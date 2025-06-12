from uuid import UUID
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.user import User


class Place(BaseModel):
    id: UUID
    title: str
    description: str
    price: float
    latitude: float
    longitude: float
    owner: User
    created_at: datetime
    updated_at: Optional[datetime] = None
