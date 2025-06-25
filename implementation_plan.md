# KẾ HOẠCH TRIỂN KHAI TÍCH HỢP HỆ THỐNG QUESTIONBANK VÀ EXAM

## 1. TỔNG QUAN

### 1.1. Mục tiêu
- Nâng cấp hệ thống QuestionBank để hỗ trợ tốt hơn việc đánh giá câu hỏi (độ khó, độ phân cách)
- Đồng bộ dữ liệu giữa hệ thống thi (Exam) và ngân hàng câu hỏi (QuestionBank)
- Cải thiện thuật toán rút trích đề thi dựa trên dữ liệu thực tế

### 1.2. Phạm vi
- Thay đổi cấu trúc cơ sở dữ liệu QuestionBank
- Xây dựng API để đồng bộ dữ liệu giữa hai hệ thống
- Triển khai các stored procedures và triggers
- Nâng cấp thuật toán rút trích đề thi

## 2. THAY ĐỔI CƠ SỞ DỮ LIỆU

### 2.1. QuestionBank (databasetable.sql)

#### 2.1.1. Thêm trường mới
```sql
-- Thêm trường độ khó thực tế vào bảng CauHoi
ALTER TABLE CauHoi
ADD DoKhoThucTe float NULL;

-- Thêm mối quan hệ giữa CLO và môn học (nếu chưa có)
ALTER TABLE CLO
ADD MaMonHoc uniqueidentifier NULL;

ALTER TABLE CLO
ADD CONSTRAINT FK_CLO_MonHoc FOREIGN KEY (MaMonHoc)
REFERENCES MonHoc(MaMonHoc);

-- Bổ sung trường cho Bloom's Taxonomy
ALTER TABLE CLO
ADD CapDoBloom smallint NULL;

-- Thêm trọng số cho CLO
ALTER TABLE CLO
ADD TrongSo float NULL DEFAULT 1.0;
```

#### 2.1.2. Bảng ánh xạ CLO (tùy chọn)
```sql
CREATE TABLE CLO_BloomMapping (
    MaMapping int IDENTITY(1,1) PRIMARY KEY,
    CLO_Level smallint NOT NULL,  -- CLO 1-5 hiện tại
    BloomLevel smallint NOT NULL, -- Cấp độ Bloom 1-6
    MoTa nvarchar(255)
);

-- Thêm dữ liệu ánh xạ
INSERT INTO CLO_BloomMapping (CLO_Level, BloomLevel, MoTa)
VALUES
(1, 1, N'Nhớ - Ghi nhớ thông tin'),
(1, 2, N'Hiểu - Diễn giải, giải thích'),
(2, 3, N'Áp dụng - Sử dụng kiến thức'),
(3, 4, N'Phân tích - Phân tách thông tin'),
(4, 5, N'Đánh giá - Phán đoán dựa trên tiêu chí'),
(5, 6, N'Sáng tạo - Tạo ra sản phẩm, ý tưởng mới');
```

### 2.2. Exam System (examtable.sql)

#### 2.2.1. Bảng lưu kết quả chi tiết (nếu chưa có)
```sql
-- Kiểm tra và đảm bảo bảng chi_tiet_bai_thi có đủ thông tin
ALTER TABLE chi_tiet_bai_thi
ADD DapAnDung bit NOT NULL DEFAULT 0;

-- Thêm cột để đánh dấu top/bottom 27% (có thể thêm view thay vì trường vật lý)
ALTER TABLE chi_tiet_bai_thi
ADD InTopGroup bit NULL;

ALTER TABLE chi_tiet_bai_thi
ADD InBottomGroup bit NULL;
```

## 3. STORED PROCEDURES VÀ TRIGGERS

### 3.1. QuestionBank

#### 3.1.1. Cập nhật độ khó thực tế
```sql
CREATE PROCEDURE UpdateRealDifficulty
AS
BEGIN
    UPDATE CauHoi
    SET DoKhoThucTe = CASE
        WHEN SoLanDuocThi >= 5 THEN -- Ngưỡng thực tế hơn, chỉ cần 5 lần thi
            CAST(SoLanDung AS float) / CAST(SoLanDuocThi AS float)
        ELSE NULL -- Chưa đủ dữ liệu
    END
    WHERE SoLanDuocThi > 0;
END
```

#### 3.1.2. Trigger tự động cập nhật
```sql
CREATE TRIGGER TR_UpdateRealDifficulty
ON CauHoi
AFTER UPDATE
AS
BEGIN
    IF UPDATE(SoLanDung) OR UPDATE(SoLanDuocThi)
    BEGIN
        UPDATE c
        SET c.DoKhoThucTe = CASE
            WHEN c.SoLanDuocThi >= 5 THEN -- Ngưỡng 5 lần thi
                CAST(c.SoLanDung AS float) / CAST(c.SoLanDuocThi AS float)
            ELSE c.DoKhoThucTe -- Giữ nguyên nếu chưa đủ dữ liệu
        END
        FROM CauHoi c
        INNER JOIN inserted i ON c.MaCauHoi = i.MaCauHoi
        WHERE c.SoLanDuocThi > 0;
    END
END
```

