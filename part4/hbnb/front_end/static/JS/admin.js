import apiClient from "../JS/apiClient.js";
const { fetchWithAutoRefresh } = apiClient;

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Script chargé");

    // Activer les sections collapsible-content au chargement
    const collapsibleContents = document.querySelectorAll('.collapsible-content');
    collapsibleContents.forEach(content => {
        content.classList.remove('hidden');
    });

    // Attendre un délai pour garantir que le DOM est complètement chargé
    setTimeout(() => {
        // Log initial du DOM
        console.log("DOM Content initial:", document.body.innerHTML);

        // Vérifier la présence des éléments critiques
        const criticalElements = [
            'show-create-place', 'cancel-create-place', 'create-place-form',
            'show-create-amenity', 'cancel-create-amenity', 'create-amenity-form',
            'show-create-admin', 'cancel-create-admin', 'create-admin-form',
            'users-section', 'places-section', 'amenities-section',
            'edit-place-section', 'edit-amenity-section', 'edit-user-section'
        ];
        criticalElements.forEach(id => {
            const element = document.getElementById(id);
            console.log(`Element ${id} exists: ${!!element}`);
            if (!element) {
                console.warn(`Élément avec l'ID '${id}' non trouvé dans le DOM. Vérifiez que l'élément est présent dans le HTML et que le script s'exécute après le chargement complet du DOM.`);
            }
        });

        // Attacher les écouteurs d'événements
        const attachEventListener = (id, event, callback) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(event, callback);
                console.log(`Écouteur d'événement attaché à ${id}`);
            } else {
                console.warn(`Élément avec l'ID '${id}' non trouvé dans le DOM. Vérifiez que l'élément est présent dans le HTML et chargé avant l'exécution du script.`);
            }
        };

        // Toggle affichage du formulaire admin
        attachEventListener('show-create-admin', 'click', () => {
            const section = document.getElementById('create-admin-section');
            if (section) {
                section.classList.remove('hidden');
            } else {
                console.warn("Section 'create-admin-section' non trouvée pour afficher le formulaire admin.");
            }
        });

        // Bouton annuler pour cacher le formulaire admin
        attachEventListener('cancel-create-admin', 'click', () => {
            const section = document.getElementById('create-admin-section');
            const form = document.getElementById('create-admin-form');
            if (section) {
                section.classList.add('hidden');
                if (form) form.reset();
            } else {
                console.warn("Section 'create-admin-section' non trouvée pour annuler le formulaire admin.");
            }
        });

        // Submit du formulaire admin
        attachEventListener('create-admin-form', 'submit', async (event) => {
            event.preventDefault();
            await createAdmin();
        });

        // Show add place form
        attachEventListener('show-create-place', 'click', () => {
            const section = document.getElementById('create-place-section');
            if (section) {
                section.classList.remove('hidden');
            } else {
                console.warn("Section 'create-place-section' non trouvée pour afficher le formulaire de lieu.");
            }
        });

        // Cancel add place form
        attachEventListener('cancel-create-place', 'click', () => {
            const section = document.getElementById('create-place-section');
            const form = document.getElementById('create-place-form');
            if (section) {
                section.classList.add('hidden');
                if (form) form.reset();
            } else {
                console.warn("Section 'create-place-section' non trouvée pour annuler le formulaire de lieu.");
            }
        });

        // Submit add place form
        attachEventListener('create-place-form', 'submit', async (event) => {
            event.preventDefault();
            await addPlace();
        });

        // Show add amenity form
        attachEventListener('show-create-amenity', 'click', () => {
            const section = document.getElementById('create-amenity-section');
            if (section) {
                section.classList.remove('hidden');
            } else {
                console.warn("Section 'create-amenity-section' non trouvée pour afficher le formulaire d'équipement.");
            }
        });

        // Cancel add amenity form
        attachEventListener('cancel-create-amenity', 'click', () => {
            const section = document.getElementById('create-amenity-section');
            const form = document.getElementById('create-amenity-form');
            if (section) {
                section.classList.add('hidden');
                if (form) form.reset();
            } else {
                console.warn("Section 'create-amenity-section' non trouvée pour annuler le formulaire d'équipement.");
            }
        });

        // Submit add amenity form
        attachEventListener('create-amenity-form', 'submit', async (event) => {
            event.preventDefault();
            await addAmenity();
        });

        // Cancel edit amenity form
        attachEventListener('cancel-edit-amenity', 'click', () => {
            const section = document.getElementById('edit-amenity-section');
            const form = document.getElementById('edit-amenity-form');
            if (section) {
                section.style.display = 'none';
                if (form) form.reset();
            } else {
                console.warn("Section 'edit-amenity-section' non trouvée pour annuler le formulaire d'édition d'équipement.");
            }
        });

        // Submit edit amenity form
        attachEventListener('edit-amenity-form', 'submit', async (event) => {
            event.preventDefault();
            await editAmenity();
        });

        // Cancel edit user form
        attachEventListener('cancel-edit-user', 'click', () => {
            const section = document.getElementById('edit-user-section');
            const form = document.getElementById('edit-user-form');
            if (section) {
                section.style.display = 'none';
                if (form) form.reset();
            } else {
                console.warn("Section 'edit-user-section' non trouvée pour annuler le formulaire d'édition d'utilisateur.");
            }
        });

        // Submit edit user form
        attachEventListener('edit-user-form', 'submit', async (event) => {
            event.preventDefault();
            await editUser();
        });

        // Cancel edit place form
        attachEventListener('cancel-edit', 'click', () => {
            const section = document.getElementById('edit-place-section');
            const form = document.getElementById('edit-place-form');
            if (section) {
                section.style.display = 'none';
                if (form) form.reset();
            } else {
                console.warn("Section 'edit-place-section' non trouvée pour annuler le formulaire d'édition de lieu.");
            }
        });

        // Submit edit place form
        attachEventListener('edit-place-form', 'submit', async (event) => {
            event.preventDefault();
            await editPlace();
        });
    }, 500); // Augmentation du délai à 500ms pour garantir le chargement du DOM

    try {
        const res = await fetchWithAutoRefresh('/users/me');
        if (!res.ok) throw new Error('Not Authorized');
        const user = await res.json();

        if (!user.is_admin) {
            alert('Accès refusé');
            window.location.href = '/';
            return;
        }

        await loadAdminDashboard();
    } catch (err) {
        console.error('Erreur lors de la vérification de l\'utilisateur:', err);
        alert('Accès refusé');
        window.location.href = '/';
    }

    // Surveiller les modifications du DOM
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            console.log('DOM modifié:', mutation);
        });
        criticalElements.forEach(id => {
            const element = document.getElementById(id);
            console.log(`Element ${id} exists after DOM change: ${!!element}`);
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
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
    if (!res.ok) throw new Error(`Échec de la récupération de ${endpoint}`);
    return await res.json();
}

const usersCache = new Map();

function renderUsers(users) {
    const section = document.getElementById('users-section');
    if (!section) return console.warn("Section utilisateurs non trouvée");
    section.innerHTML = '<h2>Users</h2>';
    usersCache.clear();

    users.forEach(user => {
        usersCache.set(user.id, user);
        const div = document.createElement('div');
        div.classList.add('user-item');
        div.innerHTML = `
        <strong>${user.first_name} ${user.last_name}</strong> (${user.email}) ${user.is_active ? '' : '[Inactif]'}
        <button onclick="openEditUserFormById('${user.id}')">Modifier</button>
        <button onclick="moderateUser('${user.id}')">${user.is_active ? 'Désactiver' : 'Activer'}</button>
        <button onclick="deleteUser('${user.id}')">Supprimer</button>
        `;
        section.appendChild(div);
    });
}

const placesCache = new Map();

function renderPlaces(places) {
    const section = document.getElementById('places-section');
    if (!section) return console.warn("Section lieux non trouvée");
    section.innerHTML = '<h2>Places</h2>';
    placesCache.clear();

    places.forEach(place => {
        placesCache.set(place.id, place);
        const div = document.createElement('div');
        div.classList.add('place-item');
        div.innerHTML = `
            <strong>${place.title}</strong>
            <p>${place.description}</p>
            <button onclick="openEditPlaceFormById('${place.id}')">Modifier</button>
            <button onclick="deletePlace('${place.id}')">Supprimer</button>
        `;
        section.appendChild(div);
    });
}

const amenitiesCache = new Map();

function renderAmenities(amenities) {
    const section = document.getElementById('amenities-section');
    if (!section) return console.warn("Section équipements non trouvée");
    section.innerHTML = '<h2>Amenities</h2>';
    amenitiesCache.clear();

    amenities.forEach(amenity => {
        amenitiesCache.set(amenity.id, amenity);
        const div = document.createElement('div');
        div.classList.add('amenity-item');
        div.innerHTML = `
        <strong>${amenity.name}</strong>
        <button onclick="openEditAmenityFormById('${amenity.id}')">Modifier</button>
        <button onclick="deleteAmenity('${amenity.id}')">Supprimer</button>
        `;
        section.appendChild(div);
    });
}

async function createAdmin() {
    const newAdmin = {
        first_name: document.getElementById('first_name')?.value.trim() || '',
        last_name: document.getElementById('last_name')?.value.trim() || '',
        email: document.getElementById('email')?.value.trim() || '',
        password: document.getElementById('password')?.value || ''
    };

    if (!newAdmin.first_name || !newAdmin.last_name || !newAdmin.email || !newAdmin.password) {
        alert('Veuillez remplir tous les champs admin');
        return;
    }

    try {
        const res = await fetchWithAutoRefresh('/users/admin_creation', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAdmin)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => null);
            throw new Error(errData?.error || 'Erreur lors de l\'envoi des données');
        }

        alert('Admin créé avec succès');
        document.getElementById('create-admin-form')?.reset();
        const section = document.getElementById('create-admin-section');
        if (section) section.classList.add('hidden');
        await loadAdminDashboard();
    } catch (err) {
        console.error('Erreur lors de la création de l\'admin:', err);
        alert('Échec de la création de l\'admin: ' + err.message);
    }
}

