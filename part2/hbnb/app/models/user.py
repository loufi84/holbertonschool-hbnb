from uuid import UUID
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timezone
from typing import Optional, List


class User(BaseModel):
    id: UUID
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr = Field(...)
    hashed_password: str
    is_active: bool = True  # Desactivate an account without being deleted
    is_admin: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None
    photo_url: Optional[str] = None
    places: List[UUID] = Field(default_factory=list)
    reviews: List[UUID] = Field(default_factory=list)

    def set_first_name(self, first_name):
        self.first_name = first_name
        self.updated_at = datetime.now(timezone.utc)

    def set_last_name(self, last_name):
        self.last_name = last_name
        self.updated_at = datetime.now(timezone.utc)
