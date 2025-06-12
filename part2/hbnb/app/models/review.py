from uuid import UUID
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from app.models.place import Place
from app.models.user import User


class Review(BaseModel):
    id: UUID
    text: str
    rating: float
    place: Place
    user: User
    created_at: datetime
    updated_at: Optional[datetime] = None
