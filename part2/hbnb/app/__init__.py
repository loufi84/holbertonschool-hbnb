#!/usr/bin/python3
'''

'''
from flask import Flask, redirect
from flask_restx import Api
from app.api.v1.users import api as users_ns
from app.api.v1.amenities import api as amenities_ns
from app.api.v1.places import api as places_ns
from app.api.v1.reviews import api as reviews_ns
from flask_jwt_extended import JWTManager


def create_app():
    print("create_app() called")
    app = Flask(__name__)

    @app.route('/')
    def redirect_to_docs():
        print("Redirect / to /docs")
        return redirect('/docs')

    api = Api(app, version='1.0', title='HBnB API',
              description='HBnB Application API', doc='/docs')

    app.config['JWT_SECRET_KEY'] = 'super-secret-key'
    jwt = JWTManager(app)

    api.add_namespace(users_ns, path='/api/v1/users')
    api.add_namespace(amenities_ns, path='/api/v1/amenities')
    api.add_namespace(places_ns, path='/api/v1/places')
    api.add_namespace(reviews_ns, path='/api/v1/reviews')


    return app
