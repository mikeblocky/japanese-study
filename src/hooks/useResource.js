import { useState, useCallback } from 'react';
import api from '@/lib/api';

/**
 * Generic resource hook factory - reduces boilerplate for CRUD operations.
 * 
 * Usage:
 *   const { data, loading, error, load, add, update, remove } = useResource('/courses');
 *   const { data: topics, load: loadTopics } = useResource('/courses/1/topics');
 */
export function useResource(basePath, options = {}) {
    const { autoLoad = false, initialData = [] } = options;

    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const load = useCallback(async (customPath = basePath) => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get(customPath);
            setData(res.data || []);
            return { success: true, data: res.data };
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to load';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [basePath]);

    const add = useCallback(async (itemData, customPath = basePath) => {
        try {
            const res = await api.post(customPath, itemData);
            await load(); // Refresh list
            return { success: true, data: res.data };
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to add';
            return { success: false, error: errorMsg };
        }
    }, [basePath, load]);

    const update = useCallback(async (id, itemData) => {
        try {
            const res = await api.put(`${basePath}/${id}`, itemData);
            await load(); // Refresh list
            return { success: true, data: res.data };
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to update';
            return { success: false, error: errorMsg };
        }
    }, [basePath, load]);

    const remove = useCallback(async (id) => {
        try {
            await api.delete(`${basePath}/${id}`);
            await load(); // Refresh list
            return { success: true };
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to delete';
            return { success: false, error: errorMsg };
        }
    }, [basePath, load]);

    const getById = useCallback(async (id) => {
        try {
            const res = await api.get(`${basePath}/${id}`);
            return { success: true, data: res.data };
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to load';
            return { success: false, error: errorMsg };
        }
    }, [basePath]);

    // Auto-load on mount if enabled
    useState(() => {
        if (autoLoad) load();
    });

    return {
        data,
        loading,
        error,
        setData,
        load,
        add,
        update,
        remove,
        getById
    };
}

/**
 * Convenience wrapper with auto-loading.
 */
export function useAutoResource(basePath, options = {}) {
    return useResource(basePath, { ...options, autoLoad: true });
}
