// Định nghĩa các roles
export const ROLES = {
    ADMIN: 'admin',
    TEACHER: 'teacher'
} as const;

// Định nghĩa các permissions
export const PERMISSIONS = {
    // Quản lý câu hỏi
    QUESTION_CREATE: 'question:create',
    QUESTION_UPDATE: 'question:update',
    QUESTION_DELETE: 'question:delete',
    QUESTION_READ: 'question:read',
    QUESTION_READ_OWN: 'question:read_own', // Chỉ xem câu hỏi của mình
    QUESTION_IMPORT: 'question:import',
    QUESTION_APPROVE: 'question:approve', // Duyệt câu hỏi import

    // Quản lý đề thi
    EXAM_CREATE: 'exam:create',
    EXAM_UPDATE: 'exam:update',
    EXAM_DELETE: 'exam:delete',
    EXAM_APPROVE: 'exam:approve',
    EXAM_READ: 'exam:read',
    EXAM_READ_OWN: 'exam:read_own', // Chỉ xem đề thi của mình
    EXAM_GENERATE_PDF: 'exam:generate_pdf',

    // Quản lý khoa
    DEPARTMENT_READ: 'department:read',
    DEPARTMENT_READ_OWN: 'department:read_own', // Chỉ xem khoa của mình
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
    [ROLES.ADMIN]: [
        // Quản lý câu hỏi - Admin có tất cả quyền
        PERMISSIONS.QUESTION_CREATE,
        PERMISSIONS.QUESTION_UPDATE,
        PERMISSIONS.QUESTION_DELETE,
        PERMISSIONS.QUESTION_READ,
        PERMISSIONS.QUESTION_READ_OWN,
        PERMISSIONS.QUESTION_IMPORT,
        PERMISSIONS.QUESTION_APPROVE,

        // Quản lý đề thi - Admin có tất cả quyền
        PERMISSIONS.EXAM_CREATE,
        PERMISSIONS.EXAM_UPDATE,
        PERMISSIONS.EXAM_DELETE,
        PERMISSIONS.EXAM_APPROVE,
        PERMISSIONS.EXAM_READ,
        PERMISSIONS.EXAM_READ_OWN,
        PERMISSIONS.EXAM_GENERATE_PDF,

        // Quản lý khoa - Admin có tất cả quyền
        PERMISSIONS.DEPARTMENT_READ,
        PERMISSIONS.DEPARTMENT_READ_OWN,
        PERMISSIONS.DEPARTMENT_CREATE,
        PERMISSIONS.DEPARTMENT_UPDATE,
        PERMISSIONS.DEPARTMENT_DELETE,

        // Quản lý môn học - Admin có tất cả quyền
        PERMISSIONS.SUBJECT_READ,
        PERMISSIONS.SUBJECT_CREATE,
        PERMISSIONS.SUBJECT_UPDATE,
        PERMISSIONS.SUBJECT_DELETE,

        // Quản lý user
        PERMISSIONS.USER_MANAGE,
        PERMISSIONS.ROLE_ASSIGN
    ],
    [ROLES.TEACHER]: [
        // Quản lý câu hỏi - Teacher chỉ xem câu hỏi của mình và import (chờ duyệt)
        PERMISSIONS.QUESTION_READ_OWN,
        PERMISSIONS.QUESTION_IMPORT,

        // Không có quyền với đề thi
        // (Bỏ tất cả quyền liên quan đến đề thi)

        // Quản lý khoa - Teacher chỉ xem khoa của mình, không sửa xóa
        PERMISSIONS.DEPARTMENT_READ_OWN,

        // Quản lý môn học - Teacher có thể xem môn học, không được sửa xóa
        PERMISSIONS.SUBJECT_READ
    ]
} as const;
