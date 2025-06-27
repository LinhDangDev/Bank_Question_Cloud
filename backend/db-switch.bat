@echo off
echo "=========================================="
echo "      DATABASE CONNECTION SWITCHER"
echo "=========================================="
echo.

:MENU
echo Choose database connection:
echo 1. Remote SQL Server (103.173.226.35)
echo 2. Local SQL Server (Windows Auth)
echo 3. Test connections
echo 4. Exit
echo.

set /p option="Enter option (1-4): "

if "%option%"=="1" (
    echo Switching to Remote SQL Server...
    node -e "const fs = require('fs'); const path = require('path'); const envPath = path.resolve(__dirname, '.env'); const content = fs.readFileSync(envPath, 'utf8').replace(/DB_ENV=local/g, 'DB_ENV=server'); fs.writeFileSync(envPath, content);"
    echo Environment updated to server mode.
    echo Restart your application for changes to take effect.
    goto END
)

if "%option%"=="2" (
    echo Switching to Local SQL Server with Windows Authentication...
    node -e "const fs = require('fs'); const path = require('path'); const envPath = path.resolve(__dirname, '.env'); const content = fs.readFileSync(envPath, 'utf8').replace(/DB_ENV=server/g, 'DB_ENV=local'); fs.writeFileSync(envPath, content);"
    echo Environment updated to local mode.
    echo Restart your application for changes to take effect.
    goto END
)

if "%option%"=="3" (
    echo Testing database connections...
    node test-sql-connection.js
    goto MENU
)

if "%option%"=="4" (
    echo Exiting...
    goto END
) else (
    echo Invalid option. Please try again.
    goto MENU
)

:END
echo.
echo "=========================================="
pause
