import api from '@/lib/api';
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ChevronRight, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageShell, PageHeader } from '@/components/ui/page';
import { Label } from '@/components/ui/label';

const WordConsole = () => {
    const [courses, setCourses] = useState([]);
    const [items, setItems] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [selectedTopic, setSelectedTopic] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCourses, setExpandedCourses] = useState({});
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [coursesLoading, setCoursesLoading] = useState(true);
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

    // Load courses and topics only (not all items upfront)
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                setCoursesLoading(true);
                const coursesRes = await api.get('/courses');
                const baseCourses = Array.isArray(coursesRes.data) ? coursesRes.data : [];

                const coursesWithTopics = await Promise.all(baseCourses.map(async (course) => {
                    try {
                        const topicsRes = await api.get(`/courses/${course.id}/topics`);
                        return { ...course, topics: topicsRes.data || [] };
                    } catch (err) {
                        console.error('Failed to load topics', err);
                        return { ...course, topics: [] };
                    }
                }));

                if (!cancelled) {
                    setCourses(coursesWithTopics);
                }
            } catch (err) {
                console.error('Failed to load console data', err);
            } finally {
                if (!cancelled) setCoursesLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, []);

    // Load items on demand based on selected filters
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

                if (!cancelled) {
                    setItems(loadedItems);
                }
            } catch (err) {
                console.error('Failed to load items', err);
            } finally {
                if (!cancelled) setItemsLoading(false);
            }
        };

        loadItems();
        return () => { cancelled = true; };
    }, [selectedCourse, selectedTopic, courses]);

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

    const showEmptyState = selectedCourse === 'all' && selectedTopic === 'all' && !searchQuery;

    // Management functions
    const handleAddItem = async () => {
        if (!formData.primaryText || !formData.meaning || !formData.topicId) {
            alert('Please fill in all required fields');
            return;
        }
        try {
            await api.post(`/topics/${formData.topicId}/items`, {
                primaryText: formData.primaryText,
                secondaryText: formData.secondaryText,
                meaning: formData.meaning
            });
            setShowAddForm(false);
            setFormData({ primaryText: '', secondaryText: '', meaning: '', topicId: '' });
            // Reload items
            setSelectedCourse(selectedCourse);
            setSelectedTopic(formData.topicId);
        } catch (err) {
            console.error('Failed to add item', err);
            alert('Failed to add item. Please try again.');
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
            setEditingItem(null);
            setFormData({ primaryText: '', secondaryText: '', meaning: '', topicId: '' });
            // Reload items
            const loadedItems = await api.get(`/topics/${selectedTopic}/items`);
            setItems(items.map(item => 
                item.id === editingItem.id 
                    ? { ...item, ...formData }
                    : item
            ));
        } catch (err) {
            console.error('Failed to edit item', err);
            alert('Failed to edit item. Please try again.');
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            await api.delete(`/items/${itemId}`);
            setItems(items.filter(item => item.id !== itemId));
        } catch (err) {
            console.error('Failed to delete item', err);
            alert('Failed to delete item. Please try again.');
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
                    <aside className={cn(
                        "fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl border-t shadow-2xl max-h-[80vh] md:relative md:bottom-auto md:w-64 md:bg-transparent md:shadow-none md:border-0 md:rounded-none md:max-h-none transition-transform duration-300",
                        mobileFiltersOpen ? "translate-y-0" : "translate-y-full md:translate-y-0"
                    )}>
                        <Card className="border-0 md:border">
                            <CardHeader className="flex flex-row items-center justify-between pb-3 md:hidden">
                                <CardTitle className="text-lg">Filters</CardTitle>
                                <Button variant="ghost" size="sm" onClick={() => setMobileFiltersOpen(false)}>
                                    <X className="h-5 w-5" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-4 max-h-[calc(80vh-4rem)] overflow-y-auto md:max-h-none">
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search words"
                                            className="pl-9"
                                        />
                                    </div>

                                    <Button
                                        variant={selectedCourse === 'all' ? "secondary" : "ghost"}
                                        onClick={() => handleSelectCourse('all')}
                                        className="w-full justify-start"
                                    >
                                        All courses
                                    </Button>

                                    <div className="text-xs font-semibold uppercase text-muted-foreground px-1">Courses</div>
                                    
                                    {coursesLoading ? (
                                        <div className="space-y-2">
                                            {[1, 2, 3].map(i => (
                                                <Skeleton key={i} className="h-8 w-full" />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {courses.map(course => (
                                                <div key={course.id} className="space-y-1">
                                                    <div className="flex items-center gap-1">
                                                        <Button variant="ghost" size="sm" onClick={() => toggleCourse(course.id)} className="h-auto p-1">
                                                            <ChevronRight className={cn("h-3 w-3 transition-transform", expandedCourses[course.id] && "rotate-90")} />
                                                        </Button>
                                                        <Button
                                                            variant={selectedCourse.toString() === course.id.toString() && selectedTopic === 'all' ? "secondary" : "ghost"}
                                                            onClick={() => handleSelectCourse(course.id)}
                                                            className="flex-1 justify-start h-auto px-2 py-1 text-sm truncate"
                                                        >
                                                            {course.title}
                                                        </Button>
                                                    </div>
                                                    {expandedCourses[course.id] && (
                                                        <div className="ml-6 pl-2 border-l border-border/60 space-y-1">
                                                            {course.topics.map(topic => (
                                                                <Button
                                                                    key={topic.id}
                                                                    variant={selectedTopic.toString() === topic.id.toString() ? "secondary" : "ghost"}
                                                                    onClick={(e) => handleSelectTopic(topic.id, course.id, e)}
                                                                    className="w-full justify-start h-auto px-2 py-1 text-xs truncate"
                                                                >
                                                                    {topic.title}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </aside>

                    <main className="flex-1 space-y-6">
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
                            <Card className="border-primary">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>{editingItem ? 'Edit word' : 'Add new word'}</CardTitle>
                                        <Button variant="ghost" size="sm" onClick={closeForm}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="term">Japanese Term *</Label>
                                            <Input
                                                id="term"
                                                value={formData.primaryText}
                                                onChange={(e) => setFormData({ ...formData, primaryText: e.target.value })}
                                                placeholder="e.g., こんにちは"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="reading">Reading (Optional)</Label>
                                            <Input
                                                id="reading"
                                                value={formData.secondaryText}
                                                onChange={(e) => setFormData({ ...formData, secondaryText: e.target.value })}
                                                placeholder="e.g., konnichiwa"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="meaning">Meaning *</Label>
                                        <Input
                                            id="meaning"
                                            value={formData.meaning}
                                            onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                                            placeholder="e.g., Hello"
                                        />
                                    </div>
                                    {!editingItem && (
                                        <div className="space-y-2">
                                            <Label htmlFor="topic">Topic *</Label>
                                            <select
                                                id="topic"
                                                value={formData.topicId}
                                                onChange={(e) => setFormData({ ...formData, topicId: e.target.value })}
                                                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                            >
                                                <option value="">Select a topic</option>
                                                {courses.flatMap(course => 
                                                    course.topics.map(topic => (
                                                        <option key={topic.id} value={topic.id}>
                                                            {course.title} - {topic.title}
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        </div>
                                    )}
                                    <div className="flex gap-2 pt-2">
                                        <Button onClick={editingItem ? handleEditItem : handleAddItem} className="flex-1">
                                            <Check className="mr-2 h-4 w-4" />
                                            {editingItem ? 'Update' : 'Add'}
                                        </Button>
                                        <Button variant="outline" onClick={closeForm} className="flex-1">
                                            Cancel
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {itemsLoading ? (
                            <Card>
                                <CardContent className="p-6 space-y-3">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="flex gap-4">
                                            <Skeleton className="h-4 w-1/4" />
                                            <Skeleton className="h-4 w-1/3" />
                                            <Skeleton className="h-4 w-1/6" />
                                            <Skeleton className="h-4 w-1/6" />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        ) : showEmptyState ? (
                            <Card>
                                <CardContent className="p-12 text-center">
                                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">Select a course or topic</h3>
                                    <p className="text-muted-foreground">Choose from the sidebar to view vocabulary items</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <>
                                <Card>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-secondary/40">
                                                <tr className="border-b">
                                                    <th className="px-3 sm:px-4 py-3 text-left font-semibold text-foreground">Term</th>
                                                    <th className="px-3 sm:px-4 py-3 text-left font-semibold text-foreground">Meaning</th>
                                                    <th className="px-3 sm:px-4 py-3 text-left font-semibold text-foreground hidden md:table-cell">Course</th>
                                                    <th className="px-3 sm:px-4 py-3 text-left font-semibold text-foreground hidden lg:table-cell">Topic</th>
                                                    <th className="px-3 sm:px-4 py-3 text-right font-semibold text-foreground">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {paginatedItems.map(item => (
                                                    <tr key={item.id} className="hover:bg-secondary/40 transition-colors">
                                                        <td className="px-3 sm:px-4 py-3 font-medium">{item.primaryText}</td>
                                                        <td className="px-3 sm:px-4 py-3 text-muted-foreground">{item.meaning}</td>
                                                        <td className="px-3 sm:px-4 py-3 text-muted-foreground hidden md:table-cell">
                                                            <Badge variant="outline" className="text-xs">{item.courseTitle}</Badge>
                                                        </td>
                                                        <td className="px-3 sm:px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">{item.topicTitle}</td>
                                                        <td className="px-3 sm:px-4 py-3">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="sm"
                                                                    onClick={() => openEditForm(item)}
                                                                    className="h-8 w-8 p-0"
                                                                >
                                                                    <Edit2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="sm"
                                                                    onClick={() => handleDeleteItem(item.id)}
                                                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>

                                {filteredItems.length === 0 && (
                                    <Card>
                                        <CardContent className="p-8 text-center text-muted-foreground">
                                            No items match your search.
                                        </CardContent>
                                    </Card>
                                )}

                                {totalPages > 1 && (
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="w-full sm:w-auto"
                                        >
                                            Previous
                                        </Button>
                                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="w-full sm:w-auto"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>
        </PageShell>
    );
};

export default WordConsole;
