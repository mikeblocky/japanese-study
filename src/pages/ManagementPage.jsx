import { useState, useEffect } from 'react';
import { Plus, BookOpen, List, Upload, Edit2, Trash2, X, Check, FolderOpen } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageShell, PageHeader } from '@/components/ui/page';

export default function ManagementPage() {
    const [activeTab, setActiveTab] = useState('courses');
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(false);

    // Course form state
    const [showCourseForm, setShowCourseForm] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [courseFormData, setCourseFormData] = useState({
        title: '',
        description: '',
        level: 'beginner'
    });

    // Topic form state
    const [showTopicForm, setShowTopicForm] = useState(false);
    const [editingTopic, setEditingTopic] = useState(null);
    const [topicFormData, setTopicFormData] = useState({
        title: '',
        description: '',
        orderIndex: 1,
        courseId: ''
    });

    // Anki import state
    const [ankiFile, setAnkiFile] = useState(null);
    const [ankiImporting, setAnkiImporting] = useState(false);
    const [ankiResult, setAnkiResult] = useState(null);
    const [importProgress, setImportProgress] = useState(null);

    useEffect(() => {
        loadCourses();
    }, []);

    useEffect(() => {
        if (selectedCourse) {
            loadTopics(selectedCourse.id);
        }
    }, [selectedCourse]);

    const loadCourses = async () => {
        try {
            setLoading(true);
            const res = await api.get('/courses');
            setCourses(res.data || []);
        } catch (err) {
            console.error('Failed to load courses', err);
        } finally {
            setLoading(false);
        }
    };

    const loadTopics = async (courseId) => {
        try {
            const res = await api.get(`/courses/${courseId}/topics`);
            setTopics(res.data || []);
        } catch (err) {
            console.error('Failed to load topics', err);
        }
    };

    // Course management
    const handleAddCourse = async () => {
        if (!courseFormData.title) {
            alert('Please enter a course title');
            return;
        }
        try {
            await api.post('/courses', courseFormData);
            setShowCourseForm(false);
            setCourseFormData({ title: '', description: '', level: 'beginner' });
            loadCourses();
        } catch (err) {
            console.error('Failed to add course', err);
            alert('Failed to add course. Please try again.');
        }
    };

    const handleEditCourse = async () => {
        if (!editingCourse) return;
        try {
            await api.put(`/courses/${editingCourse.id}`, courseFormData);
            setEditingCourse(null);
            setShowCourseForm(false);
            setCourseFormData({ title: '', description: '', level: 'beginner' });
            loadCourses();
        } catch (err) {
            console.error('Failed to edit course', err);
            alert('Failed to edit course. Please try again.');
        }
    };

    const handleDeleteCourse = async (courseId) => {
        if (!confirm('Are you sure you want to delete this course? All lessons and words will be deleted.')) return;
        try {
            await api.delete(`/courses/${courseId}`);
            loadCourses();
            if (selectedCourse?.id === courseId) {
                setSelectedCourse(null);
                setTopics([]);
            }
        } catch (err) {
            console.error('Failed to delete course', err);
            alert('Failed to delete course. Please try again.');
        }
    };

    const openCourseEditForm = (course) => {
        setEditingCourse(course);
        setCourseFormData({
            title: course.title,
            description: course.description || '',
            level: course.level || 'beginner'
        });
        setShowCourseForm(true);
    };

    const closeCourseForm = () => {
        setShowCourseForm(false);
        setEditingCourse(null);
        setCourseFormData({ title: '', description: '', level: 'beginner' });
    };

    // Topic management
    const handleAddTopic = async () => {
        if (!topicFormData.title || !topicFormData.courseId) {
            alert('Please enter a topic title and select a course');
            return;
        }
        try {
            await api.post(`/courses/${topicFormData.courseId}/topics`, {
                title: topicFormData.title,
                description: topicFormData.description,
                orderIndex: parseInt(topicFormData.orderIndex)
            });
            setShowTopicForm(false);
            setTopicFormData({ title: '', description: '', orderIndex: 1, courseId: '' });
            if (selectedCourse && topicFormData.courseId === selectedCourse.id.toString()) {
                loadTopics(selectedCourse.id);
            }
        } catch (err) {
            console.error('Failed to add topic', err);
            alert('Failed to add topic. Please try again.');
        }
    };

    const handleEditTopic = async () => {
        if (!editingTopic) return;
        try {
            await api.put(`/topics/${editingTopic.id}`, {
                title: topicFormData.title,
                description: topicFormData.description,
                orderIndex: parseInt(topicFormData.orderIndex)
            });
            setEditingTopic(null);
            setShowTopicForm(false);
            setTopicFormData({ title: '', description: '', orderIndex: 1, courseId: '' });
            if (selectedCourse) {
                loadTopics(selectedCourse.id);
            }
        } catch (err) {
            console.error('Failed to edit topic', err);
            alert('Failed to edit topic. Please try again.');
        }
    };

    const handleDeleteTopic = async (topicId) => {
        if (!confirm('Are you sure you want to delete this lesson? All words will be deleted.')) return;
        try {
            await api.delete(`/topics/${topicId}`);
            if (selectedCourse) {
                loadTopics(selectedCourse.id);
            }
        } catch (err) {
            console.error('Failed to delete topic', err);
            alert('Failed to delete topic. Please try again.');
        }
    };

    const openTopicEditForm = (topic) => {
        setEditingTopic(topic);
        setTopicFormData({
            title: topic.title,
            description: topic.description || '',
            orderIndex: topic.orderIndex || 1,
            courseId: selectedCourse?.id || ''
        });
        setShowTopicForm(true);
    };

    const closeTopicForm = () => {
        setShowTopicForm(false);
        setEditingTopic(null);
        setTopicFormData({ title: '', description: '', orderIndex: 1, courseId: '' });
    };

    // Anki import
    const handleAnkiImport = async () => {
        if (!ankiFile) {
            alert('Please select an Anki deck file (.apkg)');
            return;
        }

        // Validate file
        if (!ankiFile.name.endsWith('.apkg')) {
            setAnkiResult({
                success: false,
                message: 'Invalid file type. Please select a .apkg file exported from Anki.'
            });
            return;
        }

        // Check file size (max 50MB)
        const maxSize = 50 * 1024 * 1024;
        if (ankiFile.size > maxSize) {
            setAnkiResult({
                success: false,
                message: 'File is too large. Maximum file size is 50MB. Try exporting a smaller deck.'
            });
            return;
        }
        
        try {
            setAnkiImporting(true);
            setAnkiResult(null);
            setImportProgress('Uploading file...');
            
            const formData = new FormData();
            formData.append('file', ankiFile);
            formData.append('skipMedia', 'true'); // Skip audio/video/images
            formData.append('textOnly', 'true'); // Extract text content only
            
            setImportProgress('Processing deck...');
            
            const res = await api.post('/import/anki', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 300000, // 5 minute timeout (for Render free tier cold starts)
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setImportProgress(`Uploading... ${percentCompleted}%`);
                }
            });
            
            const coursesCount = res.data.coursesCreated || 0;
            const topicsCount = res.data.topicsCreated || 0;
            const itemsCount = res.data.itemsCreated || 0;
            const skippedCount = res.data.skippedItems || 0;
            
            let message = `Successfully imported: ${coursesCount} course${coursesCount !== 1 ? 's' : ''}, ${topicsCount} lesson${topicsCount !== 1 ? 's' : ''}, ${itemsCount} word${itemsCount !== 1 ? 's' : ''}`;
            
            if (skippedCount > 0) {
                message += `. Skipped ${skippedCount} item${skippedCount !== 1 ? 's' : ''} with media or unsupported content.`;
            }
            
            setAnkiResult({
                success: true,
                message: message,
                data: res.data,
                details: {
                    courses: coursesCount,
                    lessons: topicsCount,
                    words: itemsCount,
                    skipped: skippedCount,
                    warnings: res.data.warnings || []
                }
            });
            
            setAnkiFile(null);
            document.getElementById('anki-file').value = '';
            loadCourses();
        } catch (err) {
            console.error('Failed to import Anki deck', err);
            
            let errorMessage = 'Failed to import Anki deck. ';
            let technicalDetails = '';
            
            if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
                errorMessage += 'Import timed out after 5 minutes. This usually means Render free tier is sleeping or overloaded. Try again in 1-2 minutes after the service wakes up.';
                technicalDetails = 'Timeout after 300 seconds';
            } else if (err.response?.status === 500) {
                errorMessage += 'Server error occurred. The backend service might still be starting up (Render free tier can take 1-2 minutes to wake up). Please wait a moment and try again.';
                technicalDetails = err.response?.data?.error || err.response?.data?.message || 'Internal server error';
            } else if (err.response?.status === 413) {
                errorMessage += 'File is too large for the server. Try exporting a smaller deck.';
                technicalDetails = 'File size exceeds server limit';
            } else if (err.response?.status === 400) {
                errorMessage += err.response.data?.message || 'Invalid deck format. Make sure you exported it correctly from Anki.';
                technicalDetails = err.response?.data?.error || 'Bad request';
            } else if (err.response?.status === 403) {
                errorMessage += 'Access denied. You need admin privileges to import decks.';
                technicalDetails = 'Authorization failed';
            } else if (err.message.includes('Network Error') || err.message.includes('ERR_QUIC') || err.message.includes('ERR_CONNECTION')) {
                errorMessage += 'Network connection error. The backend service might be down or restarting. If using Render free tier, the service may be sleeping and will wake up in 1-2 minutes. Please try again shortly.';
                technicalDetails = err.message;
            } else {
                errorMessage += err.response?.data?.message || err.message || 'Unknown error occurred. Please try again.';
                technicalDetails = err.response?.data?.error || err.message || 'Unknown error';
            }
            
            setAnkiResult({
                success: false,
                message: errorMessage,
                technicalDetails: technicalDetails
            });
        } finally {
            setAnkiImporting(false);
            setImportProgress(null);
        }
    };

    const tabs = [
        { id: 'courses', label: 'Courses', icon: BookOpen },
        { id: 'lessons', label: 'Lessons', icon: List },
        { id: 'import', label: 'Import Anki', icon: Upload }
    ];

    return (
        <PageShell>
            <PageHeader 
                title="Management" 
                description="Manage courses, lessons, and import content"
            />

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors",
                                activeTab === tab.id
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Courses Tab */}
            {activeTab === 'courses' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Course Management</h2>
                        <Button onClick={() => setShowCourseForm(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add course
                        </Button>
                    </div>

                    {showCourseForm && (
                        <Card className="border-primary">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>{editingCourse ? 'Edit course' : 'Add new course'}</CardTitle>
                                    <Button variant="ghost" size="sm" onClick={closeCourseForm}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="course-title">Course Title *</Label>
                                    <Input
                                        id="course-title"
                                        value={courseFormData.title}
                                        onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
                                        placeholder="e.g., Japanese Beginner"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="course-description">Description</Label>
                                    <Input
                                        id="course-description"
                                        value={courseFormData.description}
                                        onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                                        placeholder="Brief description of the course"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="course-level">Level</Label>
                                    <select
                                        id="course-level"
                                        value={courseFormData.level}
                                        onChange={(e) => setCourseFormData({ ...courseFormData, level: e.target.value })}
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                    >
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button onClick={editingCourse ? handleEditCourse : handleAddCourse} className="flex-1">
                                        <Check className="mr-2 h-4 w-4" />
                                        {editingCourse ? 'Update' : 'Add'}
                                    </Button>
                                    <Button variant="outline" onClick={closeCourseForm} className="flex-1">
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {courses.map(course => (
                            <Card key={course.id} className="hover:shadow-md transition-all">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="flex items-center gap-2">
                                                {course.title}
                                                <Badge variant="secondary" className="text-xs">
                                                    {course.level || 'beginner'}
                                                </Badge>
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                {course.description || 'No description'}
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => openCourseEditForm(course)}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => handleDeleteCourse(course.id)}
                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>

                    {courses.length === 0 && !loading && (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
                                <p className="text-muted-foreground mb-4">Create your first course to get started</p>
                                <Button onClick={() => setShowCourseForm(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add course
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Lessons Tab */}
            {activeTab === 'lessons' && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-xl font-semibold">Lesson Management</h2>
                            {selectedCourse && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    Managing lessons for: <span className="font-medium">{selectedCourse.title}</span>
                                </p>
                            )}
                        </div>
                        <Button 
                            onClick={() => setShowTopicForm(true)} 
                            disabled={!selectedCourse}
                            className="gap-2 w-full sm:w-auto"
                        >
                            <Plus className="h-4 w-4" />
                            Add lesson
                        </Button>
                    </div>

                    {/* Course selector */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Select a course</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {courses.map(course => (
                                    <Button
                                        key={course.id}
                                        variant={selectedCourse?.id === course.id ? "default" : "outline"}
                                        onClick={() => setSelectedCourse(course)}
                                        className="justify-start"
                                    >
                                        <FolderOpen className="mr-2 h-4 w-4" />
                                        {course.title}
                                    </Button>
                                ))}
                            </div>
                            {courses.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No courses available. Create a course first.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {showTopicForm && (
                        <Card className="border-primary">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>{editingTopic ? 'Edit lesson' : 'Add new lesson'}</CardTitle>
                                    <Button variant="ghost" size="sm" onClick={closeTopicForm}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {!editingTopic && (
                                    <div className="space-y-2">
                                        <Label htmlFor="topic-course">Course *</Label>
                                        <select
                                            id="topic-course"
                                            value={topicFormData.courseId}
                                            onChange={(e) => setTopicFormData({ ...topicFormData, courseId: e.target.value })}
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                        >
                                            <option value="">Select a course</option>
                                            {courses.map(course => (
                                                <option key={course.id} value={course.id}>
                                                    {course.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="topic-title">Lesson Title *</Label>
                                        <Input
                                            id="topic-title"
                                            value={topicFormData.title}
                                            onChange={(e) => setTopicFormData({ ...topicFormData, title: e.target.value })}
                                            placeholder="e.g., Lesson 01"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="topic-order">Order</Label>
                                        <Input
                                            id="topic-order"
                                            type="number"
                                            value={topicFormData.orderIndex}
                                            onChange={(e) => setTopicFormData({ ...topicFormData, orderIndex: e.target.value })}
                                            min="1"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="topic-description">Description</Label>
                                    <Input
                                        id="topic-description"
                                        value={topicFormData.description}
                                        onChange={(e) => setTopicFormData({ ...topicFormData, description: e.target.value })}
                                        placeholder="Brief description of the lesson"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button onClick={editingTopic ? handleEditTopic : handleAddTopic} className="flex-1">
                                        <Check className="mr-2 h-4 w-4" />
                                        {editingTopic ? 'Update' : 'Add'}
                                    </Button>
                                    <Button variant="outline" onClick={closeTopicForm} className="flex-1">
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {selectedCourse && topics.length > 0 && (
                        <div className="space-y-3">
                            {topics.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)).map((topic, i) => (
                                <Card key={topic.id} className="hover:bg-accent transition-colors">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary font-mono text-sm font-semibold shrink-0">
                                                {String(i + 1).padStart(2, '0')}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium">{topic.title}</p>
                                                <p className="text-sm text-muted-foreground line-clamp-1">
                                                    {topic.description || 'No description'}
                                                </p>
                                            </div>
                                            <div className="flex gap-1 shrink-0">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => openTopicEditForm(topic)}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => handleDeleteTopic(topic.id)}
                                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {selectedCourse && topics.length === 0 && (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <List className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No lessons yet</h3>
                                <p className="text-muted-foreground mb-4">Add lessons to this course</p>
                                <Button onClick={() => setShowTopicForm(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add lesson
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Import Anki Tab */}
            {activeTab === 'import' && (
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Import from Anki</h2>

                    <Card>
                        <CardHeader>
                            <CardTitle>Upload Anki Deck (.apkg)</CardTitle>
                            <CardDescription>
                                Import your Anki decks to automatically create courses, lessons, and vocabulary
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm">
                                <div className="text-blue-600">ℹ️</div>
                                <div>
                                    <p className="font-medium text-blue-900 mb-1">Note: Render Free Tier</p>
                                    <p className="text-blue-800">The backend service may take 1-2 minutes to wake up from sleep if it hasn't been used recently. Please be patient on first attempt.</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="anki-file">Select Anki Deck File</Label>
                                <Input
                                    id="anki-file"
                                    type="file"
                                    accept=".apkg"
                                    onChange={(e) => {
                                        setAnkiFile(e.target.files[0]);
                                        setAnkiResult(null);
                                    }}
                                    disabled={ankiImporting}
                                />
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <p>• Only .apkg files are supported (max 50MB)</p>
                                    <p>• Media files (audio, images, video) will be skipped</p>
                                    <p>• Only text content will be imported</p>
                                </div>
                            </div>

                            {ankiFile && !ankiImporting && (
                                <div className="p-3 rounded-lg bg-secondary/50 border text-sm">
                                    <p className="font-medium mb-1">Selected file:</p>
                                    <p className="text-muted-foreground">{ankiFile.name}</p>
                                    <p className="text-muted-foreground text-xs mt-1">
                                        Size: {(ankiFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            )}

                            {importProgress && (
                                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                                        {importProgress}
                                    </div>
                                </div>
                            )}

                            <Button 
                                onClick={handleAnkiImport} 
                                disabled={!ankiFile || ankiImporting}
                                className="w-full gap-2"
                            >
                                {ankiImporting ? (
                                    <>
                                        <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4" />
                                        Import Deck
                                    </>
                                )}
                            </Button>

                            {ankiResult && (
                                <div className={cn(
                                    "p-4 rounded-lg border",
                                    ankiResult.success 
                                        ? "bg-green-50 border-green-200 text-green-800" 
                                        : "bg-red-50 border-red-200 text-red-800"
                                )}>
                                    <div className="flex items-start gap-3">
                                        {ankiResult.success ? (
                                            <Check className="h-5 w-5 shrink-0 mt-0.5" />
                                        ) : (
                                            <X className="h-5 w-5 shrink-0 mt-0.5" />
                                        )}
                                        <div className="flex-1">
                                            <p className="font-medium mb-1">
                                                {ankiResult.success ? 'Import Successful!' : 'Import Failed'}
                                            </p>
                                            <p className="text-sm mb-2">{ankiResult.message}</p>
                                            
                                            {ankiResult.success && ankiResult.details && (
                                                <div className="mt-3 p-3 bg-white/50 rounded border border-green-300 text-xs space-y-1">
                                                    <p><strong>Created:</strong> {ankiResult.details.courses} courses, {ankiResult.details.lessons} lessons, {ankiResult.details.words} words</p>
                                                    {ankiResult.details.skipped > 0 && (
                                                        <p className="text-amber-700"><strong>Skipped:</strong> {ankiResult.details.skipped} items with media</p>
                                                    )}
                                                    {ankiResult.details.warnings?.length > 0 && (
                                                        <div className="mt-2">
                                                            <p className="font-medium">Warnings:</p>
                                                            {ankiResult.details.warnings.map((warning, idx) => (
                                                                <p key={idx} className="text-amber-700">• {warning}</p>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {!ankiResult.success && ankiResult.technicalDetails && (
                                                <details className="mt-2">
                                                    <summary className="text-xs cursor-pointer hover:underline">
                                                        Technical details
                                                    </summary>
                                                    <p className="text-xs mt-1 p-2 bg-white/50 rounded border border-red-300 font-mono">
                                                        {ankiResult.technicalDetails}
                                                    </p>
                                                </details>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>How it works</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                                <div className="flex gap-3">
                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                                        1
                                    </div>
                                    <p>Export your Anki deck as .apkg file from Anki desktop application</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                                        2
                                    </div>
                                    <p>Upload the .apkg file using the form above</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                                        3
                                    </div>
                                    <p>The system will automatically create courses and lessons based on your deck structure</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
                                        4
                                    </div>
                                    <p>All text content from cards will be imported as vocabulary items</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Important Notes</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                                    <p className="font-medium mb-1">⚠️ Media Not Supported</p>
                                    <p className="text-xs">Audio files, images, and videos in your cards will be skipped. Only text content will be imported.</p>
                                </div>
                                
                                <div className="space-y-2 text-muted-foreground">
                                    <p><strong>Tips for best results:</strong></p>
                                    <ul className="list-disc list-inside space-y-1 text-xs ml-2">
                                        <li>Keep deck sizes under 50MB</li>
                                        <li>Use simple text-based cards</li>
                                        <li>Remove unnecessary media before exporting</li>
                                        <li>Split large decks into smaller ones</li>
                                        <li>Basic card types work best</li>
                                    </ul>
                                </div>

                                <div className="space-y-2 text-muted-foreground">
                                    <p><strong>Supported card fields:</strong></p>
                                    <ul className="list-disc list-inside space-y-1 text-xs ml-2">
                                        <li>Front/Back text</li>
                                        <li>Question/Answer text</li>
                                        <li>Word/Meaning text</li>
                                        <li>Plain text content only</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </PageShell>
    );
}
