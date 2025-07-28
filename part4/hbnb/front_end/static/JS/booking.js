document.addEventListener('DOMContentLoaded', async () => {
    const placeId = document.body.getAttribute("data-place-id");

    const toDayOnly = (d) => {
        const date = new Date(d);
        date.setUTCHours(0, 0, 0, 0);
        return date;
    };

    let disabeldRanges = [];
    try {
        const res = await fetch(`/api/v1/bookings/places/${placeId}/pending_booking`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });

        if (res.ok) {
            const bookings = await res.json();
            console.log('Booking response:', bookings)
            
            if (!Array.isArray(bookings)) {
                disabeldRanges = [];
            } else {
                disabeldRanges = bookings.map(b => ({
                    from: toDayOnly(b.start_date),
                    to: toDayOnly(b.end_date)
                }));
            }
        } else {
            console.warn('Can\'t fetch existing bookings');
        }
    } catch (err) {
        console.error('Error fetching bookings:', err);
    }

    // FLATPICKR setup
    let selectedStart = null;
    let selectedEnd = null;

    flatpickr("#date-range", {
        theme: "material-dark",
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
                window.location.href = '/static/index.html';
            } else {
                alert(result.error || JSON.stringify(result.errors));
            }
        } catch (err) {
            console.error(err);
            alert("Server error. Try again later.");
        }
    });
});
