import uuid
from datetime import datetime, timezone
from pydantic import BaseModel, Field, model_validator
from typing import Optional
from enum import Enum


class BookingStatus(str, Enum):
    DONE = "DONE"
    PENDING = "PENDING"
    CANCELLED = "CANCELLED"


class Booking(BaseModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    status: BookingStatus = Field(default=BookingStatus.DONE, strict=True) # DONE Provisoirement, sinon PENDING
    place: uuid.UUID
    user: uuid.UUID
    start_date: datetime = Field(...)
    end_date: datetime = Field(...)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None

    def set_status(self, status):
        self.status = status
        self.updated_at = datetime.now(timezone.utc)

    def set_start_date(self, start_date):
        self.start_date = start_date
        self.updated_at = datetime.now(timezone.utc)

    def set_end_date(self, end_date):
            self.end_date = end_date
            self.updated_at = datetime.now(timezone.utc)


class CreateBooking(BaseModel):
    start_date: datetime = Field(...)
    end_date: datetime = Field(...)

    @model_validator(mode='before')
    def check_dates(cls, values):
        start = values.get("start_date")
        end = values.get("end_date")
        if start and end and start >= end:
            raise ValueError("Start date must be before end date")
        return values