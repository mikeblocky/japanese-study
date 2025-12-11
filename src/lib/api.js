import axios from 'axios';

// Use environment variable for production, fallback to localhost for dev
export const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use(
    (config) => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user && user.accessToken) {
                    config.headers.Authorization = `Bearer ${user.accessToken}`;
                }
            }
        } catch (e) {
            console.error('Failed to parse user from localStorage:', e);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
