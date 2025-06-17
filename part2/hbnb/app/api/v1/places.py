from flask_restx import Namespace, Resource, fields
from flask import request
from app.services import facade
from pydantic import ValidationError
from app.models.place import PlaceCreate
from uuid import UUID
from flask_jwt_extended import jwt_required, get_jwt_identity


api = Namespace('places', description='Places operations')

# Doc for places
place_model = api.model('Place', {
    'title': fields.String(required=True, description='The title of the place'),
    'description': fields.String(required=True, description='The description of the place'),
    'price': fields.Float(required=True, description='The price of the place'),
    'latitude': fields.Float(required=True, description='The latitude of the place'),
    'longitude': fields.Float(required=True, description='The longitude of the place'),
})

place_update_model = api.model('PlaceUpdate', {
    'title': fields.String(required=True, description='The title of the place'),
    'description': fields.String(required=True, description='The description of the place'),
    'price': fields.Float(required=True, description='The price of the place'),
    'latitude': fields.Float(required=True, description='The latitude of the place'),
    'longitude': fields.Float(required=True, description='The longitude of the place'),
})

@api.route('/')
class PlaceList(Resource):
    #@jwt_required()
    @api.expect(place_model, validate=True)
    @api.response(201, 'Place successfully created')
    @api.response(403, 'User must be connected to create a place')
    @api.response(400, 'Invalid input')
    def post(self):
        #user_id = get_jwt_identity()
        try:
            place_data = PlaceCreate(**request.json)
        except ValidationError as e:
            return {'error': e.errors()}, 400

        place_dict = place_data.model_dump()
        #place_dict['owner_id'] = user_id

        new_place = facade.create_place(place_dict)

        return {
            'id': str(new_place.id),
            'title': new_place.title,
            'description': new_place.description,
            'price': new_place.price,
            'latitude': new_place.latitude,
            'longitude': new_place.longitude
        }, 201
    
    @api.response(200, 'Places found')
    @api.response(404, 'No places found')
    def get(self):
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

@api.route('/<place_id>')
class PlaceResource(Resource):
    @api.response(200, 'Place(s) found')
    @api.response(404, 'Place not found')
    def get(self, place_id):
        """Get a place by ID"""
        if place_id:
            try:
                place_uuid = UUID(place_id)
            except ValueError:
                return {'error': 'invalid UUID format'}

            place = facade.get_place(place_uuid)
            if not place:
                return {'error': 'Place not found'}, 404

            return {
                'place_id': str(place.id),
                'title': place.title,
                'description': place.description,
                'price': place.price,
                'latitude': place.latitude,
                'longitude': place.longitude
            }, 200
    
    #@jwt_required()
    @api.expect(place_update_model, validate=True)
    @api.response(200, 'Place successfully updated')
    @api.response(400, 'Invalid input or UUID')
    @api.response(403, 'Forbidden')
    @api.response(404, 'Place not found')
    def put(self, place_id):
        """Method to update a place"""
        #user_id = get_jwt_identity()
        try:
            place_uuid = UUID(place_id)
        except ValueError:
            return {'error': 'Invalid input or UUID'}, 400

        existing_place = facade.get_place(place_uuid)
        if not existing_place:
            return {'error': 'Place not found'}, 404
        
        #if self.owner_id != user_id:
            #return {'error': 'You must own this place to mdify it'}, 403

        update_data = request.json

        try:
            updated_place = facade.update_place(place_uuid, update_data)
        except ValidationError as e:
            return {'error': e.errors()}, 400

        return {
            'title': updated_place.title,
            'description': updated_place.description,
            'price': updated_place.price,
            'latitude': updated_place.latitude,
            'longitude': updated_place.longitude
        }
