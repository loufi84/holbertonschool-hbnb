from flask_restx import Namespace, Resource, fields
from flask import request
from app.services import facade
from app.models.booking import CreateBooking
from pydantic import ValidationError
from flask_jwt_extended import jwt_required, get_jwt_identity
import uuid

api = Namespace('bookings', description='Booking operations')

# Swagger model for booking
booking_model = api.model('Booking', {
    'place_id': fields.String(required=True, description='ID of the place'),
    'start_date': fields.DateTime(required=True, description='Start date'),
    'end_date': fields.DateTime(required=True, description='End date')
})

@api.route('/')
class BookingList(Resource):
    @jwt_required()
    @api.expect(booking_model, validate=True)
    @api.response(201, 'Booking succesfully created')
    @api.response(400, 'Invalid input data')
    def post(self):
        """Create a new booking"""
        user_id = get_jwt_identity()
        data = request.json

        try:
            place_id = uuid.UUID(data.get("place_id"))
            booking_data = CreateBooking(
                start_date=data.get("start_date"),
                end_date=data.get("end_date")
            )
        except (ValidationError, ValueError) as e:
            return {'error': str(e)}, 400
        
        new_booking = facade.create_booking(user_id, place_id, booking_data)

        return new_booking.model_dump(mode="json"), 201
