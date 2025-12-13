import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, FolderOpen, List } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { useTopics } from '@/hooks/useTopics';
import { useForm } from '@/hooks/useForm';
import { useToast } from '@/hooks/useToast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LessonsTab() {
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(null);

    // Custom hooks!
    const { courses } = useCourses();
    const { topics, loadTopics, addTopic, updateTopic, deleteTopic } = useTopics(selectedCourse?.id);
    const { values, handleChange, reset, setValues } = useForm({
        title: '',
        description: '',
        orderIndex: 1,
        courseId: ''
    });
    const toast = useToast();

    useEffect(() => {
        if (selectedCourse) {
            loadTopics(selectedCourse.id);
        }
    }, [selectedCourse, loadTopics]);

    const handleSubmit = async () => {
        if (!values.title || !values.courseId) {
            toast.error('Please enter a topic title and select a course');
            return;
        }

        const topicData = {
            title: values.title,
            description: values.description,
            orderIndex: parseInt(values.orderIndex)
        };

        const result = editingId
            ? await updateTopic(editingId, topicData, values.courseId)
            : await addTopic(values.courseId, topicData);

        if (result.success) {
            toast.success(editingId ? 'Lesson updated!' : 'Lesson created!');
            setShowForm(false);
            setEditingId(null);
            reset();
            if (selectedCourse && values.courseId === selectedCourse.id.toString()) {
                loadTopics(selectedCourse.id);
            }
        } else {
            toast.error(result.error || 'Operation failed');
        }
    };

    const handleEdit = (topic) => {
        setEditingId(topic.id);
        setValues({
            title: topic.title,
            description: topic.description || '',
            orderIndex: topic.orderIndex || 1,
            courseId: selectedCourse?.id || ''
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
                    <h2 className="text-xl font-semibold">Lesson Management</h2>
                    {selectedCourse && (
                        <p className="text-sm text-muted-foreground mt-1">
                            Managing lessons for: <span className="font-medium">{selectedCourse.title}</span>
                        </p>
                    )}
                </div>
                <Button
                    onClick={() => setShowForm(true)}
                    disabled={!selectedCourse}
                    className="gap-2 w-full sm:w-auto"
                >
                    <Plus className="h-4 w-4" />
                    Add lesson
                </Button>
            </div>

            {/* Course selector */}
            <Card>
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base">Select a course</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {courses.map(course => (
                            <Button
                                key={course.id}
                                variant={selectedCourse?.id === course.id ? "default" : "outline"}
                                onClick={() => setSelectedCourse(course)}
                                className="justify-start h-auto py-2 px-3 text-left"
                            >
                                <FolderOpen className="mr-2 h-4 w-4 shrink-0" />
                                <span className="truncate">{course.title}</span>
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

            {showForm && (
                <Card className="border-primary">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>{editingId ? 'Edit lesson' : 'Add new lesson'}</CardTitle>
                            <Button variant="ghost" size="sm" onClick={closeForm}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!editingId && (
                            <div className="space-y-2">
                                <Label htmlFor="topic-course">Course *</Label>
                                <select
                                    id="topic-course"
                                    value={values.courseId}
                                    onChange={(e) => handleChange('courseId', e.target.value)}
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
                            <Button onClick={handleSubmit} className="flex-1">
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
                                            onClick={() => handleEdit(topic)}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(topic.id)}
                                            disabled={deleteLoading === `topic-${topic.id}`}
                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                        >
                                            {deleteLoading === `topic-${topic.id}` ? (
                                                <div className="h-3.5 w-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                            ) : (
                                                <Trash2 className="h-3.5 w-3.5" />
                                            )}
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
                        <Button onClick={() => setShowForm(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add lesson
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
