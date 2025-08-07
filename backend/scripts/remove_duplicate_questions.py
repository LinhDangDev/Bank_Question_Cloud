#!/usr/bin/env python3
"""
Remove Duplicate Questions Script
Author: Linh Dang Dev

This script removes duplicate questions from the database, keeping only the oldest one.
"""

import pyodbc
import sys
from datetime import datetime
import json

# Database configuration
DB_CONFIG = {
    'server': '103.173.226.35',
    'port': 1433,
    'database': 'question_bank',
    'username': 'sa',
    'password': 'Pass123@',
    'driver': '{ODBC Driver 17 for SQL Server}'
}

class DuplicateQuestionRemover:
    def __init__(self):
        self.connection = None
        self.removed_count = 0
        self.kept_count = 0
        self.duplicate_groups = []
        
    def connect_database(self):
        """Connect to SQL Server database"""
        try:
            connection_string = (
                f"DRIVER={DB_CONFIG['driver']};"
                f"SERVER={DB_CONFIG['server']},{DB_CONFIG['port']};"
                f"DATABASE={DB_CONFIG['database']};"
                f"UID={DB_CONFIG['username']};"
                f"PWD={DB_CONFIG['password']};"
                f"TrustServerCertificate=yes;"
            )
            
            self.connection = pyodbc.connect(connection_string)
            print("✅ Kết nối database thành công!")
            return True
            
        except Exception as e:
            print(f"❌ Lỗi kết nối database: {e}")
            return False
    
    def find_duplicate_questions(self):
        """Find all duplicate questions in database"""
        try:
            cursor = self.connection.cursor()
            
            # Query to find duplicate questions
            query = """
            WITH DuplicateGroups AS (
                SELECT 
                    NoiDung,
                    COUNT(*) as SoLuong,
                    COUNT(DISTINCT MaPhan) as SoChapterKhacNhau
                FROM CauHoi 
                WHERE NoiDung IS NOT NULL 
                    AND LEN(TRIM(NoiDung)) > 10
                    AND (XoaTamCauHoi IS NULL OR XoaTamCauHoi = 0)
                    AND MaCauHoiCha IS NULL  -- Only parent questions
                GROUP BY NoiDung
                HAVING COUNT(*) > 1
            ),
            DuplicateDetails AS (
                SELECT 
                    ch.MaCauHoi,
                    ch.NoiDung,
                    ch.MaPhan,
                    ch.NgayTao,
                    ch.SoLanDuocThi,
                    ch.SoLanDung,
                    p.TenPhan,
                    c.TenCLO,
                    dg.SoLuong,
                    dg.SoChapterKhacNhau,
                    ROW_NUMBER() OVER (
                        PARTITION BY ch.NoiDung 
                        ORDER BY 
                            ch.NgayTao ASC,  -- Keep oldest
                            ch.SoLanDuocThi DESC,  -- Prefer more used
                            ch.SoLanDung DESC  -- Prefer more correct answers
                    ) as RowNum
                FROM CauHoi ch
                INNER JOIN DuplicateGroups dg ON ch.NoiDung = dg.NoiDung
                LEFT JOIN Phan p ON ch.MaPhan = p.MaPhan
                LEFT JOIN CLO c ON ch.MaCLO = c.MaCLO
                WHERE (ch.XoaTamCauHoi IS NULL OR ch.XoaTamCauHoi = 0)
                    AND ch.MaCauHoiCha IS NULL
            )
            SELECT 
                MaCauHoi,
                NoiDung,
                MaPhan,
                TenPhan,
                TenCLO,
                NgayTao,
                SoLanDuocThi,
                SoLanDung,
                SoLuong,
                SoChapterKhacNhau,
                RowNum,
                CASE WHEN RowNum = 1 THEN 'KEEP' ELSE 'REMOVE' END as Action
            FROM DuplicateDetails
            ORDER BY NoiDung, RowNum
            """
            
            cursor.execute(query)
            results = cursor.fetchall()
            
            # Group results by content
            current_content = None
            current_group = []
            
            for row in results:
                content = row.NoiDung
                
                if content != current_content:
                    if current_group:
                        self.duplicate_groups.append(current_group)
                    current_group = []
                    current_content = content
                
                current_group.append({
                    'MaCauHoi': row.MaCauHoi,
                    'NoiDung': row.NoiDung,
                    'MaPhan': row.MaPhan,
                    'TenPhan': row.TenPhan or 'N/A',
                    'TenCLO': row.TenCLO or 'N/A',
                    'NgayTao': row.NgayTao,
                    'SoLanDuocThi': row.SoLanDuocThi or 0,
                    'SoLanDung': row.SoLanDung or 0,
                    'SoLuong': row.SoLuong,
                    'SoChapterKhacNhau': row.SoChapterKhacNhau,
                    'RowNum': row.RowNum,
                    'Action': row.Action
                })
            
            if current_group:
                self.duplicate_groups.append(current_group)
            
            cursor.close()
            
            print(f"🔍 Tìm thấy {len(self.duplicate_groups)} nhóm câu hỏi trùng lặp")
            return len(self.duplicate_groups) > 0
            
        except Exception as e:
            print(f"❌ Lỗi khi tìm câu hỏi trùng lặp: {e}")
            return False
    
    def display_duplicate_summary(self):
        """Display summary of duplicate questions"""
        print("\n📊 TỔNG QUAN CÂU HỎI TRÙNG LẶP:")
        print("=" * 80)
        
        total_questions = 0
        cross_chapter_groups = 0
        
        for i, group in enumerate(self.duplicate_groups):
            total_questions += len(group)
            chapters = set(q['MaPhan'] for q in group)
            
            if len(chapters) > 1:
                cross_chapter_groups += 1
            
            print(f"\n{i+1}. Nhóm {len(group)} câu hỏi trùng lặp:")
            print(f"   📝 Nội dung: {group[0]['NoiDung'][:100]}...")
            print(f"   📚 Số chương khác nhau: {len(chapters)}")
            
            for j, question in enumerate(group):
                action_icon = "✅ GIỮ LẠI" if question['Action'] == 'KEEP' else "❌ XÓA"
                print(f"   {j+1}. {action_icon}")
                print(f"      - ID: {question['MaCauHoi']}")
                print(f"      - Chương: {question['TenPhan']}")
                print(f"      - CLO: {question['TenCLO']}")
                print(f"      - Ngày tạo: {question['NgayTao']}")
                print(f"      - Số lần thi: {question['SoLanDuocThi']}")
        
        print(f"\n📈 THỐNG KÊ:")
        print(f"   - Tổng số nhóm trùng lặp: {len(self.duplicate_groups)}")
        print(f"   - Nhóm trùng giữa các chương: {cross_chapter_groups}")
        print(f"   - Tổng số câu hỏi: {total_questions}")
        print(f"   - Số câu sẽ giữ lại: {len(self.duplicate_groups)}")
        print(f"   - Số câu sẽ xóa: {total_questions - len(self.duplicate_groups)}")
    
    def remove_duplicate_questions(self, confirm=True):
        """Remove duplicate questions from database"""
        if not self.duplicate_groups:
            print("❌ Không có câu hỏi trùng lặp nào để xóa")
            return False
        
        # Get list of questions to remove
        questions_to_remove = []
        questions_to_keep = []
        
        for group in self.duplicate_groups:
            for question in group:
                if question['Action'] == 'REMOVE':
                    questions_to_remove.append(question['MaCauHoi'])
                else:
                    questions_to_keep.append(question['MaCauHoi'])
        
        print(f"\n🗑️ SẼ XÓA {len(questions_to_remove)} CÂU HỎI")
        print(f"✅ SẼ GIỮ LẠI {len(questions_to_keep)} CÂU HỎI")
        
        if confirm:
            response = input("\n❓ Bạn có chắc chắn muốn xóa? (yes/no): ").lower().strip()
            if response not in ['yes', 'y']:
                print("❌ Hủy bỏ thao tác xóa")
                return False
        
        try:
            cursor = self.connection.cursor()
            
            # Start transaction
            cursor.execute("BEGIN TRANSACTION")
            
            # Remove duplicate questions
            for question_id in questions_to_remove:
                # First, delete related records
                cursor.execute("DELETE FROM ChiTietDeThi WHERE MaCauHoi = ?", question_id)
                cursor.execute("DELETE FROM CauTraLoi WHERE MaCauHoi = ?", question_id)
                cursor.execute("DELETE FROM Files WHERE MaCauHoi = ?", question_id)
                
                # Then delete the question
                cursor.execute("DELETE FROM CauHoi WHERE MaCauHoi = ?", question_id)
                
                self.removed_count += 1
                
                if self.removed_count % 10 == 0:
                    print(f"   Đã xóa {self.removed_count}/{len(questions_to_remove)} câu hỏi...")
            
            # Commit transaction
            cursor.execute("COMMIT TRANSACTION")
            cursor.close()
            
            self.kept_count = len(questions_to_keep)
            
            print(f"\n✅ HOÀN THÀNH!")
            print(f"   - Đã xóa: {self.removed_count} câu hỏi")
            print(f"   - Đã giữ lại: {self.kept_count} câu hỏi")
            
            return True
            
        except Exception as e:
            print(f"❌ Lỗi khi xóa câu hỏi: {e}")
            try:
                cursor.execute("ROLLBACK TRANSACTION")
                print("🔄 Đã rollback transaction")
            except:
                pass
            return False
    
    def save_backup_info(self):
        """Save backup information to file"""
        backup_data = {
            'timestamp': datetime.now().isoformat(),
            'removed_count': self.removed_count,
            'kept_count': self.kept_count,
            'duplicate_groups': self.duplicate_groups
        }
        
        filename = f"duplicate_removal_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(backup_data, f, ensure_ascii=False, indent=2, default=str)
            
            print(f"💾 Đã lưu thông tin backup vào: {filename}")
            return filename
            
        except Exception as e:
            print(f"⚠️ Không thể lưu backup: {e}")
            return None
    
    def close_connection(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            print("🔌 Đã đóng kết nối database")

def main():
    print("🗑️ SCRIPT XÓA CÂU HỎI TRÙNG LẶP")
    print("Author: Linh Dang Dev")
    print("=" * 50)
    
    remover = DuplicateQuestionRemover()
    
    try:
        # Connect to database
        if not remover.connect_database():
            return
        
        # Find duplicate questions
        print("\n🔍 Đang tìm kiếm câu hỏi trùng lặp...")
        if not remover.find_duplicate_questions():
            print("✅ Không tìm thấy câu hỏi trùng lặp nào!")
            return
        
        # Display summary
        remover.display_duplicate_summary()
        
        # Save backup before removal
        print("\n💾 Đang lưu thông tin backup...")
        backup_file = remover.save_backup_info()
        
        # Remove duplicates
        print("\n🗑️ Bắt đầu xóa câu hỏi trùng lặp...")
        success = remover.remove_duplicate_questions(confirm=True)
        
        if success:
            print("\n🎉 THÀNH CÔNG!")
            print("✅ Đã xóa tất cả câu hỏi trùng lặp")
            print("✅ Chỉ giữ lại 1 câu trong mỗi nhóm trùng lặp")
            if backup_file:
                print(f"✅ Thông tin backup đã được lưu: {backup_file}")
        else:
            print("\n❌ THẤT BẠI!")
            print("❌ Không thể xóa câu hỏi trùng lặp")
    
    except KeyboardInterrupt:
        print("\n⚠️ Người dùng hủy bỏ thao tác")
    except Exception as e:
        print(f"\n❌ Lỗi không mong muốn: {e}")
    finally:
        remover.close_connection()

if __name__ == "__main__":
    main()
