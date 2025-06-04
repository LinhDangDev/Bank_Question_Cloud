USE master
GO

-- Kiểm tra xem database [QuestionBank] đã tồn tại chưa
IF EXISTS (SELECT name FROM master.dbo.sysdatabases WHERE name = N'question_bank')
BEGIN
    -- Nếu database tồn tại, thực hiện drop database
    DROP DATABASE question_bank
    PRINT N'Database [QuestionBank] đã được drop thành công.' -- In thông báo (tùy chọn)
END
GO

-- Tạo database [QuestionBank]
CREATE DATABASE question_bank
GO

PRINT N'Database [QuestionBank] đã được tạo thành công.' -- In thông báo (tùy chọn)
GO

USE question_bank
go




/****** Object:  Table [dbo].[CauHoi]    Script Date: 2/16/2025 7:35:53 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CauHoi](
	[MaCauHoi] [uniqueidentifier] NOT NULL,
	[MaPhan] [uniqueidentifier] NOT NULL,
	[MaSoCauHoi] [int] NOT NULL,
	[NoiDung] [nvarchar](max) NULL,
	[HoanVi] [bit] NOT NULL,
	[CapDo] [smallint] NOT NULL,
	[SoCauHoiCon] [int] NOT NULL,
	[DoPhanCachCauHoi] [float] NULL,
	[MaCauHoiCha] [uniqueidentifier] NULL,
	[XoaTamCauHoi] [bit] NULL,
	[SoLanDuocThi] [int] NULL,
	[SoLanDung] [int] NULL,
	[NgayTao] [datetime] NULL,
	[NgaySua] [datetime] NULL,
	[MaCLO] [uniqueidentifier] NULL,
 CONSTRAINT [PK_CauHoi] PRIMARY KEY CLUSTERED
(
	[MaCauHoi] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[CauTraLoi]    Script Date: 2/16/2025 7:35:53 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CauTraLoi](
	[MaCauTraLoi] [uniqueidentifier] NOT NULL,
	[MaCauHoi] [uniqueidentifier] NOT NULL,
	[NoiDung] [nvarchar](max) NULL,
	[ThuTu] [int] NOT NULL,
	[LaDapAn] [bit] NOT NULL,
	[HoanVi] [bit] NOT NULL,
 CONSTRAINT [PK_CauTraLoi] PRIMARY KEY CLUSTERED
(
	[MaCauTraLoi] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[ChiTietDeThi]    Script Date: 2/16/2025 7:35:53 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ChiTietDeThi](
	[MaDeThi] [uniqueidentifier] NOT NULL,
	[MaPhan] [uniqueidentifier] NOT NULL,
	[MaCauHoi] [uniqueidentifier] NOT NULL,
	[ThuTu] [int] NOT NULL,
 CONSTRAINT [PK_ChiTietDeThi] PRIMARY KEY CLUSTERED
(
	[MaDeThi] ASC,
	[MaPhan] ASC,
	[MaCauHoi] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DeThi]    Script Date: 2/16/2025 7:35:53 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DeThi](
	[MaDeThi] [uniqueidentifier] NOT NULL,
	[MaMonHoc] [uniqueidentifier] NOT NULL,
	[TenDeThi] [nvarchar](250) NOT NULL,
	[NgayTao] [datetime] NOT NULL,
	[DaDuyet] [bit] NULL,
 CONSTRAINT [PK_DeThi] PRIMARY KEY CLUSTERED
(
	[MaDeThi] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Files]    Script Date: 2/16/2025 7:35:53 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Files](
	[MaFile] [uniqueidentifier] NOT NULL,
	[MaCauHoi] [uniqueidentifier] NULL,
	[TenFile] [nvarchar](250) NULL,
	[LoaiFile] [int] NULL,
	[MaCauTraLoi] [uniqueidentifier] NULL,
 CONSTRAINT [PK_File] PRIMARY KEY CLUSTERED
(
	[MaFile] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Khoa]    Script Date: 2/16/2025 7:35:53 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Khoa](
	[MaKhoa] [uniqueidentifier] NOT NULL,
	[TenKhoa] [nvarchar](250) NOT NULL,
	[XoaTamKhoa] [bit] NULL,
 CONSTRAINT [PK_Khoa] PRIMARY KEY CLUSTERED
(
	[MaKhoa] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[MonHoc]    Script Date: 2/16/2025 7:35:53 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[MonHoc](
	[MaMonHoc] [uniqueidentifier] NOT NULL,
	[MaKhoa] [uniqueidentifier] NOT NULL,
	[MaSoMonHoc] [nvarchar](50) NOT NULL,
	[TenMonHoc] [nvarchar](250) NOT NULL,
	[XoaTamMonHoc] [bit] NULL,
 CONSTRAINT [PK_MonHoc] PRIMARY KEY CLUSTERED
(
	[MaMonHoc] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Phan]    Script Date: 2/16/2025 7:35:53 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Phan](
	[MaPhan] [uniqueidentifier] NOT NULL,
	[MaMonHoc] [uniqueidentifier] NOT NULL,
	[TenPhan] [nvarchar](250) NOT NULL,
	[NoiDung] [nvarchar](max) NULL,
	[ThuTu] [int] NOT NULL,
	[SoLuongCauHoi] [int] NOT NULL,
	[MaPhanCha] [uniqueidentifier] NULL,
	[MaSoPhan] [int] NULL,
	[XoaTamPhan] [bit] NULL,
	[LaCauHoiNhom] [bit] NOT NULL,
 CONSTRAINT [PK_Phan] PRIMARY KEY CLUSTERED
(
	[MaPhan] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[User]    Script Date: 2/16/2025 7:35:53 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[User](
	[UserId] [uniqueidentifier] NOT NULL,
	[LoginName] [nvarchar](100) NOT NULL,
	[Email] [nvarchar](100) NOT NULL,
	[Name] [nvarchar](255) NOT NULL,
	[Password] [nvarchar](128) NOT NULL,
	[DateCreated] [datetime] NOT NULL,
	[IsDeleted] [bit] NOT NULL,
	[IsLockedOut] [bit] NOT NULL,
	[LastActivityDate] [datetime] NULL,
	[LastLoginDate] [datetime] NULL,
	[LastPasswordChangedDate] [datetime] NULL,
	[LastLockoutDate] [datetime] NULL,
	[FailedPwdAttemptCount] [int] NULL,
	[FailedPwdAttemptWindowStart] [datetime] NULL,
	[FailedPwdAnswerCount] [int] NULL,
	[FailedPwdAnswerWindowStart] [datetime] NULL,
	[PasswordSalt] [nvarchar](255) NULL,
	[Comment] [ntext] NULL,
	[IsBuildInUser] [bit] NOT NULL,
 CONSTRAINT [PK_Users] PRIMARY KEY CLUSTERED
(
	[UserId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[YeuCauRutTrich]    Script Date: 2/16/2025 7:35:53 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[YeuCauRutTrich](
	[MaYeuCauDe] [uniqueidentifier] NOT NULL,
	[HoTenGiaoVien] [nvarchar](50) NULL,
	[NoiDungRutTrich] [nvarchar](max) NULL,
	[NgayLay] [datetime] NULL,
 CONSTRAINT [PK_YeuCauDe] PRIMARY KEY CLUSTERED
(
	[MaYeuCauDe] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[CauHoi] ADD  CONSTRAINT [DF_CauHoi_SoCauHoiCon]  DEFAULT ((0)) FOR [SoCauHoiCon]
GO
ALTER TABLE [dbo].[Phan] ADD  CONSTRAINT [DF_Phan_LaCauHoiNhom]  DEFAULT ((0)) FOR [LaCauHoiNhom]
GO
ALTER TABLE [dbo].[CauHoi]  WITH CHECK ADD  CONSTRAINT [FK_CauHoi_Phan] FOREIGN KEY([MaPhan])
REFERENCES [dbo].[Phan] ([MaPhan])
ON UPDATE CASCADE
GO
ALTER TABLE [dbo].[CauHoi] CHECK CONSTRAINT [FK_CauHoi_Phan]
GO
ALTER TABLE [dbo].[CauTraLoi]  WITH CHECK ADD  CONSTRAINT [FK_CauTraLoi_CauHoi] FOREIGN KEY([MaCauHoi])
REFERENCES [dbo].[CauHoi] ([MaCauHoi])
ON UPDATE CASCADE
GO
ALTER TABLE [dbo].[CauTraLoi] CHECK CONSTRAINT [FK_CauTraLoi_CauHoi]
GO
ALTER TABLE [dbo].[ChiTietDeThi]  WITH CHECK ADD  CONSTRAINT [FK_ChiTietDeThi_CauHoi1] FOREIGN KEY([MaCauHoi])
REFERENCES [dbo].[CauHoi] ([MaCauHoi])
GO
ALTER TABLE [dbo].[ChiTietDeThi] CHECK CONSTRAINT [FK_ChiTietDeThi_CauHoi1]
GO
ALTER TABLE [dbo].[ChiTietDeThi]  WITH CHECK ADD  CONSTRAINT [FK_ChiTietDeThi_DeThi] FOREIGN KEY([MaDeThi])
REFERENCES [dbo].[DeThi] ([MaDeThi])
GO
ALTER TABLE [dbo].[ChiTietDeThi] CHECK CONSTRAINT [FK_ChiTietDeThi_DeThi]
GO
ALTER TABLE [dbo].[ChiTietDeThi]  WITH CHECK ADD  CONSTRAINT [FK_ChiTietDeThi_Phan] FOREIGN KEY([MaPhan])
REFERENCES [dbo].[Phan] ([MaPhan])
GO
ALTER TABLE [dbo].[ChiTietDeThi] CHECK CONSTRAINT [FK_ChiTietDeThi_Phan]
GO
ALTER TABLE [dbo].[DeThi]  WITH CHECK ADD  CONSTRAINT [FK_DeThi_MonHoc] FOREIGN KEY([MaMonHoc])
REFERENCES [dbo].[MonHoc] ([MaMonHoc])
ON UPDATE CASCADE
GO
ALTER TABLE [dbo].[DeThi] CHECK CONSTRAINT [FK_DeThi_MonHoc]
GO
ALTER TABLE [dbo].[Files]  WITH CHECK ADD  CONSTRAINT [FK_File_CauHoi] FOREIGN KEY([MaCauHoi])
REFERENCES [dbo].[CauHoi] ([MaCauHoi])
GO
ALTER TABLE [dbo].[Files] CHECK CONSTRAINT [FK_File_CauHoi]
GO
ALTER TABLE [dbo].[MonHoc]  WITH CHECK ADD  CONSTRAINT [FK_MonHoc_Khoa] FOREIGN KEY([MaKhoa])
REFERENCES [dbo].[Khoa] ([MaKhoa])
ON UPDATE CASCADE
GO
ALTER TABLE [dbo].[MonHoc] CHECK CONSTRAINT [FK_MonHoc_Khoa]
GO
ALTER TABLE [dbo].[Phan]  WITH CHECK ADD  CONSTRAINT [FK_Phan_MonHoc] FOREIGN KEY([MaMonHoc])
REFERENCES [dbo].[MonHoc] ([MaMonHoc])
ON UPDATE CASCADE
GO
ALTER TABLE [dbo].[Phan] CHECK CONSTRAINT [FK_Phan_MonHoc]
GO
/****** Object:  StoredProcedure [dbo].[CauHoi_Delete]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauHoi_Delete]
@MaCauHoi uniqueidentifier
WITH EXECUTE AS CALLER
AS
DELETE FROM [dbo].[Files]
WHERE	[MaCauHoi] = @MaCauHoi

DELETE FROM [dbo].[CauTraLoi]
WHERE	[MaCauHoi] = @MaCauHoi

DELETE FROM [dbo].[ChiTietDeThi]
WHERE   [MaCauHoi] = @MaCauHoi

DELETE FROM [dbo].[CauHoi]
WHERE
	[MaCauHoi] = @MaCauHoi
GO
/****** Object:  StoredProcedure [dbo].[CauHoi_Delete_Excel]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauHoi_Delete_Excel]

@MaCauHoi uniqueidentifier,
@MaPhan uniqueidentifier,
@MaMonHoc uniqueidentifier
WITH EXECUTE AS CALLER
AS
DELETE FROM [dbo].[Files]
WHERE	[MaCauHoi] = @MaCauHoi
		or [MaCauHoi] in (select MaCauHoi from cauhoi CH where CH.MaCauHoiCha=@MaCauHoi)
DELETE FROM [dbo].[CauTraLoi]
WHERE	[MaCauHoi] = @MaCauHoi
		or [MaCauHoi] in (select MaCauHoi from cauhoi CH where CH.MaCauHoiCha=@MaCauHoi)

DELETE FROM [dbo].[ChiTietDeThi]
WHERE   [MaCauHoi] = @MaCauHoi
		or [MaCauHoi] in (select MaCauHoi from cauhoi CH where CH.MaCauHoiCha=@MaCauHoi)
DELETE FROM [dbo].[CauHoi]
WHERE    [MaCauHoi] IN
	(select CH.MaCauHoi
		from cauhoi CH
			JOIN phan P ON P.maphan=CH.maphan
			JOIN monhoc MH ON MH.mamonhoc=P.mamonhoc
		WHERE
			CH.[MaCauHoi] = @MaCauHoi and
			P.[MaPhan] = @MaPhan and
			MH.[MaMonHoc]=@MaMonHoc)
		or [MaCauHoiCha]=@MaCauHoi

GO
/****** Object:  StoredProcedure [dbo].[CauHoi_ExportWord_SelectBy_MaDeThi]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauHoi_ExportWord_SelectBy_MaDeThi]

@MaDeThi uniqueidentifier
WITH EXECUTE AS CALLER
AS


SELECT
		DISTINCT CH.*, 'MaPhanGoc' = CTDT.[MaPhan]
FROM
		[dbo].[CauHoi] CH
		JOIN [dbo].[ChiTietDeThi] CTDT ON CTDT.MaCauHoi = CH.MaCauHoi
WHERE
		[MaDeThi] = @MaDeThi
		and XoaTamCauHoi = 'False'
ORDER BY MaSoCauHoi
GO
/****** Object:  StoredProcedure [dbo].[CauHoi_FlagAsDeleted]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauHoi_FlagAsDeleted]

@MaCauHoi uniqueidentifier
WITH EXECUTE AS CALLER
AS
UPDATE 		[dbo].[CauHoi]
SET
		XoaTamCauHoi = 'True'
WHERE
		[MaCauHoi] = @MaCauHoi
		and XoaTamCauHoi = 'False'

GO
/****** Object:  StoredProcedure [dbo].[CauHoi_GetCount]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauHoi_GetCount]
WITH EXECUTE AS CALLER
AS
SELECT COUNT(*) FROM [dbo].[CauHoi]

GO
/****** Object:  StoredProcedure [dbo].[CauHoi_GetCountNotCauHoiNhomBy_MaPhan]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauHoi_GetCountNotCauHoiNhomBy_MaPhan]

@MaPhan uniqueidentifier
WITH EXECUTE AS CALLER
AS
SELECT
		COUNT(*)
FROM
		[dbo].[CauHoi]

WHERE
		MaPhan = @MaPhan
	AND SoCauHoiCon = 0
	AND XoaTamCauHoi = 'False'
GO
/****** Object:  StoredProcedure [dbo].[CauHoi_Insert]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauHoi_Insert]


@MaCauHoi uniqueidentifier,
@MaPhan uniqueidentifier,
@MaSoCauHoi int,
@NoiDung nvarchar(max),
@HoanVi bit,
@CapDo smallint,
@SoCauHoiCon int,
@DoPhanCachCauHoi float,
@MaCauHoiCha uniqueidentifier,
@XoaTamCauHoi bit,
@SoLanDuocThi int,
@SoLanDung int,
@NgayTao datetime,
@NgaySua datetime

WITH EXECUTE AS CALLER
AS

INSERT INTO 	[dbo].[CauHoi]
(
				[MaCauHoi],
				[MaPhan],
				[MaSoCauHoi],
				[NoiDung],
				[HoanVi],
				[CapDo],
				[SoCauHoiCon],
				[DoPhanCachCauHoi],
				[MaCauHoiCha],
				[XoaTamCauHoi],
				[SoLanDuocThi],
				[SoLanDung],
				[NgayTao],
				[NgaySua]
)

VALUES
(
				@MaCauHoi,
				@MaPhan,
				@MaSoCauHoi,
				@NoiDung,
				@HoanVi,
				@CapDo,
				@SoCauHoiCon,
				@DoPhanCachCauHoi,
				@MaCauHoiCha,
				@XoaTamCauHoi,
				@SoLanDuocThi,
				@SoLanDung,
				@NgayTao,
				@NgaySua

)


GO
/****** Object:  StoredProcedure [dbo].[CauHoi_Restore]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauHoi_Restore]

@MaCauHoi uniqueidentifier

WITH EXECUTE AS CALLER
AS
UPDATE 		[dbo].[CauHoi]

SET
		XoaTamCauHoi = 'False'

WHERE
		[MaCauHoi] = @MaCauHoi
		and XoaTamCauHoi = 'True'

GO
/****** Object:  StoredProcedure [dbo].[CauHoi_SelectAll]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauHoi_SelectAll]
WITH EXECUTE AS CALLER
AS
SELECT
		[MaCauHoi],
		[MaPhan],
		[MaSoCauHoi],
		[NoiDung],
		[HoanVi],
		[CapDo],
		[SoCauHoiCon],
		[DoPhanCachCauHoi],
		[MaCauHoiCha],
		[XoaTamCauHoi],
		[SoLanDuocThi],
		[SoLanDung],
		[NgayTao],
		[NgaySua]

FROM
		[dbo].[CauHoi]

GO
/****** Object:  StoredProcedure [dbo].[CauHoi_SelectAll_Deleted]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauHoi_SelectAll_Deleted]
WITH EXECUTE AS CALLER
AS


SELECT
		*
FROM
		[dbo].[CauHoi]
WHERE
		XoaTamCauHoi = 'True'
ORDER BY [MaSoCauHoi]

GO
/****** Object:  StoredProcedure [dbo].[CauHoi_SelectBy_MaCauHoiCha]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauHoi_SelectBy_MaCauHoiCha]


@MaCauHoiCha uniqueidentifier
WITH EXECUTE AS CALLER
AS


SELECT
		*
FROM
		[dbo].[CauHoi]

WHERE
		[MaCauHoiCha] = @MaCauHoiCha
		and XoaTamCauHoi = 'False'
ORDER BY MaSoCauHoi
GO
/****** Object:  StoredProcedure [dbo].[CauHoi_SelectBy_MaDeThi]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauHoi_SelectBy_MaDeThi]

@MaDeThi uniqueidentifier

AS

SELECT ch.MaCauHoi
	, ch.MaPhan
	, ch.MaSoCauHoi
	, ch.NoiDung
	, ch.HoanVi
	, ch.SoCauHoiCon
	, ch.MaCauHoiCha

FROM ChiTietDeThi ct
JOIN CauHoi ch on ch.MaCauHoi = ct.MaCauHoi

WHERE MaDeThi = @MaDeThi
ORDER BY ct.ThuTu


GO
/****** Object:  StoredProcedure [dbo].[CauHoi_SelectBy_MaMonHoc]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauHoi_SelectBy_MaMonHoc]

@MaMonHoc uniqueidentifier
WITH EXECUTE AS CALLER
AS


SELECT
		DISTINCT CH.*
FROM
		[dbo].[CauHoi] CH
		JOIN [dbo].[Phan] P ON P.MaPhan = CH.MaPhan
WHERE
		[MaMonHoc] = @MaMonHoc
ORDER BY MaSoCauHoi

GO
/****** Object:  StoredProcedure [dbo].[CauHoi_SelectBy_MaPhan]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauHoi_SelectBy_MaPhan]

@MaPhan uniqueidentifier
WITH EXECUTE AS CALLER
AS


SELECT
		*
FROM
		[dbo].[CauHoi]

WHERE
		[MaPhan] = @MaPhan
		and XoaTamCauHoi = 'False'
ORDER BY [MaSoCauHoi]


GO
/****** Object:  StoredProcedure [dbo].[CauHoi_SelectBy_MaPhan_CapDo]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauHoi_SelectBy_MaPhan_CapDo]

@MaPhan uniqueidentifier,
@CapDo int
WITH EXECUTE AS CALLER
AS


SELECT
		*
FROM
		[dbo].[CauHoi]

WHERE
		[MaPhan] = @MaPhan
		and [CapDo] = @CapDo
		and XoaTamCauHoi = 'False'
ORDER BY [MaSoCauHoi]

GO
/****** Object:  StoredProcedure [dbo].[CauHoi_SelectBy_MaPhan_CapDo_MaSoCauHoi]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauHoi_SelectBy_MaPhan_CapDo_MaSoCauHoi]

@MaPhan uniqueidentifier,
@CapDo int,
@MaSoCauHoi int
WITH EXECUTE AS CALLER
AS


SELECT
		*
FROM
		[dbo].[CauHoi]

WHERE
		[MaPhan] = @MaPhan
		and [CapDo] = @CapDo
		and [MaSoCauHoi] = @MaSoCauHoi
		and XoaTamCauHoi = 'False'
ORDER BY [MaSoCauHoi]



GO
/****** Object:  StoredProcedure [dbo].[CauHoi_SelectBy_MaPhan_MaCauHoiCha]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauHoi_SelectBy_MaPhan_MaCauHoiCha]


@MaPhan uniqueidentifier,
@MaCauHoiCha uniqueidentifier
WITH EXECUTE AS CALLER
AS


SELECT
		*
FROM
		[dbo].[CauHoi]

WHERE
		[MaPhan] = @MaPhan
		and [MaCauHoiCha] = @MaCauHoiCha
		and XoaTamCauHoi = 'False'
ORDER BY [MaSoCauHoi]

GO
/****** Object:  StoredProcedure [dbo].[CauHoi_SelectBy_MaPhan_MaSoCauHoi]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauHoi_SelectBy_MaPhan_MaSoCauHoi]


@MaPhan uniqueidentifier,
@MaSoCauHoi int
WITH EXECUTE AS CALLER
AS


SELECT
		*
FROM
		[dbo].[CauHoi]

WHERE
		[MaPhan] = @MaPhan
		and [MaSoCauHoi] = @MaSoCauHoi
		and XoaTamCauHoi = 'False'
ORDER BY [MaSoCauHoi]

GO
/****** Object:  StoredProcedure [dbo].[CauHoi_SelectBy_MaSoCauHoi]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauHoi_SelectBy_MaSoCauHoi]

@MaSoCauHoi int
WITH EXECUTE AS CALLER
AS

SELECT
		*
FROM
		[dbo].[CauHoi]

WHERE
		[MaSoCauHoi] = @MaSoCauHoi
		and XoaTamCauHoi = 'False'
ORDER BY MaSoCauHoi

GO
/****** Object:  StoredProcedure [dbo].[CauHoi_SelectDapAn]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauHoi_SelectDapAn]
	@MaCauHoi uniqueidentifier

WITH EXECUTE AS CALLER
AS

SELECT TOP 1 *
FROM	[CauTraLoi]
WHERE	[MaCauHoi]  = @MaCauHoi
	AND	[LaDapAn]	= 1
ORDER BY ThuTu

GO
/****** Object:  StoredProcedure [dbo].[CauHoi_SelectMax_MaSoCauHoi]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauHoi_SelectMax_MaSoCauHoi]

@MaPhan uniqueidentifier
WITH EXECUTE AS CALLER
AS

DECLARE @Max int

SELECT
		@Max = MAX([MaSoCauHoi])
FROM
		[dbo].[CauHoi]

WHERE
		[MaPhan] = @MaPhan

IF(@Max IS NULL) SELECT 0
ELSE SELECT @Max

GO
/****** Object:  StoredProcedure [dbo].[CauHoi_SelectMax_MaSoCauHoiCapDo]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauHoi_SelectMax_MaSoCauHoiCapDo]

@MaPhan uniqueidentifier,
@CapDo int
WITH EXECUTE AS CALLER
AS

DECLARE @Max int

SELECT	@Max = MAX([MaSoCauHoi])
FROM	[dbo].[CauHoi]
WHERE	[MaPhan] = @MaPhan
	AND [CapDo] = @CapDo
IF(@Max IS NULL) SELECT 0
ELSE SELECT @Max

GO
/****** Object:  StoredProcedure [dbo].[CauHoi_SelectOne]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauHoi_SelectOne]

@MaCauHoi uniqueidentifier
WITH EXECUTE AS CALLER
AS


SELECT
		[MaCauHoi],
		[MaPhan],
		[MaSoCauHoi],
		[NoiDung],
		[HoanVi],
		[CapDo],
		[SoCauHoiCon],
		[DoPhanCachCauHoi],
		[MaCauHoiCha],
		[XoaTamCauHoi],
		[SoLanDuocThi],
		[SoLanDung],
		[NgayTao],
		[NgaySua]

FROM
		[dbo].[CauHoi]

WHERE
		[MaCauHoi] = @MaCauHoi

GO
/****** Object:  StoredProcedure [dbo].[CauHoi_SelectPage]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauHoi_SelectPage]
@PageNumber 			int,
@PageSize 			int
WITH EXECUTE AS CALLER
AS

DECLARE @PageLowerBound int
DECLARE @PageUpperBound int


SET @PageLowerBound = (@PageSize * @PageNumber) - @PageSize
SET @PageUpperBound = @PageLowerBound + @PageSize + 1

/*
Note: temp tables use the server default for collation not the database default
so if adding character columns be sure and specify to use the database collation like this
to avoid collation errors:

CREATE TABLE #PageIndexForUsers
(
IndexID int IDENTITY (1, 1) NOT NULL,
UserName nvarchar(50) COLLATE DATABASE_DEFAULT,
LoginName nvarchar(50) COLLATE DATABASE_DEFAULT
)


*/

