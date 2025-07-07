import os
import subprocess
import sys
import time


def run_command(command, error_message=None):
    """Chạy lệnh và trả về True nếu thành công, False nếu thất bại"""
    print(f"\n> Executing: {command}")
    result = subprocess.run(command, shell=True,
                            capture_output=True, text=True)

    if result.returncode != 0:
        print(
            f"\n❌ Error: {error_message if error_message else result.stderr}")
        return False

    print(f"✅ Success")
    if result.stdout:
        print(result.stdout)

    return True


def build_docker_image():
    # Đặt tên cho image
    image_name = "question-bank-backend"
    tag = time.strftime("%Y%m%d-%H%M")
    full_image_name = f"{image_name}:{tag}"

    print("=" * 80)
    print(f"🔨 Building Docker image: {full_image_name}")
    print("=" * 80)

    # Di chuyển vào thư mục backend
    os.chdir("backend")

    # Kiểm tra Dockerfile.production tồn tại
    if not os.path.exists("Dockerfile.production"):
        print("❌ Error: Dockerfile.production not found in backend directory")
        return False

    # Build Docker image
    build_cmd = f"docker build -t {full_image_name} -f Dockerfile.production ."
    if not run_command(build_cmd, "Failed to build Docker image"):
        return False

    # Tạo tag latest
    latest_tag = f"{image_name}:latest"
    tag_cmd = f"docker tag {full_image_name} {latest_tag}"
    if not run_command(tag_cmd, "Failed to create latest tag"):
        return False

    print("\n" + "=" * 80)
    print(f"🎉 Docker image built successfully!")
    print(f"📋 Image name: {full_image_name}")
    print(f"📋 Latest tag: {latest_tag}")
    print("=" * 80)

    print("\n📝 Push image to Docker Hub instruction:")
    print("1. Log in to Docker Hub:")
    print("   docker login")
    print("2. Push the image with tag:")
    print(f"   docker tag {full_image_name} your-username/{image_name}:{tag}")
    print(f"   docker push your-username/{image_name}:{tag}")
    print("3. Push the latest version:")
    print(f"   docker tag {latest_tag} your-username/{image_name}:latest")
    print(f"   docker push your-username/{image_name}:latest")

    return True


if __name__ == "__main__":
    build_docker_image()
