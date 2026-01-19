import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, FolderOpen, List, ChevronRight } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { useTopics } from '@/hooks/useTopics';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function LessonsTab() {
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(null);
    const { user } = useAuth();

    // Check if current user owns the selected course
    const isOwner = selectedCourse && (selectedCourse.ownerId == null || selectedCourse.ownerId === user?.uid);

    // Custom hooks!
    const { courses } = useCourses();
    const { topics, loadTopics, addTopic, updateTopic, deleteTopic } = useTopics(selectedCourse?.id);
    const [values, setValues] = useState({
        title: '',
        description: '',
        orderIndex: 1
    });

    const handleChange = (name, value) => {
        setValues(prev => ({ ...prev, [name]: value }));
    };

    const reset = () => {
        setValues({
            title: '',
            description: '',
            orderIndex: 1
        });
    };
    const toast = useToast();

    useEffect(() => {
        if (selectedCourse) {
            loadTopics(selectedCourse.id);
        } else {
            setShowForm(false);
            setEditingId(null);
            reset();
        }
    }, [selectedCourse, loadTopics]);

    const handleSubmit = async () => {
        if (!values.title || !selectedCourse) {
            toast.error('Please select a course and add a lesson title');
            return;
        }

        const topicData = {
            title: values.title,
            description: values.description,
            orderIndex: parseInt(values.orderIndex)
        };

        const courseId = selectedCourse.id.toString();
        const result = editingId
            ? await updateTopic(editingId, topicData, courseId)
            : await addTopic(courseId, topicData);

        if (result.success) {
            toast.success(editingId ? 'Lesson updated!' : 'Lesson created!');
            setShowForm(false);
            setEditingId(null);
            reset();
            loadTopics(selectedCourse.id);
        } else {
            toast.error(result.error || 'Operation failed');
        }
    };

    const handleEdit = (topic) => {
        setEditingId(topic.id);
        setValues({
            title: topic.title,
            description: topic.description || '',
            orderIndex: topic.orderIndex || 1
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this lesson? All words will be deleted.')) return;

        setDeleteLoading(`topic-${id}`);
        const result = await deleteTopic(id, selectedCourse?.id);
        setDeleteLoading(null);

        if (result.success) {
            toast.success('Lesson deleted');
            if (selectedCourse) {
                loadTopics(selectedCourse.id);
            }
        } else {
            toast.error(result.error || 'Failed to delete lesson');
        }
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        reset();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-semibold">Lesson management</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Pick a course on the left, then add or edit lessons inline.
                    </p>
                </div>
                <Button
                    onClick={() => setShowForm(true)}
                    disabled={!selectedCourse || !isOwner}
                    className="gap-2 w-full sm:w-auto"
                >
                    <Plus className="h-4 w-4" />
                    Add lesson
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
                <Card className="h-full">
                    <CardHeader className="p-4 border-b">
                        <CardTitle className="text-base">Courses</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {courses.length === 0 ? (
                            <div className="p-6 text-sm text-muted-foreground text-center">
                                No courses available. Create a course first.
                            </div>
                        ) : (
                            <div className="divide-y">
                                {courses.map(course => {
                                    const active = selectedCourse?.id === course.id;
                                    return (
                                        <button
                                            key={course.id}
                                            onClick={() => {
                                                setSelectedCourse(course);
                                                setShowForm(false);
                                                setEditingId(null);
                                                reset();
                                            }}
                                            className={`w-full px-4 py-3 flex items-start justify-between gap-3 text-left transition ${active ? 'bg-secondary/60' : 'hover:bg-secondary/40'}`}
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium leading-tight">{course.title}</span>
                                                </div>
                                                {course.category && (
                                                    <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                                                )}
                                                {course.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
                                                )}
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    {showForm && (
                        <Card className="border-primary/50">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">{editingId ? 'Edit lesson' : 'Add new lesson'}</CardTitle>
                                    <Button variant="ghost" size="sm" onClick={closeForm}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                {selectedCourse && (
                                    <p className="text-xs text-muted-foreground">In course: {selectedCourse.title}</p>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="topic-title">Lesson Title *</Label>
                                        <Input
                                            id="topic-title"
                                            value={values.title}
                                            onChange={(e) => handleChange('title', e.target.value)}
                                            placeholder="e.g., Lesson 01"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="topic-order">Order</Label>
                                        <Input
                                            id="topic-order"
                                            type="number"
                                            value={values.orderIndex}
                                            onChange={(e) => handleChange('orderIndex', e.target.value)}
                                            min="1"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="topic-description">Description</Label>
                                    <Input
                                        id="topic-description"
                                        value={values.description}
                                        onChange={(e) => handleChange('description', e.target.value)}
                                        placeholder="Brief description of the lesson"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button onClick={handleSubmit} className="flex-1" disabled={!selectedCourse}>
                                        <Check className="mr-2 h-4 w-4" />
                                        {editingId ? 'Update' : 'Add'}
                                    </Button>
                                    <Button variant="outline" onClick={closeForm} className="flex-1">
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {!selectedCourse && (
                        <Card>
                            <CardContent className="p-8 text-center space-y-3">
                                <List className="h-10 w-10 text-muted-foreground mx-auto" />
                                <div className="space-y-1">
                                    <h3 className="font-semibold">Select a course</h3>
                                    <p className="text-sm text-muted-foreground">Pick a course on the left to manage its lessons.</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {selectedCourse && topics.length > 0 && (
                        <Card className="bg-card">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Lessons in {selectedCourse.title}</CardTitle>
                            </CardHeader>
                            <Separator />
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {topics
                                        .slice()
                                        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                                        .map((topic, i) => (
                                            <div key={topic.id} className="px-4 py-3 flex items-center justify-between gap-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="font-mono text-[11px] px-2 py-0.5">{String(i + 1).padStart(2, '0')}</Badge>
                                                        <span className="font-medium">{topic.title}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground max-w-2xl line-clamp-2">
                                                        {topic.description || 'No description'}
                                                    </p>
                                                </div>
                                                {isOwner && (
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEdit(topic)}
                                                            className="h-8 px-2"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(topic.id)}
                                                            disabled={deleteLoading === `topic-${topic.id}`}
                                                            className="h-8 px-2 text-destructive hover:text-destructive"
                                                        >
                                                            {deleteLoading === `topic-${topic.id}` ? (
                                                                <div className="h-4 w-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {selectedCourse && topics.length === 0 && (
                        <Card>
                            <CardContent className="p-12 text-center space-y-3">
                                <List className="h-12 w-12 text-muted-foreground mx-auto" />
                                <h3 className="text-lg font-semibold">No lessons yet</h3>
                                <p className="text-muted-foreground">Add lessons to this course</p>
                                <Button onClick={() => setShowForm(true)} disabled={!isOwner}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add lesson
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

        </div>
    );
}