CREATE TABLE #PageIndex
(
	IndexID int IDENTITY (1, 1) NOT NULL,
MaCauHoi UniqueIdentifier
)

BEGIN

INSERT INTO #PageIndex (
MaCauHoi
)

SELECT
		[MaCauHoi]

FROM
		[dbo].[CauHoi]

-- WHERE

-- ORDER BY

END


SELECT
		t1.*

FROM
		[dbo].[CauHoi] t1

JOIN			#PageIndex t2
ON
		t1.[MaCauHoi] = t2.[MaCauHoi]

WHERE
		t2.IndexID > @PageLowerBound
		AND t2.IndexID < @PageUpperBound

ORDER BY t2.IndexID

DROP TABLE #PageIndex

GO
/****** Object:  StoredProcedure [dbo].[CauHoi_SelectSoCauHoiCon]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauHoi_SelectSoCauHoiCon]


@MaCauHoi uniqueidentifier
WITH EXECUTE AS CALLER
AS

DECLARE @C int

SELECT
		@C = CASE WHEN (c.[SoCauHoiCon] IS NOT NULL)
				THEN c.[SoCauHoiCon] ELSE 0 END
FROM
		[dbo].[CauHoi] c

WHERE
		c.[MaCauHoi] = @MaCauHoi

IF(@C IS NULL) SELECT 0
ELSE SELECT @C

GO
/****** Object:  StoredProcedure [dbo].[CauHoi_Update]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauHoi_Update]

@MaCauHoi uniqueidentifier,
@MaPhan uniqueidentifier,
@MaSoCauHoi int,
@NoiDung nvarchar(max),
@HoanVi bit,
@CapDo smallint,
@SoCauHoiCon int,
@DoPhanCachCauHoi float,
@MaCauHoiCha uniqueidentifier,
@XoaTamCauHoi bit,
@SoLanDuocThi int,
@SoLanDung int,
@NgayTao datetime,
@NgaySua datetime

WITH EXECUTE AS CALLER
AS

UPDATE 		[dbo].[CauHoi]

SET
			[MaPhan] = @MaPhan,
			[MaSoCauHoi] = @MaSoCauHoi,
			[NoiDung] = @NoiDung,
			[HoanVi] = @HoanVi,
			[CapDo] = @CapDo,
			[SoCauHoiCon] = @SoCauHoiCon,
			[DoPhanCachCauHoi] = @DoPhanCachCauHoi,
			[MaCauHoiCha] = @MaCauHoiCha,
			[XoaTamCauHoi] = @XoaTamCauHoi,
			[SoLanDuocThi] = @SoLanDuocThi,
			[SoLanDung] = @SoLanDung,
			[NgayTao] = @NgayTao,
			[NgaySua] = @NgaySua

WHERE
			[MaCauHoi] = @MaCauHoi

GO
/****** Object:  StoredProcedure [dbo].[CauTraLoi_Delete]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauTraLoi_Delete]

@MaCauTraLoi uniqueidentifier
WITH EXECUTE AS CALLER
AS

DELETE FROM [dbo].[CauTraLoi]
WHERE
	[MaCauTraLoi] = @MaCauTraLoi
GO
/****** Object:  StoredProcedure [dbo].[CauTraLoi_GetCount]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauTraLoi_GetCount]

WITH EXECUTE AS CALLER
AS

SELECT COUNT(*) FROM [dbo].[CauTraLoi]

GO
/****** Object:  StoredProcedure [dbo].[CauTraLoi_Insert]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauTraLoi_Insert]

@MaCauTraLoi uniqueidentifier,
@MaCauHoi uniqueidentifier,
@NoiDung nvarchar(max),
@ThuTu int,
@LaDapAn bit,
@HoanVi bit

WITH EXECUTE AS CALLER
AS

INSERT INTO 	[dbo].[CauTraLoi]
(
				[MaCauTraLoi],
				[MaCauHoi],
				[NoiDung],
				[ThuTu],
				[LaDapAn],
				[HoanVi]
)

VALUES
(
				@MaCauTraLoi,
				@MaCauHoi,
				@NoiDung,
				@ThuTu,
				@LaDapAn,
				@HoanVi

)
GO
/****** Object:  StoredProcedure [dbo].[CauTraLoi_SelectAll]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauTraLoi_SelectAll]

WITH EXECUTE AS CALLER
AS


SELECT
		[MaCauTraLoi],
		[MaCauHoi],
		[NoiDung],
		[ThuTu],
		[LaDapAn],
		[HoanVi]

FROM
		[dbo].[CauTraLoi]

GO
/****** Object:  StoredProcedure [dbo].[CauTraLoi_SelectBy_MaCauHoi]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauTraLoi_SelectBy_MaCauHoi]


@MaCauHoi uniqueidentifier
WITH EXECUTE AS CALLER
AS


SELECT
		[MaCauTraLoi],
		[MaCauHoi],
		[NoiDung],
		[ThuTu],
		[LaDapAn],
		[HoanVi]

FROM
		[dbo].[CauTraLoi]

WHERE
		[MaCauHoi] = @MaCauHoi
ORDER BY ThuTu

GO
/****** Object:  StoredProcedure [dbo].[CauTraLoi_SelectBy_MaDeThi]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauTraLoi_SelectBy_MaDeThi]

@MaDeThi uniqueidentifier
WITH EXECUTE AS CALLER
AS


SELECT
		DISTINCT CTL.*
FROM
		[dbo].[CauTraLoi] CTL
		JOIN [dbo].[ChiTietDeThi] CTDT ON CTDT.MaCauHoi = CTL.MaCauHoi
WHERE
		[MaDeThi] = @MaDeThi
ORDER BY ThuTu

GO
/****** Object:  StoredProcedure [dbo].[CauTraLoi_SelectBy_MaMonHoc]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauTraLoi_SelectBy_MaMonHoc]

@MaMonHoc uniqueidentifier
WITH EXECUTE AS CALLER
AS


SELECT
		DISTINCT CTL.*
FROM
		[dbo].[CauTraLoi] CTL
		JOIN [dbo].[CauHoi] CH ON CH.MaCauHoi = CTL.MaCauHoi
		JOIN [dbo].[Phan] P ON P.MaPhan = CH.MaPhan
WHERE
		[MaMonHoc] = @MaMonHoc
GO
/****** Object:  StoredProcedure [dbo].[CauTraLoi_SelectBy_MaPhan]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauTraLoi_SelectBy_MaPhan]

@MaPhan uniqueidentifier
WITH EXECUTE AS CALLER
AS


SELECT
		DISTINCT CTL.*
FROM
		[dbo].[CauTraLoi] CTL
		JOIN [dbo].[CauHoi] CH ON CH.MaCauHoi = CTL.MaCauHoi
WHERE
		[MaPhan] = @MaPhan
ORDER BY ThuTu
GO
/****** Object:  StoredProcedure [dbo].[CauTraLoi_SelectOne]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauTraLoi_SelectOne]


@MaCauTraLoi uniqueidentifier
WITH EXECUTE AS CALLER
AS


SELECT
		[MaCauTraLoi],
		[MaCauHoi],
		[NoiDung],
		[ThuTu],
		[LaDapAn],
		[HoanVi]

FROM
		[dbo].[CauTraLoi]

WHERE
		[MaCauTraLoi] = @MaCauTraLoi

GO
/****** Object:  StoredProcedure [dbo].[CauTraLoi_SelectPage]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauTraLoi_SelectPage]

@PageNumber 			int,
@PageSize 			int
WITH EXECUTE AS CALLER
AS

DECLARE @PageLowerBound int
DECLARE @PageUpperBound int


SET @PageLowerBound = (@PageSize * @PageNumber) - @PageSize
SET @PageUpperBound = @PageLowerBound + @PageSize + 1

/*
Note: temp tables use the server default for collation not the database default
so if adding character columns be sure and specify to use the database collation like this
to avoid collation errors:

CREATE TABLE #PageIndexForUsers
(
IndexID int IDENTITY (1, 1) NOT NULL,
UserName nvarchar(50) COLLATE DATABASE_DEFAULT,
LoginName nvarchar(50) COLLATE DATABASE_DEFAULT
)


*/

