from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class Amenity(BaseModel):
    id: UUID
    name: str
    created_at: datetime
    updated_at: Optional[datetime] = None
