import { useCallback, useState } from 'react';
import api from '@/lib/api';

export function useInsights() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadInsights = useCallback(async (activityLimit = 50) => {
        try {
            setLoading(true);
            setError(null);
            const res = await api.get('/insights/management', { params: { activityLimit } });
            setData(res.data);
            return { success: true, data: res.data };
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Failed to load insights';
            setError(msg);
            return { success: false, error: msg };
        } finally {
            setLoading(false);
        }
    }, []);

    return { data, loading, error, loadInsights };
}