CREATE TABLE #PageIndex
(
	IndexID int IDENTITY (1, 1) NOT NULL,
MaCauTraLoi UniqueIdentifier
)

BEGIN

INSERT INTO #PageIndex (
MaCauTraLoi
)

SELECT
		[MaCauTraLoi]

FROM
		[dbo].[CauTraLoi]

-- WHERE

-- ORDER BY

END


SELECT
		t1.*

FROM
		[dbo].[CauTraLoi] t1

JOIN			#PageIndex t2
ON
		t1.[MaCauTraLoi] = t2.[MaCauTraLoi]

WHERE
		t2.IndexID > @PageLowerBound
		AND t2.IndexID < @PageUpperBound

ORDER BY t2.IndexID

DROP TABLE #PageIndex

GO
/****** Object:  StoredProcedure [dbo].[CauTraLoi_Update]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[CauTraLoi_Update]

@MaCauTraLoi uniqueidentifier,
@MaCauHoi uniqueidentifier,
@NoiDung nvarchar(max),
@ThuTu int,
@LaDapAn bit,
@HoanVi bit

WITH EXECUTE AS CALLER
AS

UPDATE 		[dbo].[CauTraLoi]

SET
			[MaCauHoi] = @MaCauHoi,
			[NoiDung] = @NoiDung,
			[ThuTu] = @ThuTu,
			[LaDapAn] = @LaDapAn,
			[HoanVi] = @HoanVi

WHERE
			[MaCauTraLoi] = @MaCauTraLoi

GO
/****** Object:  StoredProcedure [dbo].[ChiTietDeThi_Delete]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[ChiTietDeThi_Delete]


@MaDeThi uniqueidentifier,
@MaPhan uniqueidentifier,
@MaCauHoi uniqueidentifier
WITH EXECUTE AS CALLER
AS

DELETE FROM [dbo].[ChiTietDeThi]
WHERE
	[MaDeThi] = @MaDeThi
	AND [MaPhan] = @MaPhan
	AND [MaCauHoi] = @MaCauHoi
GO
/****** Object:  StoredProcedure [dbo].[ChiTietDeThi_GetCount]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[ChiTietDeThi_GetCount]

WITH EXECUTE AS CALLER
AS

SELECT COUNT(*) FROM [dbo].[ChiTietDeThi]

GO
/****** Object:  StoredProcedure [dbo].[ChiTietDeThi_Insert]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[ChiTietDeThi_Insert]

-- THIS STORED PROCEDURE NEEDS TO BE MANUALLY COMPLETED
-- MULITPLE PRIMARY KEY MEMBERS OR NON-GUID/INT PRIMARY KEY

@MaDeThi uniqueidentifier,
@MaPhan uniqueidentifier,
@MaCauHoi uniqueidentifier,
@ThuTu int

WITH EXECUTE AS CALLER
AS

INSERT INTO 		[dbo].[ChiTietDeThi]
(
					[MaDeThi],
					[MaPhan],
					[MaCauHoi],
					[ThuTu]
)

VALUES
(
					@MaDeThi,
					@MaPhan,
					@MaCauHoi,
					@ThuTu
)


GO
/****** Object:  StoredProcedure [dbo].[ChiTietDeThi_SelectAll]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[ChiTietDeThi_SelectAll]

WITH EXECUTE AS CALLER
AS


SELECT
		[MaDeThi],
		[MaPhan],
		[MaCauHoi],
		[ThuTu]

FROM
		[dbo].[ChiTietDeThi]

GO
/****** Object:  StoredProcedure [dbo].[ChiTietDeThi_SelectContent]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[ChiTietDeThi_SelectContent]


@MaDeThi uniqueidentifier
WITH EXECUTE AS CALLER
AS


SELECT
		*
FROM
		[dbo].[ChiTietDeThi] CTDT
JOIN [dbo].[Phan] P ON P.MaPhan = CTDT.MaPhan
JOIN [dbo].[CauHoi] CH ON CH.MaCauHoi = CTDT.MaCauHoi

WHERE
		[MaDeThi] = @MaDeThi

GO
/****** Object:  StoredProcedure [dbo].[ChiTietDeThi_SelectOne]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[ChiTietDeThi_SelectOne]


@MaDeThi uniqueidentifier,
@MaPhan uniqueidentifier,
@MaCauHoi uniqueidentifier
WITH EXECUTE AS CALLER
AS


SELECT
		[MaDeThi],
		[MaPhan],
		[MaCauHoi],
		[ThuTu]

FROM
		[dbo].[ChiTietDeThi]

WHERE
		[MaDeThi] = @MaDeThi
		AND [MaPhan] = @MaPhan
		AND [MaCauHoi] = @MaCauHoi

GO
/****** Object:  StoredProcedure [dbo].[ChiTietDeThi_SelectPage]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[ChiTietDeThi_SelectPage]

@PageNumber 			int,
@PageSize 			int
WITH EXECUTE AS CALLER
AS

DECLARE @PageLowerBound int
DECLARE @PageUpperBound int


SET @PageLowerBound = (@PageSize * @PageNumber) - @PageSize
SET @PageUpperBound = @PageLowerBound + @PageSize + 1

/*
Note: temp tables use the server default for collation not the database default
so if adding character columns be sure and specify to use the database collation like this
to avoid collation errors:

CREATE TABLE #PageIndexForUsers
(
IndexID int IDENTITY (1, 1) NOT NULL,
UserName nvarchar(50) COLLATE DATABASE_DEFAULT,
LoginName nvarchar(50) COLLATE DATABASE_DEFAULT
)


*/

