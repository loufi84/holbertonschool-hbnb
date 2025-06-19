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
def user_id():
    return uuid.uuid4()

@pytest.fixture
def user_token(app):
    with app.app_context():
        user_id = str(uuid.uuid4())
        access_token = create_access_token(identity=user_id)
    return access_token, user_id

@pytest.fixture
def admin_token(app):
    with app.app_context():
        admin_id = str(uuid.uuid4())
        access_token = create_access_token(identity=admin_id)
    return access_token
