import uuid
from datetime import datetime, timedelta, timezone
import pytest
from unittest.mock import patch


# MockBooking qui imite ton modèle Booking avec
# model_dump et attributs nécessaires
class MockBooking:
    def __init__(self, user=None, place=None, status="PENDING",
                 start_date=None, end_date=None, id=None):
        self.id = id or uuid.uuid4()
        self.user = user or uuid.uuid4()
        self.place = place or uuid.uuid4()
        self.status = status
        now = datetime.now(timezone.utc)
        self.start_date = start_date or now
        self.end_date = end_date or (now + timedelta(days=1))

    def model_dump(self, mode="json"):
        return {
            "id": str(self.id),
            "user_id": str(self.user),
            "place_id": str(self.place),
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "status": self.status
        }

    def set_status(self, new_status):
        self.status = new_status


@patch('app.api.v1.bookings.facade')
def test_create_booking(mock_facade, client, user_token):
    token, user_id = user_token
    place_id = uuid.uuid4()

    # Aucun booking existant pour la place
    mock_facade.get_booking_list_by_place.return_value = []

    # Booking créé renvoyé par facade
    mock_booking = MockBooking(user=user_id, place=place_id)
    mock_facade.create_booking.return_value = mock_booking

    payload = {
        "place_id": str(place_id),
        "start_date": mock_booking.start_date.isoformat(),
        "end_date": mock_booking.end_date.isoformat()
    }

    response = client.post(
        '/api/v1/bookings/',
        json=payload,
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 201
    data = response.get_json()
    assert data['status'] == "PENDING"
    assert data['place_id'] == str(place_id)
    assert 'id' in data


@patch('app.api.v1.bookings.facade')
def test_create_booking_conflict(mock_facade, client, user_token):
    token, user_id = user_token
    place_id = uuid.uuid4()

    # Booking existant qui entre en conflit avec les dates
    existing_booking = MockBooking(
        user=user_id,
        place=place_id,
        start_date=datetime(2025, 1, 1, tzinfo=timezone.utc),
        end_date=datetime(2025, 1, 10, tzinfo=timezone.utc)
    )
    mock_facade.get_booking_list_by_place.return_value = [existing_booking]

    payload = {
        "place_id": str(place_id),
        "start_date": "2025-01-05T00:00:00+00:00",
        "end_date": "2025-01-15T00:00:00+00:00"
    }

    response = client.post(
        '/api/v1/bookings/',
        json=payload,
        headers={'Authorization': f'Bearer {token}'}
    )
    assert response.status_code == 400
    data = response.get_json()
    assert "Already booked" in data['error']


@patch('app.api.v1.bookings.facade')
def test_get_booking_by_id(mock_facade, client):
    booking_id = uuid.uuid4()
    mock_booking = MockBooking(id=booking_id)

    mock_facade.get_booking.return_value = mock_booking

    response = client.get(f'/api/v1/bookings/{booking_id}')
    assert response.status_code == 200
    data = response.get_json()
    assert data['id'] == str(booking_id)


@patch('app.api.v1.bookings.facade')
def test_get_booking_not_found(mock_facade, client):
    mock_facade.get_booking.return_value = None

    booking_id = uuid.uuid4()
    response = client.get(f'/api/v1/bookings/{booking_id}')
    assert response.status_code == 404
    data = response.get_json()
    assert "Booking not found" in data['error']


@patch('app.api.v1.bookings.facade')
def test_update_booking(mock_facade, client, user_token):
    token, user_id = user_token
    booking_id = uuid.uuid4()

    # Booking existant
    existing_booking = MockBooking(id=booking_id, user=user_id)
    mock_facade.get_booking.return_value = existing_booking

    # Place mockée, avec owner_id égal à l'utilisateur courant
    class MockPlace:
        owner_id = user_id

    mock_facade.get_place.return_value = MockPlace()

    # Booking mis à jour renvoyé
    updated_booking = MockBooking(
        id=booking_id,
        user=user_id,
        status="DONE",
        start_date=datetime.now(timezone.utc),
        end_date=datetime.now(timezone.utc) + timedelta(days=1)
    )
    mock_facade.update_booking.return_value = updated_booking

    payload = {
        "status": "DONE"
    }

    response = client.put(
        f'/api/v1/bookings/{booking_id}',
        json=payload,
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert data[0]['status'] == "DONE"


@patch('app.api.v1.bookings.facade')
def test_update_booking_not_found(mock_facade, client, user_token):
    token, user_id = user_token
    booking_id = uuid.uuid4()

    mock_facade.get_booking.return_value = None

    payload = {
        "status": "DONE"
    }

    response = client.put(
        f'/api/v1/bookings/{booking_id}',
        json=payload,
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 404
    data = response.get_json()
    assert "Booking not found" in data['error']


@patch('app.api.v1.bookings.facade')
def test_get_all_bookings(mock_facade, client):
    mock_booking = MockBooking()
    mock_facade.get_all_bookings.return_value = [mock_booking]

    response = client.get('/api/v1/bookings/')
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert any(b['id'] == str(mock_booking.id) for b in data)


@patch('app.api.v1.bookings.facade')
def test_get_all_bookings_empty(mock_facade, client):
    mock_facade.get_all_bookings.return_value = []

    response = client.get('/api/v1/bookings/')
    assert response.status_code == 200
    data = response.get_json()
    assert "No booking yet" in data['message']
