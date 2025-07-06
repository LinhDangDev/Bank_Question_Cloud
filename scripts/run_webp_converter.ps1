# WebP Converter PowerShell Script
# Chạy WebP converter với các tùy chọn phổ biến

param(
    [string]$SourceDir = "",
    [int]$Quality = 85,
    [switch]$Backup,
    [string]$OutputDir = "",
    [switch]$Test,
    [switch]$Help
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ConverterScript = Join-Path $ScriptDir "convert_to_webp.py"
$TestScript = Join-Path $ScriptDir "test_webp_converter.py"

function Show-Header {
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "                    WEBP CONVERTER" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Help {
    Write-Host "WebP Converter PowerShell Script" -ForegroundColor Green
    Write-Host ""
    Write-Host "Cách sử dụng:"
    Write-Host "  .\run_webp_converter.ps1 [tùy chọn]"
    Write-Host ""
    Write-Host "Tùy chọn:"
    Write-Host "  -SourceDir <path>    Thư mục chứa ảnh cần chuyển đổi"
    Write-Host "  -Quality <1-100>     Chất lượng nén (mặc định: 85)"
    Write-Host "  -Backup              Tạo backup file gốc"
    Write-Host "  -OutputDir <path>    Thư mục đích (mặc định: cùng thư mục nguồn)"
    Write-Host "  -Test                Chạy test"
    Write-Host "  -Help                Hiển thị trợ giúp này"
    Write-Host ""
    Write-Host "Ví dụ:"
    Write-Host "  .\run_webp_converter.ps1 -SourceDir 'C:\Images' -Quality 90 -Backup"
    Write-Host "  .\run_webp_converter.ps1 -Test"
}

function Test-PythonInstallation {
    try {
        $pythonVersion = python --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Python đã được cài đặt: $pythonVersion" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "✗ Python không được cài đặt hoặc không có trong PATH" -ForegroundColor Red
        Write-Host "Vui lòng cài đặt Python 3.6+ và thêm vào PATH" -ForegroundColor Yellow
        return $false
    }
    return $false
}

function Test-ScriptExists {
    if (-not (Test-Path $ConverterScript)) {
        Write-Host "✗ Không tìm thấy convert_to_webp.py" -ForegroundColor Red
        Write-Host "Đảm bảo file script ở cùng thư mục với PowerShell script này" -ForegroundColor Yellow
        return $false
    }
    Write-Host "✓ Script converter đã sẵn sàng" -ForegroundColor Green
    return $true
}

function Test-DirectoryExists {
    param([string]$Path)
    
    if (-not (Test-Path $Path -PathType Container)) {
        Write-Host "✗ Thư mục '$Path' không tồn tại" -ForegroundColor Red
        return $false
    }
    return $true
}

function Show-Menu {
    Write-Host "Chọn chế độ chuyển đổi:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Chuyển đổi cơ bản (chất lượng 85%)"
    Write-Host "2. Chuyển đổi chất lượng cao (chất lượng 95% + backup)"
    Write-Host "3. Chuyển đổi tối ưu kích thước (chất lượng 70%)"
    Write-Host "4. Chuyển đổi tùy chỉnh"
    Write-Host "5. Chạy test"
    Write-Host "6. Thoát"
    Write-Host ""
}

function Get-UserInput {
    param(
        [string]$Prompt,
        [string]$Default = ""
    )
    
    if ($Default) {
        $input = Read-Host "$Prompt (mặc định: $Default)"
        if ([string]::IsNullOrWhiteSpace($input)) {
            return $Default
        }
        return $input
    }
    else {
        return Read-Host $Prompt
    }
}

function Invoke-BasicConversion {
    Write-Host ""
    Write-Host "=== CHUYỂN ĐỔI CƠ BẢN ===" -ForegroundColor Green
    
    $sourceDir = Get-UserInput "Nhập đường dẫn thư mục chứa ảnh"
    if (-not (Test-DirectoryExists $sourceDir)) {
        return
    }
    
    Write-Host ""
    Write-Host "Đang chuyển đổi với chất lượng 85%..." -ForegroundColor Yellow
    python $ConverterScript $sourceDir --quality 85
}

function Invoke-HighQualityConversion {
    Write-Host ""
    Write-Host "=== CHUYỂN ĐỔI CHẤT LƯỢNG CAO ===" -ForegroundColor Green
    
    $sourceDir = Get-UserInput "Nhập đường dẫn thư mục chứa ảnh"
    if (-not (Test-DirectoryExists $sourceDir)) {
        return
    }
    
    Write-Host ""
    Write-Host "Đang chuyển đổi với chất lượng 95% và tạo backup..." -ForegroundColor Yellow
    python $ConverterScript $sourceDir --quality 95 --backup
}

function Invoke-OptimizeSizeConversion {
    Write-Host ""
    Write-Host "=== TỐI ƯU KÍCH THƯỚC ===" -ForegroundColor Green
    
    $sourceDir = Get-UserInput "Nhập đường dẫn thư mục chứa ảnh"
    if (-not (Test-DirectoryExists $sourceDir)) {
        return
    }
    
    Write-Host ""
    Write-Host "Đang chuyển đổi với chất lượng 70% để tối ưu kích thước..." -ForegroundColor Yellow
    python $ConverterScript $sourceDir --quality 70
}

function Invoke-CustomConversion {
    Write-Host ""
    Write-Host "=== CHUYỂN ĐỔI TÙY CHỈNH ===" -ForegroundColor Green
    
    $sourceDir = Get-UserInput "Nhập đường dẫn thư mục chứa ảnh"
    if (-not (Test-DirectoryExists $sourceDir)) {
        return
    }
    
    $quality = Get-UserInput "Nhập chất lượng (1-100)" "85"
    if (-not ($quality -match '^\d+$') -or [int]$quality -lt 1 -or [int]$quality -gt 100) {
        Write-Host "✗ Chất lượng phải là số từ 1 đến 100" -ForegroundColor Red
        return
    }
    
    $backupChoice = Get-UserInput "Tạo backup? (y/n)" "n"
    $backupFlag = if ($backupChoice -match '^[Yy]$') { "--backup" } else { "" }
    
    $outputDir = Get-UserInput "Thư mục đích (để trống = cùng thư mục nguồn)" ""
    $outputFlag = if ($outputDir) { "--output `"$outputDir`"" } else { "" }
    
    Write-Host ""
    Write-Host "Đang chuyển đổi với các tùy chọn tùy chỉnh..." -ForegroundColor Yellow
    
    $args = @($sourceDir, "--quality", $quality)
    if ($backupFlag) { $args += "--backup" }
    if ($outputFlag) { $args += "--output"; $args += $outputDir }
    
    python $ConverterScript @args
}

function Invoke-Test {
    Write-Host ""
    Write-Host "=== CHẠY TEST ===" -ForegroundColor Green
    Write-Host "Đang chạy test để kiểm tra hoạt động của converter..." -ForegroundColor Yellow
    
    if (-not (Test-Path $TestScript)) {
        Write-Host "✗ Không tìm thấy test_webp_converter.py" -ForegroundColor Red
        return
    }
    
    python $TestScript
}

function Start-InteractiveMode {
    while ($true) {
        Show-Menu
        $choice = Read-Host "Nhập lựa chọn (1-6)"
        
        switch ($choice) {
            "1" { Invoke-BasicConversion }
            "2" { Invoke-HighQualityConversion }
            "3" { Invoke-OptimizeSizeConversion }
            "4" { Invoke-CustomConversion }
            "5" { Invoke-Test }
            "6" { 
                Write-Host ""
                Write-Host "Tạm biệt!" -ForegroundColor Green
                return 
            }
            default {
                Write-Host ""
                Write-Host "Lựa chọn không hợp lệ. Vui lòng chọn từ 1-6." -ForegroundColor Red
            }
        }
        
        Write-Host ""
        Write-Host "Nhấn Enter để tiếp tục..." -ForegroundColor Gray
        Read-Host
        Write-Host ""
    }
}

# Main execution
Show-Header

if ($Help) {
    Show-Help
    exit 0
}

if (-not (Test-PythonInstallation)) {
    exit 1
}

if (-not (Test-ScriptExists)) {
    exit 1
}

if ($Test) {
    Invoke-Test
    exit 0
}

if ($SourceDir) {
    # Command line mode
    if (-not (Test-DirectoryExists $SourceDir)) {
        exit 1
    }
    
    $args = @($SourceDir, "--quality", $Quality)
    if ($Backup) { $args += "--backup" }
    if ($OutputDir) { $args += "--output"; $args += $OutputDir }
    
    Write-Host "Đang chuyển đổi..." -ForegroundColor Yellow
    python $ConverterScript @args
}
else {
    # Interactive mode
    Start-InteractiveMode
}
