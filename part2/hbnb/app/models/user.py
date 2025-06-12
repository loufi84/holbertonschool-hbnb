from uuid import UUID
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class User(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    email: EmailStr
    hashed_password: str
    is_active: bool = True  # Desactivate an account without being deleted
    is_admin: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None
    photo_url: Optional[str] = None
