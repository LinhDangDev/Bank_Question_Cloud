-- Migration: Thêm trường NguoiTao vào bảng CauHoi
-- Ngày tạo: 2025-06-26

-- Migration to add NguoiTao column to CauHoi table
IF NOT EXISTS(SELECT * FROM sys.columns
            WHERE Name = N'NguoiTao' AND Object_ID = Object_ID(N'CauHoi'))
BEGIN
    ALTER TABLE CauHoi ADD NguoiTao uniqueidentifier NULL;

    -- Add foreign key constraint
    ALTER TABLE CauHoi
    ADD CONSTRAINT FK_CauHoi_User
    FOREIGN KEY (NguoiTao) REFERENCES [User](UserId);

    PRINT 'Added NguoiTao column to CauHoi table';
END
ELSE
BEGIN
    PRINT 'NguoiTao column already exists in CauHoi table';
END

-- Tạo index cho performance
CREATE INDEX IX_CauHoi_NguoiTao ON CauHoi(NguoiTao);

-- Comment để ghi chú
EXEC sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'ID của người tạo câu hỏi',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE', @level1name = N'CauHoi',
    @level2type = N'COLUMN', @level2name = N'NguoiTao';
