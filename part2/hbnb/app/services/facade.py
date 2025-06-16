#!/usr/bin/python3
'''

'''
from app.persistence.repository import InMemoryRepository
from app.models.amenity import Amenity, AmenityCreate
from app.models.place import Place
from app.models.review import Review
from app.models.user import User, UserCreate
from pydantic import ValidationError
import hashlib


class HBnBFacade:
    '''
    
    '''
    def __init__(self):
        self.user_repo = InMemoryRepository()
        self.place_repo = InMemoryRepository()
        self.review_repo = InMemoryRepository()
        self.amenity_repo = InMemoryRepository()

    def create_user(self, user_data):
        user_in = UserCreate(**user_data)
        hashed_pw = hashlib.sha256(user_in.password.encode()).hexdigest()

        user = User(
            first_name=user_in.first_name,
            last_name=user_in.last_name,
            email=user_in.email,
            hashed_password=hashed_pw
        )
        self.user_repo.add(user)
        return user

    def get_user(self, user_id):
        return self.user_repo.get(user_id)

    def get_user_by_email(self, email):
        return self.user_repo.get_by_attribute('email', email)

    def update_user(self, user_id: UUID, update_data: dict):
        user = self.user_repo.get(user_id)
        if not user:
            return None
        
        if "password" in update_data:
            update_data["hashed_password"] = hashlib.sha256(update_data.pop("password").encode()).hexdigest()

        self.user_repo.update(user_id, update_data)
        return user

    def get_all_users(self):
        return self.user_repo.get_all()

    def get_place(self, place_id):
        return self.place_repo.get(place_id)

    def create_amenity(self, amenity_data):
        amenity_in = AmenityCreate(**amenity_data)

        amenity = Amenity(
            name=amenity_in.name,
            description=amenity_in.description
        )

        self.amenity_repo.add(amenity)
        return amenity

    def get_amenity(self, amenity_id):
        return self.amenity_repo.get(amenity_id)

    def get_all_amenities(self):
        return list(self.amenity_repo)

    def update_amenity(self, amenity_id, amenity_data):
        # Placeholder for logic to update an amenity
        pass