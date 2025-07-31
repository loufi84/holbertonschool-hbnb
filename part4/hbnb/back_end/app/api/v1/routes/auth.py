from flask import Blueprint, render_template, send_from_directory
from flask_jwt_extended import get_jwt_identity, jwt_required
from app.services import facade
from app.models.user import User
from extensions import db
from os import abort
import app.services.facade
import os

auth_pages = Blueprint('auth_pages', __name__)
static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../../front_end/static'))

@auth_pages.route('/login')
def login():
    return render_template('login.html')

@auth_pages.route('/acc_creation')
def acc_creation():
    return render_template('acc_creation.html')

@auth_pages.route('/admin-panel')
@jwt_required()
def serve_admin():
    identity = get_jwt_identity()
    user = facade.get_user(identity)

    if not user or not user.is_admin:
        return send_from_directory(static_dir, 'index.html')  # pour les non-admins

    # Récupération des données pour Jinja
    users = facade.get_all_users()
    places = facade.get_all_places()
    amenities = facade.get_all_amenities()
    bookings = facade.get_all_bookings()

    return render_template(
        'admin-panel.html',
        users=users,
        places=places,
        amenities=amenities,
        bookings=bookings
    )

@auth_pages.route('/profile')
@jwt_required()
def profile():
    user_id = get_jwt_identity()
    user = User.query.options(db.joinedload(User.places)).filter_by(id=user_id).first()
    if not user:
        abort(404)

    return render_template('profile.html', user=user)