CREATE TABLE #PageIndex
(
	IndexID int IDENTITY (1, 1) NOT NULL,
MaDeThi UniqueIdentifier,
MaPhan UniqueIdentifier,
MaCauHoi UniqueIdentifier
)

BEGIN

INSERT INTO #PageIndex (
MaDeThi,

MaPhan,

MaCauHoi
)

SELECT
		[MaDeThi],
		[MaPhan],
		[MaCauHoi]

FROM
		[dbo].[ChiTietDeThi]

-- WHERE

-- ORDER BY

END


SELECT
		t1.*

FROM
		[dbo].[ChiTietDeThi] t1

JOIN			#PageIndex t2
ON
		t1.[MaDeThi] = t2.[MaDeThi] AND

		t1.[MaPhan] = t2.[MaPhan] AND

		t1.[MaCauHoi] = t2.[MaCauHoi]

WHERE
		t2.IndexID > @PageLowerBound
		AND t2.IndexID < @PageUpperBound

ORDER BY t2.IndexID

DROP TABLE #PageIndex

GO
/****** Object:  StoredProcedure [dbo].[ChiTietDeThi_Update]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[ChiTietDeThi_Update]

@MaDeThi uniqueidentifier,
@MaPhan uniqueidentifier,
@MaCauHoi uniqueidentifier,
@ThuTu int

WITH EXECUTE AS CALLER
AS

UPDATE 		[dbo].[ChiTietDeThi]

SET
			[ThuTu] = @ThuTu

WHERE
			[MaDeThi] = @MaDeThi
			AND [MaPhan] = @MaPhan
			AND [MaCauHoi] = @MaCauHoi

GO
/****** Object:  StoredProcedure [dbo].[DeThi_Delete]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[DeThi_Delete]


@MaDeThi uniqueidentifier
WITH EXECUTE AS CALLER
AS

DELETE FROM [dbo].[DeThi]
WHERE
	[MaDeThi] = @MaDeThi
GO
/****** Object:  StoredProcedure [dbo].[DeThi_GetCount]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[DeThi_GetCount]

WITH EXECUTE AS CALLER
AS
SELECT COUNT(*) FROM [dbo].[DeThi]

GO
/****** Object:  StoredProcedure [dbo].[DeThi_Insert]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[DeThi_Insert]


@MaDeThi uniqueidentifier,
@MaMonHoc uniqueidentifier,
@TenDeThi nvarchar(250),
@NgayTao datetime,
@DaDuyet bit

WITH EXECUTE AS CALLER
AS

INSERT INTO 	[dbo].[DeThi]
(
				[MaDeThi],
				[MaMonHoc],
				[TenDeThi],
				[NgayTao],
				[DaDuyet]
)

VALUES
(
				@MaDeThi,
				@MaMonHoc,
				@TenDeThi,
				@NgayTao,
				@DaDuyet

)


GO
/****** Object:  StoredProcedure [dbo].[DeThi_SelectAll]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[DeThi_SelectAll]

WITH EXECUTE AS CALLER
AS


SELECT
		[MaDeThi],
		[MaMonHoc],
		[TenDeThi],
		[NgayTao],
		[DaDuyet]

FROM
		[dbo].[DeThi]

GO
/****** Object:  StoredProcedure [dbo].[DeThi_SelectBy_MaMonHoc]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
create PROCEDURE [dbo].[DeThi_SelectBy_MaMonHoc]


@MaMonHoc uniqueidentifier
WITH EXECUTE AS CALLER
AS


SELECT
		[MaDeThi],
		[MaMonHoc],
		[TenDeThi],
		[NgayTao],
		[DaDuyet]

FROM
		[dbo].[DeThi]

WHERE
		[MaMonHoc] = @MaMonHoc


GO
/****** Object:  StoredProcedure [dbo].[DeThi_SelectOne]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[DeThi_SelectOne]


@MaDeThi uniqueidentifier
WITH EXECUTE AS CALLER
AS


SELECT
		[MaDeThi],
		[MaMonHoc],
		[TenDeThi],
		[NgayTao],
		[DaDuyet]

FROM
		[dbo].[DeThi]

WHERE
		[MaDeThi] = @MaDeThi

GO
/****** Object:  StoredProcedure [dbo].[DeThi_SelectPage]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[DeThi_SelectPage]

@PageNumber 			int,
@PageSize 			int
WITH EXECUTE AS CALLER
AS

DECLARE @PageLowerBound int
DECLARE @PageUpperBound int


SET @PageLowerBound = (@PageSize * @PageNumber) - @PageSize
SET @PageUpperBound = @PageLowerBound + @PageSize + 1

/*
Note: temp tables use the server default for collation not the database default
so if adding character columns be sure and specify to use the database collation like this
to avoid collation errors:

CREATE TABLE #PageIndexForUsers
(
IndexID int IDENTITY (1, 1) NOT NULL,
UserName nvarchar(50) COLLATE DATABASE_DEFAULT,
LoginName nvarchar(50) COLLATE DATABASE_DEFAULT
)


*/

CREATE TABLE #PageIndex
(
	IndexID int IDENTITY (1, 1) NOT NULL,
MaDeThi UniqueIdentifier
)

BEGIN

INSERT INTO #PageIndex (
MaDeThi
)

SELECT
		[MaDeThi]

FROM
		[dbo].[DeThi]

-- WHERE

-- ORDER BY

END


SELECT
		t1.*

FROM
		[dbo].[DeThi] t1

JOIN			#PageIndex t2
ON
		t1.[MaDeThi] = t2.[MaDeThi]

WHERE
		t2.IndexID > @PageLowerBound
		AND t2.IndexID < @PageUpperBound

ORDER BY t2.IndexID

DROP TABLE #PageIndex

