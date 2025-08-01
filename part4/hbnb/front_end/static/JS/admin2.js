import apiClient from "../JS/apiClient.js";
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
    } catch (err) {
        console.error(err);
        alert('Access denied');
        window.location.href = '/';
        return;
    }

    // Toggle create admin form
    document.getElementById('show-create-admin').addEventListener('click', () => {
        const section = document.getElementById('create-admin-section');
        section.classList.add('visible');
    });

    // Cancel create admin form
    document.getElementById('cancel-create-admin').addEventListener('click', () => {
        const section = document.getElementById('create-admin-section');
        section.classList.remove('visible');
    });

    // Submit create admin form
    document.getElementById('create-admin-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        await createAdmin();
    });

    // Toggle create amenity form
    document.getElementById('show-create-amenity').addEventListener('click', () => {
        const section = document.getElementById('create-amenity-section');
        const parent = section.closest('.collapsible-content');
        section.classList.add('visible');
        if (parent) {
            parent.classList.add('visible');
        }
    });

    // Cancel create amenity form
    document.getElementById('cancel-create-amenity').addEventListener('click', () => {
        const section = document.getElementById('create-amenity-section');
        const parent = section.closest('.collapsible-content');
        section.classList.remove('visible');
        if (parent) {
            parent.classList.remove('visible');
        }
    });

    // Submit create amenity form
    document.getElementById('create-amenity-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        await addAmenity();
    });

    // Cancel edit place form
    document.getElementById('cancel-edit').addEventListener('click', () => {
        const section = document.getElementById('edit-place-section');
        section.classList.remove('visible');
    });

    // Submit edit place form
    document.getElementById('edit-place-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        await editPlace();
    });

    // Cancel edit amenity form
    document.getElementById('cancel-edit-amenity').addEventListener('click', () => {
        const section = document.getElementById('edit-amenity-section');
        section.classList.remove('visible');
    });

    // Submit edit amenity form
    document.getElementById('edit-amenity-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        await editAmenity();
    });

    // Cancel edit user form
    document.getElementById('cancel-edit-user').addEventListener('click', () => {
        const section = document.getElementById('edit-user-section');
        section.classList.remove('visible');
        section.classList.add('hidden');
    });

    // Submit edit user form
    document.getElementById('edit-user-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        await editUser();
    });

    // Gestion des clics sur les boutons d'édition et de suppression
    document.getElementById('users-table-body').addEventListener('click', (event) => {
        if (event.target.classList.contains('moderate-user')) {
            const userId = event.target.dataset.id;
            const isActiveStr = event.target.dataset.isActive;
            moderateUser(userId, isActiveStr);
        }
    });

    document.addEventListener('click', function (e) {
        if (e.target && e.target.classList.contains('delete-user')) {
            const userId = e.target.dataset.id;
            if (confirm('Do you really want to delete this user?')) {
                deleteUser(userId);
            }
        }
    });

    document.addEventListener('click', function (e) {
        if (e.target && e.target.classList.contains('edit-user')) {
            const userId = e.target.dataset.id;
            const row = e.target.closest('tr');
            document.getElementById('user-id').value = userId;
            document.getElementById('user-first-name').value = row.children[1].textContent;
            document.getElementById('user-last-name').value = row.children[2].textContent;
            document.getElementById('user-email').value = row.children[3].textContent;
            document.getElementById('user-is-admin').checked = row.children[4].textContent === 'Yes';
            document.getElementById('edit-user-section').classList.remove('hidden');
            document.getElementById('edit-user-section').classList.add('visible');
        }
    });
});

async function fetchData(endpoint) {
    const res = await fetchWithAutoRefresh(endpoint);
    if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
    return await res.json();
}

function renderUsers(users) {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';
    if (users && users.length > 0) {
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.first_name}</td>
                <td>${user.last_name}</td>
                <td>${user.email}</td>
                <td>${user.is_admin ? 'Yes' : 'No'}</td>
                <td>${user.is_active ? 'Yes' : 'No'}</td>
                <td>
                    <button class="edit-user" data-id="${user.id}">Edit</button>
                    <button class="delete-user" data-id="${user.id}">Delete</button>
                    <button class="moderate-user" data-id="${user.id}" data-is-active="${user.is_active}">Moderate</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="7">No users found.</td></tr>';
    }
}