async function addPlace() {
    const priceVal = parseFloat(document.getElementById('new-place-price')?.value || 'NaN');
    const latitudeVal = parseFloat(document.getElementById('new-place-latitude')?.value || 'NaN');
    const longitudeVal = parseFloat(document.getElementById('new-place-longitude')?.value || 'NaN');

    if (isNaN(priceVal) || isNaN(latitudeVal) || isNaN(longitudeVal)) {
        alert('Veuillez entrer des nombres valides pour le prix, la latitude et la longitude');
        return;
    }

    const newPlace = {
        title: document.getElementById('new-place-title')?.value.trim() || '',
        description: document.getElementById('new-place-description')?.value.trim() || '',
        price: priceVal,
        latitude: latitudeVal,
        longitude: longitudeVal,
    };

    if (!newPlace.title || !newPlace.description) {
        alert('Veuillez entrer un titre et une description');
        return;
    }

    try {
        const res = await fetchWithAutoRefresh('/places', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPlace)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => null);
            throw new Error(errData?.error || 'Erreur lors de la création du lieu');
        }

        alert('Lieu créé avec succès');
        document.getElementById('create-place-form')?.reset();
        const section = document.getElementById('create-place-section');
        if (section) section.classList.add('hidden');
        await loadAdminDashboard();
    } catch (err) {
        console.error('Erreur lors de la création du lieu:', err);
        alert('Échec de la création du lieu: ' + err.message);
    }
}

