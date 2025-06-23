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
        if (/^\/khoa\//.test(url) && method === 'DELETE') {
            requiredPermission = PERMISSIONS.USER_MANAGE as PermissionType;
        }
        if (/^\/phan\//.test(url) && method === 'DELETE') {
            requiredPermission = PERMISSIONS.USER_MANAGE as PermissionType;
        }
        if (/^\/cau-hoi\//.test(url) && method === 'DELETE') {
            requiredPermission = PERMISSIONS.QUESTION_DELETE as PermissionType;
        }
        if (/^\/cau-hoi\/.+\/soft-delete$/.test(url) && method === 'PATCH') {
            requiredPermission = PERMISSIONS.QUESTION_UPDATE as PermissionType;
        }
        // Thêm các rule khác nếu cần

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
