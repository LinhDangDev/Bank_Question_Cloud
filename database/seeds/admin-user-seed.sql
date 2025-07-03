-- Seed script: Tạo admin user để test hệ thống phân quyền
-- Ngày tạo: 2025-06-26

-- Tạo admin user (nếu chưa có)
IF NOT EXISTS (SELECT 1 FROM [User] WHERE Email = 'admin@example.com')
BEGIN
    INSERT INTO [User] (MaNguoiDung, HoTen, Email, MatKhau, TenDangNhap, LaNguoiDungHeThong, DaXoa, BiKhoa, CanDoiMatKhau, NgayTao)
    VALUES (
        NEWID(),
        N'System Administrator',
        'admin@example.com',
        '$2b$10$example.hash.here', -- Cần hash password thật
        'admin',
        1, -- LaNguoiDungHeThong = true (admin)
        0, -- DaXoa = false
        0, -- BiKhoa = false
        0, -- CanDoiMatKhau = false
        GETDATE()
    );

    PRINT 'Admin user created successfully';
END
ELSE
BEGIN
    PRINT 'Admin user already exists';
END

-- Tạo teacher user để test (nếu chưa có)
IF NOT EXISTS (SELECT 1 FROM [User] WHERE Email = 'teacher@example.com')
BEGIN
    INSERT INTO [User] (MaNguoiDung, HoTen, Email, MatKhau, TenDangNhap, LaNguoiDungHeThong, DaXoa, BiKhoa, CanDoiMatKhau, NgayTao)
    VALUES (
        NEWID(),
        N'Test Teacher',
        'teacher@example.com',
        '$2b$10$example.hash.here', -- Cần hash password thật
        'teacher',
        0, -- LaNguoiDungHeThong = false (teacher)
        0, -- DaXoa = false
        0, -- BiKhoa = false
        1, -- CanDoiMatKhau = true
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
    MaNguoiDung,
    HoTen,
    Email,
    TenDangNhap,
    LaNguoiDungHeThong,
    DaXoa,
    NgayTao
FROM [User]
WHERE Email IN ('admin@example.com', 'teacher@example.com');
