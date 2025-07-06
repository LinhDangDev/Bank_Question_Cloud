
import os
import sys
import argparse
import logging
import shutil
import subprocess
from pathlib import Path
from datetime import datetime
from typing import List, Tuple, Dict

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


class WebPConverter:
    def __init__(self, source_dir: str, quality: int = 85, create_backup: bool = False,
                 output_dir: str = None, log_file: str = None):
        self.source_dir = Path(source_dir)
        self.quality = quality
        self.create_backup = create_backup
        self.output_dir = Path(output_dir) if output_dir else self.source_dir
        self.log_file = log_file or f"webp_conversion_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

        self.supported_formats = {'.png', '.jpg',
                                  '.jpeg', '.bmp', '.tiff', '.tif'}
        self.stats = {
            'total_files': 0,
            'converted': 0,
            'skipped': 0,
            'errors': 0,
            'size_before': 0,
            'size_after': 0
        }

        self.setup_logging()

    def setup_logging(self):
        """Thiết lập logging cho script"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(self.log_file, encoding='utf-8'),
                logging.StreamHandler(sys.stdout)
            ]
        )
        self.logger = logging.getLogger(__name__)

    def check_pillow_installation(self) -> bool:
        """Kiểm tra và cài đặt Pillow nếu cần"""
        global PIL_AVAILABLE, Image

        if PIL_AVAILABLE:
            self.logger.info("Pillow đã được cài đặt")
            return True

        self.logger.warning("Pillow chưa được cài đặt. Đang cài đặt...")
        try:
            subprocess.check_call(
                [sys.executable, '-m', 'pip', 'install', 'Pillow'])
            self.logger.info("Đã cài đặt Pillow thành công")

            from PIL import Image
            PIL_AVAILABLE = True
            return True
        except subprocess.CalledProcessError as e:
            self.logger.error(f"Không thể cài đặt Pillow: {e}")
            return False

    def find_image_files(self) -> List[Path]:
        """Tìm tất cả file ảnh trong thư mục và thư mục con"""
        image_files = []

        for root, dirs, files in os.walk(self.source_dir):
            for file in files:
                file_path = Path(root) / file
                if file_path.suffix.lower() in self.supported_formats:
                    image_files.append(file_path)

        self.logger.info(f"Tìm thấy {len(image_files)} file ảnh")
        return image_files

    def create_backup_file(self, file_path: Path) -> bool:
        """Tạo backup của file gốc"""
        try:
            backup_dir = file_path.parent / 'backup'
            backup_dir.mkdir(exist_ok=True)

            backup_path = backup_dir / file_path.name
            shutil.copy2(file_path, backup_path)
            self.logger.debug(f"Đã tạo backup: {backup_path}")
            return True
        except Exception as e:
            self.logger.error(f"Không thể tạo backup cho {file_path}: {e}")
            return False

    def convert_to_webp(self, input_path: Path) -> Tuple[bool, str]:
        """Chuyển đổi một file ảnh sang WebP"""
        try:
            relative_path = input_path.relative_to(self.source_dir)
            output_path = self.output_dir / relative_path.with_suffix('.webp')

            output_path.parent.mkdir(parents=True, exist_ok=True)

            if output_path.exists():
                self.logger.debug(f"File WebP đã tồn tại: {output_path}")
                self.stats['skipped'] += 1
                return True, "Đã tồn tại"

            original_size = input_path.stat().st_size
            self.stats['size_before'] += original_size

            if self.create_backup:
                if not self.create_backup_file(input_path):
                    return False, "Không thể tạo backup"

            with Image.open(input_path) as img:
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGBA')
                else:
                    img = img.convert('RGB')

                img.save(output_path, 'WebP',
                         quality=self.quality, optimize=True)

            new_size = output_path.stat().st_size
            self.stats['size_after'] += new_size
            self.stats['converted'] += 1

            compression_ratio = (1 - new_size / original_size) * 100
            return True, f"Giảm {compression_ratio:.1f}% kích thước"

        except Exception as e:
            self.stats['errors'] += 1
            return False, str(e)

    def print_progress(self, current: int, total: int, file_path: Path, status: str):
        """Hiển thị tiến trình chuyển đổi"""
        progress = (current / total) * 100
        bar_length = 50
        filled_length = int(bar_length * current // total)
        bar = '█' * filled_length + '-' * (bar_length - filled_length)

        print(
            f'\r[{bar}] {progress:.1f}% ({current}/{total}) - {file_path.name}: {status}', end='', flush=True)

    def convert_all(self):
        """Chuyển đổi tất cả file ảnh"""
        if not self.check_pillow_installation():
            return False

        self.logger.info(f"Bắt đầu chuyển đổi từ: {self.source_dir}")
        self.logger.info(f"Thư mục đích: {self.output_dir}")
        self.logger.info(f"Chất lượng: {self.quality}%")
        self.logger.info(
            f"Tạo backup: {'Có' if self.create_backup else 'Không'}")

        image_files = self.find_image_files()
        if not image_files:
            self.logger.warning("Không tìm thấy file ảnh nào")
            return True

        self.stats['total_files'] = len(image_files)

        for i, file_path in enumerate(image_files, 1):
            success, message = self.convert_to_webp(file_path)
            status = "✓" if success else "✗"

            self.print_progress(i, len(image_files),
                                file_path, f"{status} {message}")

            if success:
                self.logger.debug(f"Chuyển đổi thành công: {file_path}")
            else:
                self.logger.error(f"Lỗi chuyển đổi {file_path}: {message}")

        print()  # New line after progress bar
        self.print_statistics()
        return True

    def print_statistics(self):
        """In thống kê kết quả"""
        print("\n" + "="*60)
        print("THỐNG KÊ CHUYỂN ĐỔI")
        print("="*60)
        print(f"Tổng số file:        {self.stats['total_files']}")
        print(f"Đã chuyển đổi:       {self.stats['converted']}")
        print(f"Đã bỏ qua:          {self.stats['skipped']}")
        print(f"Lỗi:                {self.stats['errors']}")

        if self.stats['size_before'] > 0:
            size_reduction = (
                1 - self.stats['size_after'] / self.stats['size_before']) * 100
            print(
                f"Kích thước trước:    {self.format_size(self.stats['size_before'])}")
            print(
                f"Kích thước sau:      {self.format_size(self.stats['size_after'])}")
            print(f"Tiết kiệm:          {size_reduction:.1f}%")

        print(f"Log file:           {self.log_file}")
        print("="*60)

    @staticmethod
    def format_size(size_bytes: int) -> str:
        """Định dạng kích thước file"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} TB"


