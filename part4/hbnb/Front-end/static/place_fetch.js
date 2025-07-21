document.addEventListener('DOMContentLoaded', () => {
    const placesList = document.getElementById('places-list');
    let expandedCard = null;
    let lastScrollTop = 0;
    const header = document.getElementById('header');

    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        if (currentScroll > lastScrollTop) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    });

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

                const galleryHTML = place.photos_urls
                    ? place.photos_urls.map(url => `<img src="${url}" alt="Photo">`).join('')
                    : '';

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

                placeCard.innerHTML = `
                    <img src="${place.photos_url}" alt="Image de ${place.title}" class="place-image" />
                    <div class="place-summary">
                        <h3>${place.title}</h3>
                        <p class="price">${place.price}€</p>
                    </div>
                    <div class="place-details">
                        <div class="gallery">${galleryHTML}</div>
                        ${ratingHTML}
                        <p class="description">${place.description}</p>
                        <button class="details-button" data-id="${place.id || ''}">More details</button>
                    </div>
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

    document.addEventListener('click', (e) => {
        if (expandedCard && !e.target.closest('.place-card')) {
            expandedCard.classList.remove('expanded');
            expandedCard = null;
            const overlay = document.getElementById('overlay');
            if (overlay) {
                overlay.classList.remove('active');
                overlay.style.pointerEvents = 'auto';
            }
            document.body.style.overflow = '';
        }
    });

    const slider = document.getElementById('price-slider');
    const priceValue = document.getElementById('price-value');

    if (slider && priceValue) {
        slider.addEventListener('input', () => {
            priceValue.textContent = slider.value;
            // Places filter
        });
    }
});