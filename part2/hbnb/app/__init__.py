#!/usr/bin/python3
'''

'''
from flask import Flask
from flask_restx import Api


def create_app():
    app = Flask(__name__)
    api = Api(app, version='1.0', title='HBnB API',
              description='HBnB Application API', donc='/api/v1')

    return app
