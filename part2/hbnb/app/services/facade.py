'''

'''
from app.persistence.repository import InMemoryRepository
from app.models.amenity import Amenity, AmenityCreate
from app.models.place import Place
from app.models.review import Review, ReviewCreate
from app.models.place import Place, PlaceCreate
from app.models.user import User, UserCreate
from app.models.booking import Booking, BookingStatus
from pydantic import ValidationError
from uuid import UUID, uuid4
from datetime import datetime, timezone
import hashlib


class HBnBFacade:
    '''
    This is the class defining the facade of the application.
    It contains all the base operations used by services.
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
            update_data["hashed_password"] = hashlib.sha256(
                update_data.pop("password").encode()).hexdigest()

        self.user_repo.update(user_id, update_data)
        return self.user_repo.get(user_id)

    def get_all_users(self):
        return self.user_repo.get_all()

    def create_place(self, place_data):
        place_in = PlaceCreate(**place_data)

        amenities = []
        for amenity_id in place_in.amenity_ids or []:
            amenity = self.get_amenity(str(amenity_id))
            if not amenity:
                raise Exception(f'Amenity {amenity_id} not found')
            amenities.append(amenity)

        place = Place(
            id=str(uuid4()),
            title=place_in.title,
            description=place_in.description,
            price=place_in.price,
            latitude=place_in.latitude,
            longitude=place_in.longitude,
            owner_id=place_in.owner_id,
            amenities=amenities
        )
        self.place_repo.add(place)
        return place

    def get_place(self, place_id):
        return self.place_repo.get(place_id)

    def update_place(self, place_id: str, update_data: dict) -> Place:
        place = self.place_repo.get(place_id)
        if not place:
            raise Exception("Place not found")

        if "amenity_ids" in update_data:
            current_amenity_ids = {str(a.id) for a in place.amenities}
            new_amenity_ids = set(update_data["amenity_ids"])

            to_add = new_amenity_ids - current_amenity_ids
            to_remove = current_amenity_ids - new_amenity_ids

            # Delete unused amenities
            updated_amenities = [a for a in place.amenities if str(
                a.id) not in to_remove]

            # Ajouter les nouvelles amenities
            for amenity_id in to_add:
                amenity = self.get_amenity(amenity_id)
                if not amenity:
                    raise Exception(f"Amenity {amenity_id} not found")
                updated_amenities.append(amenity)

            update_data.pop('amenity_ids')
            update_data['amenities'] = updated_amenities

        update_fields = {}
        for key, value in update_data.items():
            if hasattr(place, key):
                update_fields[key] = value

        update_fields["updated_at"] = datetime.now(timezone.utc)

        updated_place = self.place_repo.update(place_id, update_fields)

        return updated_place

    def delete_place(self, place_id):
        place = self.place_repo.get(place_id)
        if not place:
            return None
        self.place_repo.delete(place_id)
        return ''

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

    def create_review(self, review_data, booking_id, place_id, user_id):
        booking = self.get_booking(booking_id)

        if not self.user_repo.get(user_id):
            raise ValueError("User not found")
        if not self.place_repo.get(place_id):
            raise ValueError("Place not found")
        if not booking:
            raise ValueError("Booking not found")
        if (
            booking.status != BookingStatus.DONE or
            booking.end_date >= datetime.now(timezone.utc)
           ):
            raise PermissionError("User must visit the place to post review.")

        new_review = Review(
            comment=review_data.comment,
            rating=review_data.rating,
            booking=str(booking_id),
            place=str(place_id),
            user=str(user_id)
        )
        self.review_repo.add(new_review)
        return new_review

    def get_review(self, review_id):
        return self.review_repo.get(review_id)

    def get_all_reviews(self):
        return self.review_repo.get_all()

    def get_reviews_by_place(self, place_id):
        reviews = self.review_repo.get_all()
        return [review for review in reviews if review.place == place_id]

    def update_review(self, review_id, review_data):
        review = self.review_repo.get(review_id)
        if not review:
            return None
        try:
            updated_review = review.copy(update=review_data)
        except ValidationError as e:
            raise e

        self.review_repo._storage[str(review_id)] = updated_review
        return updated_review

    def delete_review(self, review_id):
        review = self.review_repo.get(review_id)
        if not review:
            return None
        self.review_repo.delete(review_id)
        return ''

    def create_booking(self, user_id, place_id, booking_data):
        if not self.user_repo.get(user_id):
            raise ValueError("User not found")
        if not self.place_repo.get(place_id):
            raise ValueError("Place not found")
        new_booking = Booking(
            place=place_id,
            user=user_id,
            start_date=booking_data.start_date,
            end_date=booking_data.end_date,
            status=BookingStatus.PENDING
        )
        self.booking_repo.add(new_booking)
        return new_booking

    def get_booking(self, booking_id):
        return self.booking_repo.get(booking_id)

    def get_all_bookings(self):
        return self.booking_repo.get_all()

    def get_booking_list_by_place(self, place_id):
        return [
            booking for booking in self.booking_repo._storage.values()
            if str(booking.place) == str(place_id)
            ]

    def get_booking_list_by_user(self, user_id):
        return [
            booking for booking in self.booking_repo._storage.values()
            if str(booking.user) == str(user_id)
            ]

    def update_booking(self, booking_id, booking_data):
        booking = self.booking_repo.get(booking_id)
        if not booking:
            return None
        place_id = booking.place
        place = self.place_repo.get(place_id)
        user_id = booking.user

        if 'status' in booking_data:
            if str(place.owner_id) != str(user_id):
                raise PermissionError("Only the"
                                      "owner of a place can update the status")
            if booking_data['status'] not in ("DONE", "PENDING", "CANCELED"):
                raise ValueError("Status must be DONE, PENDING, or CANCELED")

        try:
            updated_booking = booking.copy(update=booking_data)
        except ValidationError as e:
            raise e

        self.booking_repo._storage[str(booking_id)] = updated_booking
        return updated_booking
