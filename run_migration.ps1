# PowerShell script to run database migration
Write-Host "Running database migration to add default constraint for MaDeThi..." -ForegroundColor Green
Write-Host ""

# Replace these values with your actual database connection details
$Server = "localhost"
$Database = "question_bank"


# Path to the migration script
$MigrationScript = "database\add_default_constraint.sql"

# Check if the migration script exists
if (-not (Test-Path $MigrationScript)) {
    Write-Host "Error: Migration script not found at $MigrationScript" -ForegroundColor Red
    exit 1
}

try {
    # Run the migration script using sqlcmd
    $Command = "sqlcmd -S $Server -d $Database -U $Username -P $Password -i `"$MigrationScript`""

    Write-Host "Executing: $Command" -ForegroundColor Yellow
    Write-Host ""

    Invoke-Expression $Command

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Migration completed successfully!" -ForegroundColor Green
        Write-Host "The default constraint for MaDeThi column has been added." -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "Migration failed! Please check the error messages above." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error running migration: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
