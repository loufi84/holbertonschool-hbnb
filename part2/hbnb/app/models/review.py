import uuid
from datetime import datetime, timezone
from pydantic import BaseModel, Field, field_validator
from typing import Optional


class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    comment: str = Field(..., min_length=1, max_length=1000)
    rating: float = Field(..., ge=0, le=5)
    place: uuid.UUID
    user: uuid.UUID
    created_at: datetime = Field(default_factory=lambda:
                                 datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

    def set_comment(self, comment):
        self.comment = comment
        self.updated_at = datetime.now(timezone.utc)

    def set_rating(self, rating):
        self.rating = rating
        self.updated_at = datetime.now(timezone.utc)


class ReviewCreate(BaseModel):
    comment: str = Field(..., min_length=1, max_length=1000)
    rating: float = Field(..., ge=0, le=5)

    @field_validator('comment')
    @classmethod
    def check_for_blanks(cls, value):
        if value is None or not value.strip():
            raise ValueError(
                f"Comment cannot be empty or just whitespace"
                )
        return value.strip()

    @field_validator('rating')
    def round_one_decimal(cls, value):
        return round(value, 1)
