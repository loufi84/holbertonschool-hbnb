import requests

BASE_URL = "http://localhost:5001/api/v1"

def register(email):
    res = requests.post(f"{BASE_URL}/users", json={
        "email": email,
        "password": "123456",
        "first_name": "User",
        "last_name": "Test"
    })
    print(f"Register {email} => {res.status_code} | {res.json()}")

    if res.status_code == 201:
        return res.json()["id"]
    elif res.status_code == 400 and res.json().get("error") == "Email already registered":
        return None
    else:
        raise Exception(f"Unexpected response: {res.status_code} - {res.text}")

user_id = register("user1@example.com")
assert user_id is not None

# Login user
res = requests.post(f"{BASE_URL}/users/login", json={
    "email": "user1@example.com",
    "password": "123456"
})

token = res.json().get("access_token")
assert token, "No access token received"

# Add Authorization header
headers = {
    "Authorization": f"Bearer {token}"
}

# Register a new place
res = requests.post(f"{BASE_URL}/places", json = {
    "title": "Maion de test",
    "description": "C'est une maison en forme de maison",
    "price": 23.4243,
    "latitude": 23.4232,
    "longitude": 42.424242
}, headers=headers)
print("Status:", res.status_code)
try:
    data = res.json()
except ValueError:
    print("Body (Non-JSON):", res.text)

place_id = data.get("id")

# Delete the place
res = requests.delete(f"{BASE_URL}/places/{place_id}", headers=headers)
print("Status:", res.status_code)
try:
    print("Body:", res.json())
except ValueError:
    print("Body (Non-JSON):", res.text)

# Delete an user
res = requests.delete(f"{BASE_URL}/users/{user_id}", headers=headers)
print("Status:", res.status_code)
try:
    print("Body:", res.json())
except ValueError:
    print("Body (non-JSON):", res.text)
