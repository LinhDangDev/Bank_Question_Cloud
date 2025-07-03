import api from './api';

interface Phan {
    MaPhan: string;
    TenPhan: string;
    MaMonHoc: string;
}

export const phanService = {
    getAllPhans: () => {
        return api.get('/phan');
    },

    getPhanById: (id: string) => {
        return api.get(`/phan/${id}`);
    },

    createPhan: (data: Omit<Phan, 'MaPhan'>) => {
        return api.post('/phan', data);
    },

    updatePhan: (id: string, data: Partial<Phan>) => {
        return api.put(`/phan/${id}`, data);
    },

    deletePhan: (id: string) => {
        return api.delete(`/phan/${id}`);
    },

    getPhansByMonHoc: (maMonHoc: string) => {
        return api.get(`/phan/by-mon-hoc/${maMonHoc}`);
    },

    softDeletePhan: (id: string) => api.delete(`/phan/${id}/soft-delete`),
    restorePhan: (id: string) => api.post(`/phan/${id}/restore`)
};
