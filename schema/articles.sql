DROP TABLE IF EXISTS Articles;
CREATE TABLE IF NOT EXISTS Articles (
    ArticleId INTEGER PRIMARY KEY AUTOINCREMENT,
    Title VARCHAR(100) NOT NULL,
    CategoryId INTEGER NOT NULL, 
    Content TEXT NOT NULL,
    ImgUrl VARCHAR(300) NOT NULL,
    ImgSource VARCHAR(100) NOT NULL,
    CreatedAt  TIMESTAMP NOT NULL,
    UpdatedAt  TIMESTAMP NOT NULL,
    FOREIGN KEY (CategoryId) REFERENCES Categories(CategoryId) ON DELETE CASCADE
);
INSERT INTO Articles 
( Title, CategoryId,ImgUrl,Content,ImgSource,CreatedAt,UpdatedAt) VALUES 
( 'js', 1,"123","123","123","12","124");
-- DELETE FROM Articles