#### 3.1.3. Tính toán độ phân cách
```sql
CREATE PROCEDURE CalculateDiscriminationIndex
AS
BEGIN
    -- Đánh dấu và cập nhật độ phân cách câu hỏi từ dữ liệu đã nhập
    UPDATE CauHoi
    SET DoPhanCachCauHoi = D.DiscIndex
    FROM CauHoi C
    JOIN (
        SELECT
            MaCauHoi,
            (TopCorrectRate - BottomCorrectRate) AS DiscIndex
        FROM QuestionDiscriminationStats
    ) D ON C.MaCauHoi = D.MaCauHoi;
END
```

#### 3.1.4. Thuật toán rút trích đề thi cải tiến
```sql
CREATE PROCEDURE ExtractExamWithRealDifficulty
    @MaMonHoc uniqueidentifier,
    @TenDeThi nvarchar(250),
    @SoCauDe int,
    @SoCauTB int,
    @SoCauKho int,
    @NguoiTao nvarchar(255),
    @MaCLOList varchar(max) = NULL
AS
BEGIN
    -- Tạo đề thi mới
    DECLARE @MaDeThi uniqueidentifier = NEWID();

    INSERT INTO DeThi (MaDeThi, MaMonHoc, TenDeThi, NgayTao, NguoiTao, SoCauHoi)
    VALUES (@MaDeThi, @MaMonHoc, @TenDeThi, GETDATE(), @NguoiTao, @SoCauDe + @SoCauTB + @SoCauKho);

    -- Chọn câu hỏi dễ (ưu tiên sử dụng DoKhoThucTe)
    INSERT INTO ChiTietDeThi (MaDeThi, MaPhan, MaCauHoi, ThuTu)
    SELECT TOP (@SoCauDe)
        @MaDeThi,
        C.MaPhan,
        C.MaCauHoi,
        ROW_NUMBER() OVER (ORDER BY NEWID())
    FROM CauHoi C
    WHERE C.MaPhan IN (SELECT MaPhan FROM Phan WHERE MaMonHoc = @MaMonHoc)
        AND C.XoaTamCauHoi = 0
        AND C.SoCauHoiCon = 0 -- Không phải câu hỏi nhóm
        AND (@MaCLOList IS NULL OR EXISTS (
            SELECT 1
            FROM STRING_SPLIT(@MaCLOList, ',') S
            WHERE CAST(S.value AS uniqueidentifier) = C.MaCLO
        ))
        AND (
            -- Ưu tiên sử dụng DoKhoThucTe nếu có (>=5 lần thi)
            (C.DoKhoThucTe IS NOT NULL AND C.DoKhoThucTe >= 0.7)
            OR
            -- Xem xét cả câu hỏi có số lần thi thấp (1-4 lần)
            (C.SoLanDuocThi BETWEEN 1 AND 4 AND
             CAST(C.SoLanDung AS float) / CAST(C.SoLanDuocThi AS float) >= 0.7)
            OR
            -- Nếu không có dữ liệu thực tế, dùng CapDo
            (C.SoLanDuocThi = 0 AND C.CapDo = 1)
        )
    ORDER BY
        -- Ưu tiên câu hỏi có dữ liệu thực tế
        CASE WHEN C.DoKhoThucTe IS NOT NULL THEN 1
             WHEN C.SoLanDuocThi > 0 THEN 2
             ELSE 3
        END,
        NEWID(); -- Sau đó trộn ngẫu nhiên

    -- Tương tự cho câu hỏi trung bình - chỉ lấy ví dụ
    INSERT INTO ChiTietDeThi (MaDeThi, MaPhan, MaCauHoi, ThuTu)
    SELECT TOP (@SoCauTB)
        @MaDeThi,
        C.MaPhan,
        C.MaCauHoi,
        ROW_NUMBER() OVER (ORDER BY NEWID()) + @SoCauDe
    FROM CauHoi C
    WHERE C.MaPhan IN (SELECT MaPhan FROM Phan WHERE MaMonHoc = @MaMonHoc)
        AND C.XoaTamCauHoi = 0
        AND C.SoCauHoiCon = 0
        AND C.MaCauHoi NOT IN (SELECT MaCauHoi FROM ChiTietDeThi WHERE MaDeThi = @MaDeThi)
        AND (@MaCLOList IS NULL OR EXISTS (
            SELECT 1
            FROM STRING_SPLIT(@MaCLOList, ',') S
            WHERE CAST(S.value AS uniqueidentifier) = C.MaCLO
        ))
        AND (
            -- Ưu tiên sử dụng DoKhoThucTe nếu có
            (C.DoKhoThucTe IS NOT NULL AND C.DoKhoThucTe BETWEEN 0.3 AND 0.7)
            OR
            -- Xem xét cả câu hỏi có số lần thi thấp
            (C.SoLanDuocThi BETWEEN 1 AND 4 AND
             CAST(C.SoLanDung AS float) / CAST(C.SoLanDuocThi AS float) BETWEEN 0.3 AND 0.7)
            OR
            -- Nếu không có dữ liệu thực tế, dùng CapDo
            (C.SoLanDuocThi = 0 AND C.CapDo = 2)
        )
    ORDER BY
        CASE WHEN C.DoKhoThucTe IS NOT NULL THEN 1
             WHEN C.SoLanDuocThi > 0 THEN 2
             ELSE 3
        END,
        NEWID();

    -- Tương tự cho câu hỏi khó
    -- ...

    -- Xử lý câu hỏi nhóm
    -- ...

    RETURN @MaDeThi;
END
```

