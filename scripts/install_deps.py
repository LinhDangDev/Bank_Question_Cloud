

import sys
import subprocess
import os


def install_package(package):
    print(f"Installing {package}...")
    try:
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", package])
        print(f"Successfully installed {package}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Failed to install {package}: {e}")
        return False


if __name__ == "__main__":
    required_packages = ["python-docx"]

    print(f"Python executable: {sys.executable}")
    print(f"Python version: {sys.version}")

    success = True
    for package in required_packages:
        if not install_package(package):
            success = False

    if success:
        print("All dependencies installed successfully!")
    else:
        print("Some dependencies failed to install.")
        sys.exit(1)
