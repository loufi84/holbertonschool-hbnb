"""
This module contains all the API endpoints for the places.
It calls the basic business logic from the facade (/app/services/facade).
It defines the CRUD methods for the places.
"""
from flask_restx import Namespace, Resource, fields
from flask import request
from app.services import facade
from pydantic import ValidationError, AnyUrl
from app.models.place import PlacePublic, PlaceUpdate, PlaceCreate
from uuid import UUID
from flask_jwt_extended import jwt_required, get_jwt_identity
import json

api = Namespace('places', description='Places operations')


# Model for places creation and update
place_model = api.model('Place', {
    'title': fields.String(required=True,
                           description='The title of the place'),
    'description': fields.String(required=True,
                                 description='The description of the place'),
    'price': fields.Float(required=True, description='The price of the place'),
    'latitude': fields.Float(required=True,
                             description='The latitude of the place'),
    'longitude': fields.Float(required=True,
                              description='The longitude of the place'),
    'amenity_ids': fields.List(fields.String, required=False,
                               description='List of amenity IDs'),
    'photos_url': fields.List(fields.String, required=False,
                              description='List of photos for the place')
})

place_model_update = api.model('PlaceUpdate', {
    'title': fields.String(required=False,
                           description='The title of the place'),
    'description': fields.String(required=False,
                                 description='The description of the place'),
    'price': fields.Float(required=False,
                          description='The price of the place'),
    'latitude': fields.Float(required=False,
                             description='The latitude of the place'),
    'longitude': fields.Float(required=False,
                              description='The longitude of the place'),
    'amenity_ids': fields.List(fields.String, required=False,
                               description='List of amenity IDs'),
    'photos_url': fields.List(fields.String, required=False,
                              description='List of photos for the place')
})


@api.route('/')
class PlaceList(Resource):
    @jwt_required()
    @api.expect(place_model)
    @api.response(201, 'Place successfully created')
    @api.response(400, 'Invalid input')
    @api.response(401, 'Unauthorized')
    @api.response(404, 'Amenity not found')
    def post(self):
        """Create a new place"""
        user_id = get_jwt_identity()
        data = request.json
        data['owner_id'] = user_id
        try:
            new_place = facade.create_place(data)
        except ValidationError as e:
            return {'error': json.loads(e.json())}, 400
        except ValueError as e:
            return {'error': str(e)}, 404
        amenities = []
        for amenity in new_place.amenities:
            amenities.append({
                'id': str(amenity.id),
                'name': amenity.name,
                'description': amenity.description
            })

        try:
            photos_url = new_place.photos_url
            if isinstance(photos_url, AnyUrl):
                photos_url = [photos_url]
            elif photos_url is None:
                photos_url = []

            if not PlaceCreate.validate_image(photos_url):
                return {'message': 'L\'URL ne pointe pas'
                        ' vers une image valide'}, 400
        except ValidationError as e:
            return {'error': json.loads(e.json())}, 400
        

        response_data = PlacePublic.model_validate(new_place).model_dump()

        if 'photos_url' in response_data and response_data['photos_url'] is not None:
            response_data['photos_url'] = [str(url) for url in response_data['photos_url']]

        return response_data, 201

    @api.doc(security=[])
    @api.response(200, 'Places found')
    @api.response(404, 'No places found')
    def get(self):
        """Get a list of all places"""
        places = facade.place_repo.get_all()

        if not places:
            return {'message': 'No places found'}, 404

        results = []
        for place in places:
            place_data = PlacePublic.model_validate(place).model_dump()
            if 'photos_url' in place_data and place_data['photos_url'] is not None:
                place_data['photos_url'] = [str(url) for url in place_data['photos_url']]
            results.append(place_data)

        return results, 200


@api.route('/<place_id>')
class PlaceResource(Resource):
    @api.doc(security=[])
    @api.response(200, 'Place(s) found')
    @api.response(400, 'Invalid UUID format')
    @api.response(404, 'Place not found')
    def get(self, place_id):
        """Get a place by ID"""
        if place_id:
            try:
                UUID(place_id)
            except ValueError:
                return {'error': 'invalid UUID format'}, 400

            place = facade.get_place(place_id)
            if not place:
                return {'error': 'Place not found'}, 404

            amenities = []
            for amenity in place.amenities:
                amenities.append({
                    'id': str(amenity.id),
                    'name': amenity.name,
                    'description': amenity.description
                })

        response_data = PlacePublic.model_validate(place).model_dump()

        if 'photos_url' in response_data and response_data['photos_url'] is not None:
            response_data['photos_url'] = [str(url) for url in response_data['photos_url']]

        return response_data, 200

    @jwt_required()
    @api.expect(place_model_update)
    @api.response(200, 'Place successfully updated')
    @api.response(400, 'Invalid input or UUID')
    @api.response(401, 'Unauthorized')
    @api.response(403, 'Forbidden')
    @api.response(404, 'Place not found')
    def put(self, place_id):
        """Method to update a place"""
        user_id = get_jwt_identity()
        user = facade.get_user(user_id)
        try:
            UUID(place_id)
        except ValueError:
            return {'error': 'Invalid input or UUID'}, 400

        existing_place = facade.get_place(place_id)
        if not existing_place:
            return {'error': 'Place not found'}, 404

        if (existing_place.owner_id != user_id
           and user.is_admin is False):
            return {'error': 'You must own this place to modify it'}, 403

        try:
            update_data = (PlaceUpdate.model_validate(request.json)
                           .model_dump(exclude_unset=True))
        except ValidationError as e:
            return {'error': json.loads(e.json())}, 400
        try:
            updated_place = facade.update_place(place_id, update_data)
        except ValidationError as e:
            return {'error': json.loads(e.json())}, 400
        except ValueError as e:
            return {'error': str(e)}, 404

        amenities = []
        for amenity in updated_place.amenities:
            amenities.append({
                'id': str(amenity.id),
                'name': amenity.name,
                'description': amenity.description
            })
        try:
            photos_url = updated_place.photos_url
            if isinstance(photos_url, AnyUrl):
                photos_url = [photos_url]
            elif photos_url is None:
                photos_url = []

            if not PlaceCreate.validate_image(photos_url):
                return {'message': 'L\'URL ne pointe pas'
                        ' vers une image valide'}, 400
        except ValidationError as e:
            return {'error': json.loads(e.json())}, 400

        response_data = PlacePublic.model_validate(updated_place).model_dump()

        if 'photos_url' in response_data and response_data['photos_url'] is not None:
            response_data['photos_url'] = [str(url) for url in response_data['photos_url']]

        return response_data, 200

    @jwt_required()
    @api.response(200, 'Place successfully deleted')
    @api.response(400, 'Invalid UUID')
    @api.response(401, 'Unauthorized')
    @api.response(403, 'Forbidden')
    @api.response(404, 'Place not found')
    def delete(self, place_id):
        """Method to delete a place"""
        user_id = get_jwt_identity()
        user = facade.get_user(user_id)
        try:
            UUID(place_id)
        except ValueError as e:
            return {'error': 'Invalid UUID'}, 400

        existing_place = facade.get_place(place_id)
        if not existing_place:
            return {'error': 'Place not found'}, 404

        if (existing_place.owner_id != user_id
           and user.is_admin is False):
            return {'error': 'You must own the place to delete it'}, 403

        facade.delete_place(place_id)
        return {'message': 'Place deleted successfully'}, 200