#### 3.1.5. Xử lý dữ liệu từ hệ thống thi
```sql
CREATE PROCEDURE UpdateQuestionStatsFromExam
    @QuestionStatsJson NVARCHAR(MAX)
AS
BEGIN
    -- Tạo bảng tạm để chứa dữ liệu JSON
    DECLARE @QuestionStats TABLE (
        MaCauHoi UNIQUEIDENTIFIER,
        SoLanLam INT,
        SoLanDung INT,
        Top27Correct INT,
        Top27Total INT,
        Bottom27Correct INT,
        Bottom27Total INT
    );

    -- Parse JSON và đưa vào bảng tạm
    INSERT INTO @QuestionStats
    SELECT
        JSON_VALUE(q.value, '$.ma_cau_hoi'),
        JSON_VALUE(q.value, '$.so_lan_lam'),
        JSON_VALUE(q.value, '$.so_lan_dung'),
        JSON_VALUE(q.value, '$.top_27_correct'),
        JSON_VALUE(q.value, '$.top_27_total'),
        JSON_VALUE(q.value, '$.bottom_27_correct'),
        JSON_VALUE(q.value, '$.bottom_27_total')
    FROM OPENJSON(@QuestionStatsJson, '$.exam_results[0].question_stats') AS q;

    -- Cập nhật SoLanDuocThi và SoLanDung
    UPDATE CH
    SET
        CH.SoLanDuocThi = ISNULL(CH.SoLanDuocThi, 0) + QS.SoLanLam,
        CH.SoLanDung = ISNULL(CH.SoLanDung, 0) + QS.SoLanDung
    FROM CauHoi CH
    JOIN @QuestionStats QS ON CH.MaCauHoi = QS.MaCauHoi;

    -- Cập nhật DoPhanCachCauHoi
    UPDATE CH
    SET
        CH.DoPhanCachCauHoi =
            CASE
                WHEN QS.Top27Total > 0 AND QS.Bottom27Total > 0
                THEN (CAST(QS.Top27Correct AS FLOAT) / CAST(QS.Top27Total AS FLOAT)) -
                     (CAST(QS.Bottom27Correct AS FLOAT) / CAST(QS.Bottom27Total AS FLOAT))
                ELSE CH.DoPhanCachCauHoi
            END
    FROM CauHoi CH
    JOIN @QuestionStats QS ON CH.MaCauHoi = QS.MaCauHoi;

    -- Tự động cập nhật DoKhoThucTe qua trigger
END
```

### 3.2. Exam System

#### 3.2.1. Tính toán top/bottom 27%
```sql
CREATE PROCEDURE CalculateTopBottomGroups
    @MaCaThi int
AS
BEGIN
    -- Tạo bảng tạm lưu kết quả của sinh viên
    DECLARE @StudentResults TABLE (
        ma_chi_tiet_ca_thi int,
        ma_sinh_vien bigint,
        diem float,
        rank_order int
    );

    -- Lấy kết quả và xếp hạng
    INSERT INTO @StudentResults
    SELECT
        ma_chi_tiet_ca_thi,
        ma_sinh_vien,
        diem,
        ROW_NUMBER() OVER (ORDER BY diem DESC) as rank_order
    FROM chi_tiet_ca_thi
    WHERE ma_ca_thi = @MaCaThi AND da_hoan_thanh = 1;

    -- Tính tổng số sinh viên
    DECLARE @TotalStudents int = (SELECT COUNT(*) FROM @StudentResults);
    DECLARE @TopCount int = ROUND(@TotalStudents * 0.27, 0);
    DECLARE @BottomCount int = @TopCount;

    -- Đánh dấu top 27%
    UPDATE chi_tiet_ca_thi
    SET InTopGroup = 1
    FROM chi_tiet_ca_thi ct
    JOIN @StudentResults sr ON ct.ma_chi_tiet_ca_thi = sr.ma_chi_tiet_ca_thi
    WHERE sr.rank_order <= @TopCount;

    -- Đánh dấu bottom 27%
    UPDATE chi_tiet_ca_thi
    SET InBottomGroup = 1
    FROM chi_tiet_ca_thi ct
    JOIN @StudentResults sr ON ct.ma_chi_tiet_ca_thi = sr.ma_chi_tiet_ca_thi
    WHERE sr.rank_order > (@TotalStudents - @BottomCount);
END
```

