#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
import os
import sys
from pathlib import Path

# Cấu hình API
API_BASE_URL = "http://localhost:3000"
UPLOAD_ENDPOINT = f"{API_BASE_URL}/questions-import/upload"
PREVIEW_ENDPOINT = f"{API_BASE_URL}/questions-import/preview"
SAVE_ENDPOINT = f"{API_BASE_URL}/questions-import/save"

# Token để xác thực
AUTH_TOKEN = input("Nhập token của bạn: ")
if not AUTH_TOKEN:
    print("Bạn cần cung cấp token xác thực!")
    sys.exit(1)

# Headers cho API
headers = {
    "Authorization": f"Bearer {AUTH_TOKEN}"
}


def test_upload_docx():
    """Test tải lên tệp DOCX"""
    print("\n=== KIỂM TRA TẢI LÊN TỆP DOCX ===")

    # Tìm một tệp DOCX để test
    test_files = [
        Path("../template/DefaultTemplate.dotx"),
        Path("../template/Test_CauhoiAudio.docx"),
        Path("../template/Test_CauHoiDon.docx")
    ]

    found_file = None
    for file_path in test_files:
        if file_path.exists():
            found_file = file_path
            break

    if not found_file:
        print("Không tìm thấy tệp DOCX để test!")
        return None

    print(f"Đang sử dụng tệp: {found_file}")

    try:
        # Chuẩn bị form data
        files = {'file': (found_file.name, open(
            found_file, 'rb'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
        data = {
            'processImages': 'true'
        }

        # Gọi API upload
        print("Đang gửi yêu cầu tải lên...")
        response = requests.post(
            UPLOAD_ENDPOINT,
            headers=headers,
            files=files,
            data=data
        )

        # Kiểm tra kết quả
        if response.status_code == 200:
            result = response.json()
            print(f"Tải lên thành công! File ID: {result.get('fileId')}")
            print(f"Số câu hỏi đã phân tích: {result.get('count')}")
            return result.get('fileId')
        else:
            print(f"Lỗi khi tải lên: {response.status_code}")
            print(f"Chi tiết lỗi: {response.text}")
            return None

    except Exception as e:
        print(f"Lỗi: {str(e)}")
        return None


def test_preview_questions(file_id):
    """Test xem trước câu hỏi đã phân tích"""
    if not file_id:
        return

    print("\n=== KIỂM TRA XEM TRƯỚC CÂU HỎI ===")

    try:
        # Gọi API preview với limit 100
        print(f"Đang lấy câu hỏi từ file ID: {file_id}...")
        response = requests.get(
            f"{PREVIEW_ENDPOINT}/{file_id}?limit=100",
            headers=headers
        )

        # Kiểm tra kết quả
        if response.status_code == 200:
            result = response.json()
            total_questions = result.get('meta', {}).get('total', 0)
            questions = result.get('items', [])

            print(f"Lấy thành công {len(questions)}/{total_questions} câu hỏi")

            # Hiển thị thông tin về 3 câu hỏi đầu tiên
            for i, q in enumerate(questions[:3]):
                print(f"\nCâu hỏi {i+1}:")
                print(f"  ID: {q.get('id')}")
                print(f"  Nội dung: {q.get('content')[:80]}...")
                print(f"  Số đáp án: {len(q.get('answers', []))}")

                # Kiểm tra đáp án đúng
                correct_answers = [a.get('content') for a in q.get(
                    'answers', []) if a.get('isCorrect')]
                if correct_answers:
                    print(f"  Đáp án đúng: {', '.join(correct_answers)}")

            return questions
        else:
            print(f"Lỗi khi xem trước: {response.status_code}")
            print(f"Chi tiết lỗi: {response.text}")
            return None

    except Exception as e:
        print(f"Lỗi: {str(e)}")
        return None


def main():
    print("=== KIỂM TRA TÍNH NĂNG UPLOAD CÂU HỎI ===")

    # Test tải lên
    file_id = test_upload_docx()

    # Test xem trước
    if file_id:
        questions = test_preview_questions(file_id)


if __name__ == "__main__":
    main()
