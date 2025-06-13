from uuid import UUID
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
from amenity import Amenity

class Place(BaseModel):
    id: UUID
    title: str
    description: str
    price: float = Field(..., ge=0)  # ge=0 = greater or equal to 0
    latitude: float = Field(..., ge=-90, le=90) # le=90 = less or equal to 90
    longitude: float = Field(..., ge=-180, le=180)
    owner: UUID
    amenities: Optional[List[Amenity]] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None
    photos: List[str]
