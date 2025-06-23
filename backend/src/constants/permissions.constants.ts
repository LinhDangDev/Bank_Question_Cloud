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

    // Quản lý đề thi
    EXAM_CREATE: 'exam:create',
    EXAM_UPDATE: 'exam:update',
    EXAM_DELETE: 'exam:delete',
    EXAM_APPROVE: 'exam:approve',
    EXAM_READ: 'exam:read',

    // Quản lý user
    USER_MANAGE: 'user:manage',
    ROLE_ASSIGN: 'role:assign'
} as const;

// Mapping roles với permissions
export const ROLE_PERMISSIONS = {
    [ROLES.ADMIN]: [
        PERMISSIONS.QUESTION_CREATE,
        PERMISSIONS.QUESTION_UPDATE,
        PERMISSIONS.QUESTION_DELETE,
        PERMISSIONS.QUESTION_READ,
        PERMISSIONS.EXAM_CREATE,
        PERMISSIONS.EXAM_UPDATE,
        PERMISSIONS.EXAM_DELETE,
        PERMISSIONS.EXAM_APPROVE,
        PERMISSIONS.EXAM_READ,
        PERMISSIONS.USER_MANAGE,
        PERMISSIONS.ROLE_ASSIGN
    ],
    [ROLES.TEACHER]: [
        PERMISSIONS.QUESTION_CREATE,
        PERMISSIONS.QUESTION_UPDATE,
        PERMISSIONS.QUESTION_READ,
        PERMISSIONS.EXAM_CREATE,
        PERMISSIONS.EXAM_UPDATE,
        PERMISSIONS.EXAM_READ
    ]
} as const;