function renderPlaces(places) {
    const tbody = document.getElementById('places-table-body');
    if (!tbody) return;

    if (places.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No places found.</td></tr>';
        return;
    }

    tbody.innerHTML = places.map(place => `
        <tr>
            <td>${place.id}</td>
            <td>${place.title}</td>
            <td>${place.price}</td>
            <td>
                <button class="edit-place" data-id="${place.id}" onclick="openEditPlaceFormById('${place.id}')">Edit</button>
                <button class="delete-place" data-id="${place.id}" onclick="deletePlace('${place.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function renderAmenities(amenities) {
    const tbody = document.getElementById('amenities-table-body');
    if (!tbody) return;

    if (amenities.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No amenities found.</td></tr>';
        return;
    }

    tbody.innerHTML = amenities.map(amenity => `
        <tr>
            <td>${amenity.id}</td>
            <td>${amenity.name}</td>
            <td>${amenity.description}</td>
            <td>
                <button class="edit-amenity" data-id="${amenity.id}" onclick="openEditAmenityFormById('${amenity.id}')">Edit</button>
                <button class="delete-amenity" data-id="${amenity.id}" onclick="deleteAmenity('${amenity.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function renderBookings(bookings) {
    const tbody = document.getElementById('bookings-table-body');
    if (!tbody) return;

    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No bookings found.</td></tr>';
        return;
    }

    tbody.innerHTML = bookings.map(booking => `
        <tr>
            <td>${booking.id}</td>
            <td>${booking.user_email}</td>
            <td>${booking.place_title}</td>
            <td>${booking.start_date}</td>
            <td>${booking.end_date}</td>
            <td>${booking.status}</td>
            <td>
                <button class="cancel-booking" data-id="${booking.id}" onclick="cancelBooking('${booking.id}')">Cancel</button>
            </td>
        </tr>
    `).join('');
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
            throw new Error(errData?.error || 'Error creating admin');
        }

        alert('Admin created successfully');
        document.getElementById('create-admin-form').reset();
        document.getElementById('create-admin-section').classList.remove('visible');
        const users = await fetchData('/users');
        renderUsers(users);
    } catch (err) {
        console.error('Error creating admin:', err);
        alert('Failed to create admin: ' + err.message);
    }
}

async function addAmenity() {
    const newAmenity = {
        name: document.getElementById('new-amenity-name').value.trim(),
        description: document.getElementById('new-amenity-description').value.trim()
    };

    if (!newAmenity.name) {
        alert('Please enter an amenity name');
        return;
    }

    if (!newAmenity.description) {
        alert('Please enter a valid description for your amenity');
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
            throw new Error(errData?.error || 'Error creating amenity');
        }

        alert('Amenity created successfully');
        document.getElementById('create-amenity-form').reset();
        document.getElementById('create-amenity-section').classList.remove('visible');
        const amenities = await fetchData('/amenities');
        renderAmenities(amenities);
    } catch (err) {
        console.error('Error creating amenity:', err);
        alert('Failed to create amenity: ' + err.message);
    }
}

async function editPlace() {
    const placeId = document.getElementById('place-id').value;
    const priceVal = parseFloat(document.getElementById('price').value.replace(',', '.'));
    const latitudeVal = parseFloat(document.getElementById('latitude').value.replace(',', '.'));
    const longitudeVal = parseFloat(document.getElementById('longitude').value.replace(',', '.'));

    if (isNaN(priceVal) || isNaN(latitudeVal) || isNaN(longitudeVal)) {
        alert('Please enter valid numbers for price, latitude, and longitude');
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
        const res = await fetchWithAutoRefresh(`/places/${placeId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => null);
            throw new Error(errData?.error || 'Failed to update place');
        }

        alert('Place updated successfully');
        document.getElementById('edit-place-section').classList.remove('visible');
        const places = await fetchData('/places');
        renderPlaces(places);
    } catch (err) {
        console.error('Error updating place:', err);
        alert('Error updating place: ' + err.message);
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
        document.getElementById('edit-amenity-section').classList.remove('visible');
        const amenities = await fetchData('/amenities');
        renderAmenities(amenities);
    } catch (err) {
        console.error('Error updating amenity:', err);
        alert('Error updating amenity: ' + err.message);
    }
}

async function editUser() {
    const userId = document.getElementById('user-id').value;
    const updatedUser = {
        first_name: document.getElementById('user-first-name').value.trim(),
        last_name: document.getElementById('user-last-name').value.trim(),
        email: document.getElementById('user-email').value.trim(),
        password: document.getElementById('user-password').value.trim(),
        is_admin: document.getElementById('user-is-admin').checked
    };

    try {
        const res = await fetchWithAutoRefresh(`/users/${userId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUser)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => null);
            throw new Error(errData?.error || 'Failed to update user');
        }

        alert('User updated successfully');
        document.getElementById('edit-user-section').classList.remove('visible');
        const users = await fetchData('/users');
        renderUsers(users);
    } catch (err) {
        console.error('Error updating user:', err);
        alert('Error updating user: ' + err.message);
    }
}

