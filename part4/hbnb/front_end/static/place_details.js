document.addEventListener('DOMContentLoaded', async () => {
    // Rating display
    const ratingContainer = document.getElementById('rating-container');
    const ratingStr = ratingContainer.getAttribute('data-rating');
    const rating = ratingStr ? parseFloat(ratingStr) : null;

    const placeId = document.body.getAttribute("data-place-id");
    const toDayOnly = (d) => {
        const date = new Date(d);
        date.setUTCHours(0, 0, 0, 0);
        return date;
    }
    let disabeldRanges = [];
    try {
        const res = await fetch(`/api/v1/bookings/places/${placeId}/pending_booking`, {
            headers: {'Authorization': `Bearer ${localStorage.getItem('access_token')}`}
        });
        if (res.ok) {
            const bookings = await res.json();
            disabeldRanges = bookings.map(b => ({
                from: toDayOnly(b.start_date),
                to: toDayOnly(b.end_date)
            }));
        } else {
            console.warn('Can\'t fetch existing bookings');
        }
    } catch (err) {
        console.error('Error fetching bookings:', err);
    }

    if (rating === null) {
        ratingContainer.innerHTML = '<p>No rating for the moment</p>';
    } else {
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
        ratingHTML += `<span class="score">${rating}/5</span></div>`;
        ratingContainer.innerHTML = ratingHTML;
    }

    // FLATPICKR setup
    let selectedStart = null;
    let selectedEnd = null;
    flatpickr("#date-range", {
        mode: "range",
        minDate: "today",
        dateFormat: "Y-m-d",
        disable: disabeldRanges,
        inline: true,
        onChange: function (selectedDates) {
            if (selectedDates.length === 2) {
                selectedStart = selectedDates[0].toISOString();
                selectedEnd = selectedDates[1].toISOString();
                document.getElementById('book-button').style.display = 'inline-block';
            }
        },
        onReady: function (selectedDates, dateStr, instance) {
            instance.open();
        }
    });

    // Form submission
    const bookingForm = document.getElementById('booking-form');
    bookingForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!selectedStart || !selectedEnd) {
            alert("Please select a valid date range.");
            return;
        }

        const token = localStorage.getItem('access_token');
        if (!token) {
            alert("You must be logged in to book.");
            return;
        }

        try {
            // placeId Jinja injection
            const placeId = document.body.getAttribute("data-place-id");

            console.log('Place ID sent: ', placeId);
            const response = await fetch(`http://127.0.0.1:5001/api/v1/bookings/${placeId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    start_date: selectedStart,
                    end_date: selectedEnd
                })
            });

            const result = await response.json();
            if (response.ok) {
                alert("Booking created successfully!");
            } else {
                alert(result.error || JSON.stringify(result.errors));
            }
        } catch (err) {
            console.error(err);
            alert("Server error. Try again later.");
        }
    });
});