#### 3.2.2. Xuất thống kê cho đồng bộ
```sql
CREATE PROCEDURE ExportQuestionStats
    @MaCaThi int
AS
BEGIN
    SELECT
        ch.MaCauHoi as ma_cau_hoi,
        COUNT(ctbt.ma_chi_tiet_bai_thi) as so_lan_lam,
        SUM(CASE WHEN ctbt.DapAnDung = 1 THEN 1 ELSE 0 END) as so_lan_dung,
        SUM(CASE WHEN ctct.InTopGroup = 1 AND ctbt.DapAnDung = 1 THEN 1 ELSE 0 END) as top_27_correct,
        SUM(CASE WHEN ctct.InTopGroup = 1 THEN 1 ELSE 0 END) as top_27_total,
        SUM(CASE WHEN ctct.InBottomGroup = 1 AND ctbt.DapAnDung = 1 THEN 1 ELSE 0 END) as bottom_27_correct,
        SUM(CASE WHEN ctct.InBottomGroup = 1 THEN 1 ELSE 0 END) as bottom_27_total
    FROM chi_tiet_bai_thi ctbt
    JOIN chi_tiet_ca_thi ctct ON ctbt.ma_chi_tiet_ca_thi = ctct.ma_chi_tiet_ca_thi
    JOIN CauHoi ch ON ctbt.MaCauHoi = ch.MaCauHoi
    WHERE ctct.ma_ca_thi = @MaCaThi AND ctct.da_hoan_thanh = 1
    GROUP BY ch.MaCauHoi
    ORDER BY ch.MaCauHoi;
END
```

## 4. API ENDPOINTS

### 4.1. QuestionBank (NestJS)

#### 4.1.1. Import thống kê câu hỏi
```typescript
// question-stats.controller.ts
@Controller('api/question-stats')
export class QuestionStatsController {
  constructor(private readonly questionStatsService: QuestionStatsService) {}

  @Post('import')
  async importStats(@Body() statsData: any) {
    return this.questionStatsService.updateStatsFromExam(statsData);
  }

  @Get('difficulty')
  async getQuestionDifficulty() {
    return this.questionStatsService.getQuestionDifficultyStats();
  }

  @Get('discrimination')
  async getQuestionDiscrimination() {
    return this.questionStatsService.getQuestionDiscriminationStats();
  }
}

// question-stats.service.ts
@Injectable()
export class QuestionStatsService {
  constructor(
    @InjectRepository(CauHoi)
    private cauhoiRepository: Repository<CauHoi>,
    private dataSource: DataSource,
  ) {}

  async updateStatsFromExam(statsData: any) {
    // Chuẩn bị dữ liệu JSON
    const jsonString = JSON.stringify(statsData);

    // Gọi stored procedure
    await this.dataSource.query(
      `EXEC UpdateQuestionStatsFromExam @QuestionStatsJson = @json`,
      { json: jsonString }
    );

    return { success: true, message: 'Đã cập nhật thống kê câu hỏi' };
  }

  // Các phương thức khác...
}
```

#### 4.1.2. Rút trích đề thi
```typescript
// de-thi.controller.ts
@Controller('api/de-thi')
export class DeThiController {
  constructor(private readonly deThiService: DeThiService) {}

  @Post('extract')
  async extractExam(@Body() extractParams: ExtractExamDto) {
    return this.deThiService.extractExamWithRealDifficulty(extractParams);
  }

  // API khác...
}

// de-thi.service.ts
@Injectable()
export class DeThiService {
  constructor(private dataSource: DataSource) {}

  async extractExamWithRealDifficulty(params: ExtractExamDto) {
    const result = await this.dataSource.query(
      `EXEC ExtractExamWithRealDifficulty
       @MaMonHoc = @maMonHoc,
       @TenDeThi = @tenDeThi,
       @SoCauDe = @soCauDe,
       @SoCauTB = @soCauTB,
       @SoCauKho = @soCauKho,
       @NguoiTao = @nguoiTao,
       @MaCLOList = @maCLOList`,
      {
        maMonHoc: params.maMonHoc,
        tenDeThi: params.tenDeThi,
        soCauDe: params.soCauDe,
        soCauTB: params.soCauTB,
        soCauKho: params.soCauKho,
        nguoiTao: params.nguoiTao,
        maCLOList: params.maCLOList
      }
    );

    return {
      success: true,
      message: 'Đã rút trích đề thi thành công',
      data: result[0]
    };
  }
}
```

### 4.2. Exam System (NestJS)

#### 4.2.1. Export thống kê câu hỏi
```typescript
// exam-results.controller.ts
@Controller('api/exam-results')
export class ExamResultsController {
  constructor(private readonly examResultsService: ExamResultsService) {}

  @Post('export')
  async exportStats(@Body() exportParams: ExportStatsDto) {
    return this.examResultsService.exportQuestionStats(exportParams.maCaThi);
  }

  @Post('sync-to-question-bank')
  async syncToQuestionBank(@Body() syncParams: SyncToQuestionBankDto) {
    return this.examResultsService.syncStatsToQuestionBank(syncParams.maCaThi);
  }
}

// exam-results.service.ts
@Injectable()
export class ExamResultsService {
  constructor(
    private dataSource: DataSource,
    private httpService: HttpService,
  ) {}

  async exportQuestionStats(maCaThi: number) {
    // Đảm bảo đã tính toán top/bottom groups
    await this.dataSource.query(
      `EXEC CalculateTopBottomGroups @MaCaThi = @maCaThi`,
      { maCaThi }
    );

    // Lấy thống kê
    const stats = await this.dataSource.query(
      `EXEC ExportQuestionStats @MaCaThi = @maCaThi`,
      { maCaThi }
    );

    return {
      exam_results: [{
        ma_ca_thi: maCaThi,
        ngay_thi: new Date(),
        question_stats: stats
      }]
    };
  }

  async syncStatsToQuestionBank(maCaThi: number) {
    // Lấy thống kê
    const statsData = await this.exportQuestionStats(maCaThi);

    // Gửi đến QuestionBank API
    try {
      const response = await this.httpService.post(
        `${process.env.QUESTION_BANK_API_URL}/api/question-stats/import`,
        statsData
      ).toPromise();

      return {
        success: true,
        message: 'Đã đồng bộ thống kê câu hỏi với ngân hàng câu hỏi',
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        message: 'Lỗi khi đồng bộ với ngân hàng câu hỏi',
        error: error.message
      };
    }
  }
}
```

