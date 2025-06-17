from flask_restx import Namespace, Resource, fields
from flask import request
from app.services import facade
from pydantic import ValidationError
from app.models.place import PlaceCreate
from uuid import UUID

api = Namespace('places', description='Places operations')

# Doc for places
place_model = api.model('Place', {
    'title': fields.String(required=True, description='The title of the place'),
    'description': fields.String(required=True, description='The description of the place'),
    'price': fields.Float(required=True, description='The price of the place'),
    'latitude': fields.Float(required=True, description='The latitude of the place'),
    'longitude': fields.Float(required=True, description='The longitude of the place'),
    'rating': fields.Float(required=False, description='The rating of the place'),
})

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

        
        new_place = facade.create_place(place_data.model_dump())

        return {
            'id': str(new_place.id),
            'title': new_place.title,
            'description': new_place.description,
            'price': new_place.price,
            'latitude': new_place.latitude,
            'longitude': new_place.longitude
        }, 201

    @api.doc(params={'id': 'Filter places by id (optional)'})
    @api.response(200, 'Place(s) found')
    @api.response(404, 'Place not found')
    def get(self):
        """Get all places or one by id"""
        place_id = request.args.get('id')
        if place_id:
            try:
                place_uuid = UUID(place_id)
            except ValueError:
                return {'error': 'invalid UUID format'}

            place = facade.get_place(place_uuid)
            if not place:
                return {'error': 'Place not found'}, 404

            return {
                'id': str(place.id),
                'title': place.title,
                'description': place.description,
                'price': place.price,
                'latitude': place.latitude,
                'longitude': place.longitude
            }, 200

        places = facade.place_repo.get_all()
        places_list = []
        for place in places:
            places_list.append({
                'id': str(place.id),
                'title': place.title,
                'description': place.description,
                'price': place.price,
                'latitude': place.latitude,
                'longitude': place.longitude,
                'rating': place.rating
            })
        return places_list, 200