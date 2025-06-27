import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

interface PermissionGuardProps {
    children: React.ReactNode;
    permission?: string;
    permissions?: string[];
    requireAll?: boolean; // true: cần tất cả permissions, false: chỉ cần 1 permission
    role?: 'admin' | 'teacher';
    fallback?: React.ReactNode;
    className?: string;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    children,
    permission,
    permissions = [],
    requireAll = false,
    role,
    fallback = null,
    className
}) => {
    const { hasPermission, hasAnyPermission, hasAllPermissions, isAdmin, isTeacher } = usePermissions();

    // Kiểm tra role nếu được chỉ định
    if (role) {
        if (role === 'admin' && !isAdmin()) {
            return <>{fallback}</>;
        }
        if (role === 'teacher' && !isTeacher()) {
            return <>{fallback}</>;
        }
    }

    // Kiểm tra permission đơn lẻ
    if (permission && !hasPermission(permission)) {
        return <>{fallback}</>;
    }

    // Kiểm tra nhiều permissions
    if (permissions.length > 0) {
        const hasRequiredPermissions = requireAll
            ? hasAllPermissions(permissions)
            : hasAnyPermission(permissions);

        if (!hasRequiredPermissions) {
            return <>{fallback}</>;
        }
    }

    // Nếu có className, wrap trong div
    if (className) {
        return <div className={className}>{children}</div>;
    }

    return <>{children}</>;
};

// Helper components cho các trường hợp thường dùng
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback = null
}) => (
    <PermissionGuard role="admin" fallback={fallback}>
        {children}
    </PermissionGuard>
);

export const TeacherOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback = null
}) => (
    <PermissionGuard role="teacher" fallback={fallback}>
        {children}
    </PermissionGuard>
);

export const QuestionApprovalOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback = null
}) => {
    const { PERMISSIONS } = usePermissions();
    return (
        <PermissionGuard permission={PERMISSIONS.QUESTION_APPROVE} fallback={fallback}>
            {children}
        </PermissionGuard>
    );
};

export const QuestionCreateOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback = null
}) => {
    const { PERMISSIONS } = usePermissions();
    return (
        <PermissionGuard permission={PERMISSIONS.QUESTION_CREATE} fallback={fallback}>
            {children}
        </PermissionGuard>
    );
};

export const QuestionEditOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback = null
}) => {
    const { PERMISSIONS } = usePermissions();
    return (
        <PermissionGuard permission={PERMISSIONS.QUESTION_UPDATE} fallback={fallback}>
            {children}
        </PermissionGuard>
    );
};

export const QuestionDeleteOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback = null
}) => {
    const { PERMISSIONS } = usePermissions();
    return (
        <PermissionGuard permission={PERMISSIONS.QUESTION_DELETE} fallback={fallback}>
            {children}
        </PermissionGuard>
    );
};

export const ExamCreateOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback = null
}) => {
    const { PERMISSIONS } = usePermissions();
    return (
        <PermissionGuard permission={PERMISSIONS.EXAM_CREATE} fallback={fallback}>
            {children}
        </PermissionGuard>
    );
};

export const ExamPDFOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback = null
}) => {
    const { PERMISSIONS } = usePermissions();
    return (
        <PermissionGuard permission={PERMISSIONS.EXAM_GENERATE_PDF} fallback={fallback}>
            {children}
        </PermissionGuard>
    );
};

export const ExamManagementOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback = null
}) => {
    const { PERMISSIONS } = usePermissions();
    return (
        <PermissionGuard
            permissions={[
                PERMISSIONS.EXAM_CREATE,
                PERMISSIONS.EXAM_UPDATE,
                PERMISSIONS.EXAM_DELETE,
                PERMISSIONS.EXAM_READ
            ]}
            requireAll={false}
            fallback={fallback}
        >
            {children}
        </PermissionGuard>
    );
};

export const DepartmentManagementOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback = null
}) => {
    const { PERMISSIONS } = usePermissions();
    return (
        <PermissionGuard
            permissions={[
                PERMISSIONS.DEPARTMENT_CREATE,
                PERMISSIONS.DEPARTMENT_UPDATE,
                PERMISSIONS.DEPARTMENT_DELETE
            ]}
            requireAll={false}
            fallback={fallback}
        >
            {children}
        </PermissionGuard>
    );
};

export const SubjectManagementOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback = null
}) => {
    const { PERMISSIONS } = usePermissions();
    return (
        <PermissionGuard
            permissions={[
                PERMISSIONS.SUBJECT_CREATE,
                PERMISSIONS.SUBJECT_UPDATE,
                PERMISSIONS.SUBJECT_DELETE
            ]}
            requireAll={false}
            fallback={fallback}
        >
            {children}
        </PermissionGuard>
    );
};

export const UserManagementOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
    children,
    fallback = null
}) => {
    const { PERMISSIONS } = usePermissions();
    return (
        <PermissionGuard permission={PERMISSIONS.USER_MANAGE} fallback={fallback}>
            {children}
        </PermissionGuard>
    );
};
