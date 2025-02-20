DROP TABLE IF EXISTS categories;
CREATE TABLE IF NOT EXISTS categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    img_url VARCHAR(300) NOT NULL,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);
DROP TABLE IF EXISTS roles;
CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL PRIMARY KEY, 
    name VARCHAR(255) NOT NULL UNIQUE,
    permissions VARCHAR(255)  DEFAULT NULL,
    description VARCHAR(255),
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);
DROP TABLE IF EXISTS permissions;
CREATE TABLE IF NOT EXISTS permissions (
    permission_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    level INTEGER NOT NULL DEFAULT 1,
    parent_id VARCHAR(255)   DEFAULT null,
    description VARCHAR(255)
);
DROP TABLE IF EXISTS articles;
CREATE TABLE IF NOT EXISTS articles (
    article_id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    category_id INTEGER NOT NULL, 
    content TEXT NOT NULL,
    img_url VARCHAR(300) NOT NULL,
    img_source VARCHAR(100) NOT NULL,
    created_at  BIGINT NOT NULL,
    updated_at  BIGINT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
);
DROP TABLE IF EXISTS role_permissions;
CREATE TABLE IF NOT EXISTS role_permissions (
    role_permission_id SERIAL PRIMARY KEY,
    role_id INTEGER,
    permission_id INTEGER,
    FOREIGN KEY (role_id) REFERENCES roles(role_id),
    FOREIGN KEY (permission_id) REFERENCES permissions(permission_id)
);
DROP TABLE IF EXISTS users;
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    super_admin INTEGER NOT NULL DEFAULT 0,
    role_id INTEGER,
    created_at BIGINT,
    updated_at BIGINT,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

INSERT INTO roles (name,description,created_at,updated_at) VALUES ('超级管理员','管理员角色',1710478326661,1710478326661); 
INSERT INTO roles (name,description,created_at,updated_at) VALUES ('普通用户','普通用户角色',1710478326661,1710478326661); 
INSERT INTO users (username,email,password,role_id,super_admin,created_at,updated_at) VALUES ('admin','123@qq.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',1,1,1710478326661,1710478326661); 

INSERT INTO permissions (permission_id,name, level,parent_id,description) VALUES ( 1,'article',1,null, '文章管理');
INSERT INTO permissions (permission_id,name, level,parent_id,description) VALUES (2 ,'article_POST',2,1,'文章的写入权限');
INSERT INTO permissions (permission_id,name, level,parent_id,description) VALUES (3 ,'article_DELETE',2,1, '文章的删除权限');
INSERT INTO permissions (permission_id,name, level,parent_id,description) VALUES (4, 'article_PATCH',2,1,'文章的修改权限');

INSERT INTO permissions (permission_id,name, level,parent_id,description) VALUES (5, 'role',1,null,'角色管理');
INSERT INTO permissions (permission_id,name, level,parent_id,description) VALUES ( 6,'role_POST',2,5, '角色的写入权限');
INSERT INTO permissions (permission_id,name, level,parent_id,description) VALUES (7 ,'role_DELETE',2,5, '角色的删除权限');
INSERT INTO permissions (permission_id,name, level,parent_id,description) VALUES ( 8,'role_PATCH',2,5, '用户的修改权限');

INSERT INTO permissions (permission_id,name, level,parent_id,description) VALUES ( 9,'user',1,null, '用户管理');
INSERT INTO permissions (permission_id,name, level,parent_id,description) VALUES ( 10,'user_POST',2,9, '用户的写入权限');
INSERT INTO permissions (permission_id,name, level,parent_id,description) VALUES ( 11,'user_DELETE',2,9, '用户的删除权限');
INSERT INTO permissions (permission_id,name, level,parent_id,description) VALUES ( 12,'user_PATCH',2,9, '角色的修改权限');

INSERT INTO permissions (permission_id,name, level,parent_id,description) VALUES ( 13,'category',1,null, '分类管理');
INSERT INTO permissions (permission_id,name, level,parent_id,description) VALUES ( 14,'category_POST', 2,13,'分类的写入权限');
INSERT INTO permissions (permission_id,name, level,parent_id,description) VALUES (15, 'category_DELETE',2,13, '分类的删除权限');
INSERT INTO permissions (permission_id,name, level,parent_id,description) VALUES (16, 'category_PATCH',2,13, '分类的修改权限');