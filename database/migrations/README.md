# Database Migrations

## Hướng dẫn chạy migrations

### 1. Thêm trường NguoiTao vào bảng CauHoi

```sql
-- Chạy file: add-nguoi-tao-to-cau-hoi.sql
-- Thêm trường để track người tạo câu hỏi
```

### 2. Tạo bảng CauHoiChoDuyet

```sql
-- Chạy file: create-cau-hoi-cho-duyet-table.sql
-- Tạo bảng lưu trữ câu hỏi chờ duyệt từ teacher
```

## Thứ tự chạy migrations

1. `add-nguoi-tao-to-cau-hoi.sql`
2. `create-cau-hoi-cho-duyet-table.sql`

## Lưu ý

- Backup database trước khi chạy migrations
- Chạy trong môi trường test trước
- Kiểm tra foreign key constraints có tồn tại không

## Rollback (nếu cần)

### Rollback bảng CauHoiChoDuyet
```sql
DROP TABLE IF EXISTS [dbo].[CauHoiChoDuyet];
```

### Rollback trường NguoiTao
```sql
ALTER TABLE [dbo].[CauHoi] DROP CONSTRAINT IF EXISTS [FK_CauHoi_NguoiTao];
DROP INDEX IF EXISTS [IX_CauHoi_NguoiTao] ON [dbo].[CauHoi];
ALTER TABLE [dbo].[CauHoi] DROP COLUMN IF EXISTS [NguoiTao];
```
