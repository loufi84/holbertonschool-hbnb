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

    def set_title(self, title):
        self.title = title
        self.updated_at = datetime.now(timezone.utc)

    def set_description(self, description):
        self.description = description
        self.updated_at = datetime.now(timezone.utc)

    def set_price(self, price):
        self.price = price
        self.updated_at = datetime.now(timezone.utc)

    def set_latitude(self, latitude):
        self.latitude = latitude
        self.updated_at = datetime.now(timezone.utc)

    def set_longitude(self, longitude):
        self.longitude = longitude
        self.updated_at = datetime.now(timezone.utc)

    def add_photo(self, url):
        self.photos.append(url)
        self.updated_at = datetime.now(timezone.utc)

    def remove_photos(self, url):
        self.photos.remove(url)
        self.updated_at = datetime.now(timezone.utc)