"""
User Model
Represents an Auth0-identified user who can create and manage courses.
"""

from datetime import datetime, timezone
from typing import Optional, List
from beanie import Document, Indexed
from pydantic import BaseModel, Field


class User(Document):
    """
    User document schema.

    Relationships:
    - One-to-many with Course (a user can have multiple courses)
    """

    auth0_sub: Indexed(str, unique=True)  # Unique Auth0 user ID
    email: Optional[Indexed(str)] = None  # Optional - may not be in token
    name: Optional[str] = None
    picture: Optional[str] = None
    email_verified: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "users"
        indexes = [
            "auth0_sub",
            "email",
        ]

    def __repr__(self):
        return f"<User {self.email}>"


class UserCreate(BaseModel):
    """Schema for creating a new user"""

    auth0_sub: str
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None
    email_verified: bool = False


class UserUpdate(BaseModel):
    """Schema for updating user information"""

    name: Optional[str] = None
    picture: Optional[str] = None
    email_verified: Optional[bool] = None
