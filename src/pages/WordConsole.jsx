import api from '@/lib/api';
import React, { useState, useEffect, useMemo } from 'react';
import { Filter, Plus } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { PageShell, PageHeader } from '@/components/ui/page';

// Extracted components
import CourseTopicTree from '@/components/console/CourseTopicTree';
import ItemForm from '@/components/console/ItemForm';
import ItemTable from '@/components/console/ItemTable';

const WordConsole = () => {
    const [items, setItems] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [selectedTopic, setSelectedTopic] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCourses, setExpandedCourses] = useState({});
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [itemsLoading, setItemsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Management states
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        primaryText: '',
        secondaryText: '',
        meaning: '',
        topicId: ''
    });

    // Custom hooks
    const { courses, loading: coursesLoading } = useCourses();
    const toast = useToast();

    // Load items based on selected filters
    useEffect(() => {
        let cancelled = false;

        const loadItems = async () => {
            if (selectedCourse === 'all' && selectedTopic === 'all') {
                setItems([]);
                return;
            }

            try {
                setItemsLoading(true);
                let loadedItems = [];

                if (selectedTopic !== 'all') {
                    const itemsRes = await api.get(`/topics/${selectedTopic}/items`);
                    const topic = courses.flatMap(c => c.topics).find(t => t.id.toString() === selectedTopic.toString());
                    const course = courses.find(c => c.topics.some(t => t.id.toString() === selectedTopic.toString()));
                    loadedItems = (itemsRes.data || []).map(item => ({
                        ...item,
                        courseId: course?.id,
                        courseTitle: course?.title,
                        topicId: topic?.id,
                        topicTitle: topic?.title
                    }));
                } else if (selectedCourse !== 'all') {
                    const course = courses.find(c => c.id.toString() === selectedCourse.toString());
                    if (course) {
                        const topicItems = await Promise.all((course.topics || []).map(async (topic) => {
                            try {
                                const itemsRes = await api.get(`/topics/${topic.id}/items`);
                                return (itemsRes.data || []).map(item => ({
                                    ...item,
                                    courseId: course.id,
                                    courseTitle: course.title,
                                    topicId: topic.id,
                                    topicTitle: topic.title
                                }));
                            } catch (err) {
                                console.error('Failed to load items', err);
                                return [];
                            }
                        }));
                        loadedItems = topicItems.flat();
                    }
                }

                if (!cancelled) setItems(loadedItems);
            } catch (err) {
                console.error('Failed to load items', err);
            } finally {
                if (!cancelled) setItemsLoading(false);
            }
        };

        loadItems();
        return () => { cancelled = true; };
    }, [selectedCourse, selectedTopic, courses]);

    // Filtering and pagination
    const filteredItems = useMemo(() => {
        if (!searchQuery) return items;
        const q = searchQuery.toLowerCase();
        return items.filter(item =>
            item.primaryText?.toLowerCase().includes(q) ||
            item.meaning?.toLowerCase().includes(q)
        );
    }, [items, searchQuery]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filteredItems]);

    const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

    // Course/Topic selection handlers
    const handleSelectCourse = (courseId) => {
        setSelectedCourse(courseId);
        setSelectedTopic('all');
        if (courseId !== 'all') setExpandedCourses(prev => ({ ...prev, [courseId]: true }));
        setMobileFiltersOpen(false);
    };

    const handleSelectTopic = (topicId, courseId, e) => {
        e.stopPropagation();
        setSelectedCourse(courseId);
        setSelectedTopic(topicId);
        setMobileFiltersOpen(false);
    };

    const toggleCourse = (courseId) => {
        setExpandedCourses(prev => ({ ...prev, [courseId]: !prev[courseId] }));
    };

    // Item management handlers
    const handleAddItem = async () => {
        if (!formData.primaryText || !formData.meaning || !formData.topicId) {
            toast.error('Please fill in all required fields');
            return;
        }
        try {
            await api.post(`/topics/${formData.topicId}/items`, {
                primaryText: formData.primaryText,
                secondaryText: formData.secondaryText,
                meaning: formData.meaning
            });
            closeForm();
            setSelectedTopic(formData.topicId);
            toast.success('Word added!');
        } catch (err) {
            console.error('Failed to add item', err);
            toast.error('Failed to add item. Please try again.');
        }
    };

    const handleEditItem = async () => {
        if (!editingItem) return;
        try {
            await api.put(`/items/${editingItem.id}`, {
                primaryText: formData.primaryText,
                secondaryText: formData.secondaryText,
                meaning: formData.meaning
            });
            setItems(items.map(item =>
                item.id === editingItem.id ? { ...item, ...formData } : item
            ));
            closeForm();
            toast.success('Word updated!');
        } catch (err) {
            console.error('Failed to edit item', err);
            toast.error('Failed to edit item. Please try again.');
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            await api.delete(`/items/${itemId}`);
            setItems(items.filter(item => item.id !== itemId));
            toast.success('Word deleted');
        } catch (err) {
            console.error('Failed to delete item', err);
            toast.error(err.response?.data?.message || 'Failed to delete item');
        }
    };

    const openEditForm = (item) => {
        setEditingItem(item);
        setFormData({
            primaryText: item.primaryText,
            secondaryText: item.secondaryText || '',
            meaning: item.meaning,
            topicId: item.topicId
        });
        setShowAddForm(true);
    };

    const closeForm = () => {
        setShowAddForm(false);
        setEditingItem(null);
        setFormData({ primaryText: '', secondaryText: '', meaning: '', topicId: '' });
    };

    const canAddItems = selectedTopic !== 'all' || selectedCourse !== 'all';
    const showEmptyState = selectedCourse === 'all' && selectedTopic === 'all' && !searchQuery;

    return (
        <PageShell>
            <div className="flex items-center justify-between mb-6">
                <PageHeader
                    title="Word console"
                    description={itemsLoading ? 'Loading...' : `Manage ${filteredItems.length} vocabulary items`}
                />
                <Button onClick={() => setShowAddForm(true)} disabled={!canAddItems} className="hidden sm:flex gap-2">
                    <Plus className="h-4 w-4" />
                    Add word
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {mobileFiltersOpen && (
                    <div
                        className="fixed inset-0 bg-black/40 z-40 md:hidden"
                        onClick={() => setMobileFiltersOpen(false)}
                    />
                )}

                <CourseTopicTree
                    courses={courses}
                    coursesLoading={coursesLoading}
                    selectedCourse={selectedCourse}
                    selectedTopic={selectedTopic}
                    expandedCourses={expandedCourses}
                    searchQuery={searchQuery}
                    mobileFiltersOpen={mobileFiltersOpen}
                    onSearchChange={setSearchQuery}
                    onSelectCourse={handleSelectCourse}
                    onSelectTopic={handleSelectTopic}
                    onToggleCourse={toggleCourse}
                    onCloseMobile={() => setMobileFiltersOpen(false)}
                />

                <main className="flex-1 space-y-6">
                    {/* Mobile controls */}
                    <div className="flex flex-col sm:flex-row gap-3 md:hidden">
                        <Button
                            variant="outline"
                            onClick={() => setMobileFiltersOpen(true)}
                            className="flex-1"
                        >
                            <Filter className="mr-2 h-4 w-4" /> Filters
                        </Button>
                        <Button onClick={() => setShowAddForm(true)} disabled={!canAddItems} className="flex-1 gap-2">
                            <Plus className="h-4 w-4" />
                            Add word
                        </Button>
                    </div>

                    {/* Add/Edit Form */}
                    {showAddForm && (
                        <ItemForm
                            isEditing={!!editingItem}
                            formData={formData}
                            courses={courses}
                            onFormChange={setFormData}
                            onSubmit={editingItem ? handleEditItem : handleAddItem}
                            onClose={closeForm}
                        />
                    )}

                    {/* Items Table */}
                    <ItemTable
                        items={paginatedItems}
                        loading={itemsLoading}
                        showEmptyState={showEmptyState}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        onEditItem={openEditForm}
                        onDeleteItem={handleDeleteItem}
                    />
                </main>
            </div>
        </PageShell>
    );
};

export default WordConsole;
