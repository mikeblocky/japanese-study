// API configuration
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const API_ENDPOINTS = {
    // Auth
    login: `${API_BASE}/api/auth/login`,
    register: `${API_BASE}/api/auth/register`,

    // Data
    courses: `${API_BASE}/api/data/courses`,
    topics: (courseId) => `${API_BASE}/api/data/courses/${courseId}/topics`,
    topicItems: (topicId) => `${API_BASE}/api/data/topics/${topicId}/items`,
    types: `${API_BASE}/api/data/types`,

    // Study
    mastery: (userId) => `${API_BASE}/api/study/mastery/${userId}`,
    submitAnswer: `${API_BASE}/api/study/answer`,
    sessions: `${API_BASE}/api/study/sessions`,

    // Goals
    goals: (userId) => `${API_BASE}/api/goals/${userId}`,

    // Users
    users: `${API_BASE}/api/users`,
    user: (id) => `${API_BASE}/api/users/${id}`,
};

export default API_BASE;
