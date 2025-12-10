import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Layers, Search, FileText, Upload, MoreHorizontal, ChevronRight, User as UserIcon, Save, Image as ImageIcon, Music, HelpCircle, X, Download, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Select } from '@/components/ui/Select';

const CourseManager = () => {
    const { user, updateProfile } = useAuth();
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [items, setItems] = useState([]);
    const [itemTypes, setItemTypes] = useState([]);

    // UI State
    const [viewMode, setViewMode] = useState('CONTENT');
    const [activeTab, setActiveTab] = useState('ALL');
    const [itemSearch, setItemSearch] = useState('');
    const [searchQuery, setSearchQuery] = useState(''); // Added missing state

    // Form inputs
    const [newCourseTitle, setNewCourseTitle] = useState('');
    const [newCourseDesc, setNewCourseDesc] = useState('');
    const [newTopicTitle, setNewTopicTitle] = useState('');

    // Item Inputs
    const [newItemPrimary, setNewItemPrimary] = useState('');
    const [newItemSecondary, setNewItemSecondary] = useState('');
    const [newItemMeaning, setNewItemMeaning] = useState('');
    const [newItemImage, setNewItemImage] = useState('');
    const [newItemAudio, setNewItemAudio] = useState('');
    const [newItemType, setNewItemType] = useState('');

    // Account Form
    const [accountName, setAccountName] = useState(user?.username || '');
    const [accountEmail, setAccountEmail] = useState(user?.email || '');
    const [accountMessage, setAccountMessage] = useState('');

    const [loading, setLoading] = useState(true);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkData, setBulkData] = useState('');

    const primaryInputRef = useRef(null);

    // --- Loading Data ---
    const fetchCourses = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8080/api/data/courses');
            const data = await res.json();
            setCourses(data);
            if (selectedCourse) {
                const updatedCourse = data.find(c => c.id === selectedCourse.id);
                if (updatedCourse) {
                    setSelectedCourse(updatedCourse);
                    if (selectedTopic) {
                        const updatedTopic = updatedCourse.topics?.find(t => t.id === selectedTopic.id);
                        if (updatedTopic) {
                            setSelectedTopic(updatedTopic);
                            fetchItemsForTopic(updatedTopic.id); // Refresh items
                        }
                        else setSelectedTopic(null);
                    }
                } else {
                    setSelectedCourse(null);
                    setSelectedTopic(null);
                }
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const fetchItemTypes = async () => {
        try {
            const res = await fetch('http://localhost:8080/api/data/types');
            if (res.ok) {
                const data = await res.json();
                setItemTypes(data);
                if (data.length > 0) setNewItemType(data[0].id);
            }
        } catch (err) { console.error(err); }
    };

    const fetchItemsForTopic = async (topicId) => {
        try {
            const res = await fetch(`http://localhost:8080/api/data/topics/${topicId}/items`);
            if (res.ok) setItems(await res.json());
        } catch (err) { console.error(err); }
    }

    useEffect(() => { fetchCourses(); fetchItemTypes(); }, []);
    useEffect(() => { if (user) { setAccountName(user.username); setAccountEmail(user.email); } }, [user]);


    // --- Handlers ---
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setAccountMessage('');
        const res = await updateProfile(user.id, { username: accountName, email: accountEmail });
        if (res.success) setAccountMessage('Profile updated successfully.');
        else setAccountMessage('Failed to update profile.');
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:8080/api/data/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newCourseTitle, description: newCourseDesc })
            });
            if (res.ok) { setNewCourseTitle(''); setNewCourseDesc(''); fetchCourses(); }
        } catch (err) { console.error(err); }
    };

    const handleDeleteCourse = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete course?")) return;
        try {
            const res = await fetch(`http://localhost:8080/api/data/courses/${id}`, { method: 'DELETE' });
            if (res.ok) { if (selectedCourse?.id === id) { setSelectedCourse(null); setSelectedTopic(null); } fetchCourses(); }
        } catch (err) { console.error(err); }
    };

    const handleCreateTopic = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:8080/api/data/topics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTopicTitle, course: { id: selectedCourse.id } })
            });
            if (res.ok) { setNewTopicTitle(''); fetchCourses(); }
        } catch (err) { console.error(err); }
    };

    const handleDeleteTopic = async (id) => {
        if (!window.confirm("Delete topic?")) return;
        try {
            const res = await fetch(`http://localhost:8080/api/data/topics/${id}`, { method: 'DELETE' });
            if (res.ok) { if (selectedTopic?.id === id) setSelectedTopic(null); fetchCourses(); }
        } catch (err) { console.error(err); }
    };

    const handleCreateItem = async (e) => {
        if (e) e.preventDefault();
        if (!selectedTopic || !newItemPrimary) return;
        try {
            const res = await fetch('http://localhost:8080/api/data/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    primaryText: newItemPrimary,
                    secondaryText: newItemSecondary,
                    meaning: newItemMeaning,
                    imageUrl: newItemImage,
                    audioUrl: newItemAudio,
                    topic: { id: selectedTopic.id },
                    type: newItemType ? { id: newItemType } : null
                })
            });
            if (res.ok) {
                setNewItemPrimary(''); setNewItemSecondary(''); setNewItemMeaning(''); setNewItemImage(''); setNewItemAudio('');
                fetchItemsForTopic(selectedTopic.id); fetchCourses();
                primaryInputRef.current?.focus();
            }
        } catch (err) { console.error(err); }
    };

    const handleKeyDown = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleCreateItem(e); };

    const handleDeleteItem = async (id) => {
        if (!window.confirm("Delete item?")) return;
        try {
            const res = await fetch(`http://localhost:8080/api/data/items/${id}`, { method: 'DELETE' });
            if (res.ok) { fetchItemsForTopic(selectedTopic.id); fetchCourses(); }
        } catch (err) { console.error(err); }
    };

    const handleBulkImport = async () => {
        if (!selectedTopic || !bulkData.trim()) return;
        const lines = bulkData.trim().split('\n');
        const items = lines.map(line => {
            const parts = line.split('\t');
            return {
                primaryText: parts[0] || '',
                secondaryText: parts[1] || '',
                meaning: parts[2] || '',
                topic: { id: selectedTopic.id },
                type: newItemType ? { id: newItemType } : null
            };
        }).filter(item => item.primaryText);

        try {
            const res = await fetch('http://localhost:8080/api/data/items/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(items)
            });
            if (res.ok) { setBulkData(''); setIsBulkModalOpen(false); fetchItemsForTopic(selectedTopic.id); fetchCourses(); }
        } catch (err) { console.error(err); }
    };

    // --- Filtering ---
    const filteredCourses = courses.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredItems = items.filter(item => {
        const matchesTab = activeTab === 'ALL' || item.type?.name === activeTab;
        const matchesSearch = item.primaryText.toLowerCase().includes(itemSearch.toLowerCase()) ||
            item.meaning.toLowerCase().includes(itemSearch.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const typeOptions = itemTypes.map(t => ({ value: t.id, label: t.name }));

    return (
        <div className="bg-slate-50 min-h-screen font-sans text-slate-900 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
                        <h1 className="text-xl font-semibold tracking-tight">Manager<span className="text-slate-400 font-light ml-2">v2.1</span></h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Control Panel link for managers */}
                        {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
                            <Link
                                to="/admin"
                                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
                            >
                                <Shield className="w-3.5 h-3.5" />
                                Admin Panel
                            </Link>
                        )}

                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('CONTENT')}
                                className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", viewMode === 'CONTENT' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-900")}
                            >
                                Content
                            </button>
                            <button
                                onClick={() => setViewMode('ACCOUNT')}
                                className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2", viewMode === 'ACCOUNT' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-900")}
                            >
                                <UserIcon className="w-3.5 h-3.5" /> Account
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto p-6">
                {viewMode === 'ACCOUNT' ? (
                    <div className="max-w-xl mx-auto mt-10 bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                        <div className="mb-8 pb-6 border-b border-slate-100 flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                                <UserIcon className="w-8 h-8 text-slate-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Profile</h2>
                                <p className="text-sm text-slate-500">Manage your credentials</p>
                            </div>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Username</label>
                                <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-900/10 transition-all font-medium" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Email</label>
                                <input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-slate-900/10 transition-all font-medium" value={accountEmail} onChange={(e) => setAccountEmail(e.target.value)} />
                            </div>
                            {accountMessage && (
                                <div className={cn("p-3 rounded-lg text-sm text-center font-medium", accountMessage.includes('success') ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                                    {accountMessage}
                                </div>
                            )}
                            <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                                <Save className="w-4 h-4" /> Save Changes
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
                        {/* Column 1: Courses */}
                        <div className="col-span-12 md:col-span-3 lg:col-span-2 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <span className="font-semibold text-sm text-slate-700">Courses</span>
                                <span className="text-xs font-medium px-2 py-0.5 bg-white border border-slate-200 rounded-full text-slate-500">{courses.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                {courses.map(course => (
                                    <button
                                        key={course.id}
                                        onClick={() => { setSelectedCourse(course); setSelectedTopic(null); }}
                                        className={cn(
                                            "w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex justify-between group",
                                            selectedCourse?.id === course.id ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:bg-slate-100"
                                        )}
                                    >
                                        <span className="truncate">{course.title}</span>
                                        <div onClick={(e) => handleDeleteCourse(course.id, e)} className={cn("opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500 hover:text-white transition-all", selectedCourse?.id === course.id ? "text-slate-300 hover:text-white" : "text-slate-400")}>
                                            <Trash2 className="w-3 h-3" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <form onSubmit={handleCreateCourse} className="p-3 border-t border-slate-100">
                                <div className="flex gap-2">
                                    <input className="flex-1 min-w-0 bg-slate-100 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-300 placeholder:text-slate-400" placeholder="New Course" value={newCourseTitle} onChange={e => setNewCourseTitle(e.target.value)} />
                                    <button type="submit" disabled={!newCourseTitle} className="p-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50"><Plus className="w-4 h-4" /></button>
                                </div>
                            </form>
                        </div>

                        {/* Column 2: Topics */}
                        <div className="col-span-12 md:col-span-3 lg:col-span-3 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm relative">
                            {!selectedCourse ? (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                                    <div className="text-center">
                                        <p className="font-medium">Select a Course</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-sm text-slate-700">Topics</span>
                                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">{selectedCourse.title}</span>
                                        </div>
                                        <span className="text-xs font-medium px-2 py-0.5 bg-white border border-slate-200 rounded-full text-slate-500">{selectedCourse.topics?.length || 0}</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                        {selectedCourse.topics?.map((topic, idx) => (
                                            <button
                                                key={topic.id}
                                                onClick={() => { setSelectedTopic(topic); fetchItemsForTopic(topic.id); }}
                                                className={cn(
                                                    "w-full text-left px-3 py-3 rounded-lg text-sm transition-all flex items-center justify-between group border border-transparent",
                                                    selectedTopic?.id === topic.id ? "bg-white border-slate-200 shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:bg-slate-50 border-transparent"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono text-xs text-slate-300 w-5">{(topic.orderIndex || idx + 1).toString().padStart(2, '0')}</span>
                                                    <span className={cn("font-medium", selectedTopic?.id === topic.id ? "text-slate-900" : "text-slate-600")}>{topic.title}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <div onClick={(e) => { e.stopPropagation(); handleDeleteTopic(topic.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-50 text-red-400 transition-all"><Trash2 className="w-3 h-3" /></div>
                                                    <ChevronRight className={cn("w-3 h-3 transition-transform", selectedTopic?.id === topic.id ? "rotate-90 text-slate-900" : "text-slate-300")} />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <form onSubmit={handleCreateTopic} className="p-3 border-t border-slate-100">
                                        <div className="flex gap-2">
                                            <input className="flex-1 min-w-0 bg-slate-100 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-300 placeholder:text-slate-400" placeholder="New Topic" value={newTopicTitle} onChange={e => setNewTopicTitle(e.target.value)} />
                                            <button type="submit" disabled={!newTopicTitle} className="p-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50"><Plus className="w-4 h-4" /></button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>

                        {/* Column 3: Items (Main) */}
                        <div className="col-span-12 md:col-span-6 lg:col-span-7 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm relative">
                            {!selectedTopic ? (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                                    <p className="font-medium">Select a Topic</p>
                                </div>
                            ) : (
                                <>
                                    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900">{selectedTopic.title}</h3>
                                            <div className="flex items-center gap-2 text-slate-500 text-xs mt-1">
                                                <span>{items.length} Items</span>
                                                <span>•</span>
                                                <div className="flex gap-1">
                                                    {['ALL', 'VOCABULARY', 'KANJI', 'GRAMMAR'].map(tab => (
                                                        <button key={tab} onClick={() => setActiveTab(tab)} className={cn("px-2 py-0.5 rounded hover:bg-slate-100 transition-colors", activeTab === tab ? "text-slate-900 font-bold bg-slate-100" : "")}>
                                                            {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <div className="relative flex-1 sm:flex-initial">
                                                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                                                <input className="w-full sm:w-48 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-300" placeholder="Search..." value={itemSearch} onChange={e => setItemSearch(e.target.value)} />
                                            </div>
                                            <button onClick={() => setIsBulkModalOpen(true)} className="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"><Upload className="w-4 h-4" /></button>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/30">
                                        {filteredItems.length === 0 ? (
                                            <div className="text-center py-12 text-slate-400 italic">No items found</div>
                                        ) : (
                                            filteredItems.map((item, idx) => (
                                                <div key={item.id} className="group bg-white border border-slate-200 rounded-lg p-3 hover:shadow-md transition-all flex flex-col relative">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-mono text-slate-300 w-5">{(idx + 1).toString().padStart(2, '0')}</span>
                                                            <span className={cn(
                                                                "text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider",
                                                                item.type?.name === 'KANJI' ? "bg-red-50 text-red-600 border-red-100" :
                                                                    item.type?.name === 'VOCABULARY' ? "bg-blue-50 text-blue-600 border-blue-100" :
                                                                        "bg-purple-50 text-purple-600 border-purple-100"
                                                            )}>{item.type?.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {item.audioUrl && <span className="p-1 text-slate-400"><Music className="w-3 h-3" /></span>}
                                                            {item.imageUrl && <span className="p-1 text-slate-400"><ImageIcon className="w-3 h-3" /></span>}
                                                            <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded bg-slate-50 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                        <div><span className="text-[10px] text-slate-400 block mb-0.5">PRIMARY</span><span className="text-lg font-medium text-slate-900">{item.primaryText}</span></div>
                                                        <div><span className="text-[10px] text-slate-400 block mb-0.5">READING</span><span className="text-base text-slate-600">{item.secondaryText}</span></div>
                                                        <div><span className="text-[10px] text-slate-400 block mb-0.5">MEANING</span><span className="text-sm text-slate-600 leading-snug">{item.meaning}</span></div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Create Item Form - Technical Grid */}
                                    <div className="p-4 bg-white border-t border-slate-200">
                                        <form onSubmit={handleCreateItem} className="space-y-4">
                                            <div className="grid grid-cols-12 gap-3">
                                                <div className="col-span-12 md:col-span-4">
                                                    <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Primary</label>
                                                    <input ref={primaryInputRef} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400" value={newItemPrimary} onChange={e => setNewItemPrimary(e.target.value)} onKeyDown={handleKeyDown} required placeholder="Kanji / Word" />
                                                </div>
                                                <div className="col-span-12 md:col-span-4">
                                                    <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Secondary</label>
                                                    <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400" value={newItemSecondary} onChange={e => setNewItemSecondary(e.target.value)} onKeyDown={handleKeyDown} placeholder="Furigana" />
                                                </div>
                                                <div className="col-span-12 md:col-span-4">
                                                    <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Type</label>
                                                    <Select value={newItemType} onChange={setNewItemType} options={typeOptions} placeholder="Select Type" />
                                                </div>
                                                <div className="col-span-12">
                                                    <label className="text-[10px] uppercase font-bold text-slate-400 ml-1">Meaning</label>
                                                    <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400" value={newItemMeaning} onChange={e => setNewItemMeaning(e.target.value)} onKeyDown={handleKeyDown} required placeholder="Definition" />
                                                </div>
                                                <div className="col-span-12 md:col-span-6">
                                                    <div className="relative">
                                                        <ImageIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                                        <input className="w-full pl-9 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-slate-400 font-mono text-slate-600" value={newItemImage} onChange={e => setNewItemImage(e.target.value)} placeholder="Image URL (CDN)" />
                                                    </div>
                                                </div>
                                                <div className="col-span-12 md:col-span-6">
                                                    <div className="relative">
                                                        <Music className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                                        <input className="w-full pl-9 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-slate-400 font-mono text-slate-600" value={newItemAudio} onChange={e => setNewItemAudio(e.target.value)} placeholder="Audio URL (CDN)" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-2">
                                                <span className="text-xs text-slate-400 font-medium flex items-center gap-1"><HelpCircle className="w-3 h-3" /> CTRL + ENTER to save</span>
                                                <button type="submit" disabled={!newItemPrimary} className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 text-sm font-medium transition-colors shadow-sm">Save Item</button>
                                            </div>
                                        </form>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Bulk Import Modal */}
            <AnimatePresence>
                {isBulkModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Bulk Import</h3>
                                    <p className="text-xs text-slate-500">Paste tab-separated data (Excel/Sheets)</p>
                                </div>
                                <button onClick={() => setIsBulkModalOpen(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-900" /></button>
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <textarea className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-xs leading-relaxed outline-none focus:ring-2 focus:ring-slate-200 resize-none" placeholder={`Primary\tSecondary\tMeaning\nWatashi\t-\tI/Me`} value={bulkData} onChange={e => setBulkData(e.target.value)} />
                                <div className="mt-4 flex justify-end gap-3">
                                    <button onClick={() => setIsBulkModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                                    <button onClick={handleBulkImport} disabled={!bulkData.trim()} className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50">Import Data</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CourseManager;
