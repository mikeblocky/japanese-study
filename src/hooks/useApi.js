import { useState } from 'react';
import api from '@/lib/api';

/**
 * Generic API hook for making requests with loading and error states
 * Eliminates duplicated API logic across components
 */
export function useApi() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const request = async (method, url, data = null, config = {}) => {
        setLoading(true);
        setError(null);

        try {
            const response = await api[method](url, data, config);
            return { success: true, data: response.data };
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Request failed';
            setError(errorMsg);
            console.error(`API Error [${method.toUpperCase()} ${url}]:`, err);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    const get = (url, config) => request('get', url, null, config);
    const post = (url, data, config) => request('post', url, data, config);
    const put = (url, data, config) => request('put', url, data, config);
    const del = (url, config) => request('delete', url, null, config);

    const clearError = () => setError(null);

    return {
        loading,
        error,
        get,
        post,
        put,
        del,
        clearError
    };
}
