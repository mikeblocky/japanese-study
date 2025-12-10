import API_BASE from '@/lib/api';
import React, { useState, useEffect } from 'react';
import { Search, Filter, Edit, Save, X, RotateCcw, ChevronDown, ChevronRight, MoreHorizontal, BookOpen, Layers, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const WordConsole = () => {
    // Data State
    const [courses, setCourses] = useState([]);
    const [allItems, setAllItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [masteryData, setMasteryData] = useState({});

    // Filter State
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [selectedTopic, setSelectedTopic] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('default'); // 'default', 'srs_asc', 'srs_desc'

    // UI State
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [expandedCourses, setExpandedCourses] = useState({});
    const [editingItem, setEditingItem] = useState(null);
    const [editForm, setEditForm] = useState({ primaryText: '', secondaryText: '', meaning: '' });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    // --- Data Fetching ---
    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoading(true);
                const [coursesRes, masteryRes] = await Promise.all([
                    fetch(`${API_BASE}/api/data/courses`),
                    fetch(`${API_BASE}/api/sessions/mastery?userId=1`)
                ]);

                const coursesData = await coursesRes.json();
                const masteryJson = await masteryRes.json();

                // Mastery Map
                const map = {};
                masteryJson.forEach(m => map[m.item.id] = m);
                setMasteryData(map);

                // Fetch items for each topic since they're not included in courses response
                const flattened = [];
                for (const course of coursesData) {
                    for (const topic of (course.topics || [])) {
                        try {
                            const itemsRes = await fetch(`${API_BASE}/api/data/topics/${topic.id}/items`);
                            const items = await itemsRes.json();
                            items.forEach(item => {
                                flattened.push({
                                    ...item,
                                    courseTitle: course.title,
                                    courseId: course.id,
                                    topicTitle: topic.title,
                                    topicId: topic.id
                                });
                            });
                            // Also store items count on topic for sidebar display
                            topic.studyItems = items;
                        } catch (err) {
                            console.error(`Failed to fetch items for topic ${topic.id}:`, err);
                        }
                    }
                }

                setCourses(coursesData);
                setAllItems(flattened);
            } catch (err) {
                console.error("Failed to fetch data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // --- Filtering Logic ---
    useEffect(() => {
        let result = allItems;

        if (selectedCourse !== 'all') {
            result = result.filter(item => item.courseId.toString() === selectedCourse.toString());
        }

        if (selectedTopic !== 'all') {
            result = result.filter(item => item.topicId.toString() === selectedTopic.toString());
        }

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(item =>
                (item.primaryText && item.primaryText.toLowerCase().includes(lowerQuery)) ||
                (item.meaning && item.meaning.toLowerCase().includes(lowerQuery))
            );
        }

        // Sorting
        if (sortBy === 'srs_asc') {
            result.sort((a, b) => (masteryData[a.id]?.srsLevel || 0) - (masteryData[b.id]?.srsLevel || 0));
        } else if (sortBy === 'srs_desc') {
            result.sort((a, b) => (masteryData[b.id]?.srsLevel || 0) - (masteryData[a.id]?.srsLevel || 0));
        }

        setFilteredItems(result);
        setCurrentPage(1);
    }, [selectedCourse, selectedTopic, searchQuery, allItems, masteryData, sortBy]);

    // --- Pagination ---
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

    // --- Handlers ---
    const toggleCourse = (courseId) => {
        // If clicking same course, toggle expand. If different, select it and expand.
        // Actually, let's keep selection and expansion separate for better UX.
        // Expansion logic:
        setExpandedCourses(prev => ({ ...prev, [courseId]: !prev[courseId] }));
    };

    const handleSelectCourse = (courseId) => {
        setSelectedCourse(courseId);
        setSelectedTopic('all');
        if (courseId !== 'all') setExpandedCourses(prev => ({ ...prev, [courseId]: true }));
        setMobileFiltersOpen(false);
    };

    const handleSelectTopic = (topicId, courseId, e) => {
        e.stopPropagation();
        setSelectedCourse(courseId); // Ensure parent course is selected
        setSelectedTopic(topicId);
        setMobileFiltersOpen(false);
    };

    const getSRSLevel = (itemId) => masteryData[itemId]?.srsLevel || 0;

    const handleEditClick = (item) => {
        setEditingItem(item);
        setEditForm({
            primaryText: item.primaryText,
            secondaryText: item.secondaryText || '',
            meaning: item.meaning
        });
    };

    const handleSave = async () => {
        if (!editingItem) return;
        try {
            const res = await fetch(`${API_BASE}/api/data/items/${editingItem.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...editingItem, ...editForm })
            });
            if (res.ok) {
                const updated = await res.json();
                setAllItems(prev => prev.map(i => i.id === updated.id ? { ...i, ...editForm } : i));
                setEditingItem(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-muted-foreground animate-pulse">Loading console...</div>;

    return (
        <div className="flex flex-col md:flex-row min-h-screen gap-6 pb-20 max-w-7xl mx-auto md:pt-6">

            {/* --- Mobile Header / Filter Toggle --- */}
            <div className="md:hidden flex items-center justify-between mb-4">
                <h1 className="text-2xl font-light tracking-tight">Console</h1>
                <button
                    onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                    className="p-2 bg-secondary/50 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                    <Filter className="w-4 h-4" /> Filters
                </button>
            </div>

            {/* --- Sidebar Filters (Desktop + Mobile Drawer) --- */}
            <aside className={cn(
                "fixed inset-0 z-40 bg-background/95 backdrop-blur-xl p-6 transition-transform duration-300 md:relative md:transform-none md:bg-transparent md:backdrop-blur-none md:p-0 md:w-64 md:block border-r md:border-none border-border/50",
                mobileFiltersOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}>
                <div className="flex justify-between items-center md:hidden mb-6">
                    <h2 className="font-semibold text-lg">Filters</h2>
                    <button onClick={() => setMobileFiltersOpen(false)}><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-6">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            placeholder="Search..."
                            className="w-full pl-9 pr-4 py-2 bg-secondary/30 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Filter List */}
                    <div className="space-y-1">
                        <button
                            onClick={() => handleSelectCourse('all')}
                            className={cn(
                                "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                                selectedCourse === 'all' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                            )}
                        >
                            <Layers className="w-4 h-4" /> All Items
                        </button>

                        <div className="pt-2 pb-1 text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider px-3">Courses</div>

                        <div className="space-y-1">
                            {courses.map(course => (
                                <div key={course.id} className="space-y-1">
                                    <div className="flex items-center gap-1 group">
                                        <button
                                            onClick={() => toggleCourse(course.id)}
                                            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <ChevronRight className={cn("w-3 h-3 transition-transform", expandedCourses[course.id] && "rotate-90")} />
                                        </button>
                                        <button
                                            onClick={() => handleSelectCourse(course.id)}
                                            className={cn(
                                                "flex-1 text-left px-2 py-1.5 rounded-md text-sm transition-colors truncate",
                                                selectedCourse.toString() === course.id.toString() && selectedTopic === 'all'
                                                    ? "bg-primary/10 text-primary font-medium"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {course.title}
                                        </button>
                                    </div>

                                    {/* Topics Submenu */}
                                    <AnimatePresence>
                                        {expandedCourses[course.id] && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden ml-6 pl-2 border-l border-border/50 space-y-1"
                                            >
                                                {course.topics?.map(topic => (
                                                    <button
                                                        key={topic.id}
                                                        onClick={(e) => handleSelectTopic(topic.id, course.id, e)}
                                                        className={cn(
                                                            "w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors truncate flex items-center justify-between group",
                                                            selectedTopic.toString() === topic.id.toString()
                                                                ? "text-primary font-medium bg-primary/5"
                                                                : "text-muted-foreground hover:text-foreground"
                                                        )}
                                                    >
                                                        {topic.title}
                                                        <span className="opacity-0 group-hover:opacity-100 text-[10px] bg-secondary px-1 rounded">{topic.studyItems?.length || 0}</span>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>

            {/* --- Main Content --- */}
            <main className="flex-1 space-y-6">

                {/* Header (Desktop) */}
                <div className="hidden md:flex items-center justify-between border-b border-border/40 pb-6">
                    <div>
                        <h1 className="text-3xl font-light tracking-tight text-foreground">Word Console</h1>
                        <p className="text-muted-foreground font-light text-sm mt-1">
                            {filteredItems.length} items found
                        </p>
                    </div>
                    {/* Sort Dropdown could go here */}
                </div>

                {/* --- Mobile List View (Cards) --- */}
                <div className="grid grid-cols-1 gap-4 md:hidden">
                    {paginatedItems.map(item => (
                        <div key={item.id} className="bg-card border border-border/50 rounded-xl p-4 shadow-sm space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-medium">{item.primaryText}</h3>
                                    <p className="text-sm text-muted-foreground">{item.secondaryText}</p>
                                </div>
                                <span className={cn("text-[10px] px-2 py-1 rounded-full font-medium border", getStatusColor(getSRSLevel(item.id)))}>
                                    Lvl {getSRSLevel(item.id)}
                                </span>
                            </div>
                            <div className="pt-2 border-t border-border/30">
                                <p className="text-sm font-medium">{item.meaning}</p>
                                <p className="text-xs text-muted-foreground mt-1">{item.courseTitle} • {item.topicTitle}</p>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button onClick={() => handleEditClick(item)} className="p-2 text-sm bg-secondary/50 rounded-lg text-foreground">Edit</button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* --- Desktop Table View --- */}
                <div className="hidden md:block rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-secondary/20 border-b border-border/50">
                            <tr>
                                <th className="px-6 py-4 font-medium text-muted-foreground text-xs uppercase tracking-wider text-left w-32">Status</th>
                                <th className="px-6 py-4 font-medium text-muted-foreground text-xs uppercase tracking-wider text-left">Term</th>
                                <th className="px-6 py-4 font-medium text-muted-foreground text-xs uppercase tracking-wider text-left">Meaning</th>
                                <th className="px-6 py-4 font-medium text-muted-foreground text-xs uppercase tracking-wider text-left w-48">Location</th>
                                <th className="px-6 py-4 font-medium text-muted-foreground text-xs uppercase tracking-wider text-right w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {paginatedItems.map(item => (
                                <tr key={item.id} className="group hover:bg-secondary/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border", getStatusColor(getSRSLevel(item.id)))}>
                                            <div className={cn("w-1.5 h-1.5 rounded-full bg-current")} />
                                            Lvl {getSRSLevel(item.id)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-foreground text-lg">{item.primaryText}</div>
                                        <div className="text-muted-foreground text-xs font-mono">{item.secondaryText}</div>
                                    </td>
                                    <td className="px-6 py-4 text-foreground/90 font-medium">
                                        {item.meaning}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-muted-foreground">
                                        <div className="line-clamp-1" title={item.courseTitle}>{item.courseTitle}</div>
                                        <div className="line-clamp-1 opacity-60" title={item.topicTitle}>{item.topicTitle}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleEditClick(item)}
                                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 pt-4">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border border-border/50 disabled:opacity-30 hover:bg-secondary transition-colors"
                        >
                            <ChevronRight className="w-4 h-4 rotate-180" />
                        </button>
                        <span className="text-sm text-muted-foreground font-medium px-4">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg border border-border/50 disabled:opacity-30 hover:bg-secondary transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </main>

            {/* Edit Modal (Reused Logic) */}
            <AnimatePresence>
                {editingItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
                        <div className="bg-background w-full max-w-lg rounded-2xl border border-border shadow-2xl p-6 space-y-6 slide-in-from-bottom-10 animate-in duration-300">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold">Edit Word</h2>
                                <button onClick={() => setEditingItem(null)} className="p-1 hover:bg-secondary rounded-full"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium uppercase text-muted-foreground">Term</label>
                                    <input
                                        className="w-full p-3 bg-secondary/30 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                                        value={editForm.primaryText}
                                        onChange={e => setEditForm(prev => ({ ...prev, primaryText: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium uppercase text-muted-foreground">Reading</label>
                                    <input
                                        className="w-full p-3 bg-secondary/30 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                                        value={editForm.secondaryText}
                                        onChange={e => setEditForm(prev => ({ ...prev, secondaryText: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium uppercase text-muted-foreground">Meaning</label>
                                    <input
                                        className="w-full p-3 bg-secondary/30 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                                        value={editForm.meaning}
                                        onChange={e => setEditForm(prev => ({ ...prev, meaning: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setEditingItem(null)} className="px-4 py-2 text-sm font-medium">Cancel</button>
                                <button onClick={handleSave} className="px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90">Save</button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Helper for status colors
const getStatusColor = (level) => {
    if (level === 0) return "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700";
    if (level < 3) return "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
    if (level < 5) return "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800";
    return "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800";
};

export default WordConsole;



