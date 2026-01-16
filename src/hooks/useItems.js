import { useState, useCallback } from 'react';
import api from '@/lib/api';

export function useItems(topicId = null) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadItems = useCallback(async (tId = topicId) => {
        if (!tId) {
            setItems([]);
            return { success: false, error: 'No topic ID provided' };
        }

        try {
            setLoading(true);
            setError(null);
            const res = await api.get(`/topics/${tId}/items`);
            setItems(res.data || []);
            return { success: true, data: res.data };
        } catch (err) {
            console.error('Failed to load items:', err);
            const errorMsg = err.response?.data?.message || 'Failed to load items';
            setError(errorMsg);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [topicId]);

    const addItem = async (tId, itemData) => {
        try {
            const res = await api.post(`/topics/${tId}/items`, itemData);
            await loadItems(tId);
            return { success: true, data: res.data };
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to add item';
            return { success: false, error: errorMsg };
        }
    };

    const updateItem = async (itemId, itemData, tId = topicId) => {
        try {
            const res = await api.put(`/items/${itemId}`, itemData);
            if (tId) await loadItems(tId);
            return { success: true, data: res.data };
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to update item';
            return { success: false, error: errorMsg };
        }
    };

    const deleteItem = async (itemId, tId = topicId) => {
        try {
            await api.delete(`/items/${itemId}`);
            if (tId) await loadItems(tId);
            return { success: true };
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to delete item';
            return { success: false, error: errorMsg };
        }
    };

    return {
        items,
        loading,
        error,
        loadItems,
        addItem,
        updateItem,
        deleteItem
    };
}
