-- Migration: Tạo bảng CauHoiChoDuyet
-- Ngày tạo: 2025-06-26

-- Tạo bảng CauHoiChoDuyet
CREATE TABLE [dbo].[CauHoiChoDuyet](
    [MaCauHoiChoDuyet] [uniqueidentifier] NOT NULL DEFAULT NEWID(),
    [MaPhan] [uniqueidentifier] NULL,
    [MaSoCauHoi] [nvarchar](50) NULL,
    [NoiDung] [nvarchar](max) NOT NULL,
    [HoanVi] [bit] NULL DEFAULT 1,
    [CapDo] [int] NULL DEFAULT 2,
    [SoCauHoiCon] [int] NULL DEFAULT 0,
    [DoPhanCachCauHoi] [nvarchar](max) NULL,
    [MaCauHoiCha] [uniqueidentifier] NULL,
    [XoaTamCauHoi] [bit] NULL DEFAULT 0,
    [SoLanDuocThi] [int] NULL DEFAULT 0,
    [SoLanDung] [int] NULL DEFAULT 0,
    [NgayTao] [datetime] NULL DEFAULT GETDATE(),
    [NgaySua] [datetime] NULL,
    [MaCLO] [uniqueidentifier] NULL,
    [NguoiTao] [uniqueidentifier] NOT NULL,
    [GhiChu] [nvarchar](max) NULL,
    [TrangThai] [int] NOT NULL DEFAULT 0, -- 0: Chờ duyệt, 1: Đã duyệt, 2: Từ chối
    [NguoiDuyet] [uniqueidentifier] NULL,
    [NgayDuyet] [datetime] NULL,
    [DuLieuCauTraLoi] [nvarchar](max) NULL, -- JSON string chứa dữ liệu câu trả lời
    [DuLieuCauHoiCon] [nvarchar](max) NULL, -- JSON string chứa dữ liệu câu hỏi con
    
    CONSTRAINT [PK_CauHoiChoDuyet] PRIMARY KEY CLUSTERED ([MaCauHoiChoDuyet] ASC)
);

-- Thêm foreign key constraints
ALTER TABLE [dbo].[CauHoiChoDuyet]
ADD CONSTRAINT [FK_CauHoiChoDuyet_Phan] 
FOREIGN KEY([MaPhan]) REFERENCES [dbo].[Phan] ([MaPhan]);

ALTER TABLE [dbo].[CauHoiChoDuyet]
ADD CONSTRAINT [FK_CauHoiChoDuyet_CLO] 
FOREIGN KEY([MaCLO]) REFERENCES [dbo].[CLO] ([MaCLO]);

ALTER TABLE [dbo].[CauHoiChoDuyet]
ADD CONSTRAINT [FK_CauHoiChoDuyet_NguoiTao] 
FOREIGN KEY([NguoiTao]) REFERENCES [dbo].[Users] ([UserId]);

ALTER TABLE [dbo].[CauHoiChoDuyet]
ADD CONSTRAINT [FK_CauHoiChoDuyet_NguoiDuyet] 
FOREIGN KEY([NguoiDuyet]) REFERENCES [dbo].[Users] ([UserId]);

-- Tạo indexes cho performance
CREATE INDEX [IX_CauHoiChoDuyet_NguoiTao] ON [dbo].[CauHoiChoDuyet]([NguoiTao]);
CREATE INDEX [IX_CauHoiChoDuyet_TrangThai] ON [dbo].[CauHoiChoDuyet]([TrangThai]);
CREATE INDEX [IX_CauHoiChoDuyet_NgayTao] ON [dbo].[CauHoiChoDuyet]([NgayTao]);
CREATE INDEX [IX_CauHoiChoDuyet_MaPhan] ON [dbo].[CauHoiChoDuyet]([MaPhan]);

-- Thêm check constraint cho TrangThai
ALTER TABLE [dbo].[CauHoiChoDuyet]
ADD CONSTRAINT [CK_CauHoiChoDuyet_TrangThai] 
CHECK ([TrangThai] IN (0, 1, 2));

-- Thêm comments
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Bảng lưu trữ câu hỏi chờ duyệt từ teacher', 
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE', @level1name = N'CauHoiChoDuyet';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'0: Chờ duyệt, 1: Đã duyệt, 2: Từ chối', 
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE', @level1name = N'CauHoiChoDuyet',
    @level2type = N'COLUMN', @level2name = N'TrangThai';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Dữ liệu câu trả lời dạng JSON', 
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE', @level1name = N'CauHoiChoDuyet',
    @level2type = N'COLUMN', @level2name = N'DuLieuCauTraLoi';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Dữ liệu câu hỏi con dạng JSON', 
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE', @level1name = N'CauHoiChoDuyet',
    @level2type = N'COLUMN', @level2name = N'DuLieuCauHoiCon';
