#!/usr/bin/python3
'''

'''
from flask import Flask, redirect
from flask_restx import Api
from flask_jwt_extended import JWTManager
from config import config
from flask_sqlalchemy import SQLAlchemy
from blacklist import blacklist
from utils import purge_expired_tokens
from extensions import db, jwt
from app.models.user import RevokedToken
from utils import purge_expired_tokens, delete_invalid_amenities

def create_app(config_name='default'):
    print("create_app() called")
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    db.init_app(app)
    jwt.init_app(app)

    @jwt.token_in_blocklist_loader
    def check_if_blacklist(jwt_header, jwt_payload):
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
    def redirect_to_docs():
        print("Redirect / to /docs")
        return redirect('/docs')

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

    return app
