from flask import Blueprint, render_template
from app.services import facade

auth_pages = Blueprint('auth_pages', __name__)

@auth_pages.route('/login')
def login():
    return render_template('login.html')

@auth_pages.route('/acc_creation')
def acc_creation():
    return render_template('acc_creation.html')
