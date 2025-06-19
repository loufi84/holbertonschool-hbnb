import json
import uuid
import pytest
from unittest.mock import patch, MagicMock

# Patch global de facade (attention bien au bon chemin)
@patch('app.services.facade')
def test_get_places(mock_facade, client, user_token):
    # Setup du mock
    mock_place = MagicMock()
    mock_place.id = uuid.uuid4()
    mock_place.title = "Test Place"
    mock_place.description = "Description"
    mock_place.price = 100.0
    mock_place.latitude = 45.0
    mock_place.longitude = 5.0
    mock_place.amenities = []
    mock_facade.place_repo.get_all.return_value = [mock_place]

    response = client.get('/api/v1/places/')
    assert response.status_code == 200

@patch('app.services.facade')
def test_create_place(mock_facade, client, user_token):
    mock_place = MagicMock()
    mock_place.id = uuid.uuid4()
    mock_place.title = "Test Place"
    mock_place.description = "Description"
    mock_place.price = 100.0
    mock_place.latitude = 45.0
    mock_place.longitude = 5.0
    mock_place.amenities = []
    mock_place.owner_id = uuid.uuid4()
    mock_facade.create_place.return_value = mock_place

    payload = {
        "title": "Test Place",
        "description": "Description",
        "price": 100.0,
        "latitude": 45.0,
        "longitude": 5.0,
        "amenity_ids": []  # Important d'inclure même si vide
    }

    response = client.post(
        '/api/v1/places/',
        data=json.dumps(payload),
        headers={
            'Authorization': f'Bearer {user_token}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    )

    assert response.status_code == 201
