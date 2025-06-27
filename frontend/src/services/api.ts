import axios from 'axios';
import { API_BASE_URL } from '@/config';
import { useAuth } from '../context/AuthContext';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

    // Debug log to check token availability in the interceptor
    console.log('API interceptor - token from localStorage:', token);

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Added auth header:', config.headers.Authorization);
    }

    return config;
}, (error) => {
    // Handle errors in the interceptor
    console.error('API interceptor error:', error);
    return Promise.reject(error);
});

// Auth API
export const authApi = {
    login: (credentials: { username: string; password: string }) => {
        const payload = {
            loginName: credentials.username,
            password: credentials.password
        };
        return api.post('/auth/login', payload);
    },
    register: (userData: any) => {
        return api.post('/auth/register', userData);
    },
    getProfile: () => {
        return api.get('/auth/profile');
    },
    logout: () => {
        return api.post('/auth/logout');
    },
    forceLogout: (userId: string) => {
        return api.post('/auth/force-logout', { userId });
    },
    checkUsername: (username: string) => {
        return api.get(`/users/check-username/${username}`);
    },
};

// User API
export const userApi = {
    getAll: () => {
        return api.get('/users');
    },
    getById: (id: string) => {
        return api.get(`/users/${id}`);
    },
    create: (userData: any) => {
        return api.post('/users', userData);
    },
    update: (id: string, userData: any) => {
        return api.put(`/users/${id}`, userData);
    },
    delete: (id: string) => {
        return api.delete(`/users/${id}`);
    },
    importUsers: (userData: any[]) => {
        return api.post('/users/import', userData);
    },
    changeStatus: (id: string, status: boolean) => {
        return api.patch(`/users/${id}/status`, { active: status });
    },
    changePassword: (id: string, password: string) => {
        return api.patch(`/users/${id}/password`, { password });
    },
    firstTimePasswordChange: (id: string, password: string, currentPassword: string) => {
        return api.patch(`/users/first-time-password/${id}`, {
            password,
            currentPassword
        });
    },
};

// Faculty (Khoa) API
export const khoaApi = {
    getAll: () => {
        return api.get('/khoa');
    },
    getKhoaById: (id: string) => {
        return api.get(`/khoa/${id}`);
    },
    createKhoa: (khoaData: any) => {
        return api.post('/khoa', khoaData);
    },
    updateKhoa: (id: string, khoaData: any) => {
        return api.patch(`/khoa/${id}`, khoaData);
    },
    deleteKhoa: (id: string) => {
        return api.delete(`/khoa/${id}`);
    },
    softDeleteKhoa: (id: string) => {
        return api.patch(`/khoa/${id}/soft-delete`);
    },
    restoreKhoa: (id: string) => {
        return api.patch(`/khoa/${id}/restore`);
    },
};

// Subject (MonHoc) API
export const monHocApi = {
    getAll: () => {
        return api.get('/mon-hoc');
    },
    getMonHocById: (id: string) => {
        return api.get(`/mon-hoc/${id}`);
    },
    getMonHocByKhoa: (khoaId: string) => {
        return api.get(`/mon-hoc/khoa/${khoaId}`);
    },
    createMonHoc: (monHocData: any) => {
        return api.post('/mon-hoc', monHocData);
    },
    updateMonHoc: (id: string, monHocData: any) => {
        return api.put(`/mon-hoc/${id}`, monHocData);
    },
    deleteMonHoc: (id: string) => {
        return api.delete(`/mon-hoc/${id}`);
    },
    softDeleteMonHoc: (id: string) => {
        return api.patch(`/mon-hoc/${id}/soft-delete`);
    },
    restoreMonHoc: (id: string) => {
        return api.patch(`/mon-hoc/${id}/restore`);
    },
};

// Chapter (Phan) API
export const phanApi = {
    getAll: () => {
        return api.get('/phan');
    },
    getPhanById: (id: string) => {
        return api.get(`/phan/${id}`);
    },
    getPhanByMonHoc: (monHocId: string) => {
        return api.get(`/phan/mon-hoc/${monHocId}`);
    },
    createPhan: (phanData: any) => {
        return api.post('/phan', phanData);
    },
    updatePhan: (id: string, phanData: any) => {
        return api.put(`/phan/${id}`, phanData);
    },
    deletePhan: (id: string) => {
        return api.delete(`/phan/${id}`);
    },
    softDeletePhan: (id: string) => {
        return api.patch(`/phan/${id}/soft-delete`);
    },
    restorePhan: (id: string) => {
        return api.patch(`/phan/${id}/restore`);
    },
};

