document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('account_creation').addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const first_name = document.getElementById('first_name').value;
        const last_name = document.getElementById('last_name').value;
        const photo_url = document.getElementById('photo_url').value;

        const payload = {
            email,
            password,
            first_name,
            last_name
        }

        if (photo_url.trim()) {
            payload.photo_url = photo_url;
        }

        const response = await fetch('/api/v1/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            alert('Account created successfully');
            window.location.href = '/login';
        } else {
            let errorMessage;

            if (typeof result.error === 'string') {
                errorMessage = result.error;
            } else if (Array.isArray(result.error)) {
                errorMessage = result.error.map(err => err.msg).join('\n');
            } else {
                errorMessage = 'An unexpected error occurred';
            }

            alert('Error: ' + errorMessage);
        }
    });
});