## 5. QUY TRÌNH ĐỒNG BỘ DỮ LIỆU

### 5.1. Từ Exam đến QuestionBank

#### 5.1.1. Quy trình tự động
1. Khi kết thúc ca thi, hệ thống Exam tự động chạy `CalculateTopBottomGroups`
2. Hệ thống Exam gọi API `syncStatsToQuestionBank` để đồng bộ
3. API QuestionBank nhận dữ liệu và cập nhật thông qua `UpdateQuestionStatsFromExam`
4. Trigger tự động cập nhật `DoKhoThucTe`

#### 5.1.2. Quy trình thủ công
1. Admin truy cập giao diện quản lý ca thi
2. Chọn ca thi và nhấn nút "Đồng bộ với ngân hàng câu hỏi"
3. Hệ thống thực hiện các bước tương tự như quy trình tự động
4. Hiển thị kết quả đồng bộ

### 5.2. Từ QuestionBank đến Exam

#### 5.2.1. Xuất đề thi
1. QuestionBank sử dụng thông tin `DoKhoThucTe` và `DoPhanCachCauHoi` để rút trích đề thi
2. Đề thi được xuất ra file Word/PDF
3. File được gửi đến hệ thống Exam
4. Exam import đề thi và thiết lập ca thi

## 6. GIAO DIỆN NGƯỜI DÙNG

### 6.1. QuestionBank

#### 6.1.1. Quản lý câu hỏi
- Hiển thị độ khó thực tế và độ phân cách
- Màu sắc trực quan (đỏ: khó, vàng: trung bình, xanh: dễ)
- Biểu đồ thống kê

#### 6.1.2. Rút trích đề thi
- Form với các tùy chọn:
  - Môn học
  - Tên đề thi
  - Số lượng câu hỏi theo độ khó
  - CLO cần đánh giá
  - Tùy chọn sử dụng độ khó thực tế hoặc cấp độ ban đầu

### 6.2. Exam System

#### 6.2.1. Quản lý ca thi
- Nút "Tính toán thống kê"
- Nút "Đồng bộ với ngân hàng câu hỏi"
- Hiển thị trạng thái đồng bộ

## 7. LỊCH TRÌNH TRIỂN KHAI

### 7.1. Giai đoạn 1: Chuẩn bị (1-2 tuần)
- Cập nhật cấu trúc cơ sở dữ liệu
- Viết các stored procedures và triggers
- Thiết kế API endpoints

### 7.2. Giai đoạn 2: Triển khai backend (2-3 tuần)
- Phát triển các API trong NestJS
- Viết unit tests
- Tích hợp với cơ sở dữ liệu

### 7.3. Giai đoạn 3: Triển khai frontend (2-3 tuần)
- Phát triển giao diện quản lý câu hỏi
- Phát triển giao diện rút trích đề thi
- Phát triển giao diện đồng bộ

### 7.4. Giai đoạn 4: Kiểm thử và triển khai (1-2 tuần)
- Kiểm thử tích hợp
- Sửa lỗi
- Triển khai hệ thống

## 8. KIỂM THỬ

### 8.1. Kiểm thử đơn vị
- Kiểm thử các stored procedures
- Kiểm thử các API endpoints
- Kiểm thử các services

### 8.2. Kiểm thử tích hợp
- Kiểm thử quy trình đồng bộ end-to-end
- Kiểm thử rút trích đề thi
- Kiểm thử xuất đề thi

### 8.3. Kiểm thử hệ thống
- Kiểm thử hiệu năng
- Kiểm thử bảo mật
- Kiểm thử khả năng mở rộng

## 9. TÀI LIỆU

### 9.1. Tài liệu kỹ thuật
- Mô tả API
- Mô tả cơ sở dữ liệu
- Mô tả thuật toán

### 9.2. Tài liệu người dùng
- Hướng dẫn sử dụng QuestionBank
- Hướng dẫn sử dụng Exam System
- Hướng dẫn đồng bộ dữ liệu

## 10. PHÂN CÔNG CÔNG VIỆC

### 10.1. QuestionBank team
- Cập nhật cấu trúc cơ sở dữ liệu
- Phát triển các stored procedures
- Phát triển API endpoints
- Phát triển giao diện người dùng

### 10.2. Exam team
- Cập nhật cấu trúc cơ sở dữ liệu
- Phát triển các stored procedures cho thống kê
- Phát triển API endpoints đồng bộ
- Phát triển giao diện người dùng