GO
/****** Object:  StoredProcedure [dbo].[DeThi_Update]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[DeThi_Update]

@MaDeThi uniqueidentifier,
@MaMonHoc uniqueidentifier,
@TenDeThi nvarchar(250),
@NgayTao datetime,
@DaDuyet bit
WITH EXECUTE AS CALLER
AS

UPDATE 		[dbo].[DeThi]

SET
			[MaMonHoc] = @MaMonHoc,
			[TenDeThi] = @TenDeThi,
			[NgayTao] = @NgayTao,
			[DaDuyet] = @DaDuyet

WHERE
			[MaDeThi] = @MaDeThi

GO
/****** Object:  StoredProcedure [dbo].[Files_Delete]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Files_Delete]

@MaFile uniqueidentifier
WITH EXECUTE AS CALLER
AS

DELETE FROM [dbo].[Files]
WHERE
	[MaFile] = @MaFile
GO
/****** Object:  StoredProcedure [dbo].[Files_GetCount]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Files_GetCount]

WITH EXECUTE AS CALLER
AS

SELECT COUNT(*) FROM [dbo].[Files]

GO
/****** Object:  StoredProcedure [dbo].[Files_Insert]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Files_Insert]


@MaFile uniqueidentifier,
@MaCauHoi uniqueidentifier,
@TenFile nvarchar(250),
@LoaiFile int,
@MaCauTraLoi uniqueidentifier

WITH EXECUTE AS CALLER
AS

INSERT INTO 	[dbo].[Files]
(
				[MaFile],
				[MaCauHoi],
				[TenFile],
				[LoaiFile],
				[MaCauTraLoi]
)

VALUES
(
				@MaFile,
				@MaCauHoi,
				@TenFile,
				@LoaiFile,
				@MaCauTraLoi

)


GO
/****** Object:  StoredProcedure [dbo].[Files_SelectAll]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Files_SelectAll]
WITH EXECUTE AS CALLER
AS


SELECT
		[MaFile],
		[MaCauHoi],
		[TenFile],
		[LoaiFile],
		[MaCauTraLoi]

FROM
		[dbo].[Files]

GO
/****** Object:  StoredProcedure [dbo].[Files_SelectBy_MaCauHoi]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Files_SelectBy_MaCauHoi]


@MaCauHoi uniqueidentifier
WITH EXECUTE AS CALLER
AS


SELECT	*

FROM
		[dbo].[Files]

WHERE
		[MaCauHoi] = @MaCauHoi

GO
/****** Object:  StoredProcedure [dbo].[Files_SelectBy_MaCauHoi_LoaiFile]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Files_SelectBy_MaCauHoi_LoaiFile]

@MaCauHoi uniqueidentifier,
@LoaiFile int
WITH EXECUTE AS CALLER
AS


SELECT	*

FROM
		[dbo].[Files]

WHERE
		[MaCauHoi] = @MaCauHoi
		AND [LoaiFile] = @LoaiFile

GO
/****** Object:  StoredProcedure [dbo].[Files_SelectOne]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Files_SelectOne]

@MaFile uniqueidentifier
WITH EXECUTE AS CALLER
AS


SELECT
		[MaFile],
		[MaCauHoi],
		[TenFile],
		[LoaiFile],
		[MaCauTraLoi]

FROM
		[dbo].[Files]

WHERE
		[MaFile] = @MaFile

GO
/****** Object:  StoredProcedure [dbo].[Files_SelectPage]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Files_SelectPage]

@PageNumber 			int,
@PageSize 			int
WITH EXECUTE AS CALLER
AS

DECLARE @PageLowerBound int
DECLARE @PageUpperBound int


SET @PageLowerBound = (@PageSize * @PageNumber) - @PageSize
SET @PageUpperBound = @PageLowerBound + @PageSize + 1

/*
Note: temp tables use the server default for collation not the database default
so if adding character columns be sure and specify to use the database collation like this
to avoid collation errors:

CREATE TABLE #PageIndexForUsers
(
IndexID int IDENTITY (1, 1) NOT NULL,
UserName nvarchar(50) COLLATE DATABASE_DEFAULT,
LoginName nvarchar(50) COLLATE DATABASE_DEFAULT
)


*/

CREATE TABLE #PageIndex
(
	IndexID int IDENTITY (1, 1) NOT NULL,
MaFile UniqueIdentifier
)

BEGIN

INSERT INTO #PageIndex (
MaFile
)

SELECT
		[MaFile]

FROM
		[dbo].[Files]

-- WHERE

-- ORDER BY

END
GO
/****** Object:  StoredProcedure [dbo].[Files_Update]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Files_Update]


@MaFile uniqueidentifier,
@MaCauHoi uniqueidentifier,
@TenFile nvarchar(250),
@LoaiFile int,
@MaCauTraLoi uniqueidentifier

WITH EXECUTE AS CALLER
AS

UPDATE 		[dbo].[Files]

SET
			[MaCauHoi] = @MaCauHoi,
			[TenFile] = @TenFile,
			[LoaiFile] = @LoaiFile,
			[MaCauTraLoi] = @MaCauTraLoi

WHERE
			[MaFile] = @MaFile

GO
/****** Object:  StoredProcedure [dbo].[Files_Update_MaCauTraLoi]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Files_Update_MaCauTraLoi]

@MaFile uniqueidentifier,
@MaCauTraLoi uniqueidentifier

WITH EXECUTE AS CALLER
AS

UPDATE 		[dbo].[Files]

SET			[MaCauTraLoi]	= @MaCauTraLoi

WHERE		[MaFile]		= @MaFile


GO
/****** Object:  StoredProcedure [dbo].[Khoa_Delete]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Khoa_Delete]

@MaKhoa uniqueidentifier
WITH EXECUTE AS CALLER
AS

DELETE FROM [dbo].[Khoa]
WHERE
	[MaKhoa] = @MaKhoa
GO
/****** Object:  StoredProcedure [dbo].[Khoa_FlagAsDeleted]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Khoa_FlagAsDeleted]

@MaKhoa uniqueidentifier
WITH EXECUTE AS CALLER
AS

UPDATE
	CauHoi
SET
	XoaTamCauHoi = 'True'

WHERE
	MaPhan IN (SELECT P.MaPhan
					FROM Phan P JOIN MonHoc MH ON P.MaMonHoc = MH.MaMonHoc
					JOIN Khoa K ON K.MaKhoa = MH.MaKhoa
					WHERE K.MaKhoa = @MaKhoa
					and P.XoaTamPhan = 'False'
					and MH.XoaTamMonHoc = 'False'
					and K.XoaTamKhoa = 'False'
					)
	and XoaTamCauHoi = 'False';

UPDATE
	Phan
SET
	XoaTamPhan = 'True'
WHERE
	MaMonHoc IN (SELECT MH.MaMonHoc
					FROM MonHoc MH JOIN Khoa K ON K.MaKhoa = MH.MaKhoa
					WHERE K.MaKhoa = @MaKhoa
					and MH.XoaTamMonHoc = 'False'
					and K.XoaTamKhoa = 'False'
					)
	and XoaTamPhan = 'False';

UPDATE
	MonHoc
SET
	XoaTamMonHoc = 'True'
WHERE
	MaKhoa = (SELECT MaKhoa FROM Khoa WHERE MaKhoa = @MaKhoa and XoaTamKhoa = 'False')
	and XoaTamMonHoc = 'False';


UPDATE
	Khoa
SET
	XoaTamKhoa = 'True'
WHERE
	MaKhoa = @MaKhoa
	and XoaTamKhoa = 'False'
GO
/****** Object:  StoredProcedure [dbo].[Khoa_GetCount]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Khoa_GetCount]

WITH EXECUTE AS CALLER
AS

SELECT COUNT(*) FROM [dbo].[Khoa]

GO
/****** Object:  StoredProcedure [dbo].[Khoa_Insert]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Khoa_Insert]

@MaKhoa uniqueidentifier,
@TenKhoa nvarchar(250),
@XoaTamKhoa bit

WITH EXECUTE AS CALLER
AS

INSERT INTO 	[dbo].[Khoa]
(
				[MaKhoa],
				[TenKhoa],
				[XoaTamKhoa]
)

VALUES
(
				@MaKhoa,
				@TenKhoa,
				@XoaTamKhoa

)


GO
/****** Object:  StoredProcedure [dbo].[Khoa_Restore]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Khoa_Restore]

@MaKhoa uniqueidentifier
WITH EXECUTE AS CALLER
AS
UPDATE
	CauHoi
SET
	XoaTamCauHoi = 'False'

WHERE
	MaPhan IN (SELECT P.MaPhan
					FROM Phan P JOIN MonHoc MH ON P.MaMonHoc = MH.MaMonHoc
					JOIN Khoa K ON K.MaKhoa = MH.MaKhoa
					WHERE MH.MaKhoa = @MaKhoa
					and P.XoaTamPhan = 'True'
					and MH.XoaTamMonHoc = 'True'
					and K.XoaTamKhoa = 'True'
					)
	and XoaTamCauHoi = 'True';

UPDATE
	Phan
SET
	XoaTamPhan = 'False'
WHERE
	MaMonHoc IN (SELECT MH.MaMonHoc
					FROM MonHoc MH JOIN Khoa K ON K.MaKhoa = MH.MaKhoa
					WHERE MH.MaKhoa = @MaKhoa
					and MH.XoaTamMonHoc = 'True'
					and K.XoaTamKhoa = 'True'
					)
	and XoaTamPhan= 'True';

UPDATE
	MonHoc
SET
	XoaTamMonHoc = 'False'
WHERE
	MaKhoa = (SELECT MaKhoa FROM Khoa WHERE MaKhoa = @MaKhoa and XoaTamKhoa = 'True')
	and XoaTamMonHoc = 'True';


UPDATE
	Khoa
SET
	XoaTamKhoa = 'False'
WHERE
	MaKhoa = @MaKhoa
	and XoaTamKhoa = 'True'

GO
/****** Object:  StoredProcedure [dbo].[Khoa_SelectAll]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Khoa_SelectAll]

WITH EXECUTE AS CALLER
AS

SELECT
		[MaKhoa],
		[TenKhoa],
		[XoaTamKhoa]

FROM
		[dbo].[Khoa]

GO
/****** Object:  StoredProcedure [dbo].[Khoa_SelectAll_Deleted]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Khoa_SelectAll_Deleted]

WITH EXECUTE AS CALLER
AS


SELECT
		*

FROM
		[dbo].[Khoa]
where
		XoaTamKhoa = 'True'
GO
/****** Object:  StoredProcedure [dbo].[Khoa_SelectOne]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Khoa_SelectOne]


@MaKhoa uniqueidentifier
WITH EXECUTE AS CALLER
AS


SELECT
		[MaKhoa],
		[TenKhoa],
		[XoaTamKhoa]

FROM
		[dbo].[Khoa]

WHERE
		[MaKhoa] = @MaKhoa

GO
/****** Object:  StoredProcedure [dbo].[Khoa_SelectPage]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Khoa_SelectPage]

@PageNumber 			int,
@PageSize 			int
WITH EXECUTE AS CALLER
AS

DECLARE @PageLowerBound int
DECLARE @PageUpperBound int


SET @PageLowerBound = (@PageSize * @PageNumber) - @PageSize
SET @PageUpperBound = @PageLowerBound + @PageSize + 1

/*
Note: temp tables use the server default for collation not the database default
so if adding character columns be sure and specify to use the database collation like this
to avoid collation errors:

CREATE TABLE #PageIndexForUsers
(
IndexID int IDENTITY (1, 1) NOT NULL,
UserName nvarchar(50) COLLATE DATABASE_DEFAULT,
LoginName nvarchar(50) COLLATE DATABASE_DEFAULT
)


*/

