#!/usr/bin/python3
'''

'''
from app.persistence.repository import InMemoryRepository
from app.models.amenity import Amenity, AmenityCreate
from app.models.place import Place
from app.models.review import Review, ReviewCreate
from app.models.place import Place, PlaceCreate
from app.models.user import User, UserCreate
from pydantic import ValidationError
from uuid import UUID, uuid4
from datetime import datetime, timezone
import hashlib

class HBnBFacade:
    '''
    
    '''
    def __init__(self):
        self.user_repo = InMemoryRepository()
        self.place_repo = InMemoryRepository()
        self.review_repo = InMemoryRepository()
        self.amenity_repo = InMemoryRepository()
        self.booking_repo = InMemoryRepository()

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

    def create_place(self, place_data):
        place_in = PlaceCreate(**place_data)

        place = Place (
            title=place_in.title,
            description=place_in.description,
            price=place_in.price,
            latitude=place_in.latitude,
            longitude=place_in.longitude,
            rating=place_in.rating,
        )
        self.place_repo.add(place)
        return place

    def get_place(self, place_id):
        return self.place_repo.get(place_id)
    
    def update_place(self, place_id: UUID, update_data: dict):
        place = self.place_repo.get(place_id)
        if not place:
            return None
        updated_place = self.place_repo.update(place_id, update_data)
        return updated_place

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
        return self.amenity_repo.get_all()

    def update_amenity(self, amenity_id, amenity_data):
        amenity = self.amenity_repo.get(amenity_id)
        if not amenity:
            return None
        try:
            updated_amenity = amenity.copy(update=amenity_data)
        except ValidationError as e:
            raise e
        
        self.amenity_repo._storage[str(amenity_id)] = updated_amenity
        return updated_amenity

    def create_review(self, review_data, user_id, place_id):
        bookings = self.booking_repo.get_all()
        has_booking = any(
            booking.place == place_id and booking.user == user_id
            for booking in bookings
            )
        if not has_booking:
            raise PermissionError("User must visit this place to post a review.")
        
        new_review  = Review(
        comment=review_data.comment,
        rating=review_data.rating,
        place=place_id,
        user=user_id,
        )
        self.review_repo.add(new_review)
        return new_review


    def get_review(self, review_id):
        return self.review_repo.get(review_id)

    def get_all_reviews(self):
        return self.review_repo.get_all()

    def get_reviews_by_place(self, place_id):
        place = self.place_repo.get(place_id)
        return place.reviews

    def update_review(self, review_id, review_data):
        # Placeholder for logic to update a review
        pass

    def delete_review(self, review_id):
        # Placeholder for logic to delete a review
        pass