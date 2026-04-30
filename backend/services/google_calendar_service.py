from __future__ import annotations

import json
import os
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from sqlalchemy.orm import Session

from models import Assignment, GoogleCalendarToken

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_CALENDAR_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events"


def _require_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise ValueError(f"Missing environment variable: {name}")
    return value


def _post_form(url: str, form: dict[str, str]) -> dict[str, Any]:
    payload = urlencode(form).encode("utf-8")
    request = Request(url, data=payload, method="POST")
    request.add_header("Content-Type", "application/x-www-form-urlencoded")
    with urlopen(request, timeout=20) as response:
        return json.loads(response.read().decode("utf-8"))


def _request_json(method: str, url: str, access_token: str, body: dict[str, Any] | None = None) -> dict[str, Any]:
    payload = json.dumps(body).encode("utf-8") if body is not None else None
    request = Request(url, data=payload, method=method)
    request.add_header("Authorization", f"Bearer {access_token}")
    request.add_header("Content-Type", "application/json")
    with urlopen(request, timeout=20) as response:
        raw = response.read().decode("utf-8")
        return json.loads(raw) if raw else {}


def get_google_auth_url(user_id: int) -> str:
    client_id = _require_env("GOOGLE_CLIENT_ID")
    redirect_uri = _require_env("GOOGLE_REDIRECT_URI")
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "https://www.googleapis.com/auth/calendar.events",
        "access_type": "offline",
        "prompt": "consent",
        "state": str(user_id),
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


def exchange_code_for_token(db: Session, user_id: int, code: str) -> GoogleCalendarToken:
    client_id = _require_env("GOOGLE_CLIENT_ID")
    client_secret = _require_env("GOOGLE_CLIENT_SECRET")
    redirect_uri = _require_env("GOOGLE_REDIRECT_URI")

    token_response = _post_form(
        GOOGLE_TOKEN_URL,
        {
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        },
    )
    expires_in = int(token_response.get("expires_in", 3600))
    expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(seconds=expires_in - 60)

    existing = db.query(GoogleCalendarToken).filter(GoogleCalendarToken.user_id == user_id).first()
    if existing is None:
        existing = GoogleCalendarToken(
            user_id=user_id,
            access_token=token_response["access_token"],
            refresh_token=token_response.get("refresh_token", ""),
            token_type=token_response.get("token_type", "Bearer"),
            scope=token_response.get("scope"),
            expires_at=expires_at,
        )
        db.add(existing)
    else:
        existing.access_token = token_response["access_token"]
        if token_response.get("refresh_token"):
            existing.refresh_token = token_response["refresh_token"]
        existing.token_type = token_response.get("token_type", "Bearer")
        existing.scope = token_response.get("scope")
        existing.expires_at = expires_at

    if not existing.refresh_token:
        raise ValueError("Google refresh token is missing. Reconnect with consent prompt.")

    db.commit()
    db.refresh(existing)
    return existing


def _refresh_access_token(db: Session, token_row: GoogleCalendarToken) -> GoogleCalendarToken:
    client_id = _require_env("GOOGLE_CLIENT_ID")
    client_secret = _require_env("GOOGLE_CLIENT_SECRET")
    token_response = _post_form(
        GOOGLE_TOKEN_URL,
        {
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": token_row.refresh_token,
            "grant_type": "refresh_token",
        },
    )
    expires_in = int(token_response.get("expires_in", 3600))
    token_row.access_token = token_response["access_token"]
    token_row.token_type = token_response.get("token_type", token_row.token_type)
    token_row.expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(seconds=expires_in - 60)
    db.commit()
    db.refresh(token_row)
    return token_row


def _get_valid_access_token(db: Session, user_id: int) -> str:
    token_row = db.query(GoogleCalendarToken).filter(GoogleCalendarToken.user_id == user_id).first()
    if token_row is None:
        raise ValueError("Google Calendar is not connected for this user.")

    now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
    if token_row.expires_at <= now_utc:
        token_row = _refresh_access_token(db, token_row)
    return token_row.access_token


def _assignment_to_event_payload(assignment: Assignment) -> dict[str, Any]:
    start = assignment.deadline
    end = start + timedelta(hours=1)
    description = assignment.description or ""
    if assignment.status:
        description = f"{description}\n\nStatus: {assignment.status}".strip()
    return {
        "summary": assignment.title,
        "description": description,
        "start": {"dateTime": start.isoformat(), "timeZone": "UTC"},
        "end": {"dateTime": end.isoformat(), "timeZone": "UTC"},
    }


def upsert_assignment_event(db: Session, assignment: Assignment) -> str:
    access_token = _get_valid_access_token(db, assignment.user_id)
    payload = _assignment_to_event_payload(assignment)

    try:
        if assignment.calendar_event_id:
            url = f"{GOOGLE_CALENDAR_EVENTS_URL}/{assignment.calendar_event_id}"
            data = _request_json("PATCH", url, access_token, payload)
            return str(data.get("id", assignment.calendar_event_id))

        data = _request_json("POST", GOOGLE_CALENDAR_EVENTS_URL, access_token, payload)
        return str(data["id"])
    except HTTPError as exc:
        if exc.code == 404 and assignment.calendar_event_id:
            assignment.calendar_event_id = None
            db.commit()
            data = _request_json("POST", GOOGLE_CALENDAR_EVENTS_URL, access_token, payload)
            return str(data["id"])
        raise


def delete_assignment_event(db: Session, assignment: Assignment) -> None:
    if not assignment.calendar_event_id:
        return
    access_token = _get_valid_access_token(db, assignment.user_id)
    url = f"{GOOGLE_CALENDAR_EVENTS_URL}/{assignment.calendar_event_id}"
    try:
        _request_json("DELETE", url, access_token)
    except HTTPError as exc:
        if exc.code != 404:
            raise


def sync_user_assignments(db: Session, user_id: int) -> int:
    assignments = db.query(Assignment).filter(Assignment.user_id == user_id).all()
    synced = 0
    for assignment in assignments:
        event_id = upsert_assignment_event(db, assignment)
        assignment.calendar_event_id = event_id
        synced += 1
    db.commit()
    return synced


def disconnect_google_calendar(db: Session, user_id: int) -> int:
    token_row = db.query(GoogleCalendarToken).filter(GoogleCalendarToken.user_id == user_id).first()
    if token_row:
        db.delete(token_row)

    updated = (
        db.query(Assignment)
        .filter(Assignment.user_id == user_id, Assignment.calendar_event_id.isnot(None))
        .update({Assignment.calendar_event_id: None}, synchronize_session=False)
    )
    db.commit()
    return int(updated)
