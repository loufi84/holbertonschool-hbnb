"""
This module contains all the API endpoints for the reviews.
It calls the basic business logic from the facade (/app/services/facade).
It defines the CRUD methods for the reviews.
"""
from flask_restx import Namespace, Resource, fields
from flask import request
from app.services import facade
from pydantic import ValidationError
from uuid import UUID
from app.models.booking import BookingStatus
from app.models.review import ReviewCreate, ReviewPublic
from flask_jwt_extended import jwt_required, get_jwt_identity
import json

api = Namespace('reviews', description='Review operations')

# Define the review model for input validation and documentation
review_model = api.model('Review', {
    'booking': fields.String(required=True, description='ID of the booking'),
    'comment': fields.String(required=True, description='Text of the review'),
    'rating': fields.Float(required=True,
                           description='Rating of the place (1-5)'),
    })


@api.route('/')
class ReviewList(Resource):
    @jwt_required()
    @api.expect(review_model)
    @api.response(201, 'Review successfully created')
    @api.response(400, 'Invalid input data')
    @api.response(403, 'User must visit the place to post a review')
    @api.response(404, 'Place not found')
    def post(self):
        """Register a new review"""
        user_id = get_jwt_identity()

        try:
            review_data = ReviewCreate(**request.json)
        except ValidationError as e:
            return {"error": json.loads(e.json())}, 400
        try:
            UUID(review_data.booking)
        except ValueError:
            return {"error": "Invalid booking UUID format"}, 400
        booking = facade.get_booking(review_data.booking)
        if booking is None:
            return {"error": "Booking not found"}, 404

        place_id = booking.place

        try:
            new_review = facade.create_review(
                review_data, review_data.booking, place_id, user_id
                )
        except PermissionError as e:
            return {"error": str(e)}, 403
        except ValueError as e:
            return {"error": str(e)}, 400

        place = facade.place_repo.get(place_id)
        place.update_average_rating()
        facade.place_repo.update(place.id, {"rating": place.rating})
        return ReviewPublic.model_validate(new_review).model_dump(), 201

    @api.response(200, 'List of reviews retrieved successfully')
    def get(self):
        """Retrieve a list of all reviews"""
        reviews_list = facade.get_all_reviews()
        if not reviews_list:
            return {"message": "No review yet"}, 200
        return [
            ReviewPublic.model_validate(review).model_dump()
            for review in reviews_list
            ], 200


@api.route('/<review_id>')
class ReviewResource(Resource):
    @api.response(200, 'Review details retrieved successfully')
    @api.response(400, 'Invalide UUID format')
    @api.response(404, 'Review not found')
    def get(self, review_id):
        """Get review details by ID"""
        try:
            UUID(review_id)
        except ValueError:
            return {'error': 'Invalid UUID format'}, 400

        review = facade.get_review(review_id)
        if not review:
            return {'error': 'Review not found'}, 404

        return ReviewPublic.model_validate(review).model_dump(), 200

    @api.expect(review_model)
    @api.response(200, 'Review updated successfully')
    @api.response(404, 'Review not found')
    @api.response(400, 'Invalid input data or UUID format')
    def put(self, review_id):
        """Update a review's information"""
        try:
            UUID(review_id)
        except ValueError:
            return {'error': 'Invalid UUID format'}, 400

        review = facade.get_review(review_id)
        if not review:
            return {'error': 'Review not found'}, 404

        update_data = request.json
        place_id = review.place

        try:
            updated_review = facade.update_review(review_id, update_data)
        except ValidationError as e:
            return {'error': json.loads(e.json())}, 400

        place = facade.place_repo.get(place_id)
        place.update_average_rating()
        facade.place_repo.update(place.id, {"rating": place.rating})
        return ReviewPublic.model_validate(updated_review).model_dump(), 200

    @jwt_required()
    @api.response(200, 'Review deleted successfully')
    @api.response(400, 'Invalide UUID format')
    @api.response(404, 'Review not found')
    def delete(self, review_id):
        user_id = get_jwt_identity()
        """Delete a review"""
        try:
            UUID(review_id)
        except ValueError:
            return {'error': 'Invalid UUID format'}, 400

        review_to_delete = facade.get_review(review_id)
        if not review_to_delete:
            return {'error': 'Review not found'}, 404

        if user_id != str(review_to_delete.user):
            return {'error': "You must be the review's"
                    " creator to delete it"}, 403

        facade.delete_review(review_id)
        return {'message': 'Review deleted successfully'}, 200


@api.route('/places/<place_id>/reviews')
class PlaceReviewList(Resource):
    @api.response(200, 'List of reviews for the place retrieved successfully')
    @api.response(400, 'Invalid UUID format')
    @api.response(404, 'Place not found')
    def get(self, place_id):
        """Get all reviews for a specific place"""
        place = facade.get_place(place_id)
        if not place:
            return {'error': 'Place not found'}, 404
        try:
            UUID(place_id)
        except ValueError:
            return {'error': 'Invalid UUID format'}, 400
        review_list = facade.get_reviews_by_place(place_id)
        if not review_list:
            return {'message': 'No review for this place yet'}, 200

        return [
            ReviewPublic.model_validate(review).model_dump()
            for review in review_list
        ], 200
