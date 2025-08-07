@echo off
echo Installing Python packages for Exam Word Export...
echo Author: Linh Dang Dev

echo.
echo Checking Python installation...
python --version
if %errorlevel% neq 0 (
    echo Python not found! Please install Python 3.x first.
    pause
    exit /b 1
)

echo.
echo Installing required packages...
pip install python-docx pyodbc

echo.
echo Testing installation...
python -c "import docx, pyodbc; print('All packages installed successfully!')"

if %errorlevel% equ 0 (
    echo.
    echo ✅ Python environment setup completed!
    echo You can now use the Python-based Word export feature.
) else (
    echo.
    echo ❌ Package installation failed!
    echo Please check the error messages above.
)

echo.
pause
