@echo off
echo Running database migration to add default constraint for MaDeThi...
echo.

REM Replace these values with your actual database connection details
set SERVER=localhost
set DATABASE=question_bank
set USERNAME=your_username
set PASSWORD=your_password

REM Run the migration script
sqlcmd -S %SERVER% -d %DATABASE% -U %USERNAME% -P %PASSWORD% -i database\add_default_constraint.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Migration completed successfully!
    echo The default constraint for MaDeThi column has been added.
) else (
    echo.
    echo Migration failed! Please check the error messages above.
)

pause
