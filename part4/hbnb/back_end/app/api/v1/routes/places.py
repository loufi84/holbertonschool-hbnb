from flask import Blueprint, abort, render_template
from app.services import facade
from uuid import UUID

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