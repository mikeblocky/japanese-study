import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

/**
 * Custom hook for managing courses with their topics.
 * Fetches courses and their topics in one call.
 */
export function useCourses(autoLoad = true) {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loadCourses = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // First get courses
            const coursesRes = await api.get('/courses');
            const coursesData = coursesRes.data || [];

            // Then fetch topics for each course in parallel
            const coursesWithTopics = await Promise.all(
                coursesData.map(async (course) => {
                    try {
                        const topicsRes = await api.get(`/courses/${course.id}/topics`);
                        return { ...course, topics: topicsRes.data || [] };
                    } catch (err) {
                        console.warn(`Failed to load topics for course ${course.id}:`, err);
                        return { ...course, topics: [] };
                    }
                })
            );

            setCourses(coursesWithTopics);
            return { success: true, data: coursesWithTopics };
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to load courses';
            setError(errorMsg);
            console.error('Failed to load courses:', err);
            return { success: false, error: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (autoLoad) {
            loadCourses();
        }
    }, [autoLoad, loadCourses]);

    const addCourse = async (courseData) => {
        try {
            const res = await api.post('/courses', courseData);
            await loadCourses(); // Refresh list
            return { success: true, data: res.data };
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to add course';
            return { success: false, error: errorMsg };
        }
    };

    const updateCourse = async (id, courseData) => {
        try {
            const res = await api.put(`/courses/${id}`, courseData);
            await loadCourses(); // Refresh list
            return { success: true, data: res.data };
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to update course';
            return { success: false, error: errorMsg };
        }
    };

    const deleteCourse = async (id) => {
        try {
            await api.delete(`/courses/${id}`);
            await loadCourses(); // Refresh list
            return { success: true };
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to delete course';
            return { success: false, error: errorMsg };
        }
    };

    const getCourseById = async (id) => {
        try {
            const res = await api.get(`/courses/${id}`);
            return { success: true, data: res.data };
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to load course';
            return { success: false, error: errorMsg };
        }
    };

    return {
        courses,
        loading,
        error,
        loadCourses,
        addCourse,
        updateCourse,
        deleteCourse,
        getCourseById
    };
}
