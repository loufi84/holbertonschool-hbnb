from flask_restx import Namespace, Resource, fields
from flask import request
from app.services import facade
from pydantic import ValidationError
from app.models.place import PlaceCreate
from uuid import UUID

api = Namespace('places', description='Places operations')

# Doc for places
place_model = api.model('Place') {
    'title': fields.String(required=True, description='The title of the place'),
    'description': fields.String(required=True, description='The description of the place'),
    'price': fields.Float(required=True, description='The price of the place'),
    'latitude': fields.Float(required=True, description='The latitude of the place'),
    'longitude': fields.Float(required=True, description='The longitude of the place'),
    'rating': fields.Float(required=False, description='The rating of the place'),
    'user_id': fields.String(required=True, description='The owner of the place'),
    'reviews': fields.List(required=False, description='The list of reviews'),
    'amenities': fields.List(required=False, description='The list of amenities'),
    'photos': fields.List(required=False, description='The list of photos')
}

@api.route('/')
class PlaceList(Resource):
    @api.expect(place_model, validate=True)
    @api.response(201, 'Place successfully created')
    @api.response(400, 'Invalid input')
    def post(self):
        try:
            place_data = PlaceCreate(**request.json)
        except ValidationError as e:
            return {'error': e.errors()}, 400
        
        if facade.get_place:
            return {'error': 'Place already exist'}, 400
        
        new_place = facade.create_place(place_data.model_dump())

        return {
            'id': str(new_place.id),
            'title': new_place.title,
            'description': new_place.description,
            'price': new_place.price,
            'latitude': new_place.latitude,
            'longitude': new_place.longitude
        }, 201