CREATE TABLE #PageIndex
(
	IndexID int IDENTITY (1, 1) NOT NULL,
MaKhoa UniqueIdentifier
)

BEGIN

INSERT INTO #PageIndex (
MaKhoa
)

SELECT
		[MaKhoa]

FROM
		[dbo].[Khoa]

-- WHERE

-- ORDER BY

END


SELECT
		t1.*

FROM
		[dbo].[Khoa] t1

JOIN			#PageIndex t2
ON
		t1.[MaKhoa] = t2.[MaKhoa]

WHERE
		t2.IndexID > @PageLowerBound
		AND t2.IndexID < @PageUpperBound

ORDER BY t2.IndexID

DROP TABLE #PageIndex

GO
/****** Object:  StoredProcedure [dbo].[Khoa_Update]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Khoa_Update]


@MaKhoa uniqueidentifier,
@TenKhoa nvarchar(250),
@XoaTamKhoa bit

WITH EXECUTE AS CALLER
AS

UPDATE 		[dbo].[Khoa]

SET
			[TenKhoa] = @TenKhoa,
			[XoaTamKhoa] = @XoaTamKhoa

WHERE
			[MaKhoa] = @MaKhoa

GO
/****** Object:  StoredProcedure [dbo].[MonHoc_Delete]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[MonHoc_Delete]


@MaMonHoc uniqueidentifier
WITH EXECUTE AS CALLER
AS

DELETE FROM [dbo].[MonHoc]
WHERE
	[MaMonHoc] = @MaMonHoc
GO
/****** Object:  StoredProcedure [dbo].[MonHoc_FlagAsDeleted]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[MonHoc_FlagAsDeleted]

@MaMonHoc uniqueidentifier

WITH EXECUTE AS CALLER
AS

UPDATE
	CauHoi
SET
XoaTamCauHoi = 'True'

WHERE
	MaPhan IN (SELECT P.MaPhan
					FROM Phan P JOIN MonHoc MH ON P.MaMonHoc = MH.MaMonHoc
					WHERE MH.MaMonHoc = @MaMonHoc
					and P.XoaTamPhan = 'False'
					and MH.XoaTamMonHoc = 'False'
					)
	and XoaTamCauHoi = 'False';

UPDATE
	Phan
SET
	XoaTamPhan = 'True'
WHERE
	MaMonHoc IN (SELECT MaMonHoc
					FROM MonHoc
					WHERE MaMonHoc = @MaMonHoc
					and XoaTamMonHoc = 'False'
					)
	and XoaTamPhan = 'False';

UPDATE
	MonHoc
SET
	XoaTamMonHoc = 'True'
WHERE
	MaMonHoc = @MaMonHoc
	and XoaTamMonHoc = 'False';
GO
/****** Object:  StoredProcedure [dbo].[MonHoc_GetCount]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[MonHoc_GetCount]

WITH EXECUTE AS CALLER
AS

SELECT COUNT(*) FROM [dbo].[MonHoc]

GO
/****** Object:  StoredProcedure [dbo].[MonHoc_Insert]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[MonHoc_Insert]

@MaMonHoc uniqueidentifier,
@MaKhoa uniqueidentifier,
@MaSoMonHoc nvarchar(50),
@TenMonHoc nvarchar(250),
@XoaTamMonHoc bit

WITH EXECUTE AS CALLER
AS

INSERT INTO 	[dbo].[MonHoc]
(
				[MaMonHoc],
				[MaKhoa],
				[MaSoMonHoc],
				[TenMonHoc],
				[XoaTamMonHoc]
)

VALUES
(
				@MaMonHoc,
				@MaKhoa,
				@MaSoMonHoc,
				@TenMonHoc,
				@XoaTamMonHoc

)


GO
/****** Object:  StoredProcedure [dbo].[MonHoc_Restore]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[MonHoc_Restore]


@MaMonHoc uniqueidentifier

WITH EXECUTE AS CALLER
AS
UPDATE
	CauHoi
SET
	XoaTamCauHoi = 'False'

WHERE
	MaPhan IN (SELECT P.MaPhan
					FROM Phan P JOIN MonHoc MH ON P.MaMonHoc = MH.MaMonHoc
					WHERE MH.MaMonHoc = @MaMonHoc
					and P.XoaTamPhan = 'True'
					and MH.XoaTamMonHoc = 'True'
					)
	and XoaTamCauHoi = 'True';

UPDATE
	Phan
SET
	XoaTamPhan = 'False'
WHERE
	MaMonHoc IN (SELECT MaMonHoc
					FROM MonHoc
					WHERE MaMonHoc = @MaMonHoc
					and XoaTamMonHoc = 'True'
					)
	and XoaTamPhan = 'True';

UPDATE
	MonHoc
SET
	XoaTamMonHoc = 'False'
WHERE
	MaMonHoc = @MaMonHoc
	and XoaTamMonHoc = 'True';
GO
/****** Object:  StoredProcedure [dbo].[MonHoc_SelectAll]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[MonHoc_SelectAll]

WITH EXECUTE AS CALLER
AS

SELECT
		[MaMonHoc],
		[MaKhoa],
		[MaSoMonHoc],
		[TenMonHoc],
		[XoaTamMonHoc]

FROM
		[dbo].[MonHoc]

GO
/****** Object:  StoredProcedure [dbo].[MonHoc_SelectAll_Deleted]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[MonHoc_SelectAll_Deleted]

WITH EXECUTE AS CALLER
AS

SELECT
		*
FROM
		[dbo].[MonHoc]
where
		XoaTamMonHoc = 'True'
GO
/****** Object:  StoredProcedure [dbo].[MonHoc_SelectBy_MaDeThi]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[MonHoc_SelectBy_MaDeThi]


@MaDeThi uniqueidentifier
WITH EXECUTE AS CALLER
AS


SELECT
		MH.MaMonHoc, MH.MaSoMonHoc, MH.TenMonHoc

FROM
		[dbo].[MonHoc] MH
		JOIN [dbo].[DeThi] DT ON DT.MaMonHoc = MH.MaMonHoc

WHERE
		[MaDeThi] = @MaDeThi

GO
/****** Object:  StoredProcedure [dbo].[MonHoc_SelectBy_MaKhoa]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[MonHoc_SelectBy_MaKhoa]


@MaKhoa uniqueidentifier
WITH EXECUTE AS CALLER
AS


SELECT
		*

FROM
		[dbo].[MonHoc]

WHERE
		[MaKhoa] = @MaKhoa
		and XoaTamMonHoc = 'False'
GO
/****** Object:  StoredProcedure [dbo].[MonHoc_SelectBy_MaSoMonHoc]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[MonHoc_SelectBy_MaSoMonHoc]

@MaKhoa uniqueidentifier,
@MaSoMonHoc nvarchar(50)
WITH EXECUTE AS CALLER
AS


SELECT
		*

FROM
		[dbo].[MonHoc]

WHERE
		[MaSoMonHoc]	= @MaSoMonHoc
	AND	[MaKhoa]		= @MaKhoa
	AND [XoaTamMonHoc]			= 'False'
GO
/****** Object:  StoredProcedure [dbo].[MonHoc_SelectOne]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[MonHoc_SelectOne]

@MaMonHoc uniqueidentifier
WITH EXECUTE AS CALLER
AS


SELECT
		[MaMonHoc],
		[MaKhoa],
		[MaSoMonHoc],
		[TenMonHoc],
		[XoaTamMonHoc]

FROM
		[dbo].[MonHoc]

WHERE
		[MaMonHoc] = @MaMonHoc

GO
/****** Object:  StoredProcedure [dbo].[MonHoc_SelectOneBy_MaSoMonHoc]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[MonHoc_SelectOneBy_MaSoMonHoc]


@MaSoMonHoc nvarchar(50)
WITH EXECUTE AS CALLER
AS


SELECT
		*

FROM
		[dbo].[MonHoc]

WHERE
		[MaSoMonHoc]	= @MaSoMonHoc
	AND [XoaTamMonHoc]			= 'False'
GO
/****** Object:  StoredProcedure [dbo].[MonHoc_SelectOneByName]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[MonHoc_SelectOneByName]

@MaKhoa uniqueidentifier,
@TenMonHoc nvarchar(250)
WITH EXECUTE AS CALLER
AS


SELECT
		*
FROM
		[dbo].[MonHoc]

WHERE
		lower([TenMonHoc]) =  lower(@TenMonHoc)
		and [MaKhoa] = @MaKhoa
GO
/****** Object:  StoredProcedure [dbo].[MonHoc_SelectPage]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[MonHoc_SelectPage]

@PageNumber 			int,
@PageSize 			int
WITH EXECUTE AS CALLER
AS

DECLARE @PageLowerBound int
DECLARE @PageUpperBound int


SET @PageLowerBound = (@PageSize * @PageNumber) - @PageSize
SET @PageUpperBound = @PageLowerBound + @PageSize + 1

/*
Note: temp tables use the server default for collation not the database default
so if adding character columns be sure and specify to use the database collation like this
to avoid collation errors:

CREATE TABLE #PageIndexForUsers
(
IndexID int IDENTITY (1, 1) NOT NULL,
UserName nvarchar(50) COLLATE DATABASE_DEFAULT,
LoginName nvarchar(50) COLLATE DATABASE_DEFAULT
)


*/

CREATE TABLE #PageIndex
(
	IndexID int IDENTITY (1, 1) NOT NULL,
MaMonHoc UniqueIdentifier
)

BEGIN

INSERT INTO #PageIndex (
MaMonHoc
)

SELECT
		[MaMonHoc]

FROM
		[dbo].[MonHoc]

-- WHERE

-- ORDER BY

END


SELECT
		t1.*

FROM
		[dbo].[MonHoc] t1

JOIN			#PageIndex t2
ON
		t1.[MaMonHoc] = t2.[MaMonHoc]

WHERE
		t2.IndexID > @PageLowerBound
		AND t2.IndexID < @PageUpperBound

ORDER BY t2.IndexID

DROP TABLE #PageIndex

