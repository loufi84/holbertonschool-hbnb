# 🏠 HBnB - Part 4: Simple Web Client

This repository contains the **front-end and back-end integration** for Part 4 of the HBnB project. It implements a fully functional and interactive web client using a custom style with a mix of **JavaScript (ES6), HTML5, CSS3** and **Jinja2 templating (SSR)**. It connects to a RESTful API built with **Flask**, with session-based authentication via **JWT tokens**.

---

## 🌐 Project Overview

Unlike the default CSR approach suggested in the project prompt, this version uses a hybrid approach:

- **Client-Side Rendering (CSR)** for the landing page (index) with dynamic JS interaction.
- **Server-Side Rendering (SSR)** with Jinja2 for key pages such as login, profile, admin panel, place view, etc.
- All styles and scripts follow a **custom design**, not the provided wireframes.

---

## 🧰 Technologies Used

- **Front-End**:
  - HTML5 / CSS3 (custom styling)
  - JavaScript ES6 (modular structure, fetch API, JWT handling)
  - Jinja2 templates (for server-rendered views)

- **Back-End**:
  - Python 3.11+
  - Flask + Flask-RESTX
  - SQLAlchemy
  - JWT Extended (for access/refresh tokens)
  - Alembic (for DB migrations)
  - SQLite (dev)

---

## 📁 Project Structure

.
├── hbnb
│   ├── back_end
│   │   ├── alembic
│   │   │   ├── env.py
│   │   │   ├── README
│   │   │   ├── script.py.mako
│   │   │   └── versions
│   │   ├── alembic.ini
│   │   ├── app
│   │   │   ├── __init__.py
│   │   │   ├── api
│   │   │   │   ├── __init__.py
│   │   │   │   └── v1
│   │   │   │       ├── __init__.py
│   │   │   │       ├── amenities.py
│   │   │   │       ├── bookings.py
│   │   │   │       ├── places.py
│   │   │   │       ├── reviews.py
│   │   │   │       ├── routes
│   │   │   │       │   ├── auth.py
│   │   │   │       │   └── places.py
│   │   │   │       └── users.py
│   │   │   ├── models
│   │   │   │   ├── __init__.py
│   │   │   │   ├── amenity.py
│   │   │   │   ├── booking.py
│   │   │   │   ├── place.py
│   │   │   │   ├── review.py
│   │   │   │   └── user.py
│   │   │   ├── persistence
│   │   │   │   ├── __init__.py
│   │   │   │   │   └── repository.cpython-313.pyc
│   │   │   │   └── repository.py
│   │   │   └── services
│   │   │       ├── __init__.py
│   │   │       └── facade.py
│   │   ├── blacklist.py
│   │   ├── config.py
│   │   ├── extensions.py
│   │   ├── HBnB - Entity Relationship Diagram.jpg
│   │   ├── HBnB - Entity Relationship Diagram.pdf
│   │   ├── instance
│   │   │   └── development.db
│   │   ├── README.md
│   │   ├── requirements.txt
│   │   ├── run.py
│   │   ├── SQL
│   │   │   ├── SQL_test.sql
│   │   │   └── SQL.sql
│   │   ├── tests
│   │   │   ├── init_admin.sql
│   │   │   ├── run_tests.py
│   │   │   ├── test_amenities_req.py
│   │   │   ├── test_places_req.py
│   │   │   └── test_users_req.py
│   │   └── utils.py
│   └── front_end
│       ├── static
│       │   ├── CSS
│       │   │   ├── account.css
│       │   │   ├── reviews.css
│       │   │   └── styles.css
│       │   ├── images
│       │   │   ├── default_profile_b.png
│       │   │   ├── default_profile.png
│       │   │   ├── icon_bath.png
│       │   │   ├── icon_bed.png
│       │   │   ├── icon_wifi.png
│       │   │   ├── icon.png
│       │   │   └── logo.png
│       │   ├── index.html
│       │   └── JS
│       │       ├── account_creation.js
│       │       ├── admin2.js
│       │       ├── apiClient.js
│       │       ├── booking.js
│       │       ├── login.js
│       │       ├── place_details.js
│       │       ├── place_fetch.js
│       │       └── profile.js
│       └── templates
│           ├── 404.html
│           ├── acc_creation.html
│           ├── add_review.html
│           ├── admin-panel.html
│           ├── booking.html
│           ├── footer.html
│           ├── login.html
│           ├── place.html
│           └── profile.html
└── README.md


---

## 🚀 Running the App Locally

### 1. Clone the repository
```bash
git clone https://github.com/loufi84/holbertonschool-hbnb.git
cd holbertonschool-hbnb/part4/hbnb
```

### 2. Create and activate a virtual environment
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies
```bash
cd back-end
pip install -r requirements.txt
```

### 4. Run the Flask API
```bash
python3 -m run
```

### 5. Open the app
Just visit http://127.0.0.1:5001 in your browser

🧑‍💻 Key Features

🔐 Authentication
JWT-based login and account creation
JWT tokens stored securely in cookies
Session check and redirection logic handled via JS
🗺️ Front-End Pages
Page	Rendering	Description
/	CSR	Landing page with dynamic content
/login	SSR	Login form and session handling
/acc_creation	SSR	Account creation page
/profile	SSR	User dashboard
/booking	SSR	Booking form
/place/<id>	SSR	Place details + review form (if logged in)
/admin-panel	SSR	Admin management page
/add_review	SSR	Add review form (protected route)
⚙️ API Integration
All client-server communication is done via fetchWithAutoRefresh() defined in apiClient.js, which automatically refreshes JWT tokens when needed.

📝 Notes

This front-end implementation does not follow the exact visual or structural specifications provided in the initial project description. Instead, it reflects a personal, custom-made UI and UX approach.
Pages are fully responsive and optimized for user interaction with minimal reloads.
Both CSR and SSR are used intentionally, depending on the page type and interaction needs.
💡 Future Improvements

Add animations/transitions for smoother UI experience
Better error handling and feedback messages in JS
Pagination or infinite scrolling on place list
Unit tests for front-end logic
📬 Contact

If you have any questions or suggestions, feel free to open an issue or contact the maintainer.