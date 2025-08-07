# Docker Build Optimization Tips
**Author: Linh Dang Dev**

## 🚀 Các cách tối ưu hóa Docker build time

### 1. Sử dụng Docker BuildKit (Đã áp dụng)
```bash
export DOCKER_BUILDKIT=1
docker build --progress=plain -t image-name .
```

### 2. Tối ưu hóa layer caching
- ✅ Copy `package.json` và `pnpm-lock.yaml` trước
- ✅ Sử dụng `--mount=type=cache` cho pnpm store
- ✅ Multi-stage build để giảm kích thước final image

### 3. Sử dụng cache từ registry
```bash
docker build --cache-from lighthunter15723/question-bank-backend:latest -t lighthunter15723/question-bank-backend:latest .
```

### 4. Tối ưu hóa .dockerignore
- ✅ Loại bỏ `node_modules`, `dist`, frontend files
- ✅ Loại bỏ documentation, test files
- ✅ Giảm build context size

### 5. Sử dụng pnpm cache mounting
```dockerfile
RUN --mount=type=cache,target=/root/.pnpm-store \
    pnpm install --frozen-lockfile --prefer-offline
```

### 6. Build commands nhanh

#### Build thông thường (với cache)
```bash
python3 docker-build-optimized.py
```

#### Build nhanh với Docker Compose
```bash
docker-compose -f docker-compose.build.yml build
```

#### Build manual với cache
```bash
DOCKER_BUILDKIT=1 docker build \
  --cache-from lighthunter15723/question-bank-backend:latest \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  -t lighthunter15723/question-bank-backend:latest .
```

### 7. Warm up cache (chạy 1 lần)
```bash
# Build base image để cache dependencies
docker build --target base -t lighthunter15723/question-bank-backend:base .
```

### 8. Cleanup khi cần thiết
```bash
# Xóa dangling images
docker image prune -f

# Xóa build cache (cẩn thận!)
docker builder prune -f

# Xem disk usage
docker system df
```

### 9. Tips cho development

#### Sử dụng bind mount cho development
```bash
docker run -v $(pwd)/backend:/app -p 3001:3001 lighthunter15723/question-bank-backend:latest
```

#### Build chỉ khi cần thiết
- Chỉ rebuild khi có thay đổi dependencies
- Sử dụng `docker-compose up --build` chỉ khi cần

### 10. Monitoring build time
```bash
# Xem build history
docker history lighthunter15723/question-bank-backend:latest

# Analyze image layers
docker run --rm -it wagoodman/dive lighthunter15723/question-bank-backend:latest
```

## 📊 Kết quả tối ưu hóa

### Trước tối ưu hóa:
- Build time: ~8-10 phút
- Image size: Lớn
- Cache efficiency: Thấp

### Sau tối ưu hóa:
- Build time: ~30 giây - 2 phút (với cache)
- Image size: Nhỏ hơn (multi-stage)
- Cache efficiency: Cao
- Rebuild time: ~10-30 giây

## 🔧 Troubleshooting

### Build chậm?
1. Kiểm tra Docker Desktop có đủ RAM (4GB+)
2. Kiểm tra network connection
3. Xóa cache và rebuild: `docker builder prune -f`

### Out of space?
1. `docker system prune -a`
2. `docker volume prune`
3. Tăng disk space cho Docker Desktop

### Dependencies install chậm?
1. Sử dụng registry mirror gần hơn
2. Kiểm tra pnpm config
3. Sử dụng `--prefer-offline` flag
