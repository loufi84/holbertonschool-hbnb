#!/usr/bin/python3
'''
This module provides the initialization file for
the Flask server and JWT management.
'''
from flask import Flask, redirect, render_template, send_from_directory
from flask_restx import Api
from config import config
from utils import purge_expired_tokens
from extensions import db, jwt
from app.models.user import RevokedToken
from utils import purge_expired_tokens, delete_invalid_amenities
from flask_cors import CORS
from app.api.v1.routes.places import place_pages
from app.api.v1.routes.auth import auth_pages
from app.services import facade
import os



def create_app(config_name='default'):
    """
    Initialize the Flask server, the database and all used
    JWT functions.
    """
    print("create_app() called")
    template_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../front_end/templates'))
    static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../front_end/static'))
    app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)
    app.config.from_object(config[config_name])

    db.init_app(app)
    jwt.init_app(app)

    @jwt.token_in_blocklist_loader
    def check_if_blacklist(jwt_header, jwt_payload):
        """
        This methods will iterate the revoked tokens when a user logout.
        """
        jti = jwt_payload["jti"]
        token = db.session.get(RevokedToken, jti)
        return token is not None

    with app.app_context():
        db.create_all()
        purge_expired_tokens()
        delete_invalid_amenities()

    from app.api.v1.users import api as users_ns
    from app.api.v1.amenities import api as amenities_ns
    from app.api.v1.places import api as places_ns
    from app.api.v1.reviews import api as reviews_ns
    from app.api.v1.bookings import api as bookings_ns

    @app.route('/')
    def serve_index():
        return send_from_directory(app.static_folder, 'index.html')

    authorizations = {
        'Bearer Auth': {
            'type': 'apiKey',
            'in': 'header',
            'name': 'Authorization',
            'description': "Enter 'Bearer' + your token here"
        }
    }

    api = Api(app,
              version='1.0',
              title='HBnB API',
              description='HBnB Application API',
              doc='/docs',
              authorizations=authorizations,
              security='Bearer Auth')

    api.add_namespace(users_ns, path='/api/v1/users')
    api.add_namespace(amenities_ns, path='/api/v1/amenities')
    api.add_namespace(places_ns, path='/api/v1/places')
    api.add_namespace(reviews_ns, path='/api/v1/reviews')
    api.add_namespace(bookings_ns, path='/api/v1/bookings')

    CORS(app, resources={r"/api/*": {"origins": ["http://127.0.0.1:5500"]}})
    app.register_blueprint(place_pages)
    app.register_blueprint(auth_pages)
    return app
