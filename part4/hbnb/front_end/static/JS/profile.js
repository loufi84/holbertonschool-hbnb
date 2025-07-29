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

  // Champs du formulaire
  const firstNameInput = document.getElementById('edit_first_name');
  const lastNameInput = document.getElementById('edit_last_name');
  const emailInput = document.getElementById('edit_email');
  const photoUrlInput = document.getElementById('edit_photo_url');

  // Vérifier que les éléments existent
  if (!profileContainer || !editButton || !editForm || !cancelBtn || !saveBtn || !firstNameInput) {
    console.error('Un ou plusieurs éléments du DOM sont manquants :', {
      profileContainer, editButton, editForm, cancelBtn, saveBtn, firstNameInput
    });
    alert('Erreur : certains éléments de la page sont introuvables.');
    return;
  }

  let user = null;

  try {
    console.log('Fetching user data from /api/v1/users/me');
    const response = await fetchWithAutoRefresh('/users/me', {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      console.error('Fetch failed with status:', response.status);
      throw new Error('Unauthorized');
    }

    user = await response.json();
    console.log('User data received:', JSON.stringify(user, null, 2));

    if (!user || !user.user_id) {
      throw new Error('Invalid user data');
    }

    displayUserInfo(user);
    prefillForm(user);
  } catch (err) {
    console.error('Error fetching user data:', err);
    alert('Vous devez être connecté pour accéder à votre profil');
    window.location.href = '/login';
    return;
  }

  function displayUserInfo(user) {
    const photo = user.photo_url && user.photo_url.trim() !== ''
      ? user.photo_url
      : '/static/images/default_profile.png';

    console.log('Displaying user info with photo URL:', photo);

    profileContainer.innerHTML = `
      <div class="profile-card">
        <img src="${photo}" alt="Profile picture" class="profile-photo" onerror="this.src='/static/images/default_profile.png'" />
        <div class="profile-text">
          <h2>${user.first_name || 'N/A'} ${user.last_name || 'N/A'}</h2>
          <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
        </div>
      </div>
    `;

    profileContainer.classList.remove('hidden');
    editButton.classList.remove('hidden');
    editForm.classList.add('hidden');
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
    console.log('Prefilling form with user data:', user);
    firstNameInput.value = user.first_name || '';
    lastNameInput.value = user.last_name || '';
    emailInput.value = user.email || '';
    photoUrlInput.value = user.photo_url === 'None' ? '' : user.photo_url || '';
    console.log('Form fields:', {
      firstName: firstNameInput.value,
      lastName: lastNameInput.value,
      email: emailInput.value,
      photoUrl: photoUrlInput.value
    });
  
    editForm.classList.add('hidden');
    profileContainer.classList.remove('hidden');
    editButton.classList.remove('hidden');
  }

  editButton.addEventListener('click', () => {
    console.log('Edit button clicked');
    editForm.classList.remove('hidden');
    profileContainer.classList.add('hidden');
    editButton.classList.add('hidden');
  });
  

  cancelBtn.addEventListener('click', () => {
    console.log('Cancel button clicked');
    prefillForm(user);
  });

  saveBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    console.log('Save button clicked');
    console.log('user.user_id:', user.user_id);
  
    const updatedUser = {
      first_name: firstNameInput.value.trim(),
      last_name: lastNameInput.value.trim(),
      email: emailInput.value.trim(),
      photo_url: photoUrlInput.value.trim()
    };
  
    console.log('Updated user data:', updatedUser);
  
    for (const key in updatedUser) {
      const newVal = updatedUser[key];
      const oldVal = user[key];

      if (newVal === oldVal || newVal === '') {
        delete updatedUser[key];
      }
    }
  
    if (Object.keys(updatedUser).length === 0) {
      console.log('No changes detected');
      alert("Aucune modification détectée.");
      prefillForm(user);
      return;
    }
  
    try {
      const updateUrl = `/users/${user.user_id}`;
      console.log('Sending update request to:', updateUrl);
      const response = await fetchWithAutoRefresh(updateUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedUser)
      });
  
      const result = await response.json();
      console.log('Update response:', result);
  
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

  const addPlaceForm = document.getElementById('add-place');
  const savePlaceBtn = document.getElementById('save-place');
  const cancelPlaceBtn = document.getElementById('cancel-place');
  const addPlaceButton = document.getElementById('add-place-btn');

  addPlaceButton.addEventListener('click', () => {
    addPlaceForm.classList.remove('hidden');
  })

  cancelPlaceBtn.addEventListener('click', (e) => {
    e.preventDefault();
    addPlaceForm.classList.add('hidden');
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

      addPlaceForm.reset();
      addPlaceForm.classList.add('hidden');
      refreshProfile();
    } catch (error) {
      console.error('Error creating place:', error);
      alert('Server or network error');
    }
  })

  // User update place
  const placeItems = document.querySelectorAll(".place-item");

  placeItems.forEach(item => {
    item.addEventListener("click", (e) => {
      e.stopPropagation(); // Empêche la fermeture immédiate par le listener global

      // Cacher tous les autres formulaires
      document.querySelectorAll(".edit-form-container").forEach(c => c.classList.add("hidden"));

      const formContainer = item.querySelector(".edit-form-container");
      formContainer.innerHTML = ""; // Nettoyer l'ancien contenu s'il y en a

      const placeId = item.dataset.placeId;
      const title = item.dataset.title;
      const description = item.dataset.description;
      const price = item.dataset.price;

      const formHTML = `
        <form class="edit-place-form">
          <h3>Edit Place</h3>
          <input type="hidden" name="place_id" value="${placeId}" />
          <label>Title:</label>
          <input type="text" name="title" value="${title}" required />
          <label>Description:</label>
          <textarea name="description" required>${description}</textarea>
          <label>Price (€):</label>
          <input type="number" name="price" value="${price}" required min="0" step="0.01" />
          <div class="form-buttons">
            <button type="submit">Save</button>
          </div>
        </form>
      `;

      formContainer.innerHTML = formHTML;
      formContainer.classList.remove("hidden");

      const form = formContainer.querySelector(".edit-place-form");

      // Submit
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const body = Object.fromEntries(formData.entries());

        try {
          const response = await fetch(`/api/places/${body.place_id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
          });

          if (response.ok) {
            alert("Place updated!");
            location.reload();
          } else {
            alert("Failed to update place");
          }
        } catch (err) {
          console.error("Error updating place:", err);
          alert("Unexpected error");
        }
      });
    });
  });

  // Clic en dehors => cacher les formulaires
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".place-item")) {
      document.querySelectorAll(".edit-form-container").forEach(c => c.classList.add("hidden"));
    }
  });

});