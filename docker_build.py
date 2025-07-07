import os
import subprocess
import sys
import time


def print_header(title):
    """In tiêu đề được định dạng"""
    print("\n" + "=" * 70)
    print(f" {title} ".center(70, "="))
    print("=" * 70)


def run_python_script(script_name):
    """Chạy một script Python và trả về kết quả"""
    print(f"\n> Executing: python {script_name}")
    result = subprocess.run(f"python {script_name}", shell=True)
    return result.returncode == 0


def display_menu():
    """Hiển thị menu và trả về lựa chọn của người dùng"""
    print_header("DOCKER IMAGE BUILDER")
    print("\nCông cụ này sẽ giúp bạn build Docker image cho backend và đẩy lên Docker Hub.")
    print("\nCác lựa chọn:")
    print("1. Kiểm tra môi trường Docker")
    print("2. Build Docker image")
    print("3. Hướng dẫn push image lên Docker Hub")
    print("4. Đọc hướng dẫn đầy đủ")
    print("5. Thoát")

    try:
        choice = int(input("\nNhập lựa chọn của bạn (1-5): "))
        if 1 <= choice <= 5:
            return choice
        else:
            print("Lựa chọn không hợp lệ. Vui lòng chọn từ 1-5.")
            return None
    except ValueError:
        print("Vui lòng nhập một số từ 1-5.")
        return None


def display_push_instructions():
    """Hiển thị hướng dẫn push image lên Docker Hub"""
    print_header("PUSH DOCKER IMAGE LÊN DOCKER HUB")

    image_name = "question-bank-backend:latest"

    print("\n1. Đăng nhập vào Docker Hub:")
    print("   docker login")

    print("\n2. Đánh tag cho image với username của bạn:")
    print(
        f"   docker tag {image_name} your-username/question-bank-backend:latest")

    print("\n3. Push image lên Docker Hub:")
    print("   docker push your-username/question-bank-backend:latest")

    print("\n4. Kiểm tra trên Docker Hub:")
    print("   https://hub.docker.com/repository/docker/your-username/question-bank-backend")

    input("\nNhấn Enter để quay lại menu chính...")


def display_readme():
    """Hiển thị nội dung của file README"""
    try:
        with open("docker_build_README.md", "r", encoding="utf-8") as f:
            content = f.read()
            print("\n" + content)
    except FileNotFoundError:
        print("\nKhông tìm thấy file hướng dẫn docker_build_README.md!")

    input("\nNhấn Enter để quay lại menu chính...")


def main():
    """Hàm chính điều khiển chương trình"""
    while True:
        choice = display_menu()

        if choice == 1:
            # Kiểm tra môi trường
            run_python_script("check_docker_env.py")
            input("\nNhấn Enter để quay lại menu chính...")

        elif choice == 2:
            # Build Docker image
            print_header("BUILD DOCKER IMAGE")
            confirm = input(
                "Bạn có chắc chắn muốn build Docker image không? (y/n): ")
            if confirm.lower() == "y":
                run_python_script("build_docker_image.py")
            else:
                print("Đã hủy build Docker image.")
            input("\nNhấn Enter để quay lại menu chính...")

        elif choice == 3:
            # Hướng dẫn push image
            display_push_instructions()

        elif choice == 4:
            # Đọc hướng dẫn
            display_readme()

        elif choice == 5:
            # Thoát
            print("\nCảm ơn bạn đã sử dụng công cụ Build Docker Image!")
            sys.exit(0)

        else:
            # Lựa chọn không hợp lệ
            time.sleep(1)


if __name__ == "__main__":
    # Kiểm tra xem các file cần thiết có tồn tại không
    required_files = ["check_docker_env.py",
                      "build_docker_image.py", "docker_build_README.md"]
    missing_files = [
        file for file in required_files if not os.path.exists(file)]

    if missing_files:
        print("❌ Không tìm thấy các file cần thiết:")
        for file in missing_files:
            print(f"  - {file}")
        print("\nVui lòng đảm bảo tất cả các file đã được tạo.")
        sys.exit(1)

    main()