GO
/****** Object:  StoredProcedure [dbo].[MonHoc_Update]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[MonHoc_Update]

@MaMonHoc uniqueidentifier,
@MaKhoa uniqueidentifier,
@MaSoMonHoc nvarchar(50),
@TenMonHoc nvarchar(250),
@XoaTamMonHoc bit

WITH EXECUTE AS CALLER
AS

UPDATE 		[dbo].[MonHoc]

SET
			[MaKhoa] = @MaKhoa,
			[MaSoMonHoc] = @MaSoMonHoc,
			[TenMonHoc] = @TenMonHoc,
			[XoaTamMonHoc] = @XoaTamMonHoc

WHERE
			[MaMonHoc] = @MaMonHoc

GO
/****** Object:  StoredProcedure [dbo].[Phan_CheckExistPhanCon]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Phan_CheckExistPhanCon]

@MaPhan uniqueidentifier

AS

IF EXISTS
    (
    SELECT *
    FROM Phan
    WHERE MaPhanCha = @MaPhan
    )
    BEGIN
        select 1
    END
ELSE
    BEGIN
        select 0
    END



GO
/****** Object:  StoredProcedure [dbo].[Phan_Delete]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Phan_Delete]
@MaPhan uniqueidentifier
AS
Begin Tran DeleteCate_Child
-- set parent to empty

DELETE FROM [dbo].[Files]
WHERE	[MaCauHoi] in
(select cauhoi.macauhoi from cauhoi where cauhoi.maphan in
(select phan.maphan from phan where maphancha= @MaPhan  or maphan=@MaPhan))

DELETE FROM [dbo].[CauTraLoi]
WHERE	[MaCauHoi] in
(select cauhoi.macauhoi from cauhoi where cauhoi.maphan in
(select phan.maphan from phan where maphancha= @MaPhan  or maphan=@MaPhan))

DELETE FROM [dbo].[ChiTietDeThi]
WHERE	[MaCauHoi] in
(select cauhoi.macauhoi from cauhoi where cauhoi.maphan in
(select phan.maphan from phan where maphancha= @MaPhan  or maphan=@MaPhan))

DELETE FROM [dbo].[CauHoi]
where cauhoi.maphan in
(select phan.maphan from phan where maphancha= @MaPhan or maphan=@MaPhan)

DELETE FROM phan
WHERE MaPhanCha=@MaPhan

--Check error
If @@Error <>0 goto Error_Lbl

-- Delete
Delete FROM Phan
WHERE MaPhan=@MaPhan

--Check error
If @@Error <>0 goto Error_Lbl

-- Have no error, commit trans, exit sub
Commit Tran DeleteCate_Child
Return

-- error processing
Error_Lbl:
Rollback Tran DeleteCate_Child
GO
/****** Object:  StoredProcedure [dbo].[Phan_FlagAsDeleted]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Phan_FlagAsDeleted]


@MaPhan uniqueidentifier

WITH EXECUTE AS CALLER
AS

UPDATE
	CauHoi
SET
	XoaTamCauHoi = 'True'

WHERE
	MaPhan IN (SELECT MaPhan
					FROM Phan
					WHERE MaPhan = @MaPhan
					and XoaTamPhan = 'False'
					)
	and XoaTamCauHoi = 'False';

UPDATE
	Phan
SET
	XoaTamPhan = 'True'
WHERE
	MaPhan = @MaPhan
	and XoaTamPhan = 'False';

GO
/****** Object:  StoredProcedure [dbo].[Phan_GetCount]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[Phan_GetCount]

WITH EXECUTE AS CALLER
AS
SELECT COUNT(*) FROM [dbo].[Phan]

GO
/****** Object:  StoredProcedure [dbo].[Phan_Insert]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Phan_Insert]


@MaPhan uniqueidentifier,
@MaMonHoc uniqueidentifier,
@TenPhan nvarchar(250),
@NoiDung nvarchar(max),
@ThuTu int,
@SoLuongCauHoi int,
@MaPhanCha uniqueidentifier,
@MaSoPhan int,
@XoaTamPhan bit

WITH EXECUTE AS CALLER
AS

INSERT INTO 	[dbo].[Phan]
(
				[MaPhan],
				[MaMonHoc],
				[TenPhan],
				[NoiDung],
				[ThuTu],
				[SoLuongCauHoi],
				[MaPhanCha],
				[MaSoPhan],
				[XoaTamPhan]
)

VALUES
(
				@MaPhan,
				@MaMonHoc,
				@TenPhan,
				@NoiDung,
				@ThuTu,
				@SoLuongCauHoi,
				@MaPhanCha,
				@MaSoPhan,
				@XoaTamPhan

)


GO
/****** Object:  StoredProcedure [dbo].[Phan_Restore]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Phan_Restore]


@MaPhan uniqueidentifier

WITH EXECUTE AS CALLER
AS

UPDATE
	CauHoi
SET
	XoaTamCauHoi = 'False'

WHERE
	MaPhan IN (SELECT MaPhan
					FROM Phan
					WHERE MaPhan = @MaPhan
					and XoaTamPhan = 'True'
					)
	and XoaTamCauHoi = 'True';

UPDATE
	Phan
SET
	XoaTamPhan = 'False'
WHERE
	MaPhan = @MaPhan
	and XoaTamPhan = 'True';
GO
/****** Object:  StoredProcedure [dbo].[Phan_SelectAll]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Phan_SelectAll]

WITH EXECUTE AS CALLER
AS


SELECT
		[MaPhan],
		[MaMonHoc],
		[TenPhan],
		[NoiDung],
		[ThuTu],
		[SoLuongCauHoi],
		[MaPhanCha],
		[MaSoPhan],
		[XoaTamPhan]

FROM
		[dbo].[Phan]

GO
/****** Object:  StoredProcedure [dbo].[Phan_SelectAll_Deleted]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[Phan_SelectAll_Deleted]


WITH EXECUTE AS CALLER
AS


SELECT
		*
FROM
		[dbo].[Phan]
WHERE XoaTamPhan = 'True'
ORDER BY ThuTu, TenPhan
GO
/****** Object:  StoredProcedure [dbo].[Phan_SelectBy_MaDeThi]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Phan_SelectBy_MaDeThi]


@MaDeThi uniqueidentifier
WITH EXECUTE AS CALLER
AS


SELECT
		DISTINCT P.MaPhan, P.TenPhan, P.NoiDung, P.MaMonHoc, P.MaSoPhan, P.MaPhanCha
FROM
		[dbo].[Phan] P
		JOIN [dbo].[ChiTietDeThi] CTDT ON CTDT.MaPhan = P.MaPhan

WHERE
		CTDT.MaDeThi = @MaDeThi
		AND XoaTamPhan = 'False'
ORDER BY P.MaSoPhan







GO
/****** Object:  StoredProcedure [dbo].[Phan_SelectBy_MaMonHoc]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Phan_SelectBy_MaMonHoc]

@MaMonHoc uniqueidentifier
WITH EXECUTE AS CALLER
AS


SELECT
		*
FROM
		[dbo].[Phan]

WHERE
		[MaMonHoc] = @MaMonHoc
		AND XoaTamPhan = 'False'
ORDER BY MaSoPhan


GO
/****** Object:  StoredProcedure [dbo].[Phan_SelectBy_MaMonHoc_MaPhanCha]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Phan_SelectBy_MaMonHoc_MaPhanCha]


@MaMonHoc uniqueidentifier,
@MaPhanCha uniqueidentifier
WITH EXECUTE AS CALLER
AS


SELECT
		*

FROM
		[dbo].[Phan]

WHERE
		[MaMonHoc] = @MaMonHoc
	AND	[MaPhanCha] = @MaPhanCha

ORDER BY ThuTu, TenPhan
GO
/****** Object:  StoredProcedure [dbo].[Phan_SelectBy_MaMonHoc_MaSoPhan]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Phan_SelectBy_MaMonHoc_MaSoPhan]


@MaMonHoc uniqueidentifier,
@MaSoPhan int
WITH EXECUTE AS CALLER
AS


SELECT
		*

FROM
		[dbo].[Phan]

WHERE
		[MaMonHoc] = @MaMonHoc
	AND	[MaSoPhan] = @MaSoPhan

ORDER BY ThuTu, TenPhan
GO
/****** Object:  StoredProcedure [dbo].[Phan_SelectBy_MaPhanCha]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Phan_SelectBy_MaPhanCha]

@MaPhanCha uniqueidentifier
WITH EXECUTE AS CALLER
AS


SELECT
		*
FROM
		[dbo].[Phan]

WHERE
		[MaPhanCha] = @MaPhanCha
		and XoaTamPhan = 'False'
ORDER BY ThuTu, TenPhan

GO
/****** Object:  StoredProcedure [dbo].[Phan_SelectBy_MaSoPhan]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Phan_SelectBy_MaSoPhan]

@MaMonHoc uniqueidentifier,
@MaSoPhan int
WITH EXECUTE AS CALLER
AS


SELECT
		*
FROM
		[dbo].[Phan]

WHERE
		[MaMonHoc]	= @MaMonHoc
	AND	[MaSoPhan]	= @MaSoPhan
	AND [XoaTamPhan]		= 'False'

ORDER BY ThuTu, TenPhan
GO
/****** Object:  StoredProcedure [dbo].[Phan_SelectBy_MaSoPhan_CoMaPhanCha]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Phan_SelectBy_MaSoPhan_CoMaPhanCha]

@MaMonHoc uniqueidentifier,
@MaSoPhan int
WITH EXECUTE AS CALLER
AS


SELECT	p.*
FROM
		[dbo].[Phan] p

LEFT OUTER JOIN [dbo].[Phan] pp
	ON	pp.[MaPhanCha] = p.[MaPhan]
WHERE
	(pp.[MaMonHoc]	= @MaMonHoc
	AND	pp.[XoaTamPhan]	= @MaSoPhan
	AND pp.[XoaTamPhan]		= 'False')
OR (p.[MaMonHoc]	= @MaMonHoc
	AND	p.[MaSoPhan]	= @MaSoPhan
	AND p.[XoaTamPhan]		= 'False')
ORDER BY p.ThuTu, p.TenPhan
GO
/****** Object:  StoredProcedure [dbo].[Phan_SelectBy_MaSoPhan_MaSoMonHoc]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Phan_SelectBy_MaSoPhan_MaSoMonHoc]

@MaSoPhan int,
@MaSoMonHoc nvarchar(50)
WITH EXECUTE AS CALLER
AS


SELECT
		P.*
FROM
		[dbo].[Phan] P
		JOIN [dbo].[MonHoc] MH ON MH.MaMonHoc = P.MaMonHoc
WHERE
		[MaSoPhan] = @MaSoPhan
		AND P.XoaTamPhan = 'False'
		AND lower([MaSoMonHoc]) = lower(@MaSoMonHoc)
ORDER BY ThuTu, TenPhan

GO
/****** Object:  StoredProcedure [dbo].[Phan_SelectMax_MaSoPhan]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Phan_SelectMax_MaSoPhan]

@MaMonHoc uniqueidentifier
WITH EXECUTE AS CALLER
AS

DECLARE @Max int

SELECT	@Max = MAX([MaSoPhan])
FROM	[dbo].[Phan]
WHERE	[MaMonHoc] = @MaMonHoc

IF(@Max IS NULL) SELECT 0
ELSE SELECT @Max

GO
/****** Object:  StoredProcedure [dbo].[Phan_SelectOne]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Phan_SelectOne]

@MaPhan uniqueidentifier
WITH EXECUTE AS CALLER
AS


SELECT
		[MaPhan],
		[MaMonHoc],
		[TenPhan],
		[NoiDung],
		[ThuTu],
		[SoLuongCauHoi],
		[MaPhanCha],
		[MaSoPhan],
		[XoaTamPhan]

FROM
		[dbo].[Phan]

WHERE
		[MaPhan] = @MaPhan

GO
/****** Object:  StoredProcedure [dbo].[Phan_SelectOneByName]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[Phan_SelectOneByName]

@MaMonHoc uniqueidentifier,
@MaPhanCha uniqueidentifier,
@TenPhan nvarchar(250)
WITH EXECUTE AS CALLER
AS


SELECT	*
FROM	[dbo].[Phan]
WHERE	[MaMonHoc] = @MaMonHoc
	AND [MaPhanCha] = @MaPhanCha
	AND	Lower([TenPhan]) = Lower(@TenPhan)
GO
/****** Object:  StoredProcedure [dbo].[Phan_SelectPage]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[Phan_SelectPage]

@PageNumber 			int,
@PageSize 			int
WITH EXECUTE AS CALLER
AS

DECLARE @PageLowerBound int
DECLARE @PageUpperBound int


SET @PageLowerBound = (@PageSize * @PageNumber) - @PageSize
SET @PageUpperBound = @PageLowerBound + @PageSize + 1

/*
Note: temp tables use the server default for collation not the database default
so if adding character columns be sure and specify to use the database collation like this
to avoid collation errors:

CREATE TABLE #PageIndexForUsers
(
IndexID int IDENTITY (1, 1) NOT NULL,
UserName nvarchar(50) COLLATE DATABASE_DEFAULT,
LoginName nvarchar(50) COLLATE DATABASE_DEFAULT
)


*/