def main():
    parser = argparse.ArgumentParser(
        description='Chuyển đổi file ảnh sang định dạng WebP',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ví dụ sử dụng:
  python convert_to_webp.py /path/to/images
  python convert_to_webp.py /path/to/images --quality 90 --backup
  python convert_to_webp.py /path/to/images --output /path/to/webp --quality 75
        """
    )

    parser.add_argument(
        'source_dir', help='Thư mục chứa file ảnh cần chuyển đổi')
    parser.add_argument('--quality', '-q', type=int, default=85,
                        help='Chất lượng nén WebP (1-100, mặc định: 85)')
    parser.add_argument('--backup', '-b', action='store_true',
                        help='Tạo backup file gốc')
    parser.add_argument(
        '--output', '-o', help='Thư mục đích (mặc định: cùng thư mục nguồn)')
    parser.add_argument('--log', '-l', help='File log (mặc định: tự động tạo)')

    args = parser.parse_args()

    if not os.path.exists(args.source_dir):
        print(f"Lỗi: Thư mục '{args.source_dir}' không tồn tại")
        sys.exit(1)

    if args.quality < 1 or args.quality > 100:
        print("Lỗi: Chất lượng phải từ 1 đến 100")
        sys.exit(1)

    converter = WebPConverter(
        source_dir=args.source_dir,
        quality=args.quality,
        create_backup=args.backup,
        output_dir=args.output,
        log_file=args.log
    )

    try:
        success = converter.convert_all()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\nĐã hủy bởi người dùng")
        sys.exit(1)
    except Exception as e:
        print(f"Lỗi không mong muốn: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
