/**
 * Script to check for duplicate questions across chapters in database
 * Author: Linh Dang Dev
 */

const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Pass123@',
    server: '103.173.226.35',
    port: 1433,
    database: 'question_bank',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        requestTimeout: 30000,
        connectionTimeout: 30000
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

async function checkDuplicateQuestions() {
    let pool;
    
    try {
        console.log('🔍 KIỂM TRA CÂU HỎI TRÙNG LẶP GIỮA CÁC CHƯƠNG/PHẦN');
        console.log('=' .repeat(60));
        
        // Connect to database
        console.log('\n⏳ Đang kết nối đến database...');
        pool = await sql.connect(config);
        console.log('✅ Kết nối thành công!');

        // 1. Check for exact duplicate content across different chapters
        console.log('\n📊 1. KIỂM TRA NỘI DUNG TRÙNG LẶP HOÀN TOÀN:');
        const exactDuplicatesQuery = `
            WITH DuplicateContent AS (
                SELECT 
                    NoiDung,
                    COUNT(*) as SoLuong,
                    COUNT(DISTINCT MaPhan) as SoChapterKhacNhau,
                    STRING_AGG(CAST(MaCauHoi AS NVARCHAR(MAX)), ', ') as DanhSachMaCauHoi,
                    STRING_AGG(CAST(MaPhan AS NVARCHAR(MAX)), ', ') as DanhSachMaPhan
                FROM CauHoi 
                WHERE NoiDung IS NOT NULL 
                    AND LEN(TRIM(NoiDung)) > 10
                    AND (XoaTamCauHoi IS NULL OR XoaTamCauHoi = 0)
                    AND MaCauHoiCha IS NULL  -- Only parent questions
                GROUP BY NoiDung
                HAVING COUNT(*) > 1
            )
            SELECT 
                dc.*,
                CASE 
                    WHEN SoChapterKhacNhau > 1 THEN 'TRÙNG GIỮA CÁC CHƯƠNG'
                    ELSE 'TRÙNG TRONG CÙNG CHƯƠNG'
                END as LoaiTrung
            FROM DuplicateContent dc
            ORDER BY SoLuong DESC, SoChapterKhacNhau DESC
        `;

        const exactDuplicates = await pool.request().query(exactDuplicatesQuery);
        
        if (exactDuplicates.recordset.length > 0) {
            console.log(`❌ Tìm thấy ${exactDuplicates.recordset.length} nhóm câu hỏi có nội dung trùng lặp:`);
            
            let crossChapterDuplicates = 0;
            exactDuplicates.recordset.forEach((dup, index) => {
                console.log(`\n${index + 1}. ${dup.LoaiTrung}:`);
                console.log(`   - Số lượng: ${dup.SoLuong} câu hỏi`);
                console.log(`   - Số chương khác nhau: ${dup.SoChapterKhacNhau}`);
                console.log(`   - Mã câu hỏi: ${dup.DanhSachMaCauHoi}`);
                console.log(`   - Mã phần: ${dup.DanhSachMaPhan}`);
                console.log(`   - Nội dung: ${dup.NoiDung.substring(0, 100)}...`);
                
                if (dup.SoChapterKhacNhau > 1) {
                    crossChapterDuplicates++;
                }
            });
            
            console.log(`\n🚨 TỔNG KẾT: ${crossChapterDuplicates} nhóm câu hỏi trùng lặp GIỮA CÁC CHƯƠNG`);
        } else {
            console.log('✅ Không tìm thấy câu hỏi nào có nội dung trùng lặp hoàn toàn');
        }

        // 2. Check for similar content (fuzzy matching)
        console.log('\n📊 2. KIỂM TRA NỘI DUNG TƯƠNG TỰ (>90% giống nhau):');
        const similarContentQuery = `
            WITH QuestionPairs AS (
                SELECT 
                    q1.MaCauHoi as MaCauHoi1,
                    q1.MaPhan as MaPhan1,
                    q1.NoiDung as NoiDung1,
                    q2.MaCauHoi as MaCauHoi2,
                    q2.MaPhan as MaPhan2,
                    q2.NoiDung as NoiDung2,
                    p1.TenPhan as TenPhan1,
                    p2.TenPhan as TenPhan2
                FROM CauHoi q1
                INNER JOIN CauHoi q2 ON q1.MaCauHoi < q2.MaCauHoi
                LEFT JOIN Phan p1 ON q1.MaPhan = p1.MaPhan
                LEFT JOIN Phan p2 ON q2.MaPhan = p2.MaPhan
                WHERE q1.NoiDung IS NOT NULL 
                    AND q2.NoiDung IS NOT NULL
                    AND LEN(TRIM(q1.NoiDung)) > 20
                    AND LEN(TRIM(q2.NoiDung)) > 20
                    AND (q1.XoaTamCauHoi IS NULL OR q1.XoaTamCauHoi = 0)
                    AND (q2.XoaTamCauHoi IS NULL OR q2.XoaTamCauHoi = 0)
                    AND q1.MaCauHoiCha IS NULL
                    AND q2.MaCauHoiCha IS NULL
                    AND q1.MaPhan != q2.MaPhan  -- Different chapters only
                    AND (
                        SOUNDEX(LEFT(q1.NoiDung, 100)) = SOUNDEX(LEFT(q2.NoiDung, 100))
                        OR LEFT(q1.NoiDung, 50) = LEFT(q2.NoiDung, 50)
                        OR q1.NoiDung LIKE '%' + LEFT(q2.NoiDung, 30) + '%'
                        OR q2.NoiDung LIKE '%' + LEFT(q1.NoiDung, 30) + '%'
                    )
            )
            SELECT TOP 20 * FROM QuestionPairs
            ORDER BY LEN(NoiDung1) + LEN(NoiDung2) DESC
        `;

        const similarContent = await pool.request().query(similarContentQuery);
        
        if (similarContent.recordset.length > 0) {
            console.log(`⚠️ Tìm thấy ${similarContent.recordset.length} cặp câu hỏi có nội dung tương tự giữa các chương:`);
            
            similarContent.recordset.forEach((pair, index) => {
                console.log(`\n${index + 1}. Cặp câu hỏi tương tự:`);
                console.log(`   - Câu hỏi 1: ${pair.MaCauHoi1} (${pair.TenPhan1 || pair.MaPhan1})`);
                console.log(`   - Câu hỏi 2: ${pair.MaCauHoi2} (${pair.TenPhan2 || pair.MaPhan2})`);
                console.log(`   - Nội dung 1: ${pair.NoiDung1.substring(0, 80)}...`);
                console.log(`   - Nội dung 2: ${pair.NoiDung2.substring(0, 80)}...`);
            });
        } else {
            console.log('✅ Không tìm thấy câu hỏi nào có nội dung tương tự giữa các chương');
        }

        // 3. Check questions by CLO distribution
        console.log('\n📊 3. PHÂN TÍCH PHÂN PHỐI CÂU HỎI THEO CLO VÀ CHƯƠNG:');
        const cloDistributionQuery = `
            SELECT 
                c.TenCLO,
                p.TenPhan,
                COUNT(ch.MaCauHoi) as SoCauHoi,
                COUNT(DISTINCT ch.NoiDung) as SoCauHoiDuyNhat,
                CASE 
                    WHEN COUNT(ch.MaCauHoi) > COUNT(DISTINCT ch.NoiDung) 
                    THEN COUNT(ch.MaCauHoi) - COUNT(DISTINCT ch.NoiDung)
                    ELSE 0
                END as SoCauHoiTrung
            FROM CauHoi ch
            LEFT JOIN CLO c ON ch.MaCLO = c.MaCLO
            LEFT JOIN Phan p ON ch.MaPhan = p.MaPhan
            WHERE (ch.XoaTamCauHoi IS NULL OR ch.XoaTamCauHoi = 0)
                AND ch.MaCauHoiCha IS NULL
                AND ch.NoiDung IS NOT NULL
            GROUP BY c.TenCLO, p.TenPhan, ch.MaCLO, ch.MaPhan
            HAVING COUNT(ch.MaCauHoi) > 0
            ORDER BY c.TenCLO, p.TenPhan
        `;

        const cloDistribution = await pool.request().query(cloDistributionQuery);
        
        console.log('Phân phối câu hỏi theo CLO và Chương:');
        let currentCLO = '';
        let totalDuplicatesInCLO = 0;
        
        cloDistribution.recordset.forEach(row => {
            if (row.TenCLO !== currentCLO) {
                if (currentCLO && totalDuplicatesInCLO > 0) {
                    console.log(`   ⚠️ Tổng câu hỏi trùng trong CLO: ${totalDuplicatesInCLO}`);
                }
                currentCLO = row.TenCLO;
                totalDuplicatesInCLO = 0;
                console.log(`\n📚 ${row.TenCLO || 'Không có CLO'}:`);
            }
            
            console.log(`   - ${row.TenPhan || 'Không có phần'}: ${row.SoCauHoi} câu (${row.SoCauHoiDuyNhat} duy nhất)`);
            if (row.SoCauHoiTrung > 0) {
                console.log(`     🚨 ${row.SoCauHoiTrung} câu hỏi trùng lặp!`);
                totalDuplicatesInCLO += row.SoCauHoiTrung;
            }
        });

        // 4. Check for questions that might be causing API issues
        console.log('\n📊 4. KIỂM TRA CÂU HỎI CÓ THỂ GÂY LỖI API:');
        const problematicQuestionsQuery = `
            SELECT 
                ch.MaCauHoi,
                ch.MaPhan,
                ch.MaCLO,
                p.TenPhan,
                c.TenCLO,
                ch.NoiDung,
                ch.SoLanDuocThi,
                COUNT(*) OVER (PARTITION BY ch.NoiDung) as SoLanTrungLap,
                COUNT(*) OVER (PARTITION BY ch.MaCLO, ch.MaPhan) as SoCauHoiCungCLOPhan
            FROM CauHoi ch
            LEFT JOIN Phan p ON ch.MaPhan = p.MaPhan
            LEFT JOIN CLO c ON ch.MaCLO = c.MaCLO
            WHERE (ch.XoaTamCauHoi IS NULL OR ch.XoaTamCauHoi = 0)
                AND ch.MaCauHoiCha IS NULL
                AND ch.NoiDung IS NOT NULL
                AND (
                    -- Questions that appear multiple times
                    ch.NoiDung IN (
                        SELECT NoiDung 
                        FROM CauHoi 
                        WHERE NoiDung IS NOT NULL
                        GROUP BY NoiDung 
                        HAVING COUNT(*) > 1
                    )
                    -- Or questions used very frequently
                    OR ch.SoLanDuocThi > 10
                )
            ORDER BY SoLanTrungLap DESC, ch.SoLanDuocThi DESC
        `;

        const problematicQuestions = await pool.request().query(problematicQuestionsQuery);
        
        if (problematicQuestions.recordset.length > 0) {
            console.log(`⚠️ Tìm thấy ${problematicQuestions.recordset.length} câu hỏi có thể gây vấn đề:`);
            
            problematicQuestions.recordset.slice(0, 10).forEach((q, index) => {
                console.log(`\n${index + 1}. Câu hỏi có vấn đề:`);
                console.log(`   - Mã: ${q.MaCauHoi}`);
                console.log(`   - Phần: ${q.TenPhan || q.MaPhan}`);
                console.log(`   - CLO: ${q.TenCLO || q.MaCLO}`);
                console.log(`   - Số lần trùng lặp: ${q.SoLanTrungLap}`);
                console.log(`   - Số lần được thi: ${q.SoLanDuocThi || 0}`);
                console.log(`   - Nội dung: ${q.NoiDung.substring(0, 100)}...`);
            });
        } else {
            console.log('✅ Không tìm thấy câu hỏi nào có vấn đề rõ ràng');
        }

        // 5. Summary and recommendations
        console.log('\n' + '=' .repeat(60));
        console.log('📋 TÓM TẮT VÀ KHUYẾN NGHỊ:');
        
        const totalExactDuplicates = exactDuplicates.recordset.length;
        const crossChapterExactDuplicates = exactDuplicates.recordset.filter(d => d.SoChapterKhacNhau > 1).length;
        const totalSimilarPairs = similarContent.recordset.length;
        const totalProblematicQuestions = problematicQuestions.recordset.length;
        
        console.log(`\n📊 Thống kê:`);
        console.log(`   - Nhóm câu hỏi trùng lặp hoàn toàn: ${totalExactDuplicates}`);
        console.log(`   - Nhóm trùng lặp giữa các chương: ${crossChapterExactDuplicates}`);
        console.log(`   - Cặp câu hỏi tương tự: ${totalSimilarPairs}`);
        console.log(`   - Câu hỏi có vấn đề: ${totalProblematicQuestions}`);
        
        if (crossChapterExactDuplicates > 0 || totalSimilarPairs > 0) {
            console.log(`\n🚨 VẤN ĐỀ PHÁT HIỆN:`);
            console.log(`   - CÓ câu hỏi trùng lặp giữa các chương/phần`);
            console.log(`   - Điều này có thể gây ra lỗi trong API rút trích đề theo CLO`);
            
            console.log(`\n💡 KHUYẾN NGHỊ:`);
            console.log(`   1. Chạy script cleanup để loại bỏ câu hỏi trùng lặp`);
            console.log(`   2. Cập nhật logic API để tránh chọn câu hỏi đã được sử dụng`);
            console.log(`   3. Thêm validation khi import câu hỏi mới`);
            console.log(`   4. Kiểm tra và cập nhật dữ liệu CLO cho các câu hỏi`);
        } else {
            console.log(`\n✅ KHÔNG PHÁT HIỆN VẤN ĐỀ NGHIÊM TRỌNG`);
            console.log(`   - Vấn đề API có thể do logic selection hoặc caching`);
        }

    } catch (error) {
        console.error('\n❌ Lỗi khi kiểm tra:', error.message);
        console.error('Chi tiết lỗi:', error);
    } finally {
        if (pool) {
            await pool.close();
            console.log('\n🔌 Đã đóng kết nối database');
        }
    }
}

// Run the check
if (require.main === module) {
    checkDuplicateQuestions()
        .then(() => {
            console.log('\n✅ Hoàn thành kiểm tra!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Script thất bại:', error);
            process.exit(1);
        });
}

module.exports = { checkDuplicateQuestions };
