-- Création de la table booking pour HBnB (ajoutée car référencée dans reviews)
CREATE TABLE IF NOT EXISTS booking (
    id CHAR(36) PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Trigger pour booking.updated_at
CREATE TRIGGER IF NOT EXISTS update_booking_timestamp
AFTER UPDATE ON booking
FOR EACH ROW
BEGIN
    UPDATE booking SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Création de la table user pour HBnB
CREATE TABLE IF NOT EXISTS user (
    id CHAR(36) PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    photo_url VARCHAR(2048)
);

-- Trigger pour user.updated_at
CREATE TRIGGER IF NOT EXISTS update_user_timestamp
AFTER UPDATE ON user
FOR EACH ROW
BEGIN
    UPDATE user SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Création de la table place pour HBnB
CREATE TABLE IF NOT EXISTS place (
    id CHAR(36) PRIMARY KEY,
    title VARCHAR(50) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    price DECIMAL(10, 2) CHECK (price >= 0) NOT NULL,
    latitude FLOAT CHECK (-90 <= latitude AND latitude <= 90) NOT NULL,
    longitude FLOAT CHECK (-180 <= longitude AND longitude <= 180) NOT NULL,
    owner_id VARCHAR(36) NOT NULL,
    rating DECIMAL(10, 1) CHECK (rating >= 0 AND rating <= 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    photos_url TEXT DEFAULT '[]' NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES user(id) ON DELETE CASCADE
);

-- Trigger pour place.updated_at
CREATE TRIGGER IF NOT EXISTS update_place_timestamp
AFTER UPDATE ON place
FOR EACH ROW
BEGIN
    UPDATE place SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Création de la table amenity pour HBnB (corrigé : suppression de la virgule en trop)
CREATE TABLE IF NOT EXISTS amenity (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Trigger pour amenity.updated_at
CREATE TRIGGER IF NOT EXISTS update_amenity_timestamp
AFTER UPDATE ON amenity
FOR EACH ROW
BEGIN
    UPDATE amenity SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Création de la table d'association place_amenity pour HBnB
CREATE TABLE IF NOT EXISTS place_amenity (
    place_id VARCHAR(36),
    amenity_id VARCHAR(36),
    PRIMARY KEY (place_id, amenity_id),
    FOREIGN KEY (place_id) REFERENCES place(id),
    FOREIGN KEY (amenity_id) REFERENCES amenity(id)
);

-- Création de la table reviews pour HBnB
CREATE TABLE IF NOT EXISTS reviews (
    id CHAR(36) PRIMARY KEY,
    comment VARCHAR(2000) NOT NULL,
    rating DECIMAL(10, 1) CHECK (rating >= 0 AND rating <= 5) NOT NULL,
    place VARCHAR(36) NOT NULL,
    user_ide VARCHAR(36) NOT NULL,
    user_first_name VARCHAR(50) NOT NULL,
    user_last_name VARCHAR(50) NOT NULL,
    booking VARCHAR(36) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (place) REFERENCES place(id),
    FOREIGN KEY (user_ide) REFERENCES user(id),
    FOREIGN KEY (booking) REFERENCES booking(id)
);

-- Trigger pour reviews.updated_at
CREATE TRIGGER IF NOT EXISTS update_reviews_timestamp
AFTER UPDATE ON reviews
FOR EACH ROW
BEGIN
    UPDATE reviews SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
