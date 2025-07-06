#!/bin/bash
# WebP Converter Shell Script
# Chạy WebP converter với các tùy chọn phổ biến

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONVERTER_SCRIPT="$SCRIPT_DIR/convert_to_webp.py"
TEST_SCRIPT="$SCRIPT_DIR/test_webp_converter.py"

echo "============================================================"
echo "                    WEBP CONVERTER"
echo "============================================================"
echo

# Kiểm tra Python
if ! command -v python3 &> /dev/null; then
    echo "Lỗi: Python3 không được cài đặt hoặc không có trong PATH"
    echo "Vui lòng cài đặt Python 3.6+ trước khi sử dụng"
    exit 1
fi

# Kiểm tra script tồn tại
if [ ! -f "$CONVERTER_SCRIPT" ]; then
    echo "Lỗi: Không tìm thấy convert_to_webp.py"
    echo "Đảm bảo file script ở cùng thư mục với shell script này"
    exit 1
fi

show_menu() {
    echo "Chọn chế độ chuyển đổi:"
    echo
    echo "1. Chuyển đổi cơ bản (chất lượng 85%)"
    echo "2. Chuyển đổi chất lượng cao (chất lượng 95% + backup)"
    echo "3. Chuyển đổi tối ưu kích thước (chất lượng 70%)"
    echo "4. Chuyển đổi tùy chỉnh"
    echo "5. Chạy test"
    echo "6. Thoát"
    echo
}

read_input() {
    local prompt="$1"
    local default="$2"
    local result
    
    if [ -n "$default" ]; then
        read -p "$prompt (mặc định: $default): " result
        echo "${result:-$default}"
    else
        read -p "$prompt: " result
        echo "$result"
    fi
}

validate_directory() {
    local dir="$1"
    if [ ! -d "$dir" ]; then
        echo "Lỗi: Thư mục '$dir' không tồn tại"
        return 1
    fi
    return 0
}

basic_conversion() {
    echo
    echo "=== CHUYỂN ĐỔI CƠ BẢN ==="
    local source_dir
    source_dir=$(read_input "Nhập đường dẫn thư mục chứa ảnh")
    
    if ! validate_directory "$source_dir"; then
        return 1
    fi
    
    echo
    echo "Đang chuyển đổi với chất lượng 85%..."
    python3 "$CONVERTER_SCRIPT" "$source_dir" --quality 85
}

high_quality_conversion() {
    echo
    echo "=== CHUYỂN ĐỔI CHẤT LƯỢNG CAO ==="
    local source_dir
    source_dir=$(read_input "Nhập đường dẫn thư mục chứa ảnh")
    
    if ! validate_directory "$source_dir"; then
        return 1
    fi
    
    echo
    echo "Đang chuyển đổi với chất lượng 95% và tạo backup..."
    python3 "$CONVERTER_SCRIPT" "$source_dir" --quality 95 --backup
}

optimize_size_conversion() {
    echo
    echo "=== TỐI ƯU KÍCH THƯỚC ==="
    local source_dir
    source_dir=$(read_input "Nhập đường dẫn thư mục chứa ảnh")
    
    if ! validate_directory "$source_dir"; then
        return 1
    fi
    
    echo
    echo "Đang chuyển đổi với chất lượng 70% để tối ưu kích thước..."
    python3 "$CONVERTER_SCRIPT" "$source_dir" --quality 70
}

custom_conversion() {
    echo
    echo "=== CHUYỂN ĐỔI TÙY CHỈNH ==="
    local source_dir quality backup_choice output_dir
    local backup_flag="" output_flag=""
    
    source_dir=$(read_input "Nhập đường dẫn thư mục chứa ảnh")
    if ! validate_directory "$source_dir"; then
        return 1
    fi
    
    quality=$(read_input "Nhập chất lượng (1-100)" "85")
    
    # Validate quality
    if ! [[ "$quality" =~ ^[0-9]+$ ]] || [ "$quality" -lt 1 ] || [ "$quality" -gt 100 ]; then
        echo "Lỗi: Chất lượng phải là số từ 1 đến 100"
        return 1
    fi
    
    backup_choice=$(read_input "Tạo backup? (y/n)" "n")
    if [[ "$backup_choice" =~ ^[Yy]$ ]]; then
        backup_flag="--backup"
    fi
    
    output_dir=$(read_input "Thư mục đích (để trống = cùng thư mục nguồn)" "")
    if [ -n "$output_dir" ]; then
        output_flag="--output $output_dir"
    fi
    
    echo
    echo "Đang chuyển đổi với các tùy chọn tùy chỉnh..."
    python3 "$CONVERTER_SCRIPT" "$source_dir" --quality "$quality" $backup_flag $output_flag
}

run_test() {
    echo
    echo "=== CHẠY TEST ==="
    echo "Đang chạy test để kiểm tra hoạt động của converter..."
    
    if [ ! -f "$TEST_SCRIPT" ]; then
        echo "Lỗi: Không tìm thấy test_webp_converter.py"
        return 1
    fi
    
    python3 "$TEST_SCRIPT"
}

main() {
    while true; do
        show_menu
        local choice
        choice=$(read_input "Nhập lựa chọn (1-6)")
        
        case $choice in
            1)
                basic_conversion
                ;;
            2)
                high_quality_conversion
                ;;
            3)
                optimize_size_conversion
                ;;
            4)
                custom_conversion
                ;;
            5)
                run_test
                ;;
            6)
                echo
                echo "Tạm biệt!"
                exit 0
                ;;
            *)
                echo
                echo "Lựa chọn không hợp lệ. Vui lòng chọn từ 1-6."
                ;;
        esac
        
        echo
        echo "Nhấn Enter để tiếp tục..."
        read
        echo
    done
}

# Chạy script
main