async function addAmenity() {
    const newAmenity = {
        name: document.getElementById('new-amenity-name')?.value.trim() || ''
    };

    if (!newAmenity.name) {
        alert('Veuillez entrer un nom d\'équipement');
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
            throw new Error(errData?.error || 'Erreur lors de la création de l\'équipement');
        }

        alert('Équipement créé avec succès');
        document.getElementById('create-amenity-form')?.reset();
        const section = document.getElementById('create-amenity-section');
        if (section) section.classList.add('hidden');
        await loadAdminDashboard();
    } catch (err) {
        console.error('Erreur lors de la création de l\'équipement:', err);
        alert('Échec de la création de l\'équipement: ' + err.message);
    }
}

async function editUser() {
    const userId = document.getElementById('user-id')?.value || '';
    const updatedUser = {
        first_name: document.getElementById('user-first-name')?.value.trim() || '',
        last_name: document.getElementById('user-last-name')?.value.trim() || '',
        email: document.getElementById('user-email')?.value.trim() || '',
        is_admin: document.getElementById('user-is-admin')?.checked || false
    };

    if (!userId || !updatedUser.first_name || !updatedUser.last_name || !updatedUser.email) {
        alert('Veuillez entrer tous les champs utilisateur requis');
        return;
    }

    try {
        const res = await fetchWithAutoRefresh(`/users/${userId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUser)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => null);
            throw new Error(errData?.error || 'Échec de la mise à jour de l\'utilisateur');
        }

        alert('Utilisateur mis à jour avec succès');
        const section = document.getElementById('edit-user-section');
        if (section) section.style.display = 'none';
        await loadAdminDashboard();
    } catch (err) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', err);
        alert('Erreur lors de la mise à jour de l\'utilisateur: ' + err.message);
    }
}

async function editAmenity() {
    const amenityId = document.getElementById('amenity-id')?.value || '';
    const updatedAmenity = {
        name: document.getElementById('amenity-name')?.value.trim() || ''
    };

    if (!amenityId || !updatedAmenity.name) {
        alert('Veuillez entrer un nom d\'équipement');
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
            throw new Error(errData?.error || 'Échec de la mise à jour de l\'équipement');
        }

        alert('Équipement mis à jour avec succès');
        const section = document.getElementById('edit-amenity-section');
        if (section) section.style.display = 'none';
        await loadAdminDashboard();
    } catch (err) {
        console.error('Erreur lors de la mise à jour de l\'équipement:', err);
        alert('Erreur lors de la mise à jour de l\'équipement: ' + err.message);
    }
}

async function editPlace() {
    const placeID = document.getElementById('place-id')?.value || '';
    const priceVal = parseFloat(document.getElementById('price')?.value || 'NaN');
    const latitudeVal = parseFloat(document.getElementById('latitude')?.value || 'NaN');
    const longitudeVal = parseFloat(document.getElementById('longitude')?.value || 'NaN');

    if (isNaN(priceVal) || isNaN(latitudeVal) || isNaN(longitudeVal)) {
        alert('Veuillez entrer des nombres valides pour le prix, la latitude et la longitude');
        return;
    }

    const updateData = {
        title: document.getElementById('title')?.value.trim() || '',
        description: document.getElementById('description')?.value.trim() || '',
        price: priceVal,
        latitude: latitudeVal,
        longitude: longitudeVal,
    };

    if (!placeID || !updateData.title || !updateData.description) {
        alert('Veuillez entrer tous les champs lieu requis');
        return;
    }

    try {
        const res = await fetchWithAutoRefresh(`/places/${placeID}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => null);
            throw new Error(errData?.error || 'Échec de la mise à jour du lieu');
        }

        alert('Lieu mis à jour avec succès');
        const section = document.getElementById('edit-place-section');
        if (section) section.style.display = 'none';
        await loadAdminDashboard();
    } catch (err) {
        console.error('Erreur lors de la mise à jour du lieu:', err);
        alert('Erreur lors de la mise à jour du lieu: ' + err.message);
    }
}

