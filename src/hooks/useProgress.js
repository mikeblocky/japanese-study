import { useState, useCallback } from 'react';
import api from '@/lib/api';


export function useProgress() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);
    const [topicProgress, setTopicProgress] = useState({});


    const recordProgress = useCallback(async (studyItemId, correct) => {
        try {
            const response = await api.post('/progress/record', {
                studyItemId,
                correct
            });
            return response.data;
        } catch (err) {
            console.error('Failed to record progress:', err);
            throw err;
        }
    }, []);


    const getTopicProgress = useCallback(async (topicId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/progress/topic/${topicId}`);
            const progressMap = {};
            response.data.forEach(p => {
                progressMap[p.studyItemId] = p;
            });
            setTopicProgress(prev => ({ ...prev, [topicId]: progressMap }));
            return progressMap;
        } catch (err) {
            console.error('Failed to fetch topic progress:', err);
            setError(err.message);
            return {};
        } finally {
            setLoading(false);
        }
    }, []);


    const getStats = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/progress/stats');
            setStats(response.data);
            return response.data;
        } catch (err) {
            console.error('Failed to fetch stats:', err);
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);


    const getDueForReview = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/progress/due');
            return response.data;
        } catch (err) {
            console.error('Failed to fetch due items:', err);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Get mastery level indicator (0-5 scale).
     */
    const getMasteryColor = useCallback((level) => {
        const colors = {
            0: 'text-muted-foreground',
            1: 'text-red-500',
            2: 'text-orange-500',
            3: 'text-yellow-500',
            4: 'text-green-500',
            5: 'text-emerald-500'
        };
        return colors[level] || colors[0];
    }, []);

    const getMasteryLabel = useCallback((level) => {
        const labels = {
            0: 'New',
            1: 'Learning',
            2: 'Learning',
            3: 'Reviewing',
            4: 'Reviewing',
            5: 'Mastered'
        };
        return labels[level] || labels[0];
    }, []);

    return {
        loading,
        error,
        stats,
        topicProgress,
        recordProgress,
        getTopicProgress,
        getStats,
        getDueForReview,
        getMasteryColor,
        getMasteryLabel
    };
}
