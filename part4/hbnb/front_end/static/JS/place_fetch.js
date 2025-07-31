import apiClient from "./apiClient.js";
const { fetchWithAutoRefresh } = apiClient || {};

document.addEventListener('DOMContentLoaded', () => {
    const placesList = document.getElementById('places-list');
    const userNav = document.getElementById('userNav');
    const header = document.getElementById('header');
    const form = document.getElementById('search-form');
    const addressInput = document.getElementById('location');
    const minPriceInput = document.getElementById('min-price');
    const maxPriceInput = document.getElementById('max-price');
    const distanceInput = document.getElementById('distance');
    let expandedCard = null;
    let lastScrollTop = 0;

    // Create a container for address suggestions
    const choicesContainer = document.createElement("div");
    choicesContainer.id = "choices-container";
    addressInput.parentNode.appendChild(choicesContainer);

    // Function to calculate distance (Haversine)
    function haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in km
        console.log(`Calculated distance: ${distance} km between (${lat1}, ${lon1}) and (${lat2}, ${lon2})`);
        return distance;
    }

    // Function to apply filters
    function applyFilters(lat = null, lon = null) {
        const placeCards = document.querySelectorAll('.place-card');
        const address = addressInput.value.trim().toLowerCase() || undefined;
        const minPrice = minPriceInput.value.trim() ? parseFloat(minPriceInput.value) : undefined;
        const maxPrice = maxPriceInput.value.trim() ? parseFloat(maxPriceInput.value) : undefined;
        const maxDistance = distanceInput.value.trim() ? parseFloat(distanceInput.value) : undefined;

        console.log('Applied filters:', { address, minPrice, maxPrice, maxDistance, lat, lon });
        console.log(`Number of cards: ${placeCards.length}`);

        let visibleCount = 0;

        placeCards.forEach(card => {
            const price = parseFloat(card.dataset.price);
            const placeLocation = card.dataset.location?.toLowerCase() || '';
            const latPlace = parseFloat(card.dataset.lat);
            const lonPlace = parseFloat(card.dataset.lon);

            console.log(`Card: ${placeLocation}, Price: ${price}, Coord: (${latPlace}, ${lonPlace})`);

            let priceOk = true;
            if (minPrice !== undefined && (isNaN(price) || price < minPrice)) {
                priceOk = false;
                console.log(`Card ${placeLocation} rejected: price ${price} < minPrice ${minPrice} or invalid`);
            }
            if (maxPrice !== undefined && (isNaN(price) || price > maxPrice)) {
                priceOk = false;
                console.log(`Card ${placeLocation} rejected: price ${price} > maxPrice ${maxPrice} or invalid`);
            }

            let distanceOk = true;
            if (maxDistance !== undefined && lat !== null && lon !== null && !isNaN(latPlace) && !isNaN(lonPlace)) {
                if (latPlace < -90 || latPlace > 90 || lonPlace < -180 || lonPlace > 180) {
                    console.log(`Card ${placeLocation} rejected: invalid coordinates (${latPlace}, ${lonPlace})`);
                    distanceOk = false;
                } else {
                    const dist = haversineDistance(lat, lon, latPlace, lonPlace);
                    distanceOk = dist <= maxDistance;
                    if (!distanceOk) {
                        console.log(`Card ${placeLocation} rejected: distance ${dist} > maxDistance ${maxDistance}`);
                    }
                }
            }

            let locationOk = true;
            if (address !== undefined && lat === null && lon === null) {
                const searchCity = address.split(',')[0].trim().toLowerCase();
                locationOk = placeLocation.includes(searchCity);
                if (!locationOk) {
                    console.log(`Card ${placeLocation} rejected: does not match ${searchCity}`);
                }
            }

            if (priceOk && distanceOk && locationOk) {
                console.log(`Card ${placeLocation} accepted`);
                card.style.display = '';
                visibleCount++;
            } else {
                console.log(`Card ${placeLocation} rejected: priceOk=${priceOk}, distanceOk=${distanceOk}, locationOk=${locationOk}`);
                card.style.display = 'none';
            }
        });

        const noResultMessage = document.createElement('p');
        noResultMessage.id = 'no-results-msg';
        noResultMessage.textContent = 'No results found for these criteria.';
        noResultMessage.style.display = visibleCount === 0 ? 'block' : 'none';

        if (placesList.querySelector('#no-results-msg')) {
            placesList.removeChild(placesList.querySelector('#no-results-msg'));
        }
        if (visibleCount === 0) {
            placesList.appendChild(noResultMessage);
        }
    }

    // Function to handle filtering with geocoding
    function setupSearch() {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const address = addressInput.value.trim() || undefined;

            if (address) {
                try {
                    const response = await fetch('/geocode', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ city: address })
                    });
                    const text = await response.text();
                    let data;

                    if (!response.ok) {
                        alert("Server error: " + (data?.error || response.status));
                        placesList.innerHTML = '<p>Error during search. Please try again.</p>';
                        return;
                    }

                    try {
                        data = JSON.parse(text);
                    } catch (jsonError) {
                        console.error("Non-JSON response:", text);
                        alert('Error: Invalid server response');
                        placesList.innerHTML = '<p>Error during search. Please try again.</p>';
                        return;
                    }

                    if (data.multiple_results) {
                        choicesContainer.innerHTML = data.choices.map((choice, i) => `
                            <div class="choice-item" data-lat="${choice.lat}" data-lon="${choice.lon}">
                                ${choice.display_name}
                            </div>
                        `).join("");
                        choicesContainer.innerHTML += '<button class="close-choices">Close</button>';

                        choicesContainer.querySelectorAll(".choice-item").forEach(item => {
                            item.addEventListener("click", () => {
                                addressInput.value = item.textContent;
                                choicesContainer.innerHTML = "";
                                console.log(`Before applyFilters: ${document.querySelectorAll('.place-card').length} cards`);
                                applyFilters(parseFloat(item.dataset.lat), parseFloat(item.dataset.lon));
                            });
                        });
                        choicesContainer.querySelector('.close-choices')?.addEventListener('click', () => {
                            choicesContainer.innerHTML = '';
                            document.querySelectorAll('.place-card').forEach(card => card.style.display = '');
                        });

                        // Do not clear placesList, just show suggestions
                        document.querySelectorAll('.place-card').forEach(card => card.style.display = 'none');
                    } else if (!data.error) {
                        choicesContainer.innerHTML = "";
                        console.log(`Before applyFilters: ${document.querySelectorAll('.place-card').length} cards`);
                        applyFilters(parseFloat(data.lat), parseFloat(data.lon));
                    } else {
                        choicesContainer.innerHTML = "";
                        placesList.innerHTML = '<p>City not found. Please try again.</p>';
                        console.error(data.error);
                    }
                } catch (e) {
                    console.error("Network error:", e);
                    alert("Network error or server unreachable.");
                    placesList.innerHTML = '<p>Network error. Please try again.</p>';
                }
            } else {
                choicesContainer.innerHTML = "";
                console.log(`Before applyFilters: ${document.querySelectorAll('.place-card').length} cards`);
                applyFilters();
            }
        });
    }

    // Load places from API
    fetchWithAutoRefresh('/places')
        .then(response => {
            if (!response.ok) throw new Error('Error while fetching places');
            return response.json();
        })
        .then(data => {
            console.log('Places data:', data);
            placesList.innerHTML = '';

            data.forEach(place => {
                const placeCard = document.createElement('article');
                placeCard.classList.add('place-card');
                placeCard.dataset.lat = place.latitude;
                placeCard.dataset.lon = place.longitude;
                placeCard.dataset.price = place.price;
                placeCard.dataset.location = '';

                console.log(`Creating card: ${place.title}, Price: ${place.price}, Lat: ${place.latitude}, Lon: ${place.longitude}`);

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

                const cityParagraph = document.createElement('p');
                cityParagraph.classList.add('place-city');
                cityParagraph.innerHTML = 'City: <span class="city-placeholder">Loading</span>';

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
                    <img src="${imageUrl}" alt="Image of ${place.title}" class="place-image" />
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

                placeCard.querySelector('.place-summary').appendChild(cityParagraph);

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
                        collapseCardSmooth(expandedCard);
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
                        collapseCardSmooth(placeCard);
                    }
                });

                placesList.appendChild(placeCard);
                console.log(`Card added: ${place.title}, Total cards: ${placesList.querySelectorAll('.place-card').length}`);
            });

            async function fetchAndDisplayCities() {
                const placeCards = document.querySelectorAll('.place-card');
                console.log(`Number of cards after loading: ${placeCards.length}`);
                for (const card of placeCards) {
                    const lat = card.dataset.lat;
                    const lon = card.dataset.lon;
                    if (!lat || !lon) {
                        console.warn(`Invalid coordinates for a card: lat=${lat}, lon=${lon}`);
                        continue;
                    }

                    const citySpan = card.querySelector('.city-placeholder');
                    if (!citySpan) continue;

                    try {
                        const res = await fetch('/reverse-geocode', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ lat, lon }),
                        });

                        if (!res.ok) throw new Error('Network error');

                        const data = await res.json();
                        const city = data.city || 'Unknown city';
                        citySpan.textContent = city;
                        card.dataset.location = city;
                        console.log(`City loaded: ${city}, lat: ${lat}, lon: ${lon}`);
                    } catch (err) {
                        citySpan.textContent = 'Error';
                        card.dataset.location = 'Error';
                        console.error('Geocoding error:', err);
                    }
                }
            }

            fetchAndDisplayCities().then(() => {
                console.log(`Cards after fetchAndDisplayCities: ${document.querySelectorAll('.place-card').length}`);
                setupSearch();
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

    // User authentication
    fetchWithAutoRefresh('/users/me', {
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

            const profileLink = document.createElement('a');
            profileLink.href = '/profile';
            const profileImage = document.createElement('img');
            const photo = user.photo_url;
            profileImage.src = (typeof photo === 'string' && photo.trim() !== '')
                ? photo
                : '/static/images/default_profile.png';
            profileImage.alt = 'Profile picture';
            profileImage.classList.add('profile-pic');
            profileLink.appendChild(profileImage);
            userContainer.appendChild(profileLink);

            if (user.is_admin) {
                const adminLink = document.createElement('a');
                adminLink.href = '/admin-panel';
                adminLink.textContent = 'Admin';
                adminLink.classList.add('admin-link');
                userContainer.appendChild(adminLink);
            }

            const logoutLink = document.createElement('a');
            logoutLink.href = "#";
            logoutLink.textContent = 'Logout';
            logoutLink.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    await fetchWithAutoRefresh('/users/logout', {
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

    function collapseCardSmooth(card) {
        const rect = card.getBoundingClientRect();
        card.style.position = 'fixed';
        card.style.top = `${rect.top}px`;
        card.style.left = `${rect.left}px`;
        card.style.width = `${rect.width}px`;
        card.style.height = `${rect.height}px`;
        card.style.zIndex = 10001;

        void card.offsetWidth;

        card.classList.remove('expanded');
        card.classList.add('collapsing');

        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.classList.remove('active');
            overlay.style.pointerEvents = 'auto';
        }

        document.body.style.overflow = '';

        setTimeout(() => {
            card.classList.remove('collapsing');
            card.removeAttribute('style');
            expandedCard = null;
        }, 500);
    }
});