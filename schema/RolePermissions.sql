DROP TABLE IF EXISTS RolePermissions;
CREATE TABLE IF NOT EXISTS RolePermissions (
    RolePermissionId INTEGER PRIMARY KEY AUTOINCREMENT,
    RoleId INTEGER,
    PermissionId INTEGER,
    FOREIGN KEY (RoleId) REFERENCES Roles(RoleId),
    FOREIGN KEY (PermissionId) REFERENCES Permissions(PermissionId)
);
INSERT INTO RolePermissions (RoleId,PermissionId) VALUES (1,4);
