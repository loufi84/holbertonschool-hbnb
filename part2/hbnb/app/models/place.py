from uuid import UUID
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime, timezone
from app.models.amenity import Amenity
from app.models.review import Review

DEFAULT_PLACE_PHOTO_URL = "https://static.vecteezy.com/system/resources/previews/006/059/989/large_2x/crossed-camera-icon-avoid-taking-photos-image-is-not-available-illustration-free-vector.jpg"
class Place(BaseModel):
    id: UUID
    title: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=1000)
    price: float = Field(..., ge=0)  # ge=0 = greater or equal to 0
    latitude: float = Field(..., ge=-90, le=90) # le=90 = less or equal to 90
    longitude: float = Field(..., ge=-180, le=180)
    owner: UUID
    amenities: List[Amenity] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None
    photos: List[str] = Field(default_factory=list)
    reviews: List[Review] = Field(default_factory=list)
    rating: float = 0.0

    @field_validator("photos")
    @classmethod
    def set_default_photo(cls, photos_list: List[str]):
        if not photos_list:
            return [DEFAULT_PLACE_PHOTO_URL]
        return photos_list

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
        if DEFAULT_PLACE_PHOTO_URL in self.photos:
            self.photos.remove(DEFAULT_PLACE_PHOTO_URL)
        self.photos.append(url)
        self.updated_at = datetime.now(timezone.utc)

    def remove_photos(self, url):
        self.photos.remove(url)
        if not self.photos:
            self.photos.append(DEFAULT_PLACE_PHOTO_URL)
        self.updated_at = datetime.now(timezone.utc)

    def update_average_rating(self):
        if not self.reviews:
            self.rating = 0
        else:
            total = sum(review.rating for review in self.reviews)
            self.rating = round(total / len(self.reviews), 1)

class PlaceCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=1000)
    price: float
    latitude: float
    longitude: float
    rating: float = 0.0
