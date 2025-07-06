

import os
import sys
import threading
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
from pathlib import Path
import queue
import logging
from datetime import datetime

try:
    from convert_to_webp import WebPConverter
except ImportError:
    sys.path.insert(0, os.path.dirname(__file__))
    from convert_to_webp import WebPConverter


class WebPConverterGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("WebP Image Converter")
        self.root.geometry("800x700")
        self.root.minsize(600, 500)

        self.source_dir = tk.StringVar()
        self.output_dir = tk.StringVar()
        self.quality = tk.IntVar(value=85)
        self.create_backup = tk.BooleanVar(value=False)
        self.same_as_source = tk.BooleanVar(value=True)

        self.converter = None
        self.conversion_thread = None
        self.is_converting = False
        self.log_queue = queue.Queue()

        self.setup_ui()
        self.setup_logging()
        self.check_log_queue()

    def setup_ui(self):
        """Thiết lập giao diện người dùng"""
        # Setup menu
        self.setup_menu()

        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))

        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)

        row = 0

        # Title
        title_label = ttk.Label(main_frame, text="WebP Image Converter",
                                font=('Arial', 16, 'bold'))
        title_label.grid(row=row, column=0, columnspan=3, pady=(0, 20))
        row += 1

        # Source directory
        ttk.Label(main_frame, text="Thư mục nguồn:").grid(
            row=row, column=0, sticky=tk.W, pady=5)
        source_entry = ttk.Entry(
            main_frame, textvariable=self.source_dir, width=50)
        source_entry.grid(row=row, column=1, sticky=(
            tk.W, tk.E), padx=(10, 5), pady=5)
        ttk.Button(main_frame, text="Browse",
                   command=self.browse_source_dir).grid(row=row, column=2, pady=5)
        row += 1

        # Output directory
        ttk.Label(main_frame, text="Thư mục đích:").grid(
            row=row, column=0, sticky=tk.W, pady=5)
        self.output_entry = ttk.Entry(
            main_frame, textvariable=self.output_dir, width=50)
        self.output_entry.grid(row=row, column=1, sticky=(
            tk.W, tk.E), padx=(10, 5), pady=5)
        self.output_browse_btn = ttk.Button(main_frame, text="Browse",
                                            command=self.browse_output_dir)
        self.output_browse_btn.grid(row=row, column=2, pady=5)
        row += 1

        # Same as source checkbox
        same_source_cb = ttk.Checkbutton(main_frame, text="Cùng thư mục nguồn",
                                         variable=self.same_as_source,
                                         command=self.toggle_output_dir)
        same_source_cb.grid(row=row, column=1, sticky=tk.W,
                            padx=(10, 0), pady=5)
        row += 1

        # Quality slider
        quality_frame = ttk.Frame(main_frame)
        quality_frame.grid(row=row, column=0, columnspan=3,
                           sticky=(tk.W, tk.E), pady=10)
        quality_frame.columnconfigure(1, weight=1)

        ttk.Label(quality_frame, text="Chất lượng:").grid(
            row=0, column=0, sticky=tk.W)
        self.quality_scale = ttk.Scale(quality_frame, from_=1, to=100,
                                       variable=self.quality, orient=tk.HORIZONTAL,
                                       command=self.update_quality_label)
        self.quality_scale.grid(
            row=0, column=1, sticky=(tk.W, tk.E), padx=(10, 10))
        self.quality_label = ttk.Label(quality_frame, text="85%")
        self.quality_label.grid(row=0, column=2)
        row += 1

        # Backup checkbox
        backup_cb = ttk.Checkbutton(main_frame, text="Tạo backup file gốc",
                                    variable=self.create_backup)
        backup_cb.grid(row=row, column=0, columnspan=2, sticky=tk.W, pady=5)
        row += 1

        # Progress bar
        progress_frame = ttk.Frame(main_frame)
        progress_frame.grid(row=row, column=0, columnspan=3,
                            sticky=(tk.W, tk.E), pady=10)
        progress_frame.columnconfigure(0, weight=1)

        ttk.Label(progress_frame, text="Tiến trình:").grid(
            row=0, column=0, sticky=tk.W)
        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(progress_frame, variable=self.progress_var,
                                            maximum=100, length=400)
        self.progress_bar.grid(row=1, column=0, sticky=(tk.W, tk.E), pady=5)
        self.progress_label = ttk.Label(progress_frame, text="Sẵn sàng")
        self.progress_label.grid(row=2, column=0, sticky=tk.W)
        row += 1

        # Control buttons
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=row, column=0, columnspan=3, pady=10)

        self.start_btn = ttk.Button(button_frame, text="Bắt đầu chuyển đổi",
                                    command=self.start_conversion, style='Accent.TButton')
        self.start_btn.pack(side=tk.LEFT, padx=(0, 10))

        self.stop_btn = ttk.Button(button_frame, text="Dừng",
                                   command=self.stop_conversion, state=tk.DISABLED)
        self.stop_btn.pack(side=tk.LEFT, padx=(0, 10))

        self.clear_btn = ttk.Button(button_frame, text="Xóa log",
                                    command=self.clear_log)
        self.clear_btn.pack(side=tk.LEFT)
        row += 1

        # Log area
        log_frame = ttk.LabelFrame(
            main_frame, text="Log và kết quả", padding="5")
        log_frame.grid(row=row, column=0, columnspan=3,
                       sticky=(tk.W, tk.E, tk.N, tk.S), pady=10)
        log_frame.columnconfigure(0, weight=1)
        log_frame.rowconfigure(0, weight=1)
        main_frame.rowconfigure(row, weight=1)

        self.log_text = scrolledtext.ScrolledText(
            log_frame, height=15, width=80)
        self.log_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))

        # Initialize UI state
        self.toggle_output_dir()
        self.log_message("WebP Converter GUI đã sẵn sàng!")

    def setup_menu(self):
        """Thiết lập menu bar"""
        menubar = tk.Menu(self.root)
        self.root.config(menu=menubar)

        # File menu
        file_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="File", menu=file_menu)
        file_menu.add_command(label="Chọn thư mục nguồn...",
                              command=self.browse_source_dir)
        file_menu.add_command(label="Chọn thư mục đích...",
                              command=self.browse_output_dir)
        file_menu.add_separator()
        file_menu.add_command(label="Thoát", command=self.root.quit)

        # Tools menu
        tools_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Công cụ", menu=tools_menu)
        tools_menu.add_command(label="Xem trước kết quả",
                               command=self.preview_results)
        tools_menu.add_command(label="Mở thư mục log",
                               command=self.open_log_folder)
        tools_menu.add_separator()
        tools_menu.add_command(label="Cài đặt mặc định",
                               command=self.reset_settings)

        # Help menu
        help_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Trợ giúp", menu=help_menu)
        help_menu.add_command(label="Hướng dẫn sử dụng",
                              command=self.show_help)
        help_menu.add_command(label="Về chương trình", command=self.show_about)

    def preview_results(self):
        """Xem trước kết quả chuyển đổi"""
        if not self.source_dir.get():
            messagebox.showwarning(
                "Cảnh báo", "Vui lòng chọn thư mục nguồn trước!")
            return

        try:
            temp_converter = WebPConverter(self.source_dir.get())
            image_files = temp_converter.find_image_files()

            preview_text = f"Thư mục nguồn: {self.source_dir.get()}\n"
            preview_text += f"Số file ảnh tìm thấy: {len(image_files)}\n"
            preview_text += f"Chất lượng: {self.quality.get()}%\n"
            preview_text += f"Tạo backup: {'Có' if self.create_backup.get() else 'Không'}\n\n"

            if image_files:
                preview_text += "Danh sách file sẽ được chuyển đổi:\n"
                # Show first 10 files
                for i, file_path in enumerate(image_files[:10], 1):
                    preview_text += f"{i}. {file_path.name}\n"

                if len(image_files) > 10:
                    preview_text += f"... và {len(image_files) - 10} file khác\n"

            messagebox.showinfo("Xem trước kết quả", preview_text)

        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể xem trước: {str(e)}")

    def open_log_folder(self):
        """Mở thư mục chứa log files"""
        import subprocess
        import platform

        log_dir = os.path.dirname(os.path.abspath(__file__))

        try:
            if platform.system() == "Windows":
                os.startfile(log_dir)
            elif platform.system() == "Darwin":  # macOS
                subprocess.run(["open", log_dir])
            else:  # Linux
                subprocess.run(["xdg-open", log_dir])
        except Exception as e:
            messagebox.showerror("Lỗi", f"Không thể mở thư mục: {str(e)}")

    def reset_settings(self):
        """Đặt lại cài đặt mặc định"""
        self.quality.set(85)
        self.create_backup.set(False)
        self.same_as_source.set(True)
        self.toggle_output_dir()
        self.log_message("Đã đặt lại cài đặt mặc định")

    def show_help(self):
        """Hiển thị hướng dẫn sử dụng"""
        help_text = """
HƯỚNG DẪN SỬ DỤNG WEBP CONVERTER

1. CHỌN THƯ MỤC NGUỒN:
   - Nhấn nút "Browse" bên cạnh "Thư mục nguồn"
   - Chọn thư mục chứa các file ảnh cần chuyển đổi

2. CHỌN THƯ MỤC ĐÍCH:
   - Bỏ tick "Cùng thư mục nguồn" nếu muốn lưu vào thư mục khác
   - Nhấn "Browse" để chọn thư mục đích

3. ĐIỀU CHỈNH CHẤT LƯỢNG:
   - Kéo thanh trượt để chọn chất lượng (1-100%)
   - 85% là giá trị khuyến nghị

4. TÙY CHỌN BACKUP:
   - Tick vào "Tạo backup file gốc" để lưu file gốc

5. BẮT ĐẦU CHUYỂN ĐỔI:
   - Nhấn "Bắt đầu chuyển đổi"
   - Theo dõi tiến trình trong thanh progress và log

ĐỊNH DẠNG HỖ TRỢ:
PNG, JPG, JPEG, BMP, TIFF

LƯU Ý:
- WebP giúp giảm kích thước file 25-50% so với JPEG/PNG
- Chất lượng 70-90% thường cho kết quả tốt nhất
- Luôn tạo backup khi chuyển đổi lần đầu
        """

        help_window = tk.Toplevel(self.root)
        help_window.title("Hướng dẫn sử dụng")
        help_window.geometry("600x500")
        help_window.resizable(False, False)

        text_widget = scrolledtext.ScrolledText(
            help_window, wrap=tk.WORD, padx=10, pady=10)
        text_widget.pack(fill=tk.BOTH, expand=True)
        text_widget.insert(tk.END, help_text)
        text_widget.config(state=tk.DISABLED)

    def show_about(self):
        """Hiển thị thông tin về chương trình"""
        about_text = """
WebP Image Converter GUI v1.0

Chuyển đổi hàng loạt file ảnh sang định dạng WebP
để tối ưu hóa hiệu suất web.

Tính năng:
• Hỗ trợ PNG, JPG, JPEG, BMP, TIFF
• Chuyển đổi hàng loạt với progress tracking
• Tùy chọn chất lượng và backup
• Giao diện thân thiện, dễ sử dụng
• Tự động cài đặt dependencies

Phát triển bởi: Boss Linh Team
Sử dụng: Python + tkinter + Pillow

© 2024 - Graduation Project
        """
        messagebox.showinfo("Về chương trình", about_text)

    def setup_logging(self):
        """Thiết lập logging để ghi vào GUI"""
        self.gui_handler = GUILogHandler(self.log_queue)
        self.gui_handler.setLevel(logging.INFO)
        formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s')
        self.gui_handler.setFormatter(formatter)

    def check_log_queue(self):
        """Kiểm tra và hiển thị log từ queue"""
        try:
            while True:
                record = self.log_queue.get_nowait()
                self.log_text.insert(tk.END, record + '\n')
                self.log_text.see(tk.END)
        except queue.Empty:
            pass
        finally:
            self.root.after(100, self.check_log_queue)

    def log_message(self, message):
        """Ghi log message vào GUI"""
        timestamp = datetime.now().strftime('%H:%M:%S')
        formatted_message = f"[{timestamp}] {message}"
        self.log_text.insert(tk.END, formatted_message + '\n')
        self.log_text.see(tk.END)
        self.root.update_idletasks()

    def browse_source_dir(self):
        """Chọn thư mục nguồn"""
        directory = filedialog.askdirectory(title="Chọn thư mục chứa ảnh")
        if directory:
            self.source_dir.set(directory)
            self.log_message(f"Đã chọn thư mục nguồn: {directory}")

    def browse_output_dir(self):
        """Chọn thư mục đích"""
        directory = filedialog.askdirectory(title="Chọn thư mục đích")
        if directory:
            self.output_dir.set(directory)
            self.log_message(f"Đã chọn thư mục đích: {directory}")

    def toggle_output_dir(self):
        """Bật/tắt chọn thư mục đích"""
        if self.same_as_source.get():
            self.output_entry.config(state=tk.DISABLED)
            self.output_browse_btn.config(state=tk.DISABLED)
            self.output_dir.set("")
        else:
            self.output_entry.config(state=tk.NORMAL)
            self.output_browse_btn.config(state=tk.NORMAL)

    def update_quality_label(self, value):
        """Cập nhật label chất lượng"""
        quality_value = int(float(value))
        self.quality_label.config(text=f"{quality_value}%")

    def validate_inputs(self):
        """Kiểm tra tính hợp lệ của input"""
        if not self.source_dir.get():
            messagebox.showerror("Lỗi", "Vui lòng chọn thư mục nguồn!")
            return False

        if not os.path.exists(self.source_dir.get()):
            messagebox.showerror("Lỗi", "Thư mục nguồn không tồn tại!")
            return False

        if not self.same_as_source.get() and not self.output_dir.get():
            messagebox.showerror(
                "Lỗi", "Vui lòng chọn thư mục đích hoặc chọn 'Cùng thư mục nguồn'!")
            return False

        return True

    def start_conversion(self):
        """Bắt đầu quá trình chuyển đổi"""
        if not self.validate_inputs():
            return

        if self.is_converting:
            messagebox.showwarning(
                "Cảnh báo", "Quá trình chuyển đổi đang chạy!")
            return

        self.is_converting = True
        self.start_btn.config(state=tk.DISABLED)
        self.stop_btn.config(state=tk.NORMAL)
        self.progress_var.set(0)
        self.progress_label.config(text="Đang chuẩn bị...")

        # Tạo converter
        output_dir = self.output_dir.get() if not self.same_as_source.get() else None

        self.converter = WebPConverter(
            source_dir=self.source_dir.get(),
            quality=self.quality.get(),
            create_backup=self.create_backup.get(),
            output_dir=output_dir
        )

        # Thêm GUI handler vào converter logger
        converter_logger = logging.getLogger('convert_to_webp')
        converter_logger.addHandler(self.gui_handler)

        # Chạy conversion trong thread riêng
        self.conversion_thread = threading.Thread(
            target=self.run_conversion, daemon=True)
        self.conversion_thread.start()

        self.log_message("Bắt đầu quá trình chuyển đổi...")

    def run_conversion(self):
        """Chạy quá trình chuyển đổi trong thread riêng"""
        try:
            # Tạo custom converter với callback để cập nhật progress
            self.converter_with_progress()
        except Exception as e:
            self.log_queue.put(f"Lỗi: {str(e)}")
        finally:
            self.root.after(0, self.conversion_finished)

    def converter_with_progress(self):
        """Chạy converter với cập nhật progress"""
        if not self.converter.check_pillow_installation():
            raise Exception("Không thể cài đặt Pillow")

        self.log_queue.put("Đang quét thư mục tìm file ảnh...")
        image_files = self.converter.find_image_files()
        if not image_files:
            self.log_queue.put("Không tìm thấy file ảnh nào")
            return

        total_files = len(image_files)
        self.converter.stats['total_files'] = total_files
        self.log_queue.put(f"Tìm thấy {total_files} file ảnh")

        for i, file_path in enumerate(image_files, 1):
            if not self.is_converting:  # Check if stopped
                self.log_queue.put("Quá trình chuyển đổi đã bị dừng")
                break

            try:
                success, message = self.converter.convert_to_webp(file_path)
                status = "✓" if success else "✗"

                # Cập nhật progress
                progress = (i / total_files) * 100
                self.root.after(0, lambda p=progress, f=file_path.name, s=f"{status} {message}":
                                self.update_progress(p, f, s))

                self.log_queue.put(
                    f"[{i}/{total_files}] {file_path.name}: {status} {message}")

            except Exception as e:
                self.log_queue.put(
                    f"[{i}/{total_files}] {file_path.name}: ✗ Lỗi - {str(e)}")
                self.converter.stats['errors'] += 1

        # Hiển thị thống kê
        if self.is_converting:  # Only show stats if not stopped
            self.root.after(0, self.show_statistics)

    def update_progress(self, progress, filename, status):
        """Cập nhật progress bar và label"""
        self.progress_var.set(progress)
        self.progress_label.config(text=f"Đang xử lý: {filename} - {status}")

    def show_statistics(self):
        """Hiển thị thống kê kết quả"""
        stats = self.converter.stats

        stats_text = f"""
=== THỐNG KÊ CHUYỂN ĐỔI ===
Tổng số file: {stats['total_files']}
Đã chuyển đổi: {stats['converted']}
Đã bỏ qua: {stats['skipped']}
Lỗi: {stats['errors']}
"""

        if stats['size_before'] > 0:
            size_reduction = (
                1 - stats['size_after'] / stats['size_before']) * 100
            stats_text += f"""Kích thước trước: {self.format_size(stats['size_before'])}
Kích thước sau: {self.format_size(stats['size_after'])}
Tiết kiệm: {size_reduction:.1f}%"""

        self.log_queue.put(stats_text)

        # Hiển thị thông báo hoàn thành
        messagebox.showinfo("Hoàn thành",
                            f"Đã chuyển đổi {stats['converted']}/{stats['total_files']} file thành công!")

    def stop_conversion(self):
        """Dừng quá trình chuyển đổi"""
        self.is_converting = False
        self.log_message("Đang dừng quá trình chuyển đổi...")

    def conversion_finished(self):
        """Xử lý khi conversion hoàn thành"""
        self.is_converting = False
        self.start_btn.config(state=tk.NORMAL)
        self.stop_btn.config(state=tk.DISABLED)
        self.progress_label.config(
            text="Hoàn thành" if self.progress_var.get() == 100 else "Đã dừng")

    def clear_log(self):
        """Xóa log"""
        self.log_text.delete(1.0, tk.END)
        self.log_message("Log đã được xóa")

    @staticmethod
    def format_size(size_bytes):
        """Định dạng kích thước file"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} TB"


class GUILogHandler(logging.Handler):
    """Custom log handler để ghi log vào GUI queue"""

    def __init__(self, log_queue):
        super().__init__()
        self.log_queue = log_queue

    def emit(self, record):
        log_entry = self.format(record)
        self.log_queue.put(log_entry)


def main():
    """Hàm main để chạy GUI"""
    root = tk.Tk()

    # Thiết lập style
    style = ttk.Style()
    if 'winnative' in style.theme_names():
        style.theme_use('winnative')
    elif 'clam' in style.theme_names():
        style.theme_use('clam')

    app = WebPConverterGUI(root)

    try:
        root.mainloop()
    except KeyboardInterrupt:
        print("GUI đã được đóng")


if __name__ == '__main__':
    main()
