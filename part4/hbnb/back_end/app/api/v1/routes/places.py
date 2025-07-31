from flask import Blueprint, abort, render_template, request, jsonify, current_app
from app.services import facade
from uuid import UUID
import requests

place_pages = Blueprint('place_pages', __name__)

@place_pages.route('/places/<place_id>')
def show_places(place_id):
    try:
        UUID(place_id)
    except ValueError:
        abort(400, description='Invalid UUID')

    place = facade.get_place(place_id)
    if not place:
        abort(404, description='Place not found')

    return render_template('place.html', place=place)

@place_pages.route('/places/<place_id>/book')
def booking(place_id):
    try:
        UUID(place_id)
    except ValueError:
        abort(400, description='Invalid UUID')

    place = facade.get_place(place_id)
    if not place:
        abort(404, description='Place not found')

    return render_template('booking.html', place=place)

@place_pages.route('/reverse-geocode', methods=['POST'])
def reverse_geocode():
    """
    Endpoint to reverse geocode latitude and longitude into a location (city, etc) using OpenCage API.
    """
    data = request.get_json()
    lat = data.get("lat")
    lon = data.get("lon")

    if lat is None or lon is None:
        return jsonify({"error": "Latitude and longitude required"}), 400

    try:
        api_key = current_app.config['OPENCAGE_KEY']
        response = requests.get(
            "https://api.opencagedata.com/geocode/v1/json",
            params={
                "q": f"{lat},{lon}",
                "key": api_key,
                "language": "fr",
                "no_annotations": 1
            }
        )
        response.raise_for_status()
        data = response.json()

        if not data["results"]:
            return jsonify({"error": "No result found"}), 404

        components = data["results"][0]["components"]
        city = components.get("city") or components.get("town") or components.get("village")
        country = components.get("country")
        display_name = data["results"][0]["formatted"]

        return jsonify({
            "city": city,
            "country": country,
            "display_name": display_name
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@place_pages.route('/geocode', methods=['POST'])
def geocode():
    """
    Endpoint to geocode a city name into latitude and longitude using OpenCage API.
    Supports multiple results for ambiguous queries.
    """
    data = request.get_json()
    city = data.get("city")

    if not city:
        return jsonify({"error": "City name required"}), 400

    try:
        api_key = current_app.config['OPENCAGE_KEY']
        response = requests.get(
            "https://api.opencagedata.com/geocode/v1/json",
            params={
                "q": city,
                "key": api_key,
                "language": "en",
                "no_annotations": 1,
                "limit": 5
            }
        )
        response.raise_for_status()
        data = response.json()

        if not data["results"]:
            return jsonify({"error": "City not found"}), 404

        if len(data["results"]) > 1:
            choices = [
                {
                    "lat": result["geometry"]["lat"],
                    "lon": result["geometry"]["lng"],
                    "display_name": result["formatted"]
                }
                for result in data["results"]
            ]
            return jsonify({
                "multiple_results": True,
                "choices": choices
            })
        else:
            geometry = data["results"][0]["geometry"]
            return jsonify({
                "multiple_results": False,
                "lat": geometry["lat"],
                "lon": geometry["lng"],
                "display_name": data["results"][0]["formatted"]
            })

    except Exception as e:
        return jsonify({"error": str(e)}), 500