CREATE TABLE #PageIndex
(
	IndexID int IDENTITY (1, 1) NOT NULL,
MaPhan UniqueIdentifier
)

BEGIN

INSERT INTO #PageIndex (
MaPhan
)

SELECT
		[MaPhan]

FROM
		[dbo].[Phan]

-- WHERE

-- ORDER BY

END


SELECT
		t1.*

FROM
		[dbo].[Phan] t1

JOIN			#PageIndex t2
ON
		t1.[MaPhan] = t2.[MaPhan]

WHERE
		t2.IndexID > @PageLowerBound
		AND t2.IndexID < @PageUpperBound

ORDER BY t2.IndexID

DROP TABLE #PageIndex

GO
/****** Object:  StoredProcedure [dbo].[Phan_Update]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[Phan_Update]

@MaPhan uniqueidentifier,
@MaMonHoc uniqueidentifier,
@TenPhan nvarchar(250),
@NoiDung nvarchar(max),
@ThuTu int,
@SoLuongCauHoi int,
@MaPhanCha uniqueidentifier,
@MaSoPhan int,
@XoaTamPhan bit

WITH EXECUTE AS CALLER
AS

UPDATE 		[dbo].[Phan]

SET
			[MaMonHoc] = @MaMonHoc,
			[TenPhan] = @TenPhan,
			[NoiDung] = @NoiDung,
			[ThuTu] = @ThuTu,
			[SoLuongCauHoi] = @SoLuongCauHoi,
			[MaPhanCha] = @MaPhanCha,
			[MaSoPhan] = @MaSoPhan,
			[XoaTamPhan] = @XoaTamPhan

WHERE
			[MaPhan] = @MaPhan

GO
/****** Object:  StoredProcedure [dbo].[YeuCauRutTrich_Delete]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[YeuCauRutTrich_Delete]

@MaYeuCauDe uniqueidentifier
WITH EXECUTE AS CALLER
AS

DELETE FROM [dbo].[YeuCauRutTrich]
WHERE
	[MaYeuCauDe] = @MaYeuCauDe
GO
/****** Object:  StoredProcedure [dbo].[YeuCauRutTrich_GetCount]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[YeuCauRutTrich_GetCount]

WITH EXECUTE AS CALLER
AS

SELECT COUNT(*) FROM [dbo].[YeuCauRutTrich]

GO
/****** Object:  StoredProcedure [dbo].[YeuCauRutTrich_Insert]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[YeuCauRutTrich_Insert]

@MaYeuCauDe uniqueidentifier,
@HoTenGiaoVien nvarchar(50),
@NoiDungRutTrich nvarchar(max),
@NgayLay datetime

WITH EXECUTE AS CALLER
AS

INSERT INTO 	[dbo].[YeuCauRutTrich]
(
				[MaYeuCauDe],
				[HoTenGiaoVien],
				[NoiDungRutTrich],
				[NgayLay]
)

VALUES
(
				@MaYeuCauDe,
				@HoTenGiaoVien,
				@NoiDungRutTrich,
				@NgayLay

)


GO
/****** Object:  StoredProcedure [dbo].[YeuCauRutTrich_SelectAll]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[YeuCauRutTrich_SelectAll]

WITH EXECUTE AS CALLER
AS


SELECT
		[MaYeuCauDe],
		[HoTenGiaoVien],
		[NoiDungRutTrich],
		[NgayLay]

FROM
		[dbo].[YeuCauRutTrich]

GO
/****** Object:  StoredProcedure [dbo].[YeuCauRutTrich_SelectOne]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[YeuCauRutTrich_SelectOne]

@MaYeuCauDe uniqueidentifier
WITH EXECUTE AS CALLER
AS


SELECT
		[MaYeuCauDe],
		[HoTenGiaoVien],
		[NoiDungRutTrich],
		[NgayLay]

FROM
		[dbo].[YeuCauRutTrich]

WHERE
		[MaYeuCauDe] = @MaYeuCauDe

GO
/****** Object:  StoredProcedure [dbo].[YeuCauRutTrich_SelectPage]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[YeuCauRutTrich_SelectPage]

@PageNumber 			int,
@PageSize 			int
WITH EXECUTE AS CALLER
AS

DECLARE @PageLowerBound int
DECLARE @PageUpperBound int


SET @PageLowerBound = (@PageSize * @PageNumber) - @PageSize
SET @PageUpperBound = @PageLowerBound + @PageSize + 1

/*
Note: temp tables use the server default for collation not the database default
so if adding character columns be sure and specify to use the database collation like this
to avoid collation errors:

CREATE TABLE #PageIndexForUsers
(
IndexID int IDENTITY (1, 1) NOT NULL,
UserName nvarchar(50) COLLATE DATABASE_DEFAULT,
LoginName nvarchar(50) COLLATE DATABASE_DEFAULT
)


*/

CREATE TABLE #PageIndex
(
	IndexID int IDENTITY (1, 1) NOT NULL,
MaYeuCauDe UniqueIdentifier
)

BEGIN

INSERT INTO #PageIndex (
MaYeuCauDe
)

SELECT
		[MaYeuCauDe]

FROM
		[dbo].[YeuCauRutTrich]

-- WHERE

-- ORDER BY

END


SELECT
		t1.*

FROM
		[dbo].[YeuCauRutTrich] t1

JOIN			#PageIndex t2
ON
		t1.[MaYeuCauDe] = t2.[MaYeuCauDe]

WHERE
		t2.IndexID > @PageLowerBound
		AND t2.IndexID < @PageUpperBound

ORDER BY t2.IndexID

DROP TABLE #PageIndex

GO
/****** Object:  StoredProcedure [dbo].[YeuCauRutTrich_Update]    Script Date: 2/16/2025 7:35:54 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[YeuCauRutTrich_Update]


@MaYeuCauDe uniqueidentifier,
@HoTenGiaoVien nvarchar(50),
@NoiDungRutTrich nvarchar(max),
@NgayLay datetime

WITH EXECUTE AS CALLER
AS

UPDATE 		[dbo].[YeuCauRutTrich]

SET
			[HoTenGiaoVien] = @HoTenGiaoVien,
			[NoiDungRutTrich] = @NoiDungRutTrich,
			[NgayLay] = @NgayLay

WHERE
			[MaYeuCauDe] = @MaYeuCauDe

GO
/****** Object:  Table [dbo].[CLO]    Script Date: 2/16/2025 7:35:53 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[CLO](
	[MaCLO] [uniqueidentifier] NOT NULL,
	[TenCLO] [nvarchar](250) NOT NULL,
	[MoTa] [nvarchar](max) NULL,
	[ThuTu] [int] NOT NULL,
	[XoaTamCLO] [bit] NULL,
 CONSTRAINT [PK_CLO] PRIMARY KEY CLUSTERED
(
	[MaCLO] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

-- Thêm ràng buộc khóa ngoại cho CauHoi
ALTER TABLE [dbo].[CauHoi]  WITH CHECK ADD  CONSTRAINT [FK_CauHoi_CLO] FOREIGN KEY([MaCLO])
REFERENCES [dbo].[CLO] ([MaCLO])
ON UPDATE NO ACTION
ON DELETE NO ACTION
GO
ALTER TABLE [dbo].[CauHoi] CHECK CONSTRAINT [FK_CauHoi_CLO]
GO

-- Stored Procedures cho bảng CLO
CREATE PROCEDURE [dbo].[CLO_Insert]
    @TenCLO nvarchar(250),
    @MoTa nvarchar(max),
    @ThuTu int
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @MaCLO uniqueidentifier = NEWID()

    INSERT INTO [dbo].[CLO] ([MaCLO], [TenCLO], [MoTa], [ThuTu])
    VALUES (@MaCLO, @TenCLO, @MoTa, @ThuTu)

    SELECT @MaCLO AS MaCLO
END
GO

CREATE PROCEDURE [dbo].[CLO_Update]
    @MaCLO uniqueidentifier,
    @TenCLO nvarchar(250),
    @MoTa nvarchar(max),
    @ThuTu int
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE [dbo].[CLO]
    SET [TenCLO] = @TenCLO,
        [MoTa] = @MoTa,
        [ThuTu] = @ThuTu
    WHERE [MaCLO] = @MaCLO
END
GO

CREATE PROCEDURE [dbo].[CLO_Delete]
    @MaCLO uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM [dbo].[CLO]
    WHERE [MaCLO] = @MaCLO
END
GO

CREATE PROCEDURE [dbo].[CLO_SelectAll]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT [MaCLO], [TenCLO], [MoTa], [ThuTu], [XoaTamCLO]
    FROM [dbo].[CLO]
    ORDER BY [ThuTu]
END
GO

CREATE PROCEDURE [dbo].[CLO_SelectOne]
    @MaCLO uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    SELECT [MaCLO], [TenCLO], [MoTa], [ThuTu], [XoaTamCLO]
    FROM [dbo].[CLO]
    WHERE [MaCLO] = @MaCLO
END
GO

CREATE PROCEDURE [dbo].[CLO_GetCount]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT COUNT(*) AS TotalCount
    FROM [dbo].[CLO]
END
GO

CREATE PROCEDURE [dbo].[CLO_SelectPage]
    @PageIndex int,
    @PageSize int,
    @TotalRecords int OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT @TotalRecords = COUNT(*)
    FROM [dbo].[CLO]

    SELECT [MaCLO], [TenCLO], [MoTa], [ThuTu], [XoaTamCLO]
    FROM [dbo].[CLO]
    ORDER BY [ThuTu]
    OFFSET (@PageIndex - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY
END
GO

-- Stored Procedures để liên kết CLO với Câu hỏi
CREATE PROCEDURE [dbo].[CLO_AssignToQuestion]
    @MaCLO uniqueidentifier,
    @MaCauHoi uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE [dbo].[CauHoi]
    SET [MaCLO] = @MaCLO
    WHERE [MaCauHoi] = @MaCauHoi
END
GO

CREATE PROCEDURE [dbo].[CLO_GetQuestionsByCLO]
    @MaCLO uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    SELECT c.[MaCauHoi], c.[NoiDung], c.[CapDo], c.[SoCauHoiCon],
           cl.[TenCLO], cl.[MoTa] as CLO_MoTa
    FROM [dbo].[CauHoi] c
    INNER JOIN [dbo].[CLO] cl ON c.[MaCLO] = cl.[MaCLO]
    WHERE c.[MaCLO] = @MaCLO
    ORDER BY c.[MaSoCauHoi]
END
GO

CREATE PROCEDURE [dbo].[CLO_GetQuestionsNotAssigned]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT [MaCauHoi], [NoiDung], [CapDo], [SoCauHoiCon]
    FROM [dbo].[CauHoi]
    WHERE [MaCLO] IS NULL
    ORDER BY [MaSoCauHoi]
END
GO

CREATE PROCEDURE [dbo].[CLO_RemoveFromQuestion]
    @MaCauHoi uniqueidentifier
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE [dbo].[CauHoi]
    SET [MaCLO] = NULL
    WHERE [MaCauHoi] = @MaCauHoi
END
GO
