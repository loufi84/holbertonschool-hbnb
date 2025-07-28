import apiClient from "./apiClient.js";
const { fetchWithAutoRefresh } = apiClient || {};

document.addEventListener('DOMContentLoaded', async () => {
    // === NOTE MOYENNE ===
    const ratingContainer = document.getElementById('rating-container');
    const ratingStr = ratingContainer?.getAttribute('data-rating');
    const placeAverageRating = ratingStr ? parseFloat(ratingStr) : null;

    if (placeAverageRating === null || isNaN(placeAverageRating)) {
        ratingContainer.innerHTML = '<p>No rating for the moment</p>';
    } else {
        const scoreDisplay = `<span class="score">${placeAverageRating.toFixed(1)}/5</span>`;
        ratingContainer.innerHTML = ratingContainer.innerHTML + scoreDisplay;
    }

    // === AFFICHAGE DES ÉQUIPEMENTS ===
    const amenitiesSection = document.getElementById('amenities-section');
    const amenitiesList = document.getElementById('amenities-list');
    const amenitiesIds = amenitiesSection?.getAttribute('data-amenity');

    if (amenitiesIds) {
        const amenityIds = amenitiesIds.split(',').map(id => id.trim()).filter(Boolean);
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        try {
            const amenityPromise = amenityIds
                .filter(id => UUID_REGEX.test(id))
                .map(id =>
                    fetchWithAutoRefresh(`/amenities/${id}`)
                        .then(res => (res.ok ? res.json() : null))
                );

            const amenities = await Promise.all(amenityPromise);
            const validAmenities = amenities.filter(Boolean);

            amenitiesList.innerHTML = validAmenities.length > 0
                ? validAmenities.map(amenity => `<li><i class="fa fa-check-circle"></i> ${amenity.name}</li>`).join('')
                : '<li>No amenities found</li>';
        } catch (err) {
            console.error('Failed to load amenities:', err);
            amenitiesList.innerHTML = '<li>Error loading amenities</li>';
        }
    } else {
        amenitiesList.innerHTML = '<li>No amenities listed for this place</li>';
    }

    // === VÉRIFICATION DE L'UTILISATEUR CONNECTÉ ===
    let user = null;
    try {
        const res = await fetchWithAutoRefresh('/users/me', {
            method: 'GET',
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Unauthorized');
        user = await res.json();
        console.log('User connecté :', user);
    } catch (err) {
        console.warn('Utilisateur non connecté', err);
        const bookButton = document.getElementById('book-button');
        if (bookButton) {
            const loginButton = document.createElement('a');
            loginButton.href = '/login';
            loginButton.id = 'book-button';
            loginButton.textContent = 'You need to be connected to book this place';
            bookButton.parentNode.replaceChild(loginButton, bookButton);
        }
        return;
    }

    // === FORMULAIRE DE REVIEW ===
    const placeId = document.body.getAttribute('data-place-id');
    const showFormBtn = document.getElementById('show-review-form-btn');
    const reviewCard = document.getElementById('review-card-container');
    const reviewForm = document.getElementById('review-form');

    try {
        const bookingsRes = await fetchWithAutoRefresh(`/bookings/users/${user.user_id}/booking`);
        if (!bookingsRes.ok) throw new Error('Failed to fetch bookings');
        const bookings = await bookingsRes.json();

        const userBookingsForPlace = bookings.filter(
            b => b.place === placeId && b.status === 'DONE'
        );

        if (userBookingsForPlace.length > 0) {
            if (!showFormBtn || !reviewCard || !reviewForm) {
                console.error('One or more review form elements missing:', {
                    showFormBtn: !!showFormBtn,
                    reviewCard: !!reviewCard,
                    reviewForm: !!reviewForm
                });
                return;
            }

            showFormBtn.style.display = 'inline-block';
            showFormBtn.addEventListener('click', () => {
                reviewCard.style.display = reviewCard.style.display === 'none' ? 'block' : 'none';
                setupInteractiveStars('review-stars'); // Activate stars for review form
            });

            reviewForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const reviewText = document.getElementById('review-text').value;
                const ratingToSend = parseFloat(document.getElementById('review-rating-value').value) || 0;

                if (ratingToSend === 0) {
                    alert('Please select a rating.');
                    return;
                }

                try {
                    const res = await fetchWithAutoRefresh(`/reviews/from_booking/${userBookingsForPlace[0].id}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            credentials: 'include'
                        },
                        body: JSON.stringify({
                            comment: reviewText,
                            rating: ratingToSend
                        })
                    });

                    if (res.ok) {
                        alert('Review submitted successfully!');
                        reviewForm.reset();
                        document.getElementById('review-rating-value').value = 0;
                        reviewCard.style.display = 'none';
                        location.reload();
                    } else {
                        const errorData = await res.json();
                        alert(`Error submitting review: ${errorData.error}`);
                    }
                } catch (err) {
                    console.error('Error submitting review:', err);
                    alert('An error occurred while submitting the review.');
                }
            });
        }
    } catch (err) {
        console.warn('Erreur lors du chargement des réservations pour review:', err);
    }
});