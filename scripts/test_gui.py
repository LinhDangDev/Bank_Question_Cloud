

import os
import sys
import tempfile
import shutil
from pathlib import Path
import tkinter as tk
from tkinter import messagebox

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


def create_test_images_for_gui():
    """Tạo thư mục test với ảnh mẫu cho GUI"""
    if not PIL_AVAILABLE:
        print("Cần cài đặt Pillow để tạo ảnh test")
        return None

    # Tạo thư mục test trong thư mục hiện tại
    test_dir = Path("test_images_gui")
    if test_dir.exists():
        shutil.rmtree(test_dir)

    test_dir.mkdir()
    (test_dir / "subfolder").mkdir()

    # Tạo các file ảnh test với nội dung thực tế
    test_images = [
        ("sample1.jpg", "JPEG", (400, 300), (255, 100, 100)),  # Red
        ("sample2.png", "PNG", (300, 200), (100, 255, 100)),   # Green
        ("sample3.bmp", "BMP", (200, 150), (100, 100, 255)),   # Blue
        ("subfolder/nested1.jpeg", "JPEG", (500, 400), (255, 255, 100)),  # Yellow
        ("subfolder/nested2.tiff", "TIFF", (350, 250), (255, 100, 255)),  # Magenta
    ]

    created_files = []
    total_size = 0

    for filename, format_type, size, color in test_images:
        file_path = test_dir / filename
        file_path.parent.mkdir(parents=True, exist_ok=True)

        # Tạo ảnh với gradient để có kích thước thực tế
        img = Image.new('RGB', size, color)

        # Thêm một số pattern để ảnh có kích thước lớn hơn
        for x in range(0, size[0], 20):
            for y in range(0, size[1], 20):
                # Tạo pattern checkerboard
                if (x // 20 + y // 20) % 2:
                    for i in range(min(20, size[0] - x)):
                        for j in range(min(20, size[1] - y)):
                            if x + i < size[0] and y + j < size[1]:
                                # Slightly different color for pattern
                                new_color = tuple(max(0, c - 30)
                                                  for c in color)
                                img.putpixel((x + i, y + j), new_color)

        img.save(file_path, format_type,
                 quality=95 if format_type == 'JPEG' else None)
        file_size = file_path.stat().st_size
        total_size += file_size
        created_files.append(file_path)

        print(
            f"Đã tạo: {file_path} ({format_type}, {size[0]}x{size[1]}, {file_size:,} bytes)")

    print(f"\nTổng cộng: {len(created_files)} file, {total_size:,} bytes")
    print(f"Thư mục test: {test_dir.absolute()}")

    return test_dir


def launch_gui_with_test_data():
    """Khởi chạy GUI với dữ liệu test"""
    print("Đang tạo dữ liệu test...")
    test_dir = create_test_images_for_gui()

    if not test_dir:
        print("Không thể tạo dữ liệu test")
        return

    print("\nĐang khởi chạy GUI...")

    # Import và chạy GUI
    try:
        sys.path.insert(0, os.path.dirname(__file__))
        from webp_converter_gui import WebPConverterGUI

        root = tk.Tk()

        # Thiết lập style
        try:
            from tkinter import ttk
            style = ttk.Style()
            if 'winnative' in style.theme_names():
                style.theme_use('winnative')
            elif 'clam' in style.theme_names():
                style.theme_use('clam')
        except:
            pass

        app = WebPConverterGUI(root)

        # Tự động điền thư mục test vào GUI
        app.source_dir.set(str(test_dir.absolute()))
        app.log_message(f"Đã tự động chọn thư mục test: {test_dir.absolute()}")
        app.log_message("Bạn có thể bắt đầu test chuyển đổi ngay!")

        # Hiển thị hướng dẫn
        def show_test_instructions():
            instructions = f"""
HƯỚNG DẪN TEST GUI

Dữ liệu test đã được tạo tại: {test_dir.absolute()}

CÁCH TEST:
1. Thư mục nguồn đã được tự động chọn
2. Điều chỉnh chất lượng nếu muốn (mặc định 85%)
3. Chọn "Tạo backup" để test tính năng backup
4. Nhấn "Bắt đầu chuyển đổi" để test
5. Theo dõi progress bar và log
6. Kiểm tra kết quả trong thư mục test

MENU TEST:
- File → Chọn thư mục nguồn/đích
- Công cụ → Xem trước kết quả
- Công cụ → Mở thư mục log
- Trợ giúp → Hướng dẫn sử dụng

Sau khi test xong, thư mục test sẽ được tự động xóa khi đóng chương trình.
            """
            messagebox.showinfo("Hướng dẫn Test", instructions)

        # Hiển thị hướng dẫn sau 1 giây
        root.after(1000, show_test_instructions)

        # Cleanup function
        def cleanup_on_exit():
            try:
                if test_dir.exists():
                    shutil.rmtree(test_dir)
                    print(f"Đã xóa thư mục test: {test_dir}")
            except Exception as e:
                print(f"Không thể xóa thư mục test: {e}")
            root.destroy()

        # Bind cleanup to window close
        root.protocol("WM_DELETE_WINDOW", cleanup_on_exit)

        print("GUI đã khởi chạy thành công!")
        print("Đóng cửa sổ để kết thúc test và xóa dữ liệu test.")

        root.mainloop()

    except ImportError as e:
        print(f"Không thể import GUI: {e}")
        print("Đảm bảo file webp_converter_gui.py ở cùng thư mục")
    except Exception as e:
        print(f"Lỗi khi chạy GUI: {e}")
        import traceback
        traceback.print_exc()


def test_gui_components():
    """Test các component của GUI riêng lẻ"""
    print("Testing GUI components...")

    try:
        import tkinter as tk
        from tkinter import ttk

        # Test basic tkinter
        root = tk.Tk()
        root.title("Component Test")
        root.geometry("400x300")

        # Test các widget cơ bản
        ttk.Label(root, text="GUI Components Test").pack(pady=10)

        # Test StringVar
        test_var = tk.StringVar(value="Test Value")
        ttk.Entry(root, textvariable=test_var).pack(pady=5)

        # Test IntVar và Scale
        quality_var = tk.IntVar(value=85)
        ttk.Scale(root, from_=1, to=100, variable=quality_var,
                  orient=tk.HORIZONTAL).pack(pady=5)

        # Test BooleanVar và Checkbutton
        backup_var = tk.BooleanVar()
        ttk.Checkbutton(root, text="Test Checkbox",
                        variable=backup_var).pack(pady=5)

        # Test Progressbar
        progress_var = tk.DoubleVar()
        progress_bar = ttk.Progressbar(
            root, variable=progress_var, maximum=100)
        progress_bar.pack(pady=5, fill=tk.X, padx=20)

        # Test Button
        def test_button():
            progress_var.set(50)
            print("Button clicked, progress set to 50%")

        ttk.Button(root, text="Test Button", command=test_button).pack(pady=5)

        # Test ScrolledText
        try:
            from tkinter import scrolledtext
            text_area = scrolledtext.ScrolledText(root, height=5, width=40)
            text_area.pack(pady=5, fill=tk.BOTH, expand=True, padx=20)
            text_area.insert(tk.END, "GUI components test successful!\n")
            text_area.insert(tk.END, "All widgets are working properly.")
        except ImportError:
            print("ScrolledText not available")

        print("GUI components test window opened")
        print("Close the window to continue...")

        root.mainloop()
        print("GUI components test completed")
        return True

    except Exception as e:
        print(f"GUI components test failed: {e}")
        return False


def main():
    """Main function để chạy test"""
    print("="*60)
    print("WEBP CONVERTER GUI TEST")
    print("="*60)

    # Test 1: GUI Components
    print("\n1. Testing GUI Components...")
    if not test_gui_components():
        print("GUI components test failed. Exiting.")
        return

    # Test 2: Launch full GUI with test data
    print("\n2. Launching GUI with test data...")
    try:
        launch_gui_with_test_data()
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"Error during GUI test: {e}")
        import traceback
        traceback.print_exc()

    print("\nGUI test completed!")


if __name__ == '__main__':
    main()
