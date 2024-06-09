DROP TABLE IF EXISTS images2;
CREATE TABLE IF NOT EXISTS images2 (
    images2_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    path VARCHAR(255) NOT NULL,
    sha VARCHAR(100) NOT NULL,
    thumbnailPath VARCHAR(255) NOT NULL,
    thumbnailSha VARCHAR(100) NOT NULL,
    category_id INTEGER NOT NULL,
    created_at BIGINT
);  