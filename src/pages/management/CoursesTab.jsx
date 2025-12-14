import { useState } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { useForm } from '@/hooks/useForm';
import { useToast } from '@/hooks/useToast';
import { Card, CardHeader, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FormCard, EmptyState, ActionButtons, FormField, Select, PageHeader } from '@/components/management/SharedComponents';

export default function CoursesTab() {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(null);

    const { courses, loading, addCourse, updateCourse, deleteCourse } = useCourses();
    const { values, handleChange, reset } = useForm({ title: '', description: '', level: 'beginner' });
    const toast = useToast();

    const handleSubmit = async () => {
        if (!values.title) {
            toast.error('Please enter a course title');
            return;
        }
        const result = editingId ? await updateCourse(editingId, values) : await addCourse(values);
        if (result.success) {
            toast.success(editingId ? 'Course updated!' : 'Course created!');
            closeForm();
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
        if (!confirm('Delete this course? All lessons and words will be deleted.')) return;
        setDeleteLoading(`course-${id}`);
        const result = await deleteCourse(id);
        setDeleteLoading(null);
        if (result.success) toast.success('Course deleted');
        else toast.error(result.error || 'Failed to delete');
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        reset();
    };

    const levelOptions = [
        { value: 'beginner', label: 'Beginner' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'advanced', label: 'Advanced' }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Course Management"
                action={
                    <Button onClick={() => setShowForm(true)} className="gap-2 w-full sm:w-auto">
                        <Plus className="h-4 w-4" /> Add course
                    </Button>
                }
            />

            {showForm && (
                <FormCard title="course" onClose={closeForm} onSubmit={handleSubmit} isEditing={!!editingId}>
                    <FormField label="Course Title" id="course-title" required>
                        <Input
                            id="course-title"
                            value={values.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="e.g., Japanese Beginner"
                        />
                    </FormField>
                    <FormField label="Description" id="course-description">
                        <Input
                            id="course-description"
                            value={values.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Brief description"
                        />
                    </FormField>
                    <FormField label="Level" id="course-level">
                        <Select
                            value={values.level}
                            onChange={(v) => handleChange('level', v)}
                            options={levelOptions}
                            placeholder="Select level"
                        />
                    </FormField>
                </FormCard>
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
                                <ActionButtons
                                    onEdit={() => handleEdit(course)}
                                    onDelete={() => handleDelete(course.id)}
                                    isDeleting={deleteLoading === `course-${course.id}`}
                                />
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>

            {courses.length === 0 && !loading && (
                <EmptyState
                    icon={BookOpen}
                    title="No courses yet"
                    description="Create your first course to get started"
                    actionLabel="Add course"
                    onAction={() => setShowForm(true)}
                />
            )}
        </div>
    );
}
