import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ROLE_PERMISSIONS, ROLES, PERMISSIONS } from '../../../constants/permissions.constants';

type PermissionType = typeof PERMISSIONS[keyof typeof PERMISSIONS];

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true;
        }

        const { user, method, url } = context.switchToHttp().getRequest();

        if (!user) {
            return false;
        }

        // Chuẩn hóa role
        const userRole = user.role === ROLES.ADMIN || user.IsBuildInUser ? ROLES.ADMIN : ROLES.TEACHER;
        const userPermissions: PermissionType[] = (ROLE_PERMISSIONS[userRole] as unknown as PermissionType[]).filter(Boolean);

        // Xác định permission theo route/method
        let requiredPermission: PermissionType | null = null;

        // Quản lý khoa
        if (/^\/khoa\//.test(url)) {
            if (method === 'GET') {
                requiredPermission = userRole === ROLES.ADMIN
                    ? PERMISSIONS.DEPARTMENT_READ as PermissionType
                    : PERMISSIONS.DEPARTMENT_READ_OWN as PermissionType;
            } else if (method === 'POST') {
                requiredPermission = PERMISSIONS.DEPARTMENT_CREATE as PermissionType;
            } else if (method === 'PUT' || method === 'PATCH') {
                requiredPermission = PERMISSIONS.DEPARTMENT_UPDATE as PermissionType;
            } else if (method === 'DELETE') {
                requiredPermission = PERMISSIONS.DEPARTMENT_DELETE as PermissionType;
            }
        }

        // Quản lý đề thi - Teacher không được xem danh sách đề và không tạo PDF
        if (/^\/de-thi\//.test(url)) {
            // For teachers, always block access to all exam routes
            if (userRole === ROLES.TEACHER) {
                throw new ForbiddenException('Giáo viên không có quyền truy cập vào quản lý đề thi');
            }

            if (method === 'GET' && !url.includes('/pdf')) {
                requiredPermission = PERMISSIONS.EXAM_READ as PermissionType;
            } else if (method === 'GET' && url.includes('/pdf')) {
                requiredPermission = PERMISSIONS.EXAM_GENERATE_PDF as PermissionType;
            } else if (method === 'POST' && url.includes('/duyet')) {
                requiredPermission = PERMISSIONS.EXAM_APPROVE as PermissionType;
            } else if (method === 'POST') {
                requiredPermission = PERMISSIONS.EXAM_CREATE as PermissionType;
            } else if (method === 'PUT' || method === 'PATCH') {
                requiredPermission = PERMISSIONS.EXAM_UPDATE as PermissionType;
            } else if (method === 'DELETE') {
                requiredPermission = PERMISSIONS.EXAM_DELETE as PermissionType;
            }
        }

        // Quản lý câu hỏi
        if (/^\/cau-hoi\//.test(url)) {
            if (method === 'GET') {
                requiredPermission = userRole === ROLES.ADMIN
                    ? PERMISSIONS.QUESTION_READ as PermissionType
                    : PERMISSIONS.QUESTION_READ_OWN as PermissionType;
            } else if (method === 'POST') {
                requiredPermission = PERMISSIONS.QUESTION_CREATE as PermissionType;
            } else if (method === 'PUT' || method === 'PATCH') {
                requiredPermission = PERMISSIONS.QUESTION_UPDATE as PermissionType;
            } else if (method === 'DELETE') {
                requiredPermission = PERMISSIONS.QUESTION_DELETE as PermissionType;
            }
        }

        // Import câu hỏi
        if (/^\/questions-import\//.test(url)) {
            requiredPermission = PERMISSIONS.QUESTION_IMPORT as PermissionType;
        }

        // Duyệt câu hỏi - Chỉ admin mới có quyền duyệt
        if (/^\/cau-hoi-cho-duyet\//.test(url)) {
            if (method === 'POST' && url.includes('/duyet')) {
                requiredPermission = PERMISSIONS.QUESTION_APPROVE as PermissionType;
            } else if (userRole === ROLES.TEACHER && method !== 'GET') {
                // Teachers can only view their pending questions, not modify them
                throw new ForbiddenException('Giáo viên chỉ có quyền xem câu hỏi chờ duyệt của mình');
            }
        }

        // Quản lý môn học - Teacher chỉ có quyền xem
        if (/^\/mon-hoc\//.test(url)) {
            if (method === 'GET') {
                requiredPermission = PERMISSIONS.SUBJECT_READ as PermissionType;
            } else if (userRole === ROLES.TEACHER) {
                throw new ForbiddenException('Giáo viên chỉ có quyền xem môn học, không thể chỉnh sửa');
            } else {
                if (method === 'POST') {
                    requiredPermission = PERMISSIONS.SUBJECT_CREATE as PermissionType;
                } else if (method === 'PUT' || method === 'PATCH') {
                    requiredPermission = PERMISSIONS.SUBJECT_UPDATE as PermissionType;
                } else if (method === 'DELETE') {
                    requiredPermission = PERMISSIONS.SUBJECT_DELETE as PermissionType;
                }
            }
        }

        // Quản lý phân
        if (/^\/phan\//.test(url) && method === 'DELETE') {
            requiredPermission = PERMISSIONS.USER_MANAGE as PermissionType;
        }

        // Nếu có requiredPermission thì kiểm tra
        if (requiredPermission && !userPermissions.includes(requiredPermission)) {
            throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
        }

        // Check role như cũ (fallback)
        return requiredRoles.some((role) => {
            if (role === ROLES.ADMIN) {
                return userRole === ROLES.ADMIN;
            } else if (role === ROLES.TEACHER) {
                return userRole === ROLES.TEACHER || userRole === ROLES.ADMIN;
            }
            return false;
        });
    }
}
