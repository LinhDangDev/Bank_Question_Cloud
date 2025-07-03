#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pyodbc
import re
import sys

def connect_to_database():
    """Kết nối đến SQL Server database"""
    try:
        connection_string = (
            "DRIVER={ODBC Driver 17 for SQL Server};"
            "SERVER=localhost,1433;"
            "DATABASE=question_bank;"
            "UID=sa;"
            "PWD=Cntt15723@;"
            "Encrypt=no;"
        )
        conn = pyodbc.connect(connection_string)
        return conn
    except Exception as e:
        print(f"Lỗi kết nối database: {e}")
        return None

def fix_sql_file():
    """Sửa file SQL để thay đổi LaDapAnDung thành LaDapAn và sửa encoding"""
    print("Đang sửa file SQL...")
    
    try:
        # Đọc file với encoding UTF-8
        with open('sample_data_complete.sql', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Thay thế LaDapAnDung thành LaDapAn
        content = content.replace('[LaDapAnDung]', '[LaDapAn]')
        
        # Sửa các lỗi cú pháp SQL với dấu nháy đơn
        content = re.sub(r"N'([^']*)'([^']*)'([^']*)'", r"N'\1''\2''\3'", content)
        
        # Ghi lại file
        with open('sample_data_complete_fixed.sql', 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("Đã sửa file SQL thành sample_data_complete_fixed.sql")
        return True
        
    except Exception as e:
        print(f"Lỗi khi sửa file SQL: {e}")
        return False

def import_questions_only():
    """Import chỉ câu hỏi và câu trả lời, bỏ qua dữ liệu đã tồn tại"""
    conn = connect_to_database()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        print("Đang đọc file SQL...")
        with open('sample_data_complete.sql', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Tách các câu lệnh INSERT
        insert_statements = re.findall(r'INSERT.*?VALUES.*?;', content, re.DOTALL | re.IGNORECASE)
        
        question_count = 0
        answer_count = 0
        
        for statement in insert_statements:
            try:
                # Chỉ xử lý INSERT cho CauHoi và CauTraLoi
                if 'INSERT [dbo].[CauHoi]' in statement:
                    # Thực thi câu lệnh INSERT CauHoi
                    cursor.execute(statement)
                    question_count += 1
                    
                elif 'INSERT [dbo].[CauTraLoi]' in statement:
                    # Sửa LaDapAnDung thành LaDapAn
                    fixed_statement = statement.replace('[LaDapAnDung]', '[LaDapAn]')
                    cursor.execute(fixed_statement)
                    answer_count += 1
                
                # Commit mỗi 100 câu lệnh
                if (question_count + answer_count) % 100 == 0:
                    conn.commit()
                    print(f"Đã import {question_count} câu hỏi và {answer_count} câu trả lời...")
                    
            except pyodbc.Error as e:
                # Bỏ qua lỗi duplicate key và syntax error
                if "Violation of PRIMARY KEY constraint" not in str(e) and "Incorrect syntax" not in str(e):
                    print(f"Lỗi SQL: {e}")
                continue
        
        # Commit cuối cùng
        conn.commit()
        print(f"Hoàn thành! Đã import {question_count} câu hỏi và {answer_count} câu trả lời")
        
        return True
        
    except Exception as e:
        print(f"Lỗi khi import dữ liệu: {e}")
        return False
    finally:
        conn.close()

def fix_vietnamese_encoding():
    """Sửa encoding tiếng Việt trong database"""
    conn = connect_to_database()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        print("Đang sửa encoding tiếng Việt...")
        
        # Sửa tên khoa
        vietnamese_fixes = [
            ("Vi?n Van hóa - Ngh? thu?t - Th? thao", "Viện Văn hóa - Nghệ thuật - Thể thao"),
            ("Khoa Công ngh? thông tin", "Khoa Công nghệ thông tin"),
            ("Khoa Ti?ng Anh", "Khoa Tiếng Anh"),
            ("Khoa Qu?n tr? kinh doanh", "Khoa Quản trị kinh doanh"),
            ("Khoa Nh?t B?n h?c", "Khoa Nhật Bản học"),
            ("Ti?ng Anh Co B?n", "Tiếng Anh Cơ Bản"),
            ("Co S? D? Li?u", "Cơ Sở Dữ Liệu")
        ]
        
        for old_text, new_text in vietnamese_fixes:
            # Sửa tên khoa
            cursor.execute("UPDATE Khoa SET TenKhoa = ? WHERE TenKhoa = ?", (new_text, old_text))
            # Sửa tên môn học
            cursor.execute("UPDATE MonHoc SET TenMonHoc = ? WHERE TenMonHoc = ?", (new_text, old_text))
        
        conn.commit()
        print("Đã sửa encoding tiếng Việt")
        
        return True
        
    except Exception as e:
        print(f"Lỗi khi sửa encoding: {e}")
        return False
    finally:
        conn.close()

def check_results():
    """Kiểm tra kết quả sau khi import"""
    conn = connect_to_database()
    if not conn:
        return
    
    try:
        cursor = conn.cursor()
        
        # Đếm số lượng dữ liệu
        cursor.execute("SELECT COUNT(*) FROM CauHoi")
        question_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM CauTraLoi")
        answer_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM Khoa")
        khoa_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM MonHoc")
        monhoc_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM Phan")
        phan_count = cursor.fetchone()[0]
        
        print(f"\n=== KẾT QUẢ IMPORT ===")
        print(f"Số khoa: {khoa_count}")
        print(f"Số môn học: {monhoc_count}")
        print(f"Số phần: {phan_count}")
        print(f"Số câu hỏi: {question_count}")
        print(f"Số câu trả lời: {answer_count}")
        
        # Hiển thị một vài tên khoa để kiểm tra encoding
        cursor.execute("SELECT TOP 3 TenKhoa FROM Khoa")
        khoas = cursor.fetchall()
        print(f"\nTên khoa (kiểm tra encoding):")
        for khoa in khoas:
            print(f"- {khoa[0]}")
        
    except Exception as e:
        print(f"Lỗi khi kiểm tra kết quả: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    print("=== IMPORT DỮ LIỆU VÀ SỬA ENCODING ===")
    
    # Bước 1: Import câu hỏi và câu trả lời
    if import_questions_only():
        print("✓ Import câu hỏi và câu trả lời thành công")
    else:
        print("✗ Lỗi khi import câu hỏi và câu trả lời")
        sys.exit(1)
    
    # Bước 2: Sửa encoding tiếng Việt
    if fix_vietnamese_encoding():
        print("✓ Sửa encoding tiếng Việt thành công")
    else:
        print("✗ Lỗi khi sửa encoding tiếng Việt")
    
    # Bước 3: Kiểm tra kết quả
    check_results()
    
    print("\n=== HOÀN THÀNH ===")
