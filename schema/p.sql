DROP TABLE IF EXISTS permissions;
CREATE TABLE IF NOT EXISTS permissions (
    permission_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    level INTEGER NOT NULL DEFAULT 1,
    parent_id VARCHAR(255)   DEFAULT null,
    description VARCHAR(255)
);

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