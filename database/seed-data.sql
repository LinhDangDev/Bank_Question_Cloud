USE question_bank
GO

-- Insert sample data for Khoa table
INSERT INTO [dbo].[Khoa] ([MaKhoa], [TenKhoa], [XoaTamKhoa])
VALUES
    ('11111111-1111-1111-1111-111111111111', N'Khoa Công nghệ thông tin', 0),
    ('22222222-2222-2222-2222-222222222222', N'Khoa Điện - Điện tử', 0),
    ('33333333-3333-3333-3333-333333333333', N'Khoa Cơ khí', 0),
    ('44444444-4444-4444-4444-444444444444', N'Khoa Xây dựng', 0),
    ('55555555-5555-5555-5555-555555555555', N'Khoa Kinh tế', 0);

-- Insert sample data for MonHoc table
INSERT INTO [dbo].[MonHoc] ([MaMonHoc], [MaKhoa], [MaSoMonHoc], [TenMonHoc], [XoaTamMonHoc])
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'INT1234', N'Lập trình Web', 0),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'INT1235', N'Cơ sở dữ liệu', 0),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'EEE1234', N'Điện tử số', 0),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333', 'MEC1234', N'Cơ học kỹ thuật', 0);

-- Insert sample data for Phan table
INSERT INTO [dbo].[Phan] ([MaPhan], [MaMonHoc], [TenPhan], [NoiDung], [ThuTu], [SoLuongCauHoi], [MaPhanCha], [MaSoPhan], [XoaTamPhan], [LaCauHoiNhom])
VALUES
    ('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', N'Chương 1: Giới thiệu', N'Nội dung chương 1', 1, 10, NULL, 1, 0, 0),
    ('22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', N'Chương 2: HTML', N'Nội dung chương 2', 2, 15, NULL, 2, 0, 0),
    ('33333333-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', N'Chương 1: Tổng quan', N'Nội dung chương 1', 1, 12, NULL, 1, 0, 0);

-- Insert sample data for CauHoi table
INSERT INTO [dbo].[CauHoi] ([MaCauHoi], [MaPhan], [MaSoCauHoi], [NoiDung], [HoanVi], [CapDo], [SoCauHoiCon], [DoPhanCachCauHoi], [MaCauHoiCha], [XoaTamCauHoi], [SoLanDuocThi], [SoLanDung], [NgayTao], [NgaySua])
VALUES
    ('11111111-1111-1111-1111-111111111111', '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, N'HTML là viết tắt của từ gì?', 1, 1, 0, 0.5, NULL, 0, 0, 0, GETDATE(), GETDATE()),
    ('22222222-2222-2222-2222-222222222222', '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, N'CSS là viết tắt của từ gì?', 1, 1, 0, 0.5, NULL, 0, 0, 0, GETDATE(), GETDATE()),
    ('33333333-3333-3333-3333-333333333333', '22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, N'JavaScript là ngôn ngữ gì?', 1, 2, 0, 0.5, NULL, 0, 0, 0, GETDATE(), GETDATE());

-- Insert sample data for CauTraLoi table
INSERT INTO [dbo].[CauTraLoi] ([MaCauTraLoi], [MaCauHoi], [NoiDung], [ThuTu], [LaDapAn], [HoanVi])
VALUES
    ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', N'Hyper Text Markup Language', 1, 1, 1),
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', N'High Tech Modern Language', 2, 0, 1),
    ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', N'Hyper Transfer Markup Language', 3, 0, 1),
    ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', N'Cascading Style Sheets', 1, 1, 1),
    ('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', N'Computer Style Sheets', 2, 0, 1),
    ('66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', N'Ngôn ngữ lập trình phía client', 1, 1, 1),
    ('77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', N'Ngôn ngữ lập trình phía server', 2, 0, 1);

-- Insert sample data for CLO table
INSERT INTO [dbo].[CLO] ([MaCLO], [TenCLO], [MoTa], [ThuTu], [XoaTamCLO])
VALUES
    ('11111111-1111-1111-1111-111111111111', N'CLO1: Kiến thức cơ bản', N'Mô tả CLO1', 1, 0),
    ('22222222-2222-2222-2222-222222222222', N'CLO2: Kỹ năng thực hành', N'Mô tả CLO2', 2, 0),
    ('33333333-3333-3333-3333-333333333333', N'CLO3: Kỹ năng phân tích', N'Mô tả CLO3', 3, 0);

-- Update some questions with CLO
UPDATE [dbo].[CauHoi]
SET [MaCLO] = '11111111-1111-1111-1111-111111111111'
WHERE [MaCauHoi] = '11111111-1111-1111-1111-111111111111';

UPDATE [dbo].[CauHoi]
SET [MaCLO] = '22222222-2222-2222-2222-222222222222'
WHERE [MaCauHoi] = '22222222-2222-2222-2222-222222222222';
