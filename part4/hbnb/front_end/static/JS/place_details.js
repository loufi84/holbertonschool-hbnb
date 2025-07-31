import apiClient from "./apiClient.js";
const { fetchWithAutoRefresh } = apiClient || {};

document.addEventListener('DOMContentLoaded', async () => {
    // === RATING ===
    const container = document.getElementById('rating-container');
    if (!container) return;

    const rating = parseFloat(container.dataset.rating) || 0;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;

    for (let i = 0; i < 5; i++) {
        const star = document.createElement('span');
        star.classList.add('star');
        if (i < fullStars) {
        star.classList.add('filled');
        star.textContent = '★';
        } else {
        star.textContent = '☆';
        }
        container.appendChild(star);
    }

    const score = document.createElement('span');
    score.classList.add('score');
    score.textContent = rating.toFixed(1);
    container.appendChild(score);

    // REVIEWS
    const reviewsSection = document.getElementById('reviews-section');
    const reviewsList = document.getElementById('reviews-list');
    const placeId = reviewsSection?.getAttribute('data-place-id');

    if (placeId) {
        try {
            const res = await fetchWithAutoRefresh(`/reviews/places/${placeId}/reviews`);
            if (res.ok) {
                const reviews = await res.json();

                if (reviews.length > 0) {
                    reviewsList.innerHTML = reviews.map(review => `
                        <li>
                            <strong>${review.user_first_name} ${review.user_last_name}</strong><br/>
                            <p>${review.comment}</p>
                            <span class="rating" data-rating="${review.rating}"></span>
                        </li>
                    `).join('');
                    document.querySelectorAll('.rating:not(.interactive-rating)').forEach(container => {
                        const rating = parseFloat(container.dataset.rating) || 0;
                        const fullStars = Math.floor(rating);
                        const hasHalfStar = rating - fullStars >= 0.5;
                        container.innerHTML = '';
                    
                        for (let i = 0; i < 5; i++) {
                            const star = document.createElement('span');
                            star.classList.add('star');
                            if (i < fullStars) {
                                star.classList.add('filled');
                                star.textContent = '★';
                            } else if (i === fullStars && hasHalfStar) {
                                star.classList.add('half');
                                star.textContent = '★';
                            } else {
                                star.textContent = '☆';
                            }
                            container.appendChild(star);
                        }
                    });
                } else {
                    reviewsList.innerHTML = '<li>No reviews found for this place</li>';
                }
            } else {
                reviewsList.innerHTML = '<li>Error loading reviews</li>';
            }
        } catch (err) {
            console.error('Failed to load reviews:', err);
            reviewsList.innerHTML = '<li>Error loading reviews</li>';
        }
    } else {
        reviewsList.innerHTML = '<li>No place specified for reviews</li>';
    }

    // === AMENITIES ===
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

    // === CHECK CONNECTED USER ===
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
            loginButton.classList.add('cool-button');
            loginButton.textContent = 'You need to be connected to book this place';
            bookButton.parentNode.replaceChild(loginButton, bookButton);
        }
        return;
    }

    // === REVIEW FORM ===
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
            reviewCard.classList.toggle('visible');
            setupInteractiveStars(); // Appel corrigé
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
                    // Réinitialiser les étoiles visuellement
                    document.querySelectorAll('.rating input').forEach(input => input.checked = false);
                    reviewCard.classList.remove('visible');
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

    // ===== PHOTO CAROUSEL =====
    const track = document.querySelector('.carousel-track');
    const slides = Array.from(document.querySelectorAll('.carousel-slide'));
    const prevButton = document.querySelector('.carousel-btn.prev');
    const nextButton = document.querySelector('.carousel-btn.next');

    let currentIndex = 0;

    function updateSlidePosition() {
    const slideWidth = slides[0].offsetWidth;
    track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
    }

    prevButton.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    updateSlidePosition();
    });

    nextButton.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % slides.length;
    updateSlidePosition();
    });

    window.addEventListener('resize', updateSlidePosition);
    updateSlidePosition();

    function setupInteractiveStars() {
        const ratingInputs = document.querySelectorAll('.interactive-rating input');
        const reviewRatingValue = document.getElementById('review-rating-value');
    
        if (!reviewRatingValue) {
            console.error('Champ review-rating-value non trouvé');
            return;
        }
    
        if (ratingInputs.length === 0) {
            console.error('Aucun input radio trouvé dans .interactive-rating');
            return;
        }
    
        ratingInputs.forEach(input => {
            input.addEventListener('change', () => {
                const selectedValue = parseFloat(input.value);
                reviewRatingValue.value = selectedValue;
            });
        });
    }
});