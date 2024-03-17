DROP TABLE IF EXISTS Permissions;
CREATE TABLE IF NOT EXISTS Permissions (
    PermissionId INTEGER  PRIMARY KEY AUTOINCREMENT,
    PermissionName VARCHAR(255) NOT NULL UNIQUE,
    Description VARCHAR(255),
    CreatedAt TIMESTAMP NOT NULL,
    UpdateAt TIMESTAMP NOT NULL
);
INSERT INTO Permissions (PermissionName, Description,CreatedAt,UpdateAt) VALUES ( 'article_POST', '文章的写入权限',"1710442893708","1710442893708");
INSERT INTO Permissions (PermissionName, Description,CreatedAt,UpdateAt) VALUES ( 'article_DELETE', '文章的删除权限',"1710442893708","1710442893708");
INSERT INTO Permissions (PermissionName, Description,CreatedAt,UpdateAt) VALUES ( 'article_PATCH', '文章的修改权限',"1710442893708","1710442893708");
INSERT INTO Permissions (PermissionName, Description,CreatedAt,UpdateAt) VALUES ( 'role_POST', '角色的写入权限',"1710442893708","1710442893708");
INSERT INTO Permissions (PermissionName, Description,CreatedAt,UpdateAt) VALUES ( 'role_DELETE', '角色的删除权限',"1710442893708","1710442893708");
INSERT INTO Permissions (PermissionName, Description,CreatedAt,UpdateAt) VALUES ( 'role_PATCH', '用户的修改权限',"1710442893708","1710442893708");
INSERT INTO Permissions (PermissionName, Description,CreatedAt,UpdateAt) VALUES ( 'user_POST', '用户的写入权限',"1710442893708","1710442893708");
INSERT INTO Permissions (PermissionName, Description,CreatedAt,UpdateAt) VALUES ( 'user_DELETE', '用户的删除权限',"1710442893708","1710442893708");
INSERT INTO Permissions (PermissionName, Description,CreatedAt,UpdateAt) VALUES ( 'user_PATCH', '角色的修改权限',"1710442893708","1710442893708");
INSERT INTO Permissions (PermissionName, Description,CreatedAt,UpdateAt) VALUES ( 'category_POST', '分类的写入权限',"1710442893708","1710442893708");
INSERT INTO Permissions (PermissionName, Description,CreatedAt,UpdateAt) VALUES ( 'category_DELETE', '分类的删除权限',"1710442893708","1710442893708");
INSERT INTO Permissions (PermissionName, Description,CreatedAt,UpdateAt) VALUES ( 'category_PATCH', '分类的修改权限',"1710442893708","1710442893708");