document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async(e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://127.0.0.1:5001/api/v1/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (response.ok) {
                window.location.href = '../static/index.html';
            } else {
                alert(result.error || 'Invalid password or email');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Server error. Please try again later');
        }
    });
});