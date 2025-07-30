import apiClient from "../JS/apiClient.js";
const { fetchWithAutoRefresh } = apiClient;

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Script chargé");
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

    // Toggle affichage du formulaire
    console.log("show-create-admin:", document.getElementById('show-create-admin'));
    document.getElementById('show-create-admin').addEventListener('click', () => {
        const section = document.getElementById('create-admin-section');
        section.classList.remove('hidden');
    });
        
    // Bouton annuler pour cacher le formulaire
    document.getElementById('cancel-create-admin').addEventListener('click', () => {
        const section = document.getElementById('create-admin-section');
        section.classList.add('hidden');
    });
        
    // Submit du formulaire
    document.getElementById('create-admin-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        await createAdmin();
    });

    // Show add amenity form
    document.getElementById('show-create-amenity').addEventListener('click', () => {
        const section = document.getElementById('create-amenity-section');
        section.classList.remove('hidden');
    });

    // Cancel add amenity form
    document.getElementById('cancel-create-amenity').addEventListener('click', () => {
        const section = document.getElementById('create-amenity-section');
        section.classList.add('hidden');
    });

    // Submit add amenity form
    document.getElementById('create-amenity-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        await addAmenity();
    });

    // Cancel edit amenity form
    document.getElementById('cancel-edit-amenity').addEventListener('click', () => {
        document.getElementById('edit-amenity-section').style.display = 'none';
    });

    // Submit edit amenity form
    document.getElementById('edit-amenity-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        await editAmenity();
    });
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

const amenitiesCache = new Map();

function renderAmenities(amenities) {
    const section = document.getElementById('amenities-section');
    section.innerHTML = '<h2>Amenities</h2>';
    amenitiesCache.clear();

    amenities.forEach(amenity => {
        amenitiesCache.set(amenity.id, amenity);
        const div = document.createElement('div');
        div.classList.add('amenity-item');
        div.innerHTML = `
        <strong>${amenity.name}</strong>
        <button onclick="openEditAmenityFormById('${amenity.id}')">Edit</button>
        <button onclick="deleteAmenity('${amenity.id}')">Delete</button>
        `;
        section.appendChild(div);
    });
}

async function createAdmin() {
    const newAdmin = {
        first_name: document.getElementById('first_name').value.trim(),
        last_name: document.getElementById('last_name').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value
    };

    try {
        const res = await fetchWithAutoRefresh('/users/admin_creation', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAdmin)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => null);
            throw new Error(errData?.error || 'Error while sending data');
        }

        const data = await res.json();
        alert('Admin created successfully');

        // Reset the form and hide it
        document.getElementById('create-admin-form').reset();
        document.getElementById('create-admin-section').style.display = 'none';

        // Reload user list
        await loadAdminDashboard();
    } catch (err) {
        console.error('Error while creating admin:', err);
        alert('Failed to create admin: ' + err.message);
    }
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

function openEditAmenityFormById(id) {
    const amenity = amenitiesCache.get(id);
    if (!amenity) return alert('Amenity not found');
    openEditAmenityForm(amenity);
}

function openEditAmenityForm(amenity) {
    console.log('Opening edit amenity form with:', amenity);

    const section = document.getElementById('edit-amenity-section');
    section.style.display = 'block';
    section.style.position = 'fixed';
    section.style.top = '50px';
    section.style.left = '50px';
    section.style.zIndex = '9999';
    section.style.backgroundColor = 'white';
    section.style.border = '2px solid black';
    section.style.padding = '20px';

    document.getElementById('amenity-id').value = amenity.id || '';
    document.getElementById('amenity-name').value = amenity.name || '';
}

async function addAmenity() {
    const newAmenity = {
        name: document.getElementById('new-amenity-name').value.trim()
    };

    if (!newAmenity.name) {
        alert('Please enter an amenity name');
        return;
    }

    try {
        const res = await fetchWithAutoRefresh('/amenities', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAmenity)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => null);
            throw new Error(errData?.error || 'Error while creating amenity');
        }

        alert('Amenity created successfully');
        document.getElementById('create-amenity-form').reset();
        document.getElementById('create-amenity-section').classList.add('hidden');
        await loadAdminDashboard();
    } catch (err) {
        console.error('Error while creating amenity:', err);
        alert('Failed to create amenity: ' + err.message);
    }
}

async function editAmenity() {
    const amenityId = document.getElementById('amenity-id').value;
    const updatedAmenity = {
        name: document.getElementById('amenity-name').value.trim()
    };

    if (!updatedAmenity.name) {
        alert('Please enter an amenity name');
        return;
    }

    try {
        const res = await fetchWithAutoRefresh(`/amenities/${amenityId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedAmenity)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => null);
            throw new Error(errData?.error || 'Failed to update amenity');
        }

        alert('Amenity updated successfully');
        document.getElementById('edit-amenity-section').style.display = 'none';
        await loadAdminDashboard();
    } catch (err) {
        console.error('Error updating amenity:', err);
        alert('Error updating amenity: ' + err.message);
    }
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
window.deleteAmenity = deleteAmenity;
window.openEditAmenityFormById = openEditAmenityFormById;
window.openEditPlaceForm = openEditPlaceForm;