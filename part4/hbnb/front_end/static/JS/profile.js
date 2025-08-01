import apiClient from "./apiClient.js";
const { fetchWithAutoRefresh } = apiClient || {};

if (!fetchWithAutoRefresh) {
  console.error('fetchWithAutoRefresh is not defined. Check apiClient.js export.');
  alert('Erreur de configuration du client API.');
}

document.addEventListener('DOMContentLoaded', async () => {
  const profileContainer = document.getElementById('profile-container');
  const editButton = document.getElementById('edit-profile-btn');
  const editForm = document.getElementById('edit-form');
  const cancelBtn = document.getElementById('cancel-edit');
  const saveBtn = document.getElementById('save-edit');

  const firstNameInput = document.getElementById('edit_first_name');
  const lastNameInput = document.getElementById('edit_last_name');
  const emailInput = document.getElementById('edit_email');
  const photoUrlInput = document.getElementById('edit_photo_url');

  loadAmenities();

  if (!profileContainer || !editButton || !editForm || !cancelBtn || !saveBtn || !firstNameInput) {
    console.error('Un ou plusieurs éléments du DOM sont manquants :', {
      profileContainer, editButton, editForm, cancelBtn, saveBtn, firstNameInput
    });
    alert('Erreur : certains éléments de la page sont introuvables.');
    return;
  }

  let user = null;

  try {
    const response = await fetchWithAutoRefresh('/users/me', {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      console.error('Fetch failed with status:', response.status);
      throw new Error('Unauthorized');
    }

    user = await response.json();

    if (!user || !user.user_id) {
      throw new Error('Invalid user data');
    }

    displayUserInfo(user);
    prefillForm(user);
  } catch (err) {
    console.error('Error fetching user data:', err);
    alert('You must be connected to access profile');
    window.location.href = '/login';
    return;
  }

  function displayUserInfo(user) {
    const photo = user.photo_url && user.photo_url.trim() !== '' && user.photo_url.trim().toLowerCase() !== 'none'
      ? user.photo_url
      : '../static/images/default_profile_b.png';


    profileContainer.innerHTML = `
      <div class="profile-card">
        <img src="${photo}" alt="Profile picture" class="profile-photo" onerror="this.src='/static/images/default_profile.png'" />
        <div class="profile-text">
          <h2>${user.first_name || 'N/A'} ${user.last_name || 'N/A'}</h2>
          <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
        </div>
      </div>
    `;

    profileContainer.classList.add('visible');
    editButton.classList.add('visible');
    editForm.classList.remove('visible');
  }

  async function refreshProfile() {
    try {
      const response = await fetchWithAutoRefresh('/users/me', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      const user = await response.json();
      displayUserInfo(user);
    } catch (e) {
      console.error(e);
    }
  }

  function prefillForm(user) {
    firstNameInput.value = user.first_name || '';
    lastNameInput.value = user.last_name || '';
    emailInput.value = user.email || '';
    photoUrlInput.value = user.photo_url === 'None' ? '' : user.photo_url || '';
  
    editForm.classList.remove('visible');
    profileContainer.classList.add('visible');
    editButton.classList.add('visible');
  }

  editButton.addEventListener('click', () => {
    editForm.classList.add('visible');
    profileContainer.classList.remove('visible');
    editButton.classList.remove('visible');
  });

  cancelBtn.addEventListener('click', () => {
    prefillForm(user);
  });

  saveBtn.addEventListener('click', async (e) => {
    e.preventDefault();
  
    const updatedUser = {
      first_name: firstNameInput.value.trim(),
      last_name: lastNameInput.value.trim(),
      email: emailInput.value.trim(),
      photo_url: photoUrlInput.value.trim()
    };
  
    for (const key in updatedUser) {
      const newVal = updatedUser[key];
      const oldVal = user[key];

      if (newVal === oldVal || newVal === '') {
        delete updatedUser[key];
      }
    }
  
    if (Object.keys(updatedUser).length === 0) {
      alert("Aucune modification détectée.");
      prefillForm(user);
      return;
    }
  
    try {
      const updateUrl = `/users/${user.user_id}`;
      const response = await fetchWithAutoRefresh(updateUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedUser)
      });
  
      const result = await response.json();
  
      if (response.ok) {
        alert('Profil mis à jour avec succès');
        user = result;
        displayUserInfo(user);
        prefillForm(user);
        refreshProfile();
      } else {
        alert(result.error || 'Échec de la mise à jour du profil');
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      alert('Erreur serveur lors de la mise à jour');
    }
  });

  async function loadAmenities() {
    try {
      const res = await fetchWithAutoRefresh('/amenities');
      if (!res.ok) throw new Error('Failed to load amenities');
      const amenities = await res.json();

      const select = document.getElementById('amenity_ids');
      select.innerHTML = '';

      amenities.forEach(a => {
        const option = document.createElement('option');
        option.value = a.id;
        option.textContent = a.name;
        select.appendChild(option);
      });
    } catch (err) {
      console.error('Error loading amenities:', err);
    }
  }

  const addPlaceForm = document.getElementById('add-place');
  const savePlaceBtn = document.getElementById('save-place');
  const cancelPlaceBtn = document.getElementById('cancel-place');
  const addPlaceButton = document.getElementById('add-place-btn');

  addPlaceButton.addEventListener('click', () => {
    addPlaceForm.classList.add('visible');
  });

  cancelPlaceBtn.addEventListener('click', (e) => {
    e.preventDefault();
    addPlaceForm.classList.remove('visible');
  });

  savePlaceBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const title = document.getElementById('place-title').value.trim();
    const description = document.getElementById('place-description').value.trim();
    const price = parseFloat(document.getElementById('price').value);
    const latitude = parseFloat(document.getElementById('latitude').value);
    const longitude = parseFloat(document.getElementById('longitude').value);
    const amenitiesIdsRaw = document.getElementById('amenity_ids').value.trim();
    const photosUrlRaw = document.getElementById('photos_url').value.trim();

    if (!title || !description || isNaN(price) || isNaN(latitude) || isNaN(longitude)) {
      alert('Please fill the form correctly');
      return;
    }

    const amenity_ids = amenitiesIdsRaw ? amenitiesIdsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
    const photos_url = photosUrlRaw ? photosUrlRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

    const placeData = {
      title,
      description,
      price,
      latitude,
      longitude,
      amenity_ids,
      photos_url,
    };

    try {
      const response = await fetchWithAutoRefresh('/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(placeData),
      });

      if (!response.ok) {
        const err = await response.json();
        alert(err.error || 'Error while creating place');
        return;
      }

      const newPlace = await response.json();
      alert(`Place created successfully: ${newPlace.title}`);
      location.reload();

      addPlaceForm.reset();
      addPlaceForm.classList.remove('visible');
      refreshProfile();
    } catch (error) {
      console.error('Error creating place:', error);
      alert('Server or network error');
    }
  });

  document.querySelectorAll(".place-item").forEach(item => {
    item.addEventListener("click", async (e) => {
      e.stopPropagation();
  
      document.querySelectorAll(".edit-form-container").forEach(container => {
        container.classList.remove("expanded", "collapsing");
        container.innerHTML = "";
      });
  
      const formContainer = document.getElementById("global-edit-form-container");
      if (!formContainer) {
        console.error('Global edit form container not found');
        alert('Erreur : conteneur de formulaire global introuvable');
        return;
      }
  
      const placeId = item.dataset.placeId;
      const title = item.dataset.title || 'No title';
      const description = item.dataset.description || 'No description';
      const price = parseFloat(item.dataset.price || '0');
      const latitudeRaw = item.dataset.latitude;
      const longitudeRaw = item.dataset.longitude;
      const amenityIdsRaw = item.dataset.amenityIds || ''; // Récupérer les IDs des amenities
  
      const latitude = (latitudeRaw && latitudeRaw !== "null" && latitudeRaw !== "undefined") ? Number(latitudeRaw) : '';
      const longitude = (longitudeRaw && longitudeRaw !== "null" && longitudeRaw !== "undefined") ? Number(longitudeRaw) : '';
      const amenityIds = amenityIdsRaw ? amenityIdsRaw.split(',').map(id => id.trim()).filter(Boolean) : [];
  
      let photos_url = item.dataset.photosUrl || '';
      photos_url = photos_url.trim();
      if (photos_url === 'none' || photos_url === 'null' || photos_url === '[]') {
        photos_url = '';
      }
  
      if (!placeId) {
        console.error('Missing placeId:', item.dataset);
        alert('Erreur : ID de la place manquant');
        return;
      }
  
      const formHTML = `
        <div class="edit-form place-card">
          <button type="button" class="close-form-btn" title="Close">✖</button>
          <form class="edit-place-form" id="edit-place-form-${placeId}">
            <h3>Edit Place</h3>
            <input type="hidden" name="place_id" value="${placeId}" />
            <label for="edit-title-${placeId}">Title:</label>
            <input type="text" id="edit-title-${placeId}" name="title" value="${title}" required />
            <label for="edit-description-${placeId}">Description:</label>
            <textarea id="edit-description-${placeId}" name="description" required>${description}</textarea>
            <label for="edit-price-${placeId}">Price (€):</label>
            <input type="number" id="edit-price-${placeId}" name="price" value="${price}" required min="0" step="0.01" />
            <label for="edit-latitude-${placeId}">Latitude:</label>
            <input type="number" step="any" id="edit-latitude-${placeId}" name="latitude" value="${latitude}" />
            <label for="edit-longitude-${placeId}">Longitude:</label>
            <input type="number" step="any" id="edit-longitude-${placeId}" name="longitude" value="${longitude}" />
            <label for="edit-amenity_ids-${placeId}">Amenities:</label>
            <select id="edit-amenity_ids-${placeId}" name="amenity_ids" multiple class="form-control" style="height: 150px;">
            </select>
            <label for="edit-photos_url-${placeId}">Photos (URL):</label>
            <input type="text" id="edit-photos_url-${placeId}" name="photos_url" value="${photos_url}" />
            <div class="form-buttons">
              <button type="submit">Save</button>
              <button type="button" class="delete-place-btn">Delete</button>
            </div>
          </form>
        </div>
      `;
  
      try {
        formContainer.innerHTML = formHTML;
        formContainer.classList.add("visible", "expanded");
      } catch (error) {
        console.error('Error inserting form HTML:', error);
        alert('Error: can\'t insert form');
        return;
      }
  
      // Charger les amenities et pré-sélectionner celles associées
      try {
        const res = await fetchWithAutoRefresh('/amenities');
        if (!res.ok) throw new Error('Failed to load amenities');
        const amenities = await res.json();
  
        const select = formContainer.querySelector(`#edit-amenity_ids-${placeId}`);
        select.innerHTML = '';
        amenities.forEach(a => {
          const option = document.createElement('option');
          option.value = a.id;
          option.textContent = a.name;
          if (amenityIds.includes(String(a.id))) {
            option.selected = true; // Pré-sélectionner les amenities associées
          }
          select.appendChild(option);
        });
      } catch (err) {
        console.error('Error loading amenities for edit form:', err);
        alert('Erreur lors du chargement des amenities');
      }
  
      formContainer.scrollIntoView({ behavior: "smooth", block: "center" });
  
      const form = formContainer.querySelector(`#edit-place-form-${placeId}`);
      const closeBtn = formContainer.querySelector(".close-form-btn");
      const deleteBtn = formContainer.querySelector(".delete-place-btn");
  
      if (!form || !closeBtn || !deleteBtn) {
        console.error('Form elements not found:', { form, closeBtn, deleteBtn });
        alert('Erreur : éléments du formulaire introuvables');
        return;
      }
  
      closeBtn.addEventListener("click", () => {
        formContainer.classList.remove("expanded", "visible");
        formContainer.innerHTML = "";
      });
  
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
  
        const formData = new FormData(form);
        const raw = Object.fromEntries(formData.entries());
  
        const payload = {
          place_id: raw.place_id,
          title: raw.title,
          description: raw.description,
          price: raw.price ? parseFloat(raw.price) : undefined,
          latitude: raw.latitude ? parseFloat(raw.latitude) : undefined,
          longitude: raw.longitude ? parseFloat(raw.longitude) : undefined,
          amenity_ids: Array.from(form.querySelector(`#edit-amenity_ids-${placeId}`).selectedOptions).map(option => option.value),
        };
  
        const rawPhotos = raw.photos_url;
        if (rawPhotos && typeof rawPhotos === 'string') {
          const photos = rawPhotos
            .split(/[\n,]+/)
            .map(s => s.trim())
            .filter(Boolean);
          if (photos.length > 0) {
            payload.photos_url = photos;
          }
        }
  
        try {
          const response = await fetchWithAutoRefresh(`/places/${payload.place_id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(payload)
          });
  
          const data = await response.json();
  
          if (!response.ok) {
            console.error("Update failed:", data);
            alert("Erreur lors de la mise à jour : " + (data.error || "inconnue"));
            return;
          }
  
          alert("Place updated successfully");
          formContainer.classList.remove("expanded", "visible");
          formContainer.innerHTML = "";
          location.reload();
        } catch (error) {
          console.error("System error", error);
          alert("Système error");
        }
      });
  
      deleteBtn.addEventListener("click", async () => {
        if (!confirm("Are you sure you want to delete this place?")) return;
  
        try {
          const response = await fetchWithAutoRefresh(`/places/${placeId}`, {
            method: "DELETE",
            credentials: "include"
          });
  
          if (response.ok) {
            alert("Place deleted!");
            formContainer.classList.remove("expanded", "visible");
            formContainer.innerHTML = "";
            location.reload();
          } else {
            const err = await response.json();
            console.error('Delete failed:', err);
            alert(err.error || "Failed to delete place");
          }
        } catch (err) {
          console.error("Error deleting place:", err);
          alert("Unexpected error");
        }
      });
    });
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".place-item") && !event.target.closest(".edit-form-container")) {
      document.querySelectorAll(".edit-form-container").forEach(c => {
        c.classList.remove("expanded");
        c.innerHTML = "";
      });
    }
  });
});