## 11. LIÊN HỆ VÀ HỖ TRỢ

- **QuestionBank team**: [email]
- **Exam team**: [email]
- **Project Manager**: [email]

## 12. BỔ SUNG TÍNH NĂNG NÂNG CAO

### 12.1. Độ khó động (Dynamic Difficulty)

#### 12.1.1. Mô tả
Độ khó động kết hợp cả dữ liệu thống kê và phân tích nội dung câu hỏi để đánh giá độ khó chính xác hơn.

#### 12.1.2. Công thức
```
Độ khó động = (1 - SoLanDung/SoLanDuocThi) * 0.6 + DoPhucTapNoiDung * 0.4
```
- Thành phần thống kê: `(1 - SoLanDung/SoLanDuocThi)` - Độ khó thực tế từ kết quả thi
- Thành phần nội dung: `DoPhucTapNoiDung` - Phân tích độ phức tạp của nội dung câu hỏi

#### 12.1.3. Triển khai
```python
class DifficultyService:
    def calculate_actual_difficulty(self, question_id):
        # Tính độ khó thực tế: SoLanDung/SoLanDuocThi
        pass

    def calculate_content_complexity(self, question_content):
        # Tính độ phức tạp nội dung dựa trên:
        # - Độ dài câu hỏi
        # - Số lượng từ khóa chuyên ngành
        # - Độ phức tạp câu/cụm từ
        # - Độ phức tạp của công thức/biểu đồ (nếu có)
        pass

    def calculate_dynamic_difficulty(self, question_id):
        actual_diff = self.calculate_actual_difficulty(question_id)
        question = self.get_question(question_id)
        content_complexity = self.calculate_content_complexity(question.content)

        # Độ khó động = (1-actual_diff)*0.6 + content_complexity*0.4
        return (1 - actual_diff) * 0.6 + content_complexity * 0.4
```

#### 12.1.4. Thay đổi cơ sở dữ liệu
```sql
-- Thêm trường độ phức tạp nội dung và độ khó động
ALTER TABLE CauHoi
ADD DoPhucTapNoiDung float NULL;

ALTER TABLE CauHoi
ADD DoKhoDong float NULL;
```

### 12.2. Độ phân cách nâng cao

#### 12.2.1. Phương pháp 27%
Đã được triển khai trong kế hoạch hiện tại, tính toán dựa trên 27% sinh viên điểm cao và 27% sinh viên điểm thấp.

#### 12.2.2. Phương pháp Point-Biserial
Phương pháp này tính toán hệ số tương quan giữa điểm của câu hỏi và điểm tổng, cung cấp độ chính xác thống kê cao hơn.

```python
def calculate_point_biserial(self, question_id):
    # Lấy dữ liệu về câu hỏi và kết quả thi
    results = self.get_exam_results_for_question(question_id)

    # Tính điểm trung bình của nhóm trả lời đúng
    correct_scores = [r.total_score for r in results if r.is_correct]
    incorrect_scores = [r.total_score for r in results if not r.is_correct]

    if not correct_scores or not incorrect_scores:
        return None

    mean_correct = sum(correct_scores) / len(correct_scores)
    mean_incorrect = sum(incorrect_scores) / len(incorrect_scores)

    # Tính độ lệch chuẩn của điểm tổng
    all_scores = correct_scores + incorrect_scores
    std_dev = self.calculate_std_dev(all_scores)

    # Tính tỷ lệ trả lời đúng
    p = len(correct_scores) / len(all_scores)
    q = 1 - p

    # Công thức Point-Biserial
    rpb = ((mean_correct - mean_incorrect) / std_dev) * math.sqrt(p * q)

    return rpb
```

#### 12.2.3. Kết hợp hai phương pháp
```python
def update_discrimination_index(self, question_id):
    # Tính theo phương pháp 27%
    disc_27 = self.calculate_27_percent_method(question_id)

    # Tính theo Point-Biserial
    disc_pb = self.calculate_point_biserial(question_id)

    # Chọn phương pháp tốt nhất hoặc kết hợp
    if disc_pb is not None and len(self.get_exam_results_for_question(question_id)) >= 30:
        # Nếu đủ dữ liệu, ưu tiên Point-Biserial
        discrimination = disc_pb
    else:
        # Ngược lại dùng phương pháp 27%
        discrimination = disc_27

    # Cập nhật vào database
    self.update_discrimination_value(question_id, discrimination)

    return discrimination
```

### 12.3. Thuật toán rút trích thông minh

#### 12.3.1. Mô tả
Thuật toán rút trích thông minh kết hợp nhiều yếu tố (CLO, độ khó, độ phân cách) với trọng số linh hoạt để chọn câu hỏi tối ưu nhất.

