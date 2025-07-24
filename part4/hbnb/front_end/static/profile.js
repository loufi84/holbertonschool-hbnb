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
      <img src="${photo}" alt="Profile picture" class="profile-photo" onerror="this.src='/static/images/default_profile.png'" />
      <h2>${user.first_name || 'N/A'} ${user.last_name || 'N/A'}</h2>
      <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
    `;

    profileContainer.classList.remove('hidden');
    editButton.classList.remove('hidden');
    editForm.classList.add('hidden');
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
      } else {
        alert(result.error || 'Échec de la mise à jour du profil');
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      alert('Erreur serveur lors de la mise à jour');
    }
  });
});