// DeThi API - Separate from examApi for better organization
export const deThiApi = {
    getAll: () => {
        return api.get('/de-thi');
    },
    getById: (id: string) => {
        return api.get(`/de-thi/${id}`);
    },
    getHierarchicalQuestions: (id: string) => {
        return api.get(`/de-thi/${id}/hierarchical-questions`);
    },
    getExamDetails: (id: string) => {
        return api.get(`/chi-tiet-de-thi/de-thi/${id}`);
    },
    getApprovedExams: () => {
        return api.get('/de-thi/approved');
    },
    getPendingExams: () => {
        return api.get('/de-thi/pending');
    },
    createDeThi: (data: any) => {
        return api.post('/de-thi', data);
    },
    updateDeThi: (id: string, data: any) => {
        return api.put(`/de-thi/${id}`, data);
    },
    deleteDeThi: (id: string) => {
        return api.delete(`/de-thi/${id}`);
    },
    approveDeThi: (id: string) => {
        return api.post(`/de-thi/${id}/duyet`);
    },
    disapproveDeThi: (id: string) => {
        return api.post(`/de-thi/${id}/huy-duyet`);
    }
};

// Question API
export const questionApi = {
    getAll: () => {
        return api.get('/cau-hoi');
    },
    getById: (id: string) => {
        return api.get(`/cau-hoi/${id}`);
    },
    getFullDetails: (id: string) => {
        return api.get(`/cau-hoi/${id}/full-details`);
    },
    getAnswers: (questionId: string) => {
        return api.get(`/cau-tra-loi/cau-hoi/${questionId}`);
    },
    getByChapter: (chapterId: string) => {
        return api.get(`/cau-hoi/phan/${chapterId}`);
    },
    getByChapterWithAnswers: (chapterId: string) => {
        return api.get(`/cau-hoi/phan/${chapterId}/with-answers`);
    },
    getWithAnswers: (id: string) => {
        return api.get(`/cau-hoi/${id}/with-answers`);
    },
    getChildQuestions: (parentId: string) => {
        return api.get(`/cau-hoi/con/${parentId}`);
    },
    create: (questionData: any) => {
        return api.post('/cau-hoi', questionData);
    },
    createWithAnswers: (questionData: any) => {
        return api.post('/cau-hoi/with-answers', questionData);
    },
    createGroupQuestion: (questionData: any) => {
        return api.post('/cau-hoi/group', questionData);
    },
    update: (id: string, questionData: any) => {
        return api.put(`/cau-hoi/${id}`, questionData);
    },
    updateWithAnswers: (id: string, questionData: any) => {
        return api.put(`/cau-hoi/${id}/with-answers`, questionData);
    },
    delete: (id: string) => {
        return api.delete(`/cau-hoi/${id}`);
    },
    softDelete: (id: string) => {
        return api.patch(`/cau-hoi/${id}/soft-delete`);
    },
    restore: (id: string) => {
        return api.patch(`/cau-hoi/${id}/restore`);
    },
};

