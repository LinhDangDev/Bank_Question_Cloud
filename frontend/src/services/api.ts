import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Extraction API
export const extractionApi = {
    createExtractionRequest: (data: any) => {
        return api.post('/yeu-cau-rut-trich', data);
    },

    getExtractionRequests: (page = 1, limit = 10) => {
        return api.get(`/yeu-cau-rut-trich?page=${page}&limit=${limit}`);
    },

    getExtractionRequest: (id: string) => {
        return api.get(`/yeu-cau-rut-trich/${id}`);
    },

    getExtractionStatus: (id: string) => {
        return api.get(`/yeu-cau-rut-trich/status/${id}`);
    },
};

export default api;
