from uuid import UUID
from datetime import datetime, timezone
from pydantic import BaseModel, Field, field_validator
from typing import Optional



class Review(BaseModel):
    id: UUID
    comment: str
    rating: float = Field(..., ge=0, le=5)
    place: UUID
    user: UUID
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

    @field_validator('rating')
    def round_one_decimal(cls, value):
        return round(value, 1)
