from app import db, create_app
from app.models.amenity import Amenity
from sqlalchemy import delete

app = create_app()

with app.app_context():
    result = db.session.execute(
        delete(Amenity).where(Amenity.id.like('<function uuid4%'))
    )
    db.session.commit()
    print(f"{result.rowcount} amenities invalides supprimées")
