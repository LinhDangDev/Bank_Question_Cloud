# Hệ thống phân quyền - Admin & Teacher

## Tổng quan
Hệ thống chỉ hỗ trợ 2 roles: **Admin** và **Teacher** cho môi trường internal.

## Logic phân quyền

### 🔐 Admin (IsBuildInUser: true)
- **Có thể làm TẤT CẢ**
- Quản lý câu hỏi: Tạo, sửa, xóa, đọc
- Quản lý đề thi: Tạo, sửa, xóa, duyệt
- Quản lý user và phân quyền
- Truy cập tất cả endpoints

### 👨‍🏫 Teacher (IsBuildInUser: false)
- **Quản lý câu hỏi:** Tạo, sửa, đọc (KHÔNG xóa hoàn toàn)
- **Quản lý đề thi:** Tạo, sửa, đọc (KHÔNG xóa, KHÔNG duyệt)
- **Soft delete:** Có thể soft delete câu hỏi
- **KHÔNG thể:** Xóa hoàn toàn, duyệt đề thi, quản lý user

## Endpoints được bảo vệ

### CauHoi (Câu hỏi)
| Endpoint | Method | Admin | Teacher | Mô tả |
|----------|--------|-------|---------|-------|
| `/cau-hoi` | GET | ✅ | ✅ | Xem danh sách câu hỏi |
| `/cau-hoi/:id` | GET | ✅ | ✅ | Xem chi tiết câu hỏi |
| `/cau-hoi` | POST | ✅ | ✅ | Tạo câu hỏi mới |
| `/cau-hoi/:id` | PUT | ✅ | ✅ | Sửa câu hỏi |
| `/cau-hoi/:id` | DELETE | ✅ | ❌ | Xóa hoàn toàn câu hỏi |
| `/cau-hoi/:id/soft-delete` | PATCH | ✅ | ✅ | Soft delete câu hỏi |
| `/cau-hoi/:id/restore` | PATCH | ✅ | ❌ | Khôi phục câu hỏi |

### DeThi (Đề thi)
| Endpoint | Method | Admin | Teacher | Mô tả |
|----------|--------|-------|---------|-------|
| `/de-thi` | GET | ✅ | ✅ | Xem danh sách đề thi |
| `/de-thi/:id` | GET | ✅ | ✅ | Xem chi tiết đề thi |
| `/de-thi` | POST | ✅ | ✅ | Tạo đề thi mới |
| `/de-thi/:id` | PUT | ✅ | ✅ | Sửa đề thi |
| `/de-thi/:id` | DELETE | ✅ | ❌ | Xóa đề thi |
| `/de-thi/:id/duyet` | POST | ✅ | ❌ | Duyệt đề thi |
| `/de-thi/:id/huy-duyet` | POST | ✅ | ❌ | Hủy duyệt đề thi |

### Auth (Xác thực)
| Endpoint | Method | Admin | Teacher | Mô tả |
|----------|--------|-------|---------|-------|
| `/auth/login` | POST | ✅ | ✅ | Đăng nhập |
| `/auth/register` | POST | ✅ | ✅ | Đăng ký |
| `/auth/assign-role` | POST | ✅ | ❌ | Phân quyền user |
| `/auth/profile` | GET | ✅ | ✅ | Xem thông tin profile |

## Cách sử dụng

### 1. Xóa SkipAuthMiddleware
```typescript
// Trong app.module.ts - xóa dòng này:
consumer
    .apply(SkipAuthMiddleware)
    .forRoutes('*');
```

### 2. Frontend gửi token
```javascript
// Thêm Authorization header cho mọi request
headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
}
```

### 3. Handle 401/403 errors
```javascript
// Frontend cần handle khi không có quyền
if (response.status === 401) {
    // Redirect to login
}
if (response.status === 403) {
    // Show "Không có quyền truy cập"
}
```

## Database
- **Không thay đổi** database schema
- Sử dụng field `IsBuildInUser` có sẵn để phân biệt admin/teacher
- Admin: `IsBuildInUser = true`
- Teacher: `IsBuildInUser = false`

## Environment Variables
```env
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d
```

## Testing
1. Tạo user admin: `IsBuildInUser = true`
2. Tạo user teacher: `IsBuildInUser = false`
3. Test các endpoints với từng role
4. Verify permissions hoạt động đúng
