"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

function getFallbackUserId() {
  if (typeof window === "undefined") return 1;
  const rawUserId = window.localStorage.getItem("userId");
  const parsed = rawUserId ? Number(rawUserId) : NaN;
  if (Number.isInteger(parsed) && parsed > 0) return parsed;
  return 1;
}

export default function GoogleCalendarCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Connecting Google Calendar...");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const oauthError = searchParams.get("error");

    if (oauthError) {
      router.replace(`/taskcalendar?calendar_error=${encodeURIComponent(oauthError)}`);
      return;
    }

    if (!code) {
      router.replace("/taskcalendar?calendar_error=missing_code");
      return;
    }

    const userIdFromState = state ? Number(state) : NaN;
    const userId =
      Number.isInteger(userIdFromState) && userIdFromState > 0
        ? userIdFromState
        : getFallbackUserId();

    fetch(`${API_BASE_URL}/integrations/google-calendar/exchange-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        code,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorBody = (await response.json().catch(() => ({}))) as {
            detail?: string;
          };
          throw new Error(errorBody.detail || `HTTP ${response.status}`);
        }
        setMessage("Google Calendar connected. Syncing tasks...");
        return fetch(
          `${API_BASE_URL}/integrations/google-calendar/sync-all?user_id=${userId}`,
          { method: "POST" },
        );
      })
      .then(() => {
        router.replace("/taskcalendar?calendar_status=connected");
      })
      .catch((error: Error) => {
        router.replace(
          `/taskcalendar?calendar_error=${encodeURIComponent(error.message)}`,
        );
      });
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#EFEFEF] flex items-center justify-center p-6">
      <div className="bg-white border border-gray-100 rounded-2xl px-6 py-5 text-gray-600 text-sm">
        {message}
      </div>
    </div>
  );
}
