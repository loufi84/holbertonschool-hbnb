import apiClient from "../static/apiClient.js";
const { fetchWithAutoRefresh } = apiClient;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetchWithAutoRefresh('/users/me');
        if (!res.ok) throw new Error('Not Authorized');
        const user = await res.json();

        if (!user.is_admin) {
            alert('Access denied');
            window.location.href = '/';
            return;
        }

        await loadAdminDashboard();
    } catch (err) {
        console.error(err);
        alert('Access denied');
        window.location.href = '/';
    }
});

async function loadAdminDashboard() {
    const users = await fetchData('/users');
    const places = await fetchData('/places');
    const amenities = await fetchData('/amenities');

    renderUsers(users);
    renderPlaces(places);
    renderAmenities(amenities);
}

async function fetchData(endpoint) {
    const res = await fetchWithAutoRefresh(endpoint);
    if (!res.ok) throw new Error(`Failed to reach ${endpoint}`);
    return await res.json();
}

function renderUsers(users) {
    const section = document.getElementById('users-section');
    section.innerHTML = '<h2>Users</h2>';

    users.forEach(user => {
        const div = document.createElement('div');
        div.classList.add('user-item');
        div.innerHTML = `
        <strong>${user.first_name} ${user.last_name}</strong> (${user.email})
        <button onclick="deleteUser('${user.id}')">Delete</button>
        `;
        section.appendChild(div);
    });
}

const placesCache = new Map();

function renderPlaces(places) {
    const section = document.getElementById('places-section');
    section.innerHTML = '<h2>Places</h2>';
    placesCache.clear();

    places.forEach(place => {
        placesCache.set(place.id, place);

        const div = document.createElement('div');
        div.classList.add('place-item');
        div.innerHTML = `
            <strong>${place.title}</strong>
            <p>${place.description}</p>
            <button onclick="openEditPlaceFormById('${place.id}')">Edit</button>
            <button onclick="deletePlace('${place.id}')">Delete</button>
        `;
        section.appendChild(div);
    });
}

function openEditPlaceFormById(id) {
    const place = placesCache.get(id);
    if (!place) return alert('Place not found');
    openEditPlaceForm(place);
}

window.openEditPlaceFormById = openEditPlaceFormById;
window.deletePlace = deletePlace;



function renderAmenities(amenities) {
    const section = document.getElementById('amenities-section');
    section.innerHTML = '<h2>Amenities</h2>';

    amenities.forEach(amenity => {
        const div = document.createElement('div');
        div.classList.add('amenity-item');
        div.innerHTML = `
        <strong>${amenity.name}</strong>
        <button onclick="editAmenity('${amenity.id}')">Edit</button>
        <button onclick="deleteAmenity('${amenity.id}')">Delete</button>
        `;
        section.appendChild(div);
    });
}

function deleteUser(userId) {
    fetchWithAutoRefresh(`/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
    })
    .then(res => {
        if (!res.ok) throw new Error('Failed to delete user');
        alert('User deleted successfully');
        loadAdminDashboard();
    })
    .catch(console.error);
}

function deletePlace(placeID) {
    fetchWithAutoRefresh(`/places/${placeID}`, {
        method: 'DELETE',
        credentials: 'include'
    })
    .then(res => {
        if (!res.ok) throw new Error('Failed to delete place');
        alert('Place deleted successfully');
        loadAdminDashboard();
    })
    .catch(console.error);
}

function deleteAmenity(amenityId) {
    fetchWithAutoRefresh(`/amenities/${amenityId}`, {
        method: 'DELETE',
        credentials: 'include'
    })
    .then(res => {
        if (!res.ok) throw new Error('Failed to delete amenity');
        alert('Amenity deleted successfully');
        loadAdminDashboard()
    })
    .catch(console.error);
}

function openEditPlaceForm(place) {
    console.log('Opening edit form with place:', place);

    const section = document.getElementById('edit-place-section');
    section.style.display = 'block';
    section.style.position = 'fixed';
    section.style.top = '50px';
    section.style.left = '50px';
    section.style.zIndex = '9999';
    section.style.backgroundColor = 'white';
    section.style.border = '2px solid black';
    section.style.padding = '20px';

    document.getElementById('place-id').value = place.id || '';
    document.getElementById('title').value = place.title || '';
    console.log('title input value:', document.getElementById('title').value);
    document.getElementById('description').value = place.description || '';
    document.getElementById('price').value = place.price ?? '';
    document.getElementById('latitude').value = place.latitude ?? '';
    document.getElementById('longitude').value = place.longitude ?? '';
}


document.getElementById('cancel-edit').addEventListener('click', () => {
    document.getElementById('edit-place-section').style.display = 'none';
});

document.getElementById('edit-place-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const placeID = document.getElementById('place-id').value;
    const priceVal = parseFloat(document.getElementById('price').value);
    const latitudeVal = parseFloat(document.getElementById('latitude').value);
    const longitudeVal = parseFloat(document.getElementById('longitude').value);

    if (isNaN(priceVal) || isNaN(latitudeVal) || isNaN(longitudeVal)) {
        alert('Please enter valid numbers for price, latitude and longitude');
        return;
    }

    const updateData = {
        title: document.getElementById('title').value.trim(),
        description: document.getElementById('description').value.trim(),
        price: priceVal,
        latitude: latitudeVal,
        longitude: longitudeVal,
    };

    try {
    const res = await fetchWithAutoRefresh(`/places/${placeID}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(updateData),
    });

    if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || 'Failed to update place');
    }

    alert('Place updated successfully');
    document.getElementById('edit-place-section').style.display = 'none';
    await loadAdminDashboard();
    } catch (err) {
    console.error(err);
    alert('Error updating place: ' + err.message);
    }
});

window.deleteUser = deleteUser;
window.openEditPlaceForm = openEditPlaceForm;