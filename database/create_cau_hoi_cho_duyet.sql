-- Tạo bảng CauHoiChoDuyet
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CauHoiChoDuyet]') AND type in (N'U'))
BEGIN
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
    FOREIGN KEY([NguoiTao]) REFERENCES [dbo].[User] ([UserId]);

    ALTER TABLE [dbo].[CauHoiChoDuyet]
    ADD CONSTRAINT [FK_CauHoiChoDuyet_NguoiDuyet]
    FOREIGN KEY([NguoiDuyet]) REFERENCES [dbo].[User] ([UserId]);

    -- Tạo indexes cho performance
    CREATE INDEX [IX_CauHoiChoDuyet_NguoiTao] ON [dbo].[CauHoiChoDuyet]([NguoiTao]);
    CREATE INDEX [IX_CauHoiChoDuyet_TrangThai] ON [dbo].[CauHoiChoDuyet]([TrangThai]);
    CREATE INDEX [IX_CauHoiChoDuyet_NgayTao] ON [dbo].[CauHoiChoDuyet]([NgayTao]);
    CREATE INDEX [IX_CauHoiChoDuyet_MaPhan] ON [dbo].[CauHoiChoDuyet]([MaPhan]);

    -- Thêm check constraint cho TrangThai
    ALTER TABLE [dbo].[CauHoiChoDuyet]
    ADD CONSTRAINT [CK_CauHoiChoDuyet_TrangThai]
    CHECK ([TrangThai] IN (0, 1, 2));

    PRINT 'Bảng CauHoiChoDuyet đã được tạo thành công';
END
ELSE
BEGIN
    PRINT 'Bảng CauHoiChoDuyet đã tồn tại';
END
