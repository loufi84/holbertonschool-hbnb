from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime, timezone
from typing import Optional


class Amenity(BaseModel):
    id: UUID
    name: str
    description: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

    def set_name(self, name):
        self.name = name
        self.updated_at = datetime.now(timezone.utc)

    def set_description(self, description):
        self.description = description
        self.updated_at = datetime.now(timezone.utc)
