const API_BASE_URL = 'http://127.0.0.1:5001/api/v1';

async function fetchWithAutoRefresh(endpoint, options = {}) {
    options.credentials = 'include'

    let response = await fetch(API_BASE_URL + endpoint, options);

    if (response.status === 401) {
        const refreshResponse = await fetch(API_BASE_URL + '/users/refresh', {
            method: 'POST',
            credentials: 'include'
        });

        if (!refreshResponse.ok) {
            throw new Error('Session has expired, please log again.');
        }

        response = await fetch(API_BASE_URL + endpoint, options);
    }
    return response;
}

async function getJSON(endpoint, options = {}) {
    const res = await fetchWithAutoRefresh(endpoint, options);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
    }
    return await res.json();
}

export default {
    fetchWithAutoRefresh,
    getJSON,
};