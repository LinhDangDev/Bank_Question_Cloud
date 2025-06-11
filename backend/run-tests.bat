@echo off
echo Question Bank API Test Runner
echo ===========================
echo.

:menu
echo Choose a test method:
echo 1. Run Node.js test script
echo 2. Run Python test script
echo 3. Open Swagger UI in browser
echo 4. Exit
echo.

set /p choice=Enter your choice (1-4):

if "%choice%"=="1" goto nodejs
if "%choice%"=="2" goto python
if "%choice%"=="3" goto swagger
if "%choice%"=="4" goto end

echo Invalid choice. Please try again.
goto menu

:nodejs
echo.
echo Running Node.js test script...
node test-api.js
echo.
pause
goto menu

:python
echo.
echo Running Python test script...
python test-api.py
echo.
pause
goto menu

:swagger
echo.
echo Opening Swagger UI in browser...
start http://localhost:3000/api
echo.
pause
goto menu

:end
echo.
echo Thank you for using the Question Bank API Test Runner!
echo.
