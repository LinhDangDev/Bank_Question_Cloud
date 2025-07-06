
import os
import sys
import tempfile
import shutil
from pathlib import Path

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


def create_test_images(test_dir: Path):
    """Tạo các file ảnh test"""
    if not PIL_AVAILABLE:
        print("Cần cài đặt Pillow để tạo ảnh test")
        return False

    # Tạo cấu trúc thư mục test
    (test_dir / "subfolder1").mkdir(parents=True, exist_ok=True)
    (test_dir / "subfolder2" / "nested").mkdir(parents=True, exist_ok=True)

    test_images = [
        # (path, format, size, color)
        ("test1.jpg", "JPEG", (800, 600), "red"),
        ("test2.png", "PNG", (640, 480), "blue"),
        ("test3.bmp", "BMP", (400, 300), "green"),
        ("subfolder1/image1.jpeg", "JPEG", (1024, 768), "yellow"),
        ("subfolder1/image2.tiff", "TIFF", (500, 400), "purple"),
        ("subfolder2/nested/photo.png", "PNG", (300, 200), "orange"),
    ]

    colors = {
        "red": (255, 0, 0),
        "blue": (0, 0, 255),
        "green": (0, 255, 0),
        "yellow": (255, 255, 0),
        "purple": (128, 0, 128),
        "orange": (255, 165, 0)
    }

    created_files = []

    for filename, format_type, size, color in test_images:
        file_path = test_dir / filename
        file_path.parent.mkdir(parents=True, exist_ok=True)

        # Tạo ảnh với màu solid
        img = Image.new('RGB', size, colors[color])
        img.save(file_path, format_type)
        created_files.append(file_path)
        print(f"Đã tạo: {file_path} ({format_type}, {size[0]}x{size[1]})")

    return created_files


def run_converter_test():
    """Chạy test cho WebP converter"""
    print("="*60)
    print("TEST WEBP CONVERTER")
    print("="*60)

    # Tạo thư mục test tạm thời
    with tempfile.TemporaryDirectory() as temp_dir:
        test_dir = Path(temp_dir) / "test_images"
        test_dir.mkdir()

        print(f"Thư mục test: {test_dir}")

        # Tạo ảnh test
        print("\n1. Tạo ảnh test...")
        created_files = create_test_images(test_dir)
        if not created_files:
            print("Không thể tạo ảnh test")
            return False

        print(f"Đã tạo {len(created_files)} file ảnh test")

        # Import converter
        sys.path.insert(0, str(Path(__file__).parent))
        try:
            from convert_to_webp import WebPConverter
        except ImportError as e:
            print(f"Không thể import WebPConverter: {e}")
            return False

        # Test 1: Chuyển đổi cơ bản
        print("\n2. Test chuyển đổi cơ bản...")
        converter1 = WebPConverter(
            source_dir=str(test_dir),
            quality=85,
            create_backup=False
        )

        success = converter1.convert_all()
        if not success:
            print("Test 1 thất bại")
            return False

        # Kiểm tra kết quả
        webp_files = list(test_dir.rglob("*.webp"))
        print(f"Đã tạo {len(webp_files)} file WebP")

        # Test 2: Chuyển đổi với backup
        print("\n3. Test chuyển đổi với backup...")

        # Xóa file WebP từ test trước
        for webp_file in webp_files:
            webp_file.unlink()

        converter2 = WebPConverter(
            source_dir=str(test_dir),
            quality=75,
            create_backup=True
        )

        success = converter2.convert_all()
        if not success:
            print("Test 2 thất bại")
            return False

        # Kiểm tra backup
        backup_files = list(test_dir.rglob("backup/*"))
        print(f"Đã tạo {len(backup_files)} file backup")

        # Test 3: Chuyển đổi sang thư mục khác
        print("\n4. Test chuyển đổi sang thư mục khác...")
        output_dir = Path(temp_dir) / "webp_output"

        converter3 = WebPConverter(
            source_dir=str(test_dir),
            quality=90,
            create_backup=False,
            output_dir=str(output_dir)
        )

        success = converter3.convert_all()
        if not success:
            print("Test 3 thất bại")
            return False

        # Kiểm tra output
        output_webp_files = list(output_dir.rglob("*.webp"))
        print(
            f"Đã tạo {len(output_webp_files)} file WebP trong thư mục output")

        # Hiển thị cấu trúc thư mục kết quả
        print("\n5. Cấu trúc thư mục kết quả:")
        print("\nThư mục nguồn:")
        show_directory_tree(test_dir)

        print("\nThư mục đích:")
        show_directory_tree(output_dir)

        print("\n" + "="*60)
        print("TẤT CẢ TEST ĐÃ HOÀN THÀNH THÀNH CÔNG!")
        print("="*60)

        return True


def show_directory_tree(directory: Path, prefix: str = "", max_depth: int = 3, current_depth: int = 0):
    """Hiển thị cây thư mục"""
    if current_depth > max_depth:
        return

    if not directory.exists():
        print(f"{prefix}[Thư mục không tồn tại]")
        return

    items = sorted(directory.iterdir(), key=lambda x: (x.is_file(), x.name))

    for i, item in enumerate(items):
        is_last = i == len(items) - 1
        current_prefix = "└── " if is_last else "├── "
        print(f"{prefix}{current_prefix}{item.name}")

        if item.is_dir() and current_depth < max_depth:
            extension = "    " if is_last else "│   "
            show_directory_tree(item, prefix + extension,
                                max_depth, current_depth + 1)


def main():
    """Hàm main để chạy test"""
    if not PIL_AVAILABLE:
        print("Cần cài đặt Pillow để chạy test:")
        print("pip install Pillow")
        sys.exit(1)

    try:
        success = run_converter_test()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\nTest bị hủy bởi người dùng")
        sys.exit(1)
    except Exception as e:
        print(f"Lỗi trong quá trình test: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
