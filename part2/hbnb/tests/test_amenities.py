import uuid
import json
from unittest.mock import patch, MagicMock

@patch('app.api.v1.amenities.facade')
def test_create_amenity_as_admin(mock_facade, client, admin_token):
    token, admin_id = admin_token

    mock_admin = MagicMock()
    mock_admin.is_admin = True
    mock_facade.get_user.return_value = mock_admin

    mock_facade.get_amenity.return_value = None  # pas d'amenity existant

    mock_amenity = MagicMock()
    mock_amenity.id = uuid.uuid4()
    mock_amenity.name = "Oxygène"
    mock_amenity.description = "En supplément payant"
    mock_facade.create_amenity.return_value = mock_amenity

    payload = {
        "name": "Oxygène",
        "description": "En supplément payant"
    }

    response = client.post(
        '/api/v1/amenities/',
        json=payload,
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    )

    assert response.status_code == 201
    data = response.get_json()
    assert data['name'] == "Oxygène"
    assert data['description'] == "En supplément payant"


@patch('app.api.v1.amenities.facade')
def test_create_amenity_as_non_admin(mock_facade, client, user_token):
    token, user_id = user_token

    mock_user = MagicMock()
    mock_user.is_admin = False
    mock_facade.get_user.return_value = mock_user

    payload = {
        "name": "Sans cafards",
        "description": "Aucune garantie"
    }

    response = client.post(
        '/api/v1/amenities/',
        json=payload,
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 403
    data = response.get_json()
    assert "Admin privileges required" in data['error']


@patch('app.api.v1.amenities.facade')
def test_get_all_amenities(mock_facade, client):
    mock_amenity = MagicMock()
    mock_amenity.id = uuid.uuid4()
    mock_amenity.name = "Escaliers"
    mock_amenity.description = "En papier"

    mock_facade.get_all_amenities.return_value = [mock_amenity]

    response = client.get('/api/v1/amenities/')

    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]['name'] == "Escaliers"
    assert data[0]['description'] == "En papier"


@patch('app.api.v1.amenities.facade')
def test_get_amenity_by_id(mock_facade, client):
    amenity_id = uuid.uuid4()
    mock_amenity = MagicMock()
    mock_amenity.id = amenity_id
    mock_amenity.name = "Vers"
    mock_amenity.description = "Plus trop luisants"

    mock_facade.get_amenity.return_value = mock_amenity

    response = client.get(f'/api/v1/amenities/{amenity_id}')
    assert response.status_code == 200
    data = response.get_json()
    assert data['id'] == str(amenity_id)
    assert data['name'] == "Vers"


@patch('app.api.v1.amenities.facade')
def test_get_amenity_not_found(mock_facade, client):
    amenity_id = uuid.uuid4()
    mock_facade.get_amenity.return_value = None

    response = client.get(f'/api/v1/amenities/{amenity_id}')
    assert response.status_code == 404
    data = response.get_json()
    assert "Amenity not found" in data['error']


@patch('app.api.v1.amenities.facade')
def test_update_amenity_as_admin(mock_facade, client, admin_token):
    token, admin_id = admin_token
    amenity_id = uuid.uuid4()

    mock_admin = MagicMock()
    mock_admin.is_admin = True
    mock_facade.get_user.return_value = mock_admin

    mock_existing = MagicMock()
    mock_existing.id = amenity_id
    mock_facade.get_amenity.return_value = mock_existing

    mock_updated = MagicMock()
    mock_updated.id = amenity_id
    mock_updated.name = "Papier toilette"
    mock_updated.description = "Réutilisable"
    mock_facade.update_amenity.return_value = mock_updated

    payload = {
        "name": "Papier toilette",
        "description": "Réutilisable"
    }

    response = client.put(
        f'/api/v1/amenities/{amenity_id}',
        json=payload,
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data['name'] == "Papier toilette"


@patch('app.api.v1.amenities.facade')
def test_update_amenity_not_found(mock_facade, client, admin_token):
    token, admin_id = admin_token
    amenity_id = uuid.uuid4()

    mock_admin = MagicMock()
    mock_admin.is_admin = True
    mock_facade.get_user.return_value = mock_admin

    mock_facade.get_amenity.return_value = None

    payload = {
        "name": "Gouvernement compétent",
        "description": "Pas vu depuis des années"
    }

    response = client.put(
        f'/api/v1/amenities/{amenity_id}',
        json=payload,
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 404
    data = response.get_json()
    assert "Amenity not found" in data['error']