@echo off
REM WebP Converter Batch Script
REM Chạy WebP converter với các tùy chọn phổ biến

setlocal enabledelayedexpansion

echo ============================================================
echo                    WEBP CONVERTER
echo ============================================================
echo.

REM Kiểm tra Python
python --version >nul 2>&1
if errorlevel 1 (
    echo Lỗi: Python không được cài đặt hoặc không có trong PATH
    echo Vui lòng cài đặt Python 3.6+ và thêm vào PATH
    pause
    exit /b 1
)

REM Kiểm tra script tồn tại
if not exist "%~dp0convert_to_webp.py" (
    echo Lỗi: Không tìm thấy convert_to_webp.py
    echo Đảm bảo file script ở cùng thư mục với batch file này
    pause
    exit /b 1
)

echo Chọn chế độ chuyển đổi:
echo.
echo 1. Chuyển đổi cơ bản (chất lượng 85%%)
echo 2. Chuyển đổi chất lượng cao (chất lượng 95%% + backup)
echo 3. Chuyển đổi tối ưu kích thước (chất lượng 70%%)
echo 4. Chuyển đổi tùy chỉnh
echo 5. Chạy test
echo 6. Thoát
echo.

set /p choice="Nhập lựa chọn (1-6): "

if "%choice%"=="1" goto basic
if "%choice%"=="2" goto high_quality
if "%choice%"=="3" goto optimize_size
if "%choice%"=="4" goto custom
if "%choice%"=="5" goto test
if "%choice%"=="6" goto exit
goto invalid_choice

:basic
echo.
echo === CHUYỂN ĐỔI CỞ BẢN ===
set /p source_dir="Nhập đường dẫn thư mục chứa ảnh: "
if not exist "!source_dir!" (
    echo Lỗi: Thư mục không tồn tại
    pause
    goto end
)
echo.
echo Đang chuyển đổi với chất lượng 85%%...
python "%~dp0convert_to_webp.py" "!source_dir!" --quality 85
goto end

:high_quality
echo.
echo === CHUYỂN ĐỔI CHẤT LƯỢNG CAO ===
set /p source_dir="Nhập đường dẫn thư mục chứa ảnh: "
if not exist "!source_dir!" (
    echo Lỗi: Thư mục không tồn tại
    pause
    goto end
)
echo.
echo Đang chuyển đổi với chất lượng 95%% và tạo backup...
python "%~dp0convert_to_webp.py" "!source_dir!" --quality 95 --backup
goto end

:optimize_size
echo.
echo === TỐI ƯU KÍCH THƯỚC ===
set /p source_dir="Nhập đường dẫn thư mục chứa ảnh: "
if not exist "!source_dir!" (
    echo Lỗi: Thư mục không tồn tại
    pause
    goto end
)
echo.
echo Đang chuyển đổi với chất lượng 70%% để tối ưu kích thước...
python "%~dp0convert_to_webp.py" "!source_dir!" --quality 70
goto end

:custom
echo.
echo === CHUYỂN ĐỔI TÙY CHỈNH ===
set /p source_dir="Nhập đường dẫn thư mục chứa ảnh: "
if not exist "!source_dir!" (
    echo Lỗi: Thư mục không tồn tại
    pause
    goto end
)

set /p quality="Nhập chất lượng (1-100, mặc định 85): "
if "%quality%"=="" set quality=85

set /p backup_choice="Tạo backup? (y/n, mặc định n): "
set backup_flag=
if /i "%backup_choice%"=="y" set backup_flag=--backup

set /p output_dir="Thư mục đích (để trống = cùng thư mục nguồn): "
set output_flag=
if not "%output_dir%"=="" set output_flag=--output "!output_dir!"

echo.
echo Đang chuyển đổi với các tùy chọn tùy chỉnh...
python "%~dp0convert_to_webp.py" "!source_dir!" --quality !quality! !backup_flag! !output_flag!
goto end

:test
echo.
echo === CHẠY TEST ===
echo Đang chạy test để kiểm tra hoạt động của converter...
python "%~dp0test_webp_converter.py"
goto end

:invalid_choice
echo.
echo Lựa chọn không hợp lệ. Vui lòng chọn từ 1-6.
pause
goto start

:exit
echo.
echo Tạm biệt!
goto end

:end
echo.
echo Nhấn phím bất kỳ để tiếp tục...
pause >nul
