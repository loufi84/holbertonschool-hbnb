import requests


BASE_URL = "http://localhost:5001/api/v1"

# Login an admin
res = requests.post(f"{BASE_URL}/users/login", json= {
    "email": "admin@hbnb.com",
    "password": "Iamanadmin"
})

token = res.json().get("access_token")

# Add Authorization header
headers = {
    "Authorization": f"Bearer {token}"
}

# Create a new amenity
res = requests.post(f"{BASE_URL}/amenities", json={
    "name": "Un tabouret d'entraînement",
    "description": "Un tabouret tout ce qu'il y a de plus normal"
}, headers=headers)

print("Status:", res.status_code)
try:
    data = res.json()
except ValueError:
    print("Body (Non-JSON):", res.text)

amenity_id = data.get("id")

# Update the amenity
res = requests.put(f"{BASE_URL}/amenities/{amenity_id}", json={
    "name": "Le tabouret est changé"
}, headers=headers)

print("Status:", res.status_code)
try:
    print("Body:", res.json())
except ValueError:
    print("Body (Non-JSON):", res.text)

# Delete the amenity
res = requests.delete(f"{BASE_URL}/amenities/{amenity_id}", headers=headers)
print("Status:", res.status_code)
try:
    print("Body:", res.json())
except ValueError:
    print("Body (Non-JSON):", res.text)