// Exam API
export const examApi = {
    getAll: () => {
        return api.get('/de-thi');
    },
    getExamById: (id: string) => {
        return api.get(`/de-thi/${id}`);
    },
    getExamDetails: (id: string) => {
        return api.get(`/chi-tiet-de-thi/de-thi/${id}`);
    },
    getApprovedExams: () => {
        return api.get('/de-thi?approved=true');
    },
    getPendingExams: () => {
        return api.get('/de-thi?approved=false');
    },
    getExamPackages: () => {
        return api.get('/de-thi/packages/all');
    },
    getExamPackage: (id: string) => {
        return api.get(`/de-thi/packages/${id}`);
    },
    createExam: (examData: any) => {
        return api.post('/de-thi', examData);
    },
    updateExam: (id: string, examData: any) => {
        return api.put(`/de-thi/${id}`, examData);
    },
    deleteExam: (id: string) => {
        return api.delete(`/de-thi/${id}`);
    },
    approveExam: (id: string) => {
        return api.post(`/de-thi/${id}/duyet`);
    },
    generateExam: (examData: any) => {
        return api.post('/de-thi/generate-clo', examData);
    },
    checkQuestionAvailability: (examData: any) => {
        return api.post('/de-thi/check-availability', examData);
    },
    downloadExam: (id: string, format: 'pdf' | 'docx') => {
        return api.get(`/de-thi/${id}/${format}`, {
            responseType: 'blob',
            headers: {
                'Accept': format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            }
        });
    },
    generateCustomPdf: (pdfData: any) => {
        return api.post('/de-thi/generate-pdf', pdfData, {
            responseType: 'blob',
            headers: {
                'Accept': 'application/pdf'
            }
        });
    },
    generateCustomDocx: (docxData: any) => {
        return api.post('/de-thi/generate-docx', docxData, {
            responseType: 'blob',
            headers: {
                'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            }
        });
    },
};

// File upload API
export const fileApi = {
    uploadQuestionFile: (file: File, questionId?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        if (questionId) {
            formData.append('maCauHoi', questionId);
        }
        return api.post('/files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    uploadImage: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/files/upload-image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};

// Extraction API
export const extractionApi = {
    extractQuestions: (fileId: string) => {
        return api.post('/questions-import/extract', { fileId });
    },
    getExtractionStatus: (jobId: string) => {
        return api.get(`/questions-import/status/${jobId}`);
    },
};

// Questions Import API
export const questionsImportApi = {
    uploadFile: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/questions-import/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    parseFile: (fileId: string) => {
        return api.post('/questions-import/parse', { fileId });
    },
    getPreview: (fileId: string, page: number = 1, limit: number = 10) => {
        return api.get(`/questions-import/preview/${fileId}?page=${page}&limit=${limit}`);
    },
    saveQuestions: (payload: {
        fileId: string;
        questionIds: string[];
        maPhan?: string;
        questionMetadata?: any[];
    }) => {
        return api.post('/questions-import/save', payload);
    },
    cleanup: (fileId: string) => {
        return api.delete(`/questions-import/cleanup/${fileId}`);
    },
};

// Pending Question API (câu hỏi chờ duyệt)
export const pendingQuestionApi = {
    // Get all pending questions (teachers will only see their own)
    getAll: (page = 1, limit = 10, trangThai?: number) => {
        let url = `/cau-hoi-cho-duyet?page=${page}&limit=${limit}`;
        if (trangThai !== undefined) {
            url += `&trangThai=${trangThai}`;
        }
        return api.get(url);
    },

    // Get statistics about pending questions
    getStatistics: () => {
        return api.get('/cau-hoi-cho-duyet/statistics');
    },

    // Get a single pending question by ID
    getById: (id: string) => {
        return api.get(`/cau-hoi-cho-duyet/${id}`);
    },

    // Admin only - approve a question
    approve: (id: string, phanId?: string) => {
        return api.post('/cau-hoi-cho-duyet/duyet', {
            MaCauHoiChoDuyet: id,
            TrangThai: 1, // 1 = Approve
            MaPhan: phanId
        });
    },

    // Admin only - reject a question
    reject: (id: string, reason: string) => {
        return api.post('/cau-hoi-cho-duyet/duyet', {
            MaCauHoiChoDuyet: id,
            TrangThai: 2, // 2 = Reject
            GhiChu: reason
        });
    },

    // Admin only - bulk approve/reject questions
    bulkProcess: (ids: string[], status: number, note?: string, phanId?: string) => {
        return api.post('/cau-hoi-cho-duyet/duyet-nhieu', {
            cauHoiIds: ids,
            trangThai: status,
            ghiChu: note,
            maPhan: phanId
        });
    }
};

// CLO API
export const cloApi = {
    getAll: () => {
        return api.get('/clo');
    },
    getById: (id: string) => {
        return api.get(`/clo/${id}`);
    },
    create: (cloData: any) => {
        return api.post('/clo', cloData);
    },
    update: (id: string, cloData: any) => {
        return api.put(`/clo/${id}`, cloData);
    },
    delete: (id: string) => {
        return api.delete(`/clo/${id}`);
    },
    softDelete: (id: string) => {
        return api.patch(`/clo/${id}/soft-delete`);
    },
    restore: (id: string) => {
        return api.patch(`/clo/${id}/restore`);
    },
};

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');

    // Debug logging to check what's happening with the token
    console.log('Token in fetchWithAuth:', token);

    const headers = {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
    };

    // Debug the headers to see what is being sent
    console.log('Request headers:', headers);

    return fetch(url, { ...options, headers });
};

export default api;
