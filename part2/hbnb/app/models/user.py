from uuid import UUID
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class User(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    email: EmailStr
    is_admin: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None
