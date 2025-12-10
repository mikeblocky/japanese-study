// API configuration - central place for all API calls
const API_BASE = import.meta.env.DEV
    ? 'http://localhost:8080'
    : (import.meta.env.VITE_API_BASE_URL || 'https://japanese-study-api.onrender.com');

// Helper function to build API URLs
export const api = (path) => `${API_BASE}/api${path}`;

// Fetch helper with common options
export const apiFetch = async (path, options = {}) => {
    const url = api(path);
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    return response;
};

export const API_ENDPOINTS = {
    // Auth
    login: `${API_BASE}/api/auth/login`,
    register: `${API_BASE}/api/auth/register`,

    // Data
    courses: `${API_BASE}/api/data/courses`,
    topics: (courseId) => `${API_BASE}/api/data/courses/${courseId}/topics`,
    topicItems: (topicId) => `${API_BASE}/api/data/topics/${topicId}/items`,
    types: `${API_BASE}/api/data/types`,
    items: `${API_BASE}/api/data/items`,

    // Study
    mastery: (userId) => `${API_BASE}/api/sessions/mastery/${userId}`,
    sessions: `${API_BASE}/api/sessions`,
    sessionsStart: (userId) => `${API_BASE}/api/sessions/start?userId=${userId}`,
    sessionsDue: (userId) => `${API_BASE}/api/sessions/due?userId=${userId}`,

    // Stats
    stats: `${API_BASE}/api/stats/summary`,
    sessionStats: (userId) => `${API_BASE}/api/sessions/stats?userId=${userId}`,

    // Progress
    progress: (userId) => `${API_BASE}/api/progress/summary?userId=${userId}`,

    // Goals
    goals: `${API_BASE}/api/goals`,
};

export default API_BASE;