function openEditPlaceFormById(id) {
    const place = placesCache.get(id);
    if (!place) return alert('Lieu non trouvé');
    openEditPlaceForm(place);
}

function openEditPlaceForm(place) {
    console.log('Ouverture du formulaire d\'édition avec le lieu:', place);

    const section = document.getElementById('edit-place-section');
    if (!section) {
        console.warn("Section d'édition de lieu non trouvée. Vérifiez que '#edit-place-section' est présent dans le HTML.");
        return;
    }

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
    console.log('Valeur de l\'input titre:', document.getElementById('title').value);
    document.getElementById('description').value = place.description || '';
    document.getElementById('price').value = place.price ?? '';
    document.getElementById('latitude').value = place.latitude ?? '';
    document.getElementById('longitude').value = place.longitude ?? '';
}

function openEditAmenityFormById(id) {
    const amenity = amenitiesCache.get(id);
    if (!amenity) {
        console.warn(`Équipement avec l'ID ${id} non trouvé dans le cache.`);
        return alert('Équipement non trouvé');
    }
    openEditAmenityForm(amenity);
}

function openEditAmenityForm(amenity) {
    console.log('Ouverture du formulaire d\'édition d\'équipement avec:', amenity);

    const section = document.getElementById('edit-amenity-section');
    if (!section) {
        console.warn("Section d'édition d'équipement non trouvée. Vérifiez que '#edit-amenity-section' est présent dans le HTML.");
        return;
    }

    section.style.display = 'block';
    section.style.position = 'fixed';
    section.style.top = '50px';
    section.style.left = '50px';
    section.style.zIndex = '9999';
    section.style.backgroundColor = 'white';
    section.style.border = '2px solid black';
    section.style.padding = '20px';

    const amenityIdInput = document.getElementById('amenity-id');
    const amenityNameInput = document.getElementById('amenity-name');
    if (!amenityIdInput || !amenityNameInput) {
        console.warn("Champs du formulaire d'édition d'équipement non trouvés. Vérifiez '#amenity-id' et '#amenity-name'.");
        return;
    }

    amenityIdInput.value = amenity.id || '';
    amenityNameInput.value = amenity.name || '';
}

