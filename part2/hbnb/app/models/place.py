from uuid import UUID
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from amenity import Amenity

class Place(BaseModel):
    id: UUID
    title: str
    description: str
    price: float = Field(..., ge=0)  # ge=0 = greater or equal than 0
    latitude: float = Field(..., gt=-90, lt=90) # lt=90 = less than 90
    longitude: float = Field(..., gt=-180, lt=180) # gt=-180 = greater than -180
    owner: UUID
    amenities: Optional[List[Amenity]] = []
    created_at: datetime
    updated_at: Optional[datetime] = None
    #photos: List[Photo]
