import uuid
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime, timezone
from typing import Optional, List


DEFAULT_USER_PHOTO_URL = (
    "https://cdn0.iconfinder.com/data/icons"
    "/mobile-basic-vol-1/32/Profile-256.png"
)


class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr = Field(...)
    hashed_password: str
    is_active: bool = True  # Desactivate an account without being deleted
    is_admin: bool = False
    created_at: datetime = Field(default_factory=lambda:
                                 datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None
    photo_url: Optional[str] = None
    places: List[uuid.UUID] = Field(default_factory=list)
    reviews: List[uuid.UUID] = Field(default_factory=list)

    model_config = ConfigDict(
        json_encoders={datetime: lambda v: v.isoformat()}
    )

    @field_validator("photo_url")
    @classmethod
    def set_default_photo(cls, photo_url):
        if not photo_url:
            return DEFAULT_USER_PHOTO_URL
        return photo_url

    def set_first_name(self, first_name):
        self.first_name = first_name
        self.updated_at = datetime.now(timezone.utc)

    def set_last_name(self, last_name):
        self.last_name = last_name
        self.updated_at = datetime.now(timezone.utc)


class UserCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=50)

    @model_validator(mode='before')
    @classmethod
    def check_for_blanks(cls, values):
        for field_name in ['first_name', 'last_name', 'password']:
            value = values.get(field_name)
            if value is None or not value.strip():
                raise ValueError(
                    f"{field_name} cannot be empty or just whitespace"
                    )
            values[field_name] = value.strip()
        return values


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
