from app import db, create_app
from app.models.amenity import Amenity
from sqlalchemy import delete
from app.models.user import RevokedToken
from datetime import datetime

app = create_app()

with app.app_context():
    result = db.session.execute(
        delete(Amenity).where(Amenity.id.like('<function uuid4%'))
    )
    db.session.commit()
    print(f"{result.rowcount} amenities invalides supprimées")


def purge_expired_tokens():
    now = datetime.utcnow()
    expired = RevokedToken.query.filter(RevokedToken.expires_at < now).all()

    for token in expired:
        db.session.delete(token)

    db.session.commit()