#### 12.3.2. Triển khai
```python
class ExamExtractionService:
    def __init__(self, w1=0.4, w2=0.3, w3=0.3):
        self.w1 = w1  # Trọng số CLO
        self.w2 = w2  # Trọng số Độ khó
        self.w3 = w3  # Trọng số Độ phân cách

    def calculate_question_weight(self, question, target_clo, target_difficulty):
        # Tính trọng số câu hỏi
        clo_match = 1 if question.clo_id == target_clo else 0
        difficulty_match = 1 - abs(question.difficulty - target_difficulty)
        discrimination = question.discrimination_index or 0

        return self.w1*clo_match + self.w2*difficulty_match + self.w3*discrimination

    def extract_exam(self, matrix_requirements):
        # matrix_requirements: ma trận yêu cầu [CLO, độ khó, số lượng]
        selected_questions = []

        for req in matrix_requirements:
            target_clo = req.clo_id
            target_difficulty = req.difficulty_level
            count = req.question_count

            # Lấy tất cả câu hỏi phù hợp
            available_questions = self.get_questions_by_subject(req.subject_id)

            # Tính trọng số cho mỗi câu hỏi
            weighted_questions = []
            for q in available_questions:
                if q.id not in [sq.id for sq in selected_questions]:  # Chưa được chọn
                    weight = self.calculate_question_weight(q, target_clo, target_difficulty)
                    weighted_questions.append((q, weight))

            # Sắp xếp theo trọng số giảm dần
            weighted_questions.sort(key=lambda x: x[1], reverse=True)

            # Chọn số lượng câu hỏi cần thiết
            for i in range(min(count, len(weighted_questions))):
                selected_questions.append(weighted_questions[i][0])

        return selected_questions
```

#### 12.3.3. Stored Procedure tương ứng
```sql
CREATE PROCEDURE ExtractExamWithWeightedAlgorithm
    @MaMonHoc uniqueidentifier,
    @TenDeThi nvarchar(250),
    @MatrixRequirements nvarchar(max),  -- JSON format
    @NguoiTao nvarchar(255)
AS
BEGIN
    -- Tạo đề thi mới
    DECLARE @MaDeThi uniqueidentifier = NEWID();

    -- Parse matrix từ JSON
    DECLARE @Matrix TABLE (
        CLO_ID uniqueidentifier,
        CapDo float,
        SoLuong int
    );

    INSERT INTO @Matrix
    SELECT
        JSON_VALUE(item.value, '$.clo_id'),
        JSON_VALUE(item.value, '$.cap_do'),
        JSON_VALUE(item.value, '$.so_luong')
    FROM OPENJSON(@MatrixRequirements) AS item;

    -- Tạo bảng tạm lưu câu hỏi có trọng số
    DECLARE @WeightedQuestions TABLE (
        MaCauHoi uniqueidentifier,
        MaPhan uniqueidentifier,
        CLO_ID uniqueidentifier,
        CapDo float,
        DoPhanCach float,
        TrongSo float
    );

    -- Tính trọng số cho từng nhóm yêu cầu
    DECLARE @W1 float = 0.4; -- Trọng số CLO
    DECLARE @W2 float = 0.3; -- Trọng số độ khó
    DECLARE @W3 float = 0.3; -- Trọng số độ phân cách

    -- Tiến hành rút trích cho từng nhóm
    DECLARE @CLO_ID uniqueidentifier;
    DECLARE @CapDo float;
    DECLARE @SoLuong int;
    DECLARE @ThucHien int = 0;

    -- Tạo đề thi
    INSERT INTO DeThi (MaDeThi, MaMonHoc, TenDeThi, NgayTao, NguoiTao)
    VALUES (@MaDeThi, @MaMonHoc, @TenDeThi, GETDATE(), @NguoiTao);

    -- Xử lý từng yêu cầu trong ma trận
    DECLARE matrix_cursor CURSOR FOR SELECT CLO_ID, CapDo, SoLuong FROM @Matrix;
    OPEN matrix_cursor;
    FETCH NEXT FROM matrix_cursor INTO @CLO_ID, @CapDo, @SoLuong;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Xóa bảng tạm để tính toán cho nhóm mới
        DELETE FROM @WeightedQuestions;

        -- Tính trọng số cho tất cả câu hỏi còn lại
        INSERT INTO @WeightedQuestions
        SELECT
            C.MaCauHoi,
            C.MaPhan,
            C.MaCLO,
            ISNULL(C.DoKhoThucTe, CAST(C.CapDo AS float)/3),
            ISNULL(C.DoPhanCachCauHoi, 0),
            -- Công thức tính trọng số
            @W1 * CASE WHEN C.MaCLO = @CLO_ID THEN 1 ELSE 0 END +
            @W2 * (1 - ABS(ISNULL(C.DoKhoThucTe, CAST(C.CapDo AS float)/3) - @CapDo)) +
            @W3 * ISNULL(C.DoPhanCachCauHoi, 0)
        FROM CauHoi C
        WHERE C.MaPhan IN (SELECT MaPhan FROM Phan WHERE MaMonHoc = @MaMonHoc)
            AND C.XoaTamCauHoi = 0
            AND C.SoCauHoiCon = 0
            AND C.MaCauHoi NOT IN (SELECT MaCauHoi FROM ChiTietDeThi WHERE MaDeThi = @MaDeThi);

        -- Chọn câu hỏi theo trọng số
        INSERT INTO ChiTietDeThi (MaDeThi, MaPhan, MaCauHoi, ThuTu)
        SELECT TOP (@SoLuong)
            @MaDeThi,
            W.MaPhan,
            W.MaCauHoi,
            ROW_NUMBER() OVER (ORDER BY W.TrongSo DESC) + @ThucHien
        FROM @WeightedQuestions W
        ORDER BY W.TrongSo DESC;

        -- Cập nhật số câu hỏi đã thực hiện
        SET @ThucHien = @ThucHien + @SoLuong;

        FETCH NEXT FROM matrix_cursor INTO @CLO_ID, @CapDo, @SoLuong;
    END

    CLOSE matrix_cursor;
    DEALLOCATE matrix_cursor;

    -- Cập nhật tổng số câu hỏi
    UPDATE DeThi
    SET SoCauHoi = @ThucHien
    WHERE MaDeThi = @MaDeThi;

    RETURN @MaDeThi;
END
```

