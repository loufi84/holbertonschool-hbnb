from flask_restx import Namespace, Resource, fields
from flask import request
from app.services import facade
from pydantic import ValidationError
from uuid import UUID
from app.models.user import UserCreate, LoginRequest
from flask_jwt_extended import create_access_token
import hashlib

api = Namespace('users', description='User operations')
api = Namespace('auth', description='Authentication operations')

# Doc only, no validation here
user_model = api.model('User', {
    'first_name': fields.String(required=True,
                                description='First name of user'),
    'last_name': fields.String(required=True, description='Last name of user'),
    'email': fields.String(required=True, description='Email of user'),
    'password': fields.String(required=True, description='Password of user'),
})

# User update
user_update_model = api.model('UserUpdate', {
    'first_name': fields.String(description='First name of user'),
    'last_name': fields.String(description='Last name of user'),
    'email': fields.String(description='Email of user'),
    'password': fields.String(description='Password of user')
})

# User login
login_model = api.model('Login', {
    'email': fields.String(required=True, description='User email'),
    'password': fields.String(required=True, description='User password')
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

        new_user = facade.create_user(user_data.model_dump())

        return {
            'id': str(new_user.id),  # UUID -> str pour le JSON
            'first_name': new_user.first_name,
            'last_name': new_user.last_name,
            'email': new_user.email
        }, 201

    @api.doc(params={'email': 'Filter user by email (optional)'})
    @api.response(200, 'User(s) found')
    @api.response(404, 'User not found')
    def get(self):
        """Get all users or by email query"""
        email = request.args.get('email')
        if email:
            user = facade.get_user_by_email(email)
            if not user:
                return {'error': 'User not found'}, 404

            return {
                'id': str(user.id),
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email
            }, 200

        users = facade.get_all_users()
        return [user.model_dump(mode='json') for user in users], 200


@api.route('/<user_id>')
class UserResource(Resource):
    @api.response(200, 'user details retrieved successfully')
    @api.response(404, 'User not found')
    @api.response(400, 'Invalid UUID format')
    def get(self, user_id):
        """Get user details by ID"""
        try:
            user_uuid = UUID(user_id)
        except TypeError:
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

    @api.expect(user_update_model, validate=True)
    @api.response(200, 'User successfully updated')
    @api.response(400, 'Invalid input or UUID format')
    @api.response(404, 'User not found')
    def put(self, user_id):
        """Update an existing user"""
        try:
            user_uuid = UUID(user_id)
        except TypeError:
            return {'error': 'Invalid UUID format'}, 400

        existing_user = facade.get_user(user_uuid)
        if not existing_user:
            return {'error': 'User not found'}, 404

        update_data = request.json

        try:
            updated_user = facade.update_user(user_uuid, update_data)
        except ValidationError as e:
            return {'error': e.errors()}, 400

        return {
            'id': str(updated_user.id),
            'first_name': updated_user.first_name,
            'last_name': updated_user.last_name,
            'email': updated_user.email
        }, 200


@api.route('/login')
class Login(Resource):
    @api.expect(login_model, validate=True)
    @api.response(201, 'Token created')
    @api.response(400, 'Pydantic validation error')
    @api.response(401, 'Bad credentials')
    @api.response(404, 'User not found')
    def post(self):
        """Login the user"""
        data = request.json
        try:
            login_data = LoginRequest(**data)
        except ValidationError as e:
            return {'error': e.errors()}, 400

        user = facade.get_user_by_email(login_data.email)
        if not user:
            return {'error': 'User not found'}, 404
        hashed_input_pw = hashlib.sha256(
            login_data.password.encode()).hexdigest()
        if user.hashed_password != hashed_input_pw:
            return {'error': 'Invalide password or email'}, 401

        access_token = create_access_token(identity=str(user.id))
        return {'access token': access_token}, 201
