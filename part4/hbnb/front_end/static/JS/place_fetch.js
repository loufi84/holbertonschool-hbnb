document.addEventListener('DOMContentLoaded', () => {

    fetch('http://127.0.0.1:5001/api/v1/users/me', {
        method: 'GET',
        credentials: 'include'
    })
    .then(res => {
        if (!res.ok) throw new Error('Not authenticated');
        return res.json();
    })
    .then(user => {
        userNav.innerHTML = '';
    
        const userContainer = document.createElement('div');
        userContainer.classList.add('user-info');
    
        // Clickable image to profile
        const profileLink = document.createElement('a');
        profileLink.href = '/profile';
        const profileImage = document.createElement('img');
        const photo = user.photo_url;
        console.log('Photo URL:', user.photo_url);
        profileImage.src = (typeof photo === 'string' && photo.trim() !== '')
                            ? photo
                            : '/static/images/default_profile.png';
        profileImage.alt = 'Profile picture';
        profileImage.classList.add('profile-pic');
        profileLink.appendChild(profileImage);
    
        userContainer.appendChild(profileLink);
    
        // Admin link if user is admin
        if (user.is_admin) {
            const adminLink = document.createElement('a');
            adminLink.href = '/admin-panel';
            adminLink.textContent = 'Admin';
            adminLink.classList.add('admin-link');
            userContainer.appendChild(adminLink);
        }
    
        // Logout
        const logoutLink = document.createElement('a');
        logoutLink.href = "#";
        logoutLink.textContent = 'Logout';
        logoutLink.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await fetch('http://127.0.0.1:5001/api/v1/users/logout', {
                    method: 'POST',
                    credentials: 'include'
                });
                window.location.reload();
            } catch (err) {
                console.error('Logout failed', err);
            }
        });
    
        userContainer.appendChild(logoutLink);
    
        userNav.appendChild(userContainer);
    })
    .catch(() => {
        userNav.innerHTML = `
            <a href="/acc_creation">Create an account</a>
            <a href="/login">Login</a>
        `;
    });
    

    const placesList = document.getElementById('places-list');
    let expandedCard = null;
    let lastScrollTop = 0;
    const header = document.getElementById('header');

    // Scroll behavior for header
    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        if (currentScroll > lastScrollTop) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    });

    // Load places from API
    fetch('http://127.0.0.1:5001/api/v1/places/')
        .then(response => {
            if (!response.ok) throw new Error('Error while fetching places');
            return response.json();
        })
        .then(data => {
            placesList.innerHTML = '';

            data.forEach(place => {
                const placeCard = document.createElement('article');
                placeCard.classList.add('place-card');

                const rating = place.rating !== null ? place.rating : 0;
                const maxRating = 5;
                const fullStars = Math.floor(rating);
                const hasHalfStar = rating % 1 >= 0.5;
                let ratingHTML = '<div class="rating">';
                for (let i = 1; i <= maxRating; i++) {
                    if (i <= fullStars) {
                        ratingHTML += '<i class="fa fa-star star filled"></i>';
                    } else if (i === fullStars + 1 && hasHalfStar) {
                        ratingHTML += '<i class="fa fa-star-half-alt star filled"></i>';
                    } else {
                        ratingHTML += '<i class="fa fa-star star"></i>';
                    }
                }
                ratingHTML += `<span class="score">${
                    place.rating !== null ? place.rating + '/5' : 'No reviews yet'
                }</span></div>`;

                // Gestion de l'image principale
                let imageUrl = '/static/images/default-placeholder.png';
                if (typeof place.photos_url === 'string') {
                    try {
                        const parsedPhotos = JSON.parse(place.photos_url);
                        if (Array.isArray(parsedPhotos) && parsedPhotos.length > 0) {
                            imageUrl = parsedPhotos[0];
                        } else if (place.photos_url) {
                            imageUrl = place.photos_url;
                        }
                    } catch (e) {
                        if (place.photos_url) {
                            imageUrl = place.photos_url;
                        }
                    }
                } else if (Array.isArray(place.photos_url) && place.photos_url.length > 0) {
                    imageUrl = place.photos_url[0];
                }

                placeCard.innerHTML = `
                    <img src="${imageUrl}" alt="Image de ${place.title}" class="place-image" />
                    <div class="place-summary">
                        <h3>${place.title}</h3>
                        <p class="price">${place.price}€ per night</p>
                    </div>
                    <div class="place-details">
                        ${ratingHTML}
                        <p class="description">${place.description}</p>
                    </div>
                    <button class="details-button" data-id="${place.id || ''}">More details</button>
                `;

                const detailButton = placeCard.querySelector('.details-button');
                detailButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const placeId = e.target.getAttribute('data-id');
                    if (placeId) {
                        window.location.href = `http://127.0.0.1:5001/places/${placeId}`;
                    }
                });

                placeCard.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (expandedCard && expandedCard !== placeCard) {
                        expandedCard.classList.remove('expanded');
                    }

                    const isExpanding = !placeCard.classList.contains('expanded');
                    const overlay = document.getElementById('overlay');
                    if (isExpanding) {
                        placeCard.classList.add('expanded');
                        expandedCard = placeCard;
                        if (overlay) {
                            overlay.classList.add('active');
                            overlay.style.pointerEvents = 'none';
                        }
                        document.body.style.overflow = 'hidden';
                    } else {
                        placeCard.classList.remove('expanded');
                        expandedCard = null;
                        if (overlay) {
                            overlay.classList.remove('active');
                            overlay.style.pointerEvents = 'auto';
                        }
                        document.body.style.overflow = '';
                    }
                });

                placesList.appendChild(placeCard);
            });
        })
        .catch(err => {
            placesList.innerHTML = '<p>An error occurred, can\'t display places.</p>';
            console.error(err);
        });

    // Collapse on outside click
    document.addEventListener('click', (e) => {
        if (expandedCard && !e.target.closest('.place-card')) {
            collapseCardSmooth(expandedCard);
        }
    });
    
    // Price slider
    const slider = document.getElementById('price-slider');
    const priceValue = document.getElementById('price-value');

    if (slider && priceValue) {
        slider.addEventListener('input', () => {
            priceValue.textContent = slider.value;
            // Optionally: filter places here
        });
    }
});

let expandedCard = null;

function collapseCardSmooth(card) {
    const rect = card.getBoundingClientRect();

    // Figer la carte à sa position actuelle
    card.style.position = 'fixed';
    card.style.top = `${rect.top}px`;
    card.style.left = `${rect.left}px`;
    card.style.width = `${rect.width}px`;
    card.style.height = `${rect.height}px`;
    card.style.zIndex = 10001;

    // Forcer reflow pour prendre en compte les styles
    void card.offsetWidth;

    // Remplacer la classe .expanded par .collapsing
    card.classList.remove('expanded');
    card.classList.add('collapsing');

    // Une fois la transition finie, nettoyer
    setTimeout(() => {
        card.classList.remove('collapsing');
        card.removeAttribute('style');
        expandedCard = null;
    }, 500); // match la durée du CSS
}
