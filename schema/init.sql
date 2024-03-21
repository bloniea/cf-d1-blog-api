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
    super_admin INTEGER NOT NULL DEFAULT 0,
    description VARCHAR(255),
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
);
DROP TABLE IF EXISTS permissions;
CREATE TABLE IF NOT EXISTS permissions (
    permission_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
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
    role_permissionId SERIAL PRIMARY KEY,
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
    role_id INTEGER,
    created_at BIGINT,
    updated_at BIGINT,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

INSERT INTO roles (name,description,super_admin,created_at,updated_at) VALUES ('超级管理员','管理员角色',1,1710478326661,1710478326661); 
INSERT INTO roles (name,description,created_at,updated_at) VALUES ('普通用户','普通用户角色',1710478326661,1710478326661); 
INSERT INTO users (username,email,password,role_id,created_at,updated_at) VALUES ('admin','123@qq.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',1,1710478326661,1710478326661); 
INSERT INTO permissions (name, description,created_at,updated_at) VALUES ( 'article_POST', '文章的写入权限',1710442893708,1710442893708);
INSERT INTO permissions (name, description,created_at,updated_at) VALUES ( 'article_DELETE', '文章的删除权限',1710442893708,1710442893708);
INSERT INTO permissions (name, description,created_at,updated_at) VALUES ( 'article_PATCH', '文章的修改权限',1710442893708,1710442893708);
INSERT INTO permissions (name, description,created_at,updated_at) VALUES ( 'role_POST', '角色的写入权限',1710442893708,1710442893708);
INSERT INTO permissions (name, description,created_at,updated_at) VALUES ( 'role_DELETE', '角色的删除权限',1710442893708,1710442893708);
INSERT INTO permissions (name, description,created_at,updated_at) VALUES ( 'role_PATCH', '用户的修改权限',1710442893708,1710442893708);
INSERT INTO permissions (name, description,created_at,updated_at) VALUES ( 'user_POST', '用户的写入权限',1710442893708,1710442893708);
INSERT INTO permissions (name, description,created_at,updated_at) VALUES ( 'user_DELETE', '用户的删除权限',1710442893708,1710442893708);
INSERT INTO permissions (name, description,created_at,updated_at) VALUES ( 'user_PATCH', '角色的修改权限',1710442893708,1710442893708);
INSERT INTO permissions (name, description,created_at,updated_at) VALUES ( 'category_POST', '分类的写入权限',1710442893708,1710442893708);
INSERT INTO permissions (name, description,created_at,updated_at) VALUES ( 'category_DELETE', '分类的删除权限',1710442893708,1710442893708);
INSERT INTO permissions (name, description,created_at,updated_at) VALUES ( 'category_PATCH', '分类的修改权限',1710442893708,1710442893708);