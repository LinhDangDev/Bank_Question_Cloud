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

// Question API
export const questionApi = {
    getAll: () => {
        return api.get('/cau-hoi');
    },
    getById: (id: string) => {
        return api.get(`/cau-hoi/${id}`);
    },
    getByChapter: (chapterId: string) => {
        return api.get(`/cau-hoi/phan/${chapterId}`);
    },
    getByChapterWithAnswers: (chapterId: string) => {
        return api.get(`/cau-hoi/phan/${chapterId}/with-answers`);
    },
    create: (questionData: any) => {
        return api.post('/cau-hoi', questionData);
    },
    createWithAnswers: (questionData: any) => {
        return api.post('/cau-hoi/with-answers', questionData);
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
        return api.patch(`/de-thi/${id}/duyet`);
    },
    generateExam: (examData: any) => {
        return api.post('/de-thi/generate-clo', examData);
    },
    checkQuestionAvailability: (examData: any) => {
        return api.post('/de-thi/check-availability', examData);
    },
    downloadExam: (id: string, format: 'pdf' | 'docx') => {
        return api.get(`/de-thi/${id}/${format}`, { responseType: 'blob' });
    },
};

// File upload API
export const fileApi = {
    uploadQuestionFile: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/files/upload-questions', formData, {
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
