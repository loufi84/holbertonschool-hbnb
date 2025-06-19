import pytest
from app import create_app
from flask_jwt_extended import create_access_token
import uuid

@pytest.fixture(scope="session")
def app():
    app = create_app()
    app.config['TESTING'] = True
    app.config['JWT_SECRET_KEY'] = 'a-string-secret-at-least-256-bits-long'
    return app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def user_token(app):
    with app.app_context():
        access_token = create_access_token(identity={"id": str(uuid.uuid4()), "admin": False})
    return access_token

@pytest.fixture
def admin_token(app):
    with app.app_context():
        access_token = create_access_token(identity={"id": str(uuid.uuid4()), "admin": True})