async function deleteUser(userId) {
    try {
        const res = await fetchWithAutoRefresh(`/users/${userId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!res.ok) throw new Error('Failed to delete user');
        alert('User deleted successfully');
        const users = await fetchData('/users');
        renderUsers(users);
    } catch (err) {
        console.error('Error deleting user:', err);
        alert('Error deleting user: ' + err.message);
    }
}

async function moderateUser(userId, isActiveStr) {

    if (!['true', 'false'].includes(isActiveStr)) {
        console.error('Invalid isActiveStr:', isActiveStr);
        alert('Error: Invalid user status provided');
        return;
    }

    const isActive = isActiveStr === 'true';

    const moderate = { is_active: !isActive };

    try {
        const res = await fetchWithAutoRefresh(`/users/${userId}/moderate`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(moderate)
        });


        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            console.error('Error response:', errData);
            throw new Error(errData.error || `Failed to moderate user (Status: ${res.status})`);
        }

        const updatedUser = await res.json();

        const action = updatedUser.is_active ? 'activated' : 'deactivated';
        alert(`User ${updatedUser.email} ${action} successfully`);

        const users = await fetchData('/users');
        renderUsers(users);
    } catch (err) {
        console.error('Error moderating user:', err);
        alert(`Error moderating user: ${err.message}`);
    }
}

async function deletePlace(placeId) {
    try {
        const res = await fetchWithAutoRefresh(`/places/${placeId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!res.ok) throw new Error('Failed to delete place');
        alert('Place deleted successfully');
        const places = await fetchData('/places');
        renderPlaces(places);
    } catch (err) {
        console.error('Error deleting place:', err);
        alert('Error deleting place: ' + err.message);
    }
}

async function deleteAmenity(amenityId) {
    try {
        const res = await fetchWithAutoRefresh(`/amenities/${amenityId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!res.ok) throw new Error('Failed to delete amenity');
        alert('Amenity deleted successfully');
        const amenities = await fetchData('/amenities');
        renderAmenities(amenities);
    } catch (err) {
        console.error('Error deleting amenity:', err);
        alert('Error deleting amenity: ' + err.message);
    }
}

async function cancelBooking(bookingId) {
    const payload = { status: "CANCELLED" };
    try {
        const res = await fetchWithAutoRefresh(`/bookings/${bookingId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Failed to cancel booking');
        alert('Booking cancelled successfully');
        const bookings = await fetchData('/bookings');
        renderBookings(bookings);
    } catch (err) {
        console.error('Error cancelling booking:', err);
        alert('Error cancelling booking: ' + err.message);
    }
}

function openEditPlaceFormById(id) {
    fetchWithAutoRefresh(`/places/${id}`)
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch place');
            return res.json();
        })
        .then(place => {
            const section = document.getElementById('edit-place-section');
            section.classList.add('visible');
            document.getElementById('place-id').value = place.id || '';
            document.getElementById('title').value = place.title || '';
            document.getElementById('description').value = place.description || '';
            document.getElementById('price').value = Number(place.price).toString().replace(',', '.');
            document.getElementById('latitude').value = Number(place.latitude).toString().replace(',', '.');
            document.getElementById('longitude').value = Number(place.longitude).toString().replace(',', '.');
        })
        .catch(err => {
            console.error('Error fetching place:', err);
            alert('Error fetching place: ' + err.message);
        });
}

function openEditAmenityFormById(id) {
    fetchWithAutoRefresh(`/amenities/${id}`)
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch amenity');
            return res.json();
        })
        .then(amenity => {
            const section = document.getElementById('edit-amenity-section');
            section.classList.add('visible');
            document.getElementById('amenity-id').value = amenity.id || '';
            document.getElementById('amenity-name').value = amenity.name || '';
        })
        .catch(err => {
            console.error('Error fetching amenity:', err);
            alert('Error fetching amenity: ' + err.message);
        });
}

function openEditUserFormById(id) {
    fetchWithAutoRefresh(`/users/${id}`)
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch user');
            return res.json();
        })
        .then(user => {
            const section = document.getElementById('edit-user-section');
            section.classList.add('visible');
            document.getElementById('user-id').value = user.id || '';
            document.getElementById('user-first-name').value = user.first_name || '';
            document.getElementById('user-last-name').value = user.last_name || '';
            document.getElementById('user-email').value = user.email || '';
            document.getElementById('user-is-admin').checked = user.is_admin || false;
        })
        .catch(err => {
            console.error('Error fetching user:', err);
            alert('Error fetching user: ' + err.message);
        });
}

// Expose functions to global scope for button onclick handlers
window.deleteUser = deleteUser;
window.deletePlace = deletePlace;
window.deleteAmenity = deleteAmenity;
window.cancelBooking = cancelBooking;
window.openEditPlaceFormById = openEditPlaceFormById;
window.openEditAmenityFormById = openEditAmenityFormById;
window.openEditUserFormById = openEditUserFormById;
window.moderateUser = moderateUser;