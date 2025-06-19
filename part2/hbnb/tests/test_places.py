import uuid
from unittest.mock import patch, MagicMock


@patch('app.api.v1.places.facade')
def test_create_place(mock_facade, client, user_token):
    token, user_id = user_token
    mock_place = MagicMock()
    mock_place.id = str(uuid.uuid4())
    mock_place.title = "Maison"
    mock_place.description = "En pain d'épices"
    mock_place.price = 42.0
    mock_place.latitude = 45.0
    mock_place.longitude = 5.0
    mock_place.amenities = []
    mock_place.owner_id = user_id
    mock_facade.create_place.return_value = mock_place

    payload = {
        "title": "Maison",
        "description": "En pain d'épices",
        "price": 100.0,
        "latitude": 45.0,
        "longitude": 5.0,
        "amenity_ids": []
    }

    response = client.post(
        '/api/v1/places/',
        json=payload,
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    )

    assert response.status_code == 201
    data = response.get_json()
    assert data['title'] == "Maison"


@patch('app.api.v1.places.facade')
def test_get_places(mock_facade, client):
    mock_place = MagicMock()
    mock_place.id = str(uuid.uuid4())
    mock_place.title = "Château"
    mock_place.description = "Ambulant (ou dans le Ciel)"
    mock_place.price = 26473.0
    mock_place.latitude = 27.0
    mock_place.longitude = -121.0
    mock_place.amenities = []

    mock_facade.place_repo.get_all.return_value = [mock_place]

    response = client.get('/api/v1/places/')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]['title'] == "Château"


@patch('app.api.v1.places.facade')
def test_get_place_by_id(mock_facade, client):
    place_id = uuid.uuid4()

    mock_place = MagicMock()
    mock_place.id = place_id
    mock_place.title = "Manoir"
    mock_place.description = "Luigi non inclus"
    mock_place.price = 100.0
    mock_place.latitude = 45.0
    mock_place.longitude = 5.0
    mock_place.amenities = []

    mock_facade.get_place.return_value = mock_place

    response = client.get(f'/api/v1/places/{place_id}')
    assert response.status_code == 200
    data = response.get_json()
    assert data['title'] == "Manoir"
    assert data['place_id'] == str(place_id)


@patch('app.api.v1.places.facade')
def test_update_place(mock_facade, client, user_token):
    token, user_id = user_token
    place_id = str(uuid.uuid4())

    mock_existing_place = MagicMock()
    mock_existing_place.id = place_id
    mock_existing_place.owner_id = user_id  # ICI très important
    mock_existing_place.amenities = []

    mock_updated_place = MagicMock()
    mock_updated_place.id = place_id
    mock_updated_place.title = "Grotte"
    mock_updated_place.description = "Amenez votre gourdin"
    mock_updated_place.price = 200.0
    mock_updated_place.latitude = 50.0
    mock_updated_place.longitude = 10.0
    mock_updated_place.owner_id = user_id
    mock_updated_place.amenities = []

    mock_facade.get_place.return_value = mock_existing_place
    mock_facade.update_place.return_value = mock_updated_place

    payload = {
        "title": "Grotte",
        "price": 200.0
    }

    response = client.put(
        f'/api/v1/places/{place_id}',
        json=payload,
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data['title'] == "Grotte"


@patch('app.api.v1.places.facade')
def test_delete_place(mock_facade, client, user_token):
    token, user_id = user_token
    place_id = str(uuid.uuid4())

    mock_existing_place = MagicMock()
    mock_existing_place.id = place_id
    mock_existing_place.owner_id = user_id  # ICI aussi !
    mock_existing_place.amenities = []

    mock_facade.get_place.return_value = mock_existing_place

    response = client.delete(
        f'/api/v1/places/{place_id}',
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data['message'] == "Place deleted successfully"