### 12.4. Scripts tự động hóa và phân tích

#### 12.4.1. Script cập nhật độ khó và độ phân cách
```python
# scripts/update_question_metrics.py
import sys
sys.path.append('../backend')

from services.difficulty_service import DifficultyService
from services.discrimination_service import DiscriminationService

def update_all_questions():
    # Cập nhật độ khó và độ phân cách cho tất cả câu hỏi
    difficulty_service = DifficultyService()
    discrimination_service = DiscriminationService()

    # Lấy danh sách câu hỏi cần cập nhật (có dữ liệu thi mới)
    questions = difficulty_service.get_questions_with_new_exam_data()

    for question in questions:
        # Cập nhật độ khó thực tế
        difficulty_service.calculate_actual_difficulty(question.id)

        # Cập nhật độ phức tạp nội dung (chỉ làm khi nội dung thay đổi)
        if question.content_updated:
            difficulty_service.calculate_content_complexity(question.content)

        # Cập nhật độ khó động
        difficulty_service.calculate_dynamic_difficulty(question.id)

        # Cập nhật độ phân cách
        discrimination_service.update_discrimination_index(question.id)

    print(f"Đã cập nhật {len(questions)} câu hỏi")

if __name__ == "__main__":
    update_all_questions()
```

#### 12.4.2. Script phân tích ngân hàng câu hỏi
```python
# scripts/analyze_question_bank.py
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

def analyze_question_bank():
    # Kết nối database và lấy dữ liệu
    questions = get_all_questions_with_metrics()

    # Chuyển thành DataFrame
    df = pd.DataFrame(questions)

    # Phân tích phân bố độ khó
    plt.figure(figsize=(10, 6))
    sns.histplot(df['DoKhoThucTe'].dropna(), bins=20, kde=True)
    plt.title('Phân bố độ khó thực tế')
    plt.xlabel('Độ khó thực tế')
    plt.ylabel('Số lượng câu hỏi')
    plt.savefig('../output/difficulty_distribution.png')

    # Phân tích phân bố độ phân cách
    plt.figure(figsize=(10, 6))
    sns.histplot(df['DoPhanCachCauHoi'].dropna(), bins=20, kde=True)
    plt.title('Phân bố độ phân cách')
    plt.xlabel('Độ phân cách')
    plt.ylabel('Số lượng câu hỏi')
    plt.savefig('../output/discrimination_distribution.png')

    # Phân tích bao phủ CLO
    clo_coverage = df.groupby('MaCLO').size()
    plt.figure(figsize=(10, 6))
    clo_coverage.plot(kind='bar')
    plt.title('Phân bố câu hỏi theo CLO')
    plt.xlabel('CLO')
    plt.ylabel('Số lượng câu hỏi')
    plt.savefig('../output/clo_coverage.png')

    # Xuất báo cáo tổng hợp
    report = {
        'total_questions': len(df),
        'questions_with_real_difficulty': df['DoKhoThucTe'].notna().sum(),
        'questions_with_discrimination': df['DoPhanCachCauHoi'].notna().sum(),
        'avg_difficulty': df['DoKhoThucTe'].mean(),
        'avg_discrimination': df['DoPhanCachCauHoi'].mean(),
        'clo_coverage': clo_coverage.to_dict()
    }

    # Lưu báo cáo dạng JSON
    with open('../output/question_bank_report.json', 'w') as f:
        json.dump(report, f, indent=2)

    print("Đã phân tích xong ngân hàng câu hỏi")

if __name__ == "__main__":
    analyze_question_bank()
```

### 12.5. Lịch trình triển khai tính năng nâng cao

| Giai đoạn | Thời gian | Tính năng |
|-----------|-----------|-----------|
| 1 | Tuần 1-2 | Độ khó thực tế và bổ sung trường dữ liệu |
| 2 | Tuần 3-4 | Độ phân cách câu hỏi (27%) |
| 3 | Tuần 5-6 | Thuật toán rút trích cơ bản |
| 4 | Tuần 7-8 | Độ phức tạp nội dung và độ khó động |
| 5 | Tuần 9-10 | Thuật toán rút trích thông minh |
| 6 | Tuần 11-12 | Script phân tích và báo cáo |

Kế hoạch này đảm bảo triển khai từng bước, với các tính năng cơ bản trước, sau đó mới đến các tính năng nâng cao.
