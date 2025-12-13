import { useState } from 'react';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { useForm } from '@/hooks/useForm';
import { useToast } from '@/hooks/useToast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BookOpen } from 'lucide-react';

export default function CoursesTab() {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(null);

    // Custom hooks eliminate duplicated code!
    const { courses, loading, addCourse, updateCourse, deleteCourse } = useCourses();
    const { values, handleChange, reset } = useForm({
        title: '',
        description: '',
        level: 'beginner'
    });
    const toast = useToast();

    const handleSubmit = async () => {
        if (!values.title) {
            toast.error('Please enter a course title');
            return;
        }

        const result = editingId
            ? await updateCourse(editingId, values)
            : await addCourse(values);

        if (result.success) {
            toast.success(editingId ? 'Course updated!' : 'Course created!');
            setShowForm(false);
            setEditingId(null);
            reset();
        } else {
            toast.error(result.error || 'Operation failed');
        }
    };

    const handleEdit = (course) => {
        setEditingId(course.id);
        handleChange('title', course.title);
        handleChange('description', course.description || '');
        handleChange('level', course.level || 'beginner');
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this course? All lessons and words will be deleted.')) return;

        setDeleteLoading(`course-${id}`);
        const result = await deleteCourse(id);
        setDeleteLoading(null);

        if (result.success) {
            toast.success('Course deleted');
        } else {
            toast.error(result.error || 'Failed to delete course');
        }
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        reset();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <h2 className="text-lg sm:text-xl font-semibold">Course Management</h2>
                <Button onClick={() => setShowForm(true)} className="gap-2 w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    Add course
                </Button>
            </div>

            {showForm && (
                <Card className="border-primary">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>{editingId ? 'Edit course' : 'Add new course'}</CardTitle>
                            <Button variant="ghost" size="sm" onClick={closeForm}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="course-title">Course Title *</Label>
                            <Input
                                id="course-title"
                                value={values.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                placeholder="e.g., Japanese Beginner"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="course-description">Description</Label>
                            <Input
                                id="course-description"
                                value={values.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="Brief description of the course"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="course-level">Level</Label>
                            <select
                                id="course-level"
                                value={values.level}
                                onChange={(e) => handleChange('level', e.target.value)}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                            >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map(course => (
                    <Card key={course.id} className="hover:shadow-md transition-all overflow-hidden">
                        <CardHeader className="p-4 sm:p-6">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span className="font-semibold text-base break-anywhere">{course.title}</span>
                                        <Badge variant="secondary" className="text-xs shrink-0">
                                            {course.level || 'beginner'}
                                        </Badge>
                                    </div>
                                    <CardDescription className="mt-1 line-clamp-2">
                                        {course.description || 'No description'}
                                    </CardDescription>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEdit(course)}
                                        className="h-8 w-8 p-0"
                                    >
                                        <Edit2 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(course.id)}
                                        disabled={deleteLoading === `course-${course.id}`}
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    >
                                        {deleteLoading === `course-${course.id}` ? (
                                            <div className="h-3.5 w-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                        ) : (
                                            <Trash2 className="h-3.5 w-3.5" />
                                        )}
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
                        <Button onClick={() => setShowForm(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add course
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
