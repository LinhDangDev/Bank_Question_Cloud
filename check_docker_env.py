import subprocess
import sys
import os


def check_docker_installation():
    """Kiểm tra Docker đã được cài đặt và hoạt động chưa"""
    try:
        result = subprocess.run(
            "docker --version", shell=True, capture_output=True, text=True)
        if result.returncode != 0:
            print("❌ Docker không được cài đặt hoặc không chạy.")
            print("Vui lòng cài đặt Docker và khởi động nó.")
            return False

        print(f"✅ Docker đã được cài đặt: {result.stdout.strip()}")

        # Kiểm tra Docker daemon có đang chạy không
        result = subprocess.run("docker info", shell=True,
                                capture_output=True, text=True)
        if result.returncode != 0:
            print("❌ Docker daemon không chạy. Vui lòng khởi động Docker.")
            return False

        print("✅ Docker daemon đang chạy.")
        return True
    except Exception as e:
        print(f"❌ Lỗi khi kiểm tra Docker: {str(e)}")
        return False


def check_backend_folder():
    """Kiểm tra thư mục backend và Dockerfile.production"""
    if not os.path.isdir("backend"):
        print("❌ Không tìm thấy thư mục backend.")
        return False

    if not os.path.exists("backend/Dockerfile.production"):
        print("❌ Không tìm thấy file Dockerfile.production trong thư mục backend.")
        return False

    print("✅ Thư mục backend và Dockerfile.production đã sẵn sàng.")
    return True


def check_disk_space():
    """Kiểm tra không gian đĩa trống"""
    try:
        if sys.platform == "win32":
            # Windows
            result = subprocess.run("wmic LogicalDisk where DeviceID='C:' get FreeSpace",
                                    shell=True, capture_output=True, text=True)
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                if len(lines) >= 2:
                    free_bytes = int(lines[1].strip())
                    free_gb = free_bytes / (1024**3)
                    print(f"✅ Không gian đĩa trống: {free_gb:.2f} GB")
                    return free_gb > 5  # Cần ít nhất 5GB
        else:
            # Linux/Mac
            result = subprocess.run("df -h / | awk 'NR==2 {print $4}'",
                                    shell=True, capture_output=True, text=True)
            if result.returncode == 0:
                free = result.stdout.strip()
                print(f"✅ Không gian đĩa trống: {free}")
                # Giá trị trả về có thể là "5.2G", v.v.
                return True
    except Exception as e:
        print(f"⚠️ Không thể kiểm tra không gian đĩa: {str(e)}")

    return True  # Mặc định cho phép tiếp tục


def main():
    """Kiểm tra môi trường Docker"""
    print("=" * 70)
    print("🔍 KIỂM TRA MÔI TRƯỜNG DOCKER")
    print("=" * 70)

    all_checks_passed = True

    # Kiểm tra Docker
    if not check_docker_installation():
        all_checks_passed = False

    # Kiểm tra thư mục backend
    if not check_backend_folder():
        all_checks_passed = False

    # Kiểm tra không gian đĩa trống
    if not check_disk_space():
        print("⚠️ Cảnh báo: Không đủ không gian đĩa trống (khuyến nghị >5GB).")

    print("\n" + "=" * 70)
    if all_checks_passed:
        print("✅ Tất cả kiểm tra đã thành công! Môi trường sẵn sàng để build Docker image.")
        print("Thực hiện lệnh sau để tiếp tục: python build_docker_image.py")
    else:
        print("❌ Một hoặc nhiều kiểm tra không thành công. Vui lòng khắc phục các vấn đề trên.")
    print("=" * 70)

    return all_checks_passed


if __name__ == "__main__":
    main()
