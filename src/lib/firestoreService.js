import api from './api';

// ============================================
// COURSES & TOPICS
// ============================================

export async function getCourses() {
    const response = await api.get('/courses');
    return response.data;
}

export async function getCourse(courseId) {
    const response = await api.get(`/courses/${courseId}`);
    return response.data;
}

export async function getTopics(courseId) {
    const response = await api.get(`/courses/${courseId}/topics`);
    return response.data;
}

// ============================================
// STUDY ITEMS
// ============================================

export async function getItems(topicId) {
    const response = await api.get(`/study/items/topic/${topicId}`);
    return response.data;
}

// ============================================
// USER PROGRESS (SRS)
// ============================================

export async function getDueItems(uid) {
    // uid is extracted from token on backend usually, but our API might ignore it if properly designed
    const response = await api.get('/study/items/due');
    return response.data;
}

// ============================================
// STUDY SESSIONS
// ============================================

export async function startSession(uid) {
    const response = await api.post('/study/session/start');
    return response.data;
}

export async function endSession(sessionId, durationSeconds) {
    // durationSeconds might be calculated on backend
    const response = await api.post(`/study/session/${sessionId}/end`);
    return response.data;
}

export async function logSessionItem(sessionId, itemId, correct) {
    await api.post(`/study/session/${sessionId}/submit`, {
        itemId,
        correct
    });
}

// ============================================
// STATS & ANALYTICS (Placeholder)
// ============================================

export async function getStatsSummary(uid) {
    // Needs backend Implementation
    return {
        totalDuration: 0,
        totalSessions: 0,
        currentStreak: 0,
        recentActivity: []
    };
}

export default {
    getCourses,
    getCourse,
    getTopics,
    getItems,
    getDueItems,
    startSession,
    endSession,
    logSessionItem,
    getStatsSummary
};
