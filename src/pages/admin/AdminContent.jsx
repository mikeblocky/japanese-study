import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Database, BookOpen, Layers, FileText, Upload, Trash2,
    Plus, AlertTriangle, CheckCircle, X, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

import { useAuth } from '@/context/AuthContext';

const api = (path) => `http://localhost:8080/api${path}`;

/**
 * Admin Content Page - Course and content management with Anki import
 */
export default function AdminContent() {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [message, setMessage] = useState(null);
    const [showAnkiImport, setShowAnkiImport] = useState(false);
    const [loading, setLoading] = useState({});

    // Anki import form with refs to prevent flickering
    const courseNameRef = useRef(null);
    const descriptionRef = useRef(null);
    const ankiDataRef = useRef(null);

    const fetchCourses = useCallback(async () => {
        try {
            // Include header for consistency, though backend might not strictly enforce it yet for this endpoint
            const headers = user ? { 'X-User-Id': user.id.toString() } : {};
            const res = await fetch(api('/admin/courses'), { headers });
            if (res.ok) setCourses(await res.json());
        } catch (err) {
            console.error('Failed to fetch courses:', err);
        }
    }, [user]);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const showToast = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const handleDeleteCourse = async (id) => {
        if (!user) return;
        if (!confirm('Delete this course and ALL its topics and items? This cannot be undone!')) return;
        setLoading(l => ({ ...l, [`del-${id}`]: true }));
        try {
            const res = await fetch(api(`/admin/courses/${id}`), {
                method: 'DELETE',
                headers: { 'X-User-Id': user.id.toString() }
            });
            if (res.ok) {
                showToast('success', 'Course deleted');
                fetchCourses();
            }
        } catch (err) {
            showToast('error', err.message);
        } finally {
            setLoading(l => ({ ...l, [`del-${id}`]: false }));
        }
    };

    const handleAnkiImport = async () => {
        if (!user) return;
        const courseName = courseNameRef.current?.value || 'Imported Course';
        const description = descriptionRef.current?.value || '';
        const ankiData = ankiDataRef.current?.value || '';

        if (!ankiData.trim()) {
            showToast('error', 'Please enter Anki data');
            return;
        }

        setLoading(l => ({ ...l, anki: true }));

        try {
            // Parse Anki data: format is "front\tback" or "front\treading\tback" per line
            const lines = ankiData.trim().split('\n').filter(l => l.trim());
            const items = lines.map((line, idx) => {
                const parts = line.split('\t');
                // Support: word, meaning OR word, reading, meaning
                if (parts.length >= 3) {
                    return { front: parts[0], reading: parts[1], back: parts[2], topic: `Lesson ${Math.floor(idx / 20) + 1}` };
                } else if (parts.length >= 2) {
                    return { front: parts[0], back: parts[1], topic: `Lesson ${Math.floor(idx / 20) + 1}` };
                }
                return { front: parts[0] || '', back: '', topic: 'Default' };
            });

            const res = await fetch(api('/admin/anki/import'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': user.id.toString()
                },
                body: JSON.stringify({ courseName, description, items })
            });

            if (res.ok) {
                const result = await res.json();
                showToast('success', `Created course "${result.courseName}" with ${result.topicsCreated} topics and ${result.itemsCreated} items`);
                setShowAnkiImport(false);
                // Clear refs
                if (courseNameRef.current) courseNameRef.current.value = '';
                if (descriptionRef.current) descriptionRef.current.value = '';
                if (ankiDataRef.current) ankiDataRef.current.value = '';
                fetchCourses();
            } else {
                showToast('error', 'Import failed');
            }
        } catch (err) {
            showToast('error', err.message);
        } finally {
            setLoading(l => ({ ...l, anki: false }));
        }
    };

    const Modal = ({ title, children, onClose }) => (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-lg">{title}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                {children}
            </motion.div>
        </motion.div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-light tracking-tight">Content Management</h1>
                    <p className="text-xs text-gray-500 mt-1">{courses.length} courses</p>
                </div>
                <button
                    onClick={() => setShowAnkiImport(true)}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm flex items-center gap-2 transition-colors"
                >
                    <Upload className="w-4 h-4" />
                    Import Anki Data
                </button>
            </div>

            {/* Toast */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                            "p-3 rounded-lg flex items-center gap-2 text-sm",
                            message.type === 'success' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        )}
                    >
                        {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Courses List */}
            <div className="space-y-4">
                {courses.map(course => (
                    <div key={course.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                                    <BookOpen className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-lg">{course.title}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{course.description || 'No description'}</p>
                                    <div className="flex gap-4 mt-3 text-xs">
                                        <span className="flex items-center gap-1 text-gray-500">
                                            <Layers className="w-3.5 h-3.5" />
                                            {course.topicCount} topics
                                        </span>
                                        <span className="flex items-center gap-1 text-gray-500">
                                            <FileText className="w-3.5 h-3.5" />
                                            {course.itemCount} items
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDeleteCourse(course.id)}
                                disabled={loading[`del-${course.id}`]}
                                className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {courses.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No courses yet</p>
                        <p className="text-sm mt-1">Import Anki data to create courses</p>
                    </div>
                )}
            </div>

            {/* Anki Import Modal */}
            <AnimatePresence>
                {showAnkiImport && (
                    <Modal title="Import Anki Data" onClose={() => setShowAnkiImport(false)}>
                        <div className="space-y-4">
                            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-400">
                                <strong>Format:</strong> Tab-separated values, one card per line
                                <br />
                                <code className="text-[10px] font-mono">front[tab]reading[tab]meaning</code> or <code className="text-[10px] font-mono">front[tab]meaning</code>
                                <br />
                                Items are automatically grouped into topics (20 items each)
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Course Name</label>
                                <input
                                    ref={courseNameRef}
                                    type="text"
                                    defaultValue=""
                                    placeholder="e.g., JLPT N5 Vocabulary"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Description</label>
                                <input
                                    ref={descriptionRef}
                                    type="text"
                                    defaultValue=""
                                    placeholder="Optional description"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Anki Export Data (TSV format)</label>
                                <textarea
                                    ref={ankiDataRef}
                                    defaultValue=""
                                    placeholder="日本	にほん	Japan
東京	とうきょう	Tokyo
食べる	たべる	to eat"
                                    className="w-full h-64 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono resize-none"
                                />
                            </div>

                            <button
                                onClick={handleAnkiImport}
                                disabled={loading.anki}
                                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-lg py-3 text-sm font-medium flex items-center justify-center gap-2"
                            >
                                {loading.anki ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Import Data
                                    </>
                                )}
                            </button>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
}