function openEditUserFormById(id) {
    const user = usersCache.get(id);
    if (!user) {
        console.warn(`Utilisateur avec l'ID ${id} non trouvé dans le cache.`);
        return alert('Utilisateur non trouvé');
    }
    openEditUserForm(user);
}

function openEditUserForm(user) {
    console.log('Ouverture du formulaire d\'édition d\'utilisateur avec:', user);

    const section = document.getElementById('edit-user-section');
    if (!section) {
        console.warn("Section d'édition d'utilisateur non trouvée. Vérifiez que '#edit-user-section' est présent dans le HTML.");
        return;
    }

    section.style.display = 'block';
    section.style.position = 'fixed';
    section.style.top = '50px';
    section.style.left = '50px';
    section.style.zIndex = '9999';
    section.style.backgroundColor = 'white';
    section.style.border = '2px solid black';
    section.style.padding = '20px';

    document.getElementById('user-id').value = user.id || '';
    document.getElementById('user-first-name').value = user.first_name || '';
    document.getElementById('user-last-name').value = user.last_name || '';
    document.getElementById('user-email').value = user.email || '';
    document.getElementById('user-is-admin').checked = user.is_admin || false;
}

async function moderateUser(userId) {
    const user = usersCache.get(userId);
    if (!user) return alert('Utilisateur non trouvé');

    const moderationData = {
        is_active: !user.is_active // Basculer l'état is_active
    };

    try {
        const res = await fetchWithAutoRefresh(`/users/${userId}/moderate`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(moderationData)
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => null);
            throw new Error(errData?.error || 'Échec de la modération de l\'utilisateur');
        }

        alert(`Utilisateur ${user.is_active ? 'désactivé' : 'activé'} avec succès`);
        await loadAdminDashboard();
    } catch (err) {
        console.error('Erreur lors de la modération de l\'utilisateur:', err);
        alert('Erreur lors de la modération de l\'utilisateur: ' + err.message);
    }
}

function deleteUser(userId) {
    fetchWithAutoRefresh(`/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
    })
    .then(res => {
        if (!res.ok) throw new Error('Échec de la suppression de l\'utilisateur');
        alert('Utilisateur supprimé avec succès');
        loadAdminDashboard();
    })
    .catch(err => {
        console.error('Erreur lors de la suppression de l\'utilisateur:', err);
        alert('Erreur lors de la suppression de l\'utilisateur: ' + err.message);
    });
}

function deletePlace(placeID) {
    fetchWithAutoRefresh(`/places/${placeID}`, {
        method: 'DELETE',
        credentials: 'include'
    })
    .then(res => {
        if (!res.ok) throw new Error('Échec de la suppression du lieu');
        alert('Lieu supprimé avec succès');
        loadAdminDashboard();
    })
    .catch(err => {
        console.error('Erreur lors de la suppression du lieu:', err);
        alert('Erreur lors de la suppression du lieu: ' + err.message);
    });
}

function deleteAmenity(amenityId) {
    fetchWithAutoRefresh(`/amenities/${amenityId}`, {
        method: 'DELETE',
        credentials: 'include'
    })
    .then(res => {
        if (!res.ok) throw new Error('Échec de la suppression de l\'équipement');
        alert('Équipement supprimé avec succès');
        loadAdminDashboard();
    })
    .catch(err => {
        console.error('Erreur lors de la suppression de l\'équipement:', err);
        alert('Erreur lors de la suppression de l\'équipement: ' + err.message);
    });
}

window.deleteUser = deleteUser;
window.deletePlace = deletePlace;
window.deleteAmenity = deleteAmenity;
window.openEditAmenityFormById = openEditAmenityFormById;
window.openEditPlaceFormById = openEditPlaceFormById;
window.openEditUserFormById = openEditUserFormById;
window.moderateUser = moderateUser;
window.openEditPlaceForm = openEditPlaceForm;
window.openEditUserForm = openEditUserForm;