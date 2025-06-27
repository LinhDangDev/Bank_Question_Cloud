import { useAuth } from '../context/AuthContext';

// Định nghĩa các permissions
export const PERMISSIONS = {
    // Quản lý câu hỏi
    QUESTION_CREATE: 'question:create',
    QUESTION_UPDATE: 'question:update',
    QUESTION_DELETE: 'question:delete',
    QUESTION_READ: 'question:read',
    QUESTION_READ_OWN: 'question:read_own',
    QUESTION_IMPORT: 'question:import',
    QUESTION_APPROVE: 'question:approve',

    // Quản lý đề thi
    EXAM_CREATE: 'exam:create',
    EXAM_UPDATE: 'exam:update',
    EXAM_DELETE: 'exam:delete',
    EXAM_APPROVE: 'exam:approve',
    EXAM_READ: 'exam:read',
    EXAM_READ_OWN: 'exam:read_own',
    EXAM_GENERATE_PDF: 'exam:generate_pdf',

    // Quản lý khoa
    DEPARTMENT_READ: 'department:read',
    DEPARTMENT_READ_OWN: 'department:read_own',
    DEPARTMENT_CREATE: 'department:create',
    DEPARTMENT_UPDATE: 'department:update',
    DEPARTMENT_DELETE: 'department:delete',

    // Quản lý môn học
    SUBJECT_READ: 'subject:read',
    SUBJECT_CREATE: 'subject:create',
    SUBJECT_UPDATE: 'subject:update',
    SUBJECT_DELETE: 'subject:delete',

    // Quản lý user
    USER_MANAGE: 'user:manage',
    ROLE_ASSIGN: 'role:assign'
} as const;

// Mapping roles với permissions
export const ROLE_PERMISSIONS = {
    admin: [
        // Admin có tất cả quyền
        PERMISSIONS.QUESTION_CREATE,
        PERMISSIONS.QUESTION_UPDATE,
        PERMISSIONS.QUESTION_DELETE,
        PERMISSIONS.QUESTION_READ,
        PERMISSIONS.QUESTION_READ_OWN,
        PERMISSIONS.QUESTION_IMPORT,
        PERMISSIONS.QUESTION_APPROVE,

        PERMISSIONS.EXAM_CREATE,
        PERMISSIONS.EXAM_UPDATE,
        PERMISSIONS.EXAM_DELETE,
        PERMISSIONS.EXAM_APPROVE,
        PERMISSIONS.EXAM_READ,
        PERMISSIONS.EXAM_READ_OWN,
        PERMISSIONS.EXAM_GENERATE_PDF,

        PERMISSIONS.DEPARTMENT_READ,
        PERMISSIONS.DEPARTMENT_READ_OWN,
        PERMISSIONS.DEPARTMENT_CREATE,
        PERMISSIONS.DEPARTMENT_UPDATE,
        PERMISSIONS.DEPARTMENT_DELETE,

        PERMISSIONS.SUBJECT_READ,
        PERMISSIONS.SUBJECT_CREATE,
        PERMISSIONS.SUBJECT_UPDATE,
        PERMISSIONS.SUBJECT_DELETE,

        PERMISSIONS.USER_MANAGE,
        PERMISSIONS.ROLE_ASSIGN
    ],
    teacher: [
        // Teacher chỉ xem câu hỏi của mình và import (chờ duyệt)
        PERMISSIONS.QUESTION_READ_OWN,
        PERMISSIONS.QUESTION_IMPORT,

        // Không có quyền với đề thi

        // Quản lý khoa - Teacher chỉ xem khoa của mình, không sửa xóa
        PERMISSIONS.DEPARTMENT_READ_OWN,

        // Quản lý môn học - Teacher chỉ xem môn học, không được sửa xóa
        PERMISSIONS.SUBJECT_READ
    ]
} as const;

export const usePermissions = () => {
    const { user } = useAuth();

    const hasPermission = (permission: string): boolean => {
        if (!user) return false;

        const userPermissions = ROLE_PERMISSIONS[user.role] || [];
        return userPermissions.includes(permission as any);
    };

    const hasAnyPermission = (permissions: string[]): boolean => {
        return permissions.some(permission => hasPermission(permission));
    };

    const hasAllPermissions = (permissions: string[]): boolean => {
        return permissions.every(permission => hasPermission(permission));
    };

    const isAdmin = (): boolean => {
        return user?.role === 'admin';
    };

    const isTeacher = (): boolean => {
        return user?.role === 'teacher';
    };

    // Các helper functions cho từng chức năng
    const canViewAllQuestions = (): boolean => {
        return hasPermission(PERMISSIONS.QUESTION_READ);
    };

    const canViewOwnQuestions = (): boolean => {
        return hasPermission(PERMISSIONS.QUESTION_READ_OWN);
    };

    const canImportQuestions = (): boolean => {
        return hasPermission(PERMISSIONS.QUESTION_IMPORT);
    };

    const canApproveQuestions = (): boolean => {
        return hasPermission(PERMISSIONS.QUESTION_APPROVE);
    };

    const canCreateQuestions = (): boolean => {
        return hasPermission(PERMISSIONS.QUESTION_CREATE);
    };

    const canUpdateQuestions = (): boolean => {
        return hasPermission(PERMISSIONS.QUESTION_UPDATE);
    };

    const canDeleteQuestions = (): boolean => {
        return hasPermission(PERMISSIONS.QUESTION_DELETE);
    };

    const canViewAllExams = (): boolean => {
        return hasPermission(PERMISSIONS.EXAM_READ);
    };

    const canGeneratePDF = (): boolean => {
        return hasPermission(PERMISSIONS.EXAM_GENERATE_PDF);
    };

    const canCreateExams = (): boolean => {
        return hasPermission(PERMISSIONS.EXAM_CREATE);
    };

    const canManageDepartments = (): boolean => {
        return hasAnyPermission([
            PERMISSIONS.DEPARTMENT_CREATE,
            PERMISSIONS.DEPARTMENT_UPDATE,
            PERMISSIONS.DEPARTMENT_DELETE
        ]);
    };

    const canViewAllDepartments = (): boolean => {
        return hasPermission(PERMISSIONS.DEPARTMENT_READ);
    };

    const canViewOwnDepartment = (): boolean => {
        return hasPermission(PERMISSIONS.DEPARTMENT_READ_OWN);
    };

    const canManageSubjects = (): boolean => {
        return hasAnyPermission([
            PERMISSIONS.SUBJECT_CREATE,
            PERMISSIONS.SUBJECT_UPDATE,
            PERMISSIONS.SUBJECT_DELETE
        ]);
    };

    const canManageUsers = (): boolean => {
        return hasPermission(PERMISSIONS.USER_MANAGE);
    };

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        isAdmin,
        isTeacher,

        // Question permissions
        canViewAllQuestions,
        canViewOwnQuestions,
        canImportQuestions,
        canApproveQuestions,
        canCreateQuestions,
        canUpdateQuestions,
        canDeleteQuestions,

        // Exam permissions
        canViewAllExams,
        canGeneratePDF,
        canCreateExams,

        // Department permissions
        canManageDepartments,
        canViewAllDepartments,
        canViewOwnDepartment,

        // Subject permissions
        canManageSubjects,

        // User permissions
        canManageUsers,

        // Raw permissions for direct access
        PERMISSIONS,
        userPermissions: user ? ROLE_PERMISSIONS[user.role] || [] : []
    };
};
