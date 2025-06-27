-- Seed script: Tạo admin user để test hệ thống phân quyền
-- Ngày tạo: 2025-06-26

-- Tạo admin user (nếu chưa có)
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'admin@example.com')
BEGIN
    INSERT INTO Users (UserId, Name, Email, Password, Role, IsActive, CreatedAt)
    VALUES (
        NEWID(),
        N'System Administrator',
        'admin@example.com',
        '$2b$10$example.hash.here', -- Cần hash password thật
        'admin',
        1,
        GETDATE()
    );
    
    PRINT 'Admin user created successfully';
END
ELSE
BEGIN
    PRINT 'Admin user already exists';
END

-- Tạo teacher user để test (nếu chưa có)
IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'teacher@example.com')
BEGIN
    INSERT INTO Users (UserId, Name, Email, Password, Role, IsActive, CreatedAt)
    VALUES (
        NEWID(),
        N'Test Teacher',
        'teacher@example.com',
        '$2b$10$example.hash.here', -- Cần hash password thật
        'teacher',
        1,
        GETDATE()
    );
    
    PRINT 'Teacher user created successfully';
END
ELSE
BEGIN
    PRINT 'Teacher user already exists';
END

-- Hiển thị thông tin users đã tạo
SELECT 
    UserId,
    Name,
    Email,
    Role,
    IsActive,
    CreatedAt
FROM Users 
WHERE Email IN ('admin@example.com', 'teacher@example.com');
