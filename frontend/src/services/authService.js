import api from './api';

export const authService = {
    signup: async (data) => {
        const response = await api.post('/auth/signup', data);
        return response.data;
    },
    login: async (data) => {
        const response = await api.post('/auth/login', data);
        if (response.data.access_token) {
            localStorage.setItem('access_token', response.data.access_token);
        }
        return response.data;
    },
    logout: async () => {
        await api.post('/auth/logout');
        localStorage.removeItem('access_token');
    },
    getMe: async () => {
        const response = await api.get('/users/me');
        return response.data;
    }
};
