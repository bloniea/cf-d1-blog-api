DROP TABLE IF EXISTS Roles;
CREATE TABLE IF NOT EXISTS Roles (
    RoleId INTEGER  PRIMARY KEY AUTOINCREMENT, 
    Name VARCHAR(255) NOT NULL UNIQUE,
    SuperAdmin BOOLEAN NOT NULL DEFAULT 0,
    Description VARCHAR(255),
    CreatedAt TIMESTAMP,
    UpdatedAt TIMESTAMP
);
INSERT INTO Roles (Name,Description,SuperAdmin,CreatedAt,UpdatedAt) VALUES ('超级管理员','管理员角色',1,'1710478326661','1710478326661'); 
INSERT INTO Roles (Name,Description,CreatedAt,UpdatedAt) VALUES ('普通用户','普通用户角色','1710478326661','1710478326661'); 
