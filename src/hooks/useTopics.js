import { useState, useCallback } from 'react';
import api from '@/lib/api';

/**
 * Custom hook for managing topics
 * Provides CRUD operations for topics within courses
 */
export function useTopics(courseId = null) {
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadTopics = useCallback(async (id = courseId) => {
        if (!id) {
            setTopics([]);
            return { success: false, error: 'No course ID provided' };
        }

        try {
            setLoading(true);
            setError(null);
            const res = await api.get(`/courses/${id}/topics`);
            setTopics(res.data || []);
            return { success: true, data: res.data };
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to load topics';
            setError(errorMsg);
            console.error('Failed to load topics:', err);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    const addTopic = async (cId, topicData) => {
        try {
            const res = await api.post(`/courses/${cId}/topics`, topicData);
            await loadTopics(cId); // Refresh list
            return { success: true, data: res.data };
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to add topic';
            return { success: false, error: errorMsg };
        }
    };

    const updateTopic = async (topicId, topicData, cId = courseId) => {
        try {
            const res = await api.put(`/topics/${topicId}`, topicData);
            if (cId) {
                await loadTopics(cId); // Refresh list
            }
            return { success: true, data: res.data };
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to update topic';
            return { success: false, error: errorMsg };
        }
    };

    const deleteTopic = async (topicId, cId = courseId) => {
        try {
            await api.delete(`/topics/${topicId}`);
            if (cId) {
                await loadTopics(cId); // Refresh list
            }
            return { success: true };
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to delete topic';
            return { success: false, error: errorMsg };
        }
    };

    const addItemToTopic = async (topicId, itemData) => {
        try {
            const res = await api.post(`/topics/${topicId}/items`, itemData);
            return { success: true, data: res.data };
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to add item';
            return { success: false, error: errorMsg };
        }
    };

    return {
        topics,
        loading,
        error,
        loadTopics,
        addTopic,
        updateTopic,
        deleteTopic,
        addItemToTopic
    };
}
