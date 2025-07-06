# PowerShell script để push Docker image
Write-Host "🚀 Docker Push Script" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green

# Kiểm tra Docker
Write-Host "`n🔍 Kiểm tra Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker đã sẵn sàng: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker không được cài đặt hoặc không chạy!" -ForegroundColor Red
    exit 1
}

# Kiểm tra image
Write-Host "`n🔍 Kiểm tra image question-bank-backend..." -ForegroundColor Yellow
$imageCheck = docker images question-bank-backend --format "table {{.Repository}}:{{.Tag}}"
if ($imageCheck -match "question-bank-backend") {
    Write-Host "✅ Tìm thấy image question-bank-backend" -ForegroundColor Green
} else {
    Write-Host "❌ Không tìm thấy image question-bank-backend!" -ForegroundColor Red
    Write-Host "💡 Hãy build image trước: docker build -t question-bank-backend:latest ." -ForegroundColor Yellow
    exit 1
}

# Thông tin push
$dockerUsername = "LightHunter15723"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$localImage = "question-bank-backend:latest"
$tagLatest = "$dockerUsername/question-bank-backend:latest"
$tagTimestamp = "$dockerUsername/question-bank-backend:$timestamp"

Write-Host "`n📋 Thông tin push:" -ForegroundColor Cyan
Write-Host "   Local Image: $localImage" -ForegroundColor White
Write-Host "   Remote Latest: $tagLatest" -ForegroundColor White
Write-Host "   Remote Timestamp: $tagTimestamp" -ForegroundColor White

# Xác nhận
$confirm = Read-Host "`nTiếp tục? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "❌ Hủy bỏ!" -ForegroundColor Red
    exit 0
}

# Tag images
Write-Host "`n🏷️  Tagging images..." -ForegroundColor Yellow
try {
    docker tag $localImage $tagLatest
    Write-Host "✅ Tagged as $tagLatest" -ForegroundColor Green
    
    docker tag $localImage $tagTimestamp
    Write-Host "✅ Tagged as $tagTimestamp" -ForegroundColor Green
} catch {
    Write-Host "❌ Tagging thất bại!" -ForegroundColor Red
    exit 1
}

# Đăng nhập Docker Hub
Write-Host "`n🔐 Đăng nhập Docker Hub..." -ForegroundColor Yellow
Write-Host "💡 Nếu gặp lỗi, hãy tạo Personal Access Token tại:" -ForegroundColor Cyan
Write-Host "   https://app.docker.com/settings/personal-access-tokens" -ForegroundColor Cyan

try {
    docker login -u $dockerUsername
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Đăng nhập thành công!" -ForegroundColor Green
    } else {
        Write-Host "❌ Đăng nhập thất bại!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Lỗi đăng nhập!" -ForegroundColor Red
    exit 1
}

# Push images
Write-Host "`n📦 Pushing images..." -ForegroundColor Yellow

Write-Host "Pushing $tagLatest..." -ForegroundColor Cyan
docker push $tagLatest
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Push $tagLatest thành công!" -ForegroundColor Green
} else {
    Write-Host "❌ Push $tagLatest thất bại!" -ForegroundColor Red
    exit 1
}

Write-Host "Pushing $tagTimestamp..." -ForegroundColor Cyan
docker push $tagTimestamp
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Push $tagTimestamp thành công!" -ForegroundColor Green
} else {
    Write-Host "❌ Push $tagTimestamp thất bại!" -ForegroundColor Red
    exit 1
}

# Hoàn thành
Write-Host "`n🎉 Push hoàn thành!" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Green
Write-Host "✅ Images đã được push lên Docker Hub:" -ForegroundColor Green
Write-Host "   📦 $tagLatest" -ForegroundColor White
Write-Host "   📦 $tagTimestamp" -ForegroundColor White
Write-Host "`n🚀 Để chạy container:" -ForegroundColor Cyan
Write-Host "   docker run -p 3001:3001 $tagLatest" -ForegroundColor White
Write-Host "`n🌐 Docker Hub URL:" -ForegroundColor Cyan
Write-Host "   https://hub.docker.com/r/$dockerUsername/question-bank-backend" -ForegroundColor White
