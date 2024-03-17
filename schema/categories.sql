DROP TABLE IF EXISTS Categories;
CREATE TABLE IF NOT EXISTS Categories (
    CategoryId INTEGER PRIMARY KEY AUTOINCREMENT,
    Title VARCHAR(100) NOT NULL,
    ImgUrl VARCHAR(300) NOT NULL,
    CreatedAt TIMESTAMP NOT NULL,
    UpdatedAt TIMESTAMP NOT NULL
);
INSERT INTO Categories ( Title, ImgUrl,CreatedAt,UpdatedAt) VALUES ( 'js', 'Maria Anders',"123","123");