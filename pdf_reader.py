#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF Reader Script
Đọc và trích xuất nội dung từ file PDF
"""

import sys
import os
from pathlib import Path

def install_required_packages():
    """Cài đặt các package cần thiết"""
    try:
        import PyPDF2
        import pdfplumber
        print("✓ Các thư viện PDF đã được cài đặt")
        return True
    except ImportError:
        print("Đang cài đặt các thư viện cần thiết...")
        os.system("pip install PyPDF2 pdfplumber")
        try:
            import PyPDF2
            import pdfplumber
            print("✓ Cài đặt thành công!")
            return True
        except ImportError:
            print("❌ Không thể cài đặt thư viện. Vui lòng chạy: pip install PyPDF2 pdfplumber")
            return False

def read_pdf_with_pypdf2(pdf_path):
    """Đọc PDF bằng PyPDF2"""
    try:
        import PyPDF2
        
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            
            print(f"📄 Số trang: {len(pdf_reader.pages)}")
            
            for page_num, page in enumerate(pdf_reader.pages, 1):
                print(f"Đang đọc trang {page_num}...")
                page_text = page.extract_text()
                text += f"\n--- TRANG {page_num} ---\n"
                text += page_text
                text += "\n"
            
            return text
    except Exception as e:
        print(f"❌ Lỗi khi đọc bằng PyPDF2: {e}")
        return None

def read_pdf_with_pdfplumber(pdf_path):
    """Đọc PDF bằng pdfplumber (thường tốt hơn cho văn bản tiếng Việt)"""
    try:
        import pdfplumber
        
        text = ""
        with pdfplumber.open(pdf_path) as pdf:
            print(f"📄 Số trang: {len(pdf.pages)}")
            
            for page_num, page in enumerate(pdf.pages, 1):
                print(f"Đang đọc trang {page_num}...")
                page_text = page.extract_text()
                if page_text:
                    text += f"\n--- TRANG {page_num} ---\n"
                    text += page_text
                    text += "\n"
            
            return text
    except Exception as e:
        print(f"❌ Lỗi khi đọc bằng pdfplumber: {e}")
        return None

def save_text_to_file(text, output_path):
    """Lưu text vào file"""
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"✓ Đã lưu nội dung vào: {output_path}")
        return True
    except Exception as e:
        print(f"❌ Lỗi khi lưu file: {e}")
        return False

def main():
    # Đường dẫn file PDF
    pdf_path = "template/huong-dan-soan-ngan-hang-cau-hoi-trac-nghiem.pdf"
    output_path = "pdf_content.txt"
    
    print("🔍 PDF Reader - Đọc file PDF")
    print("=" * 50)
    
    # Kiểm tra file tồn tại
    if not os.path.exists(pdf_path):
        print(f"❌ Không tìm thấy file: {pdf_path}")
        return
    
    print(f"📁 Đang đọc file: {pdf_path}")
    
    # Cài đặt thư viện nếu cần
    if not install_required_packages():
        return
    
    # Thử đọc bằng pdfplumber trước (tốt hơn cho tiếng Việt)
    print("\n🔄 Thử đọc bằng pdfplumber...")
    text = read_pdf_with_pdfplumber(pdf_path)
    
    # Nếu không thành công, thử PyPDF2
    if not text or len(text.strip()) < 100:
        print("\n🔄 Thử đọc bằng PyPDF2...")
        text = read_pdf_with_pypdf2(pdf_path)
    
    if text and len(text.strip()) > 0:
        print(f"\n✓ Đọc thành công! Độ dài nội dung: {len(text)} ký tự")
        
        # Lưu vào file
        save_text_to_file(text, output_path)
        
        # Hiển thị preview
        print("\n📖 PREVIEW NỘI DUNG:")
        print("=" * 50)
        preview = text[:2000] + "..." if len(text) > 2000 else text
        print(preview)
        
        print(f"\n✓ Hoàn thành! Nội dung đầy đủ đã được lưu vào: {output_path}")
    else:
        print("❌ Không thể đọc được nội dung từ file PDF")

if __name__ == "__main__":
    main()
