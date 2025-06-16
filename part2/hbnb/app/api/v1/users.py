from flask_restx import Namespace, Resource, fields
from flask import request
from app.services import facade
from pydantic import ValidationError
from app.models.user import UserCreate
from uuid import UUID

api = Namespace('users', description='User operations')

# Doc only, no validation here
user_model = api.model('User', {
    'first_name': fields.String(required=True, description='First name of user'),
    'last_name': fields.String(required=True, description='Last name of user'),
    'email': fields.String(required=True, description='Email of user')
})

@api.route('/')
class UserList(Resource):
    @api.expect(user_model, validate=True)
    @api.response(201, 'User succesfully created')
    @api.response(400, 'Email already registered or invalid input')
    def post(self):
        """Register new user"""
        try:
            user_data = UserCreate(**request.json)
        except ValidationError as e:
            return {'error': e.errors()}, 400

        if facade.get_user_by_email(user_data.email):
            return {'error': 'Email already registered'}, 400

        new_user = facade.create_user(user_data.dict())

        return {
            'id': str(new_user.id), # UUID -> str pour le JSON
            'first_name': new_user.first_name,
            'last_name': new_user.last_name,
            'email': new_user.email
        }, 201

@api.route('/<user_id>')
class UserResource(Resource):
    @api.response(200, 'user details retrieved successfully')
    @api.response(404, 'User not found')
    @api.response(400, 'Invalid UUID format')
    def get(self, user_id):
        """Get user details by ID"""
        try:
            user_uuid = UUID(user_id)
        except ValueError:
            return {'error': 'Invalid UUID format'}, 400

        user = facade.get_user(user_uuid)
        if not user:
            return {'error': 'User not found'}, 404

        return {
            'id': str(user.id),
            'firs_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email
        }, 200
