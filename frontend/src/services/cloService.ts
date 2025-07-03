import api from './api';

interface CLO {
    MaCLO: string;
    TenCLO: string;
    MoTa?: string;
    MaMonHoc?: string;
}

export const cloService = {
    getAllCLOs: () => {
        return api.get('/clo');
    },

    getCLOById: (id: string) => {
        return api.get(`/clo/${id}`);
    },

    createCLO: (data: Omit<CLO, 'MaCLO'>) => {
        return api.post('/clo', data);
    },

    updateCLO: (id: string, data: Partial<CLO>) => {
        return api.put(`/clo/${id}`, data);
    },

    deleteCLO: (id: string) => {
        return api.delete(`/clo/${id}`);
    },

    getCLOsByMonHoc: (maMonHoc: string) => {
        return api.get(`/clo/by-mon-hoc/${maMonHoc}`);
    }
};
