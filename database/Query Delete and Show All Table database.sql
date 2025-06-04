USE question_bank;
GO

-- Bắt đầu xóa từ các bảng không có hoặc có ít phụ thuộc nhất,

-- 1. Xóa các bảng có tham chiếu đến CauHoi, DeThi, Phan
-- ChiTietDeThi tham chiếu đến DeThi, Phan, CauHoi
DELETE FROM [dbo].[ChiTietDeThi];
GO

-- 2. Xóa các bảng tham chiếu đến CauHoi
-- CauTraLoi tham chiếu đến CauHoi
DELETE FROM [dbo].[CauTraLoi];
GO
-- Files có thể tham chiếu đến CauHoi (MaCauHoi) hoặc CauTraLoi (MaCauTraLoi)
-- Tuy nhiên, vì CauTraLoi đã bị xóa, chúng ta chỉ cần quan tâm đến CauHoi ở đây.
-- Hoặc nếu Files có FK đến CauTraLoi, thì CauTraLoi phải được xóa trước Files.
-- Trong script của bạn, Files chỉ có FK đến CauHoi.
DELETE FROM [dbo].[Files];
GO

-- 3. Bây giờ có thể xóa CauHoi vì các bảng tham chiếu đến nó đã được xóa
-- CauHoi tham chiếu đến Phan và CLO
DELETE FROM [dbo].[CauHoi];
GO

-- 4. Xóa DeThi (sau khi ChiTietDeThi đã được xóa)
-- DeThi tham chiếu đến MonHoc
DELETE FROM [dbo].[DeThi];
GO

-- 5. Xóa Phan (sau khi CauHoi và ChiTietDeThi đã được xóa)
-- Phan tham chiếu đến MonHoc và có thể có MaPhanCha tự tham chiếu
DELETE FROM [dbo].[Phan];
GO

-- 6. Xóa CLO (sau khi CauHoi đã được xóa)
DELETE FROM [dbo].[CLO];
GO

-- 7. Xóa MonHoc (sau khi DeThi và Phan đã được xóa)
-- MonHoc tham chiếu đến Khoa
DELETE FROM [dbo].[MonHoc];
GO

-- 8. Xóa Khoa (sau khi MonHoc đã được xóa)
DELETE FROM [dbo].[Khoa];
GO

-- 9. Xóa các bảng không có ràng buộc khóa ngoại từ các bảng khác trong danh sách này
-- (hoặc các bảng gốc mà không bảng nào trong đây tham chiếu đến chúng)
DELETE FROM [dbo].[User];
GO
DELETE FROM [dbo].[YeuCauRutTrich];
GO

PRINT N'Đã xóa dữ liệu khỏi các bảng trong database question_bank.';
GO


USE question_bank;
GO

EXEC sp_MSforeachtable 'PRINT N''Show database in table: ?''; SELECT * FROM ?;';
GO