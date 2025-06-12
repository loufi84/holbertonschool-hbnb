from uuid import UUID
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class Place(BaseModel):
    id: UUID
    title: str
    description: str
    price: float
    latitude: float
    longitude: float
    owner: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
