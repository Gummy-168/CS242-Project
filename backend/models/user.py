from __future__ import annotations

from datetime import datetime
from enum import Enum

from sqlalchemy import Column, DateTime, Enum as SqlEnum, Integer, String

from database import Base


class AccountStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), nullable=False, index=True)
    password = Column("password_hash", String(255), nullable=False)
    account_status = Column(SqlEnum(AccountStatus), nullable=False, default=AccountStatus.ACTIVE)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def login(self, email: str, password: str) -> bool:
        return self.email == email and self.authenticate_pw(password) and self.validate_account_status()

    def logout(self) -> None:
        return None

    def get_email(self) -> str:
        return self.email

    def set_email(self, email: str) -> None:
        self.email = email.strip().lower()

    def get_username(self) -> str:
        return self.username

    def set_username(self, username: str) -> None:
        self.username = username.strip()

    def get_id(self) -> int:
        return self.id

    def authenticate_pw(self, password: str) -> bool:
        return self.password == password

    def validate_account_status(self) -> bool:
        return self.account_status == AccountStatus.ACTIVE

    @classmethod
    def register_user(
        cls,
        _id: int,
        _email: str,
        _username: str,
        _password: str,
    ) -> "User":
        return cls(
            id=_id,
            email=_email.strip().lower(),
            username=_username.strip(),
            password=_password,
            account_status=AccountStatus.ACTIVE,
        )
