import { useState } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';

import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FormCard, EmptyState, ActionButtons, FormField, Select, PageHeader } from '@/components/management/SharedComponents';

const LEVEL_OPTIONS = [
    { value: '', label: 'Not specified' },
    { value: 'N5', label: 'N5 (Beginner)' },
    { value: 'N4', label: 'N4' },
    { value: 'N3', label: 'N3 (Intermediate)' },
    { value: 'N2', label: 'N2' },
    { value: 'N1', label: 'N1 (Advanced)' },
];

const CATEGORY_OPTIONS = [
    { value: '', label: 'Not specified' },
    { value: 'Vocabulary', label: 'Vocabulary' },
    { value: 'Grammar', label: 'Grammar' },
    { value: 'Reading', label: 'Reading' },
    { value: 'Listening', label: 'Listening' },
    { value: 'Kanji', label: 'Kanji' },
    { value: 'Mixed', label: 'Mixed' },
];

const VISIBILITY_OPTIONS = [
    { value: 'PRIVATE', label: '🔒 Private' },
    { value: 'PUBLIC', label: '🌍 Public' },
];

export default function CoursesTab() {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(null);

    const { courses, loading, addCourse, updateCourse, deleteCourse } = useCourses();
    const [values, setValues] = useState({
        title: '',
        description: '',
        minLevel: '',
        maxLevel: '',
        visibility: 'PRIVATE',
        tags: '',
        category: '',
        difficulty: 3,
        estimatedHours: '',
    });

    const handleChange = (name, value) => {
        setValues(prev => ({ ...prev, [name]: value }));
    };

    const reset = () => {
        setValues({
            title: '',
            description: '',
            minLevel: '',
            maxLevel: '',
            visibility: 'PRIVATE',
            tags: '',
            category: '',
            difficulty: 3,
            estimatedHours: '',
        });
    };
    const toast = useToast();

    const handleSubmit = async () => {
        if (!values.title) {
            toast.error('Please enter a course title');
            return;
        }
        const courseData = {
            ...values,
            difficulty: values.difficulty ? parseInt(values.difficulty) : null,
            estimatedHours: values.estimatedHours ? parseInt(values.estimatedHours) : null,
        };
        const result = editingId ? await updateCourse(editingId, courseData) : await addCourse(courseData);
        if (result.success) {
            toast.success(editingId ? 'Course updated!' : 'Course created!');
            closeForm();
        } else {
            toast.error(result.error || 'Operation failed');
        }
    };

    const handleEdit = (course) => {
        setEditingId(course.id);
        setValues({
            title: course.title || '',
            description: course.description || '',
            minLevel: course.minLevel || '',
            maxLevel: course.maxLevel || '',
            visibility: course.visibility || 'PRIVATE',
            tags: course.tags || '',
            category: course.category || '',
            difficulty: course.difficulty || 3,
            estimatedHours: course.estimatedHours || '',
        });
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
                    {/* Basic Info */}
                    <FormField label="Course Title" id="course-title" required>
                        <Input
                            id="course-title"
                            value={values.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="e.g., JLPT N5 Vocabulary"
                        />
                    </FormField>
                    <FormField label="Description" id="course-description">
                        <Input
                            id="course-description"
                            value={values.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Brief course description"
                        />
                    </FormField>

                    {/* Level Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Min Level" id="course-min-level">
                            <Select
                                value={values.minLevel}
                                onChange={(v) => handleChange('minLevel', v)}
                                options={LEVEL_OPTIONS}
                                placeholder="From..."
                            />
                        </FormField>
                        <FormField label="Max Level" id="course-max-level">
                            <Select
                                value={values.maxLevel}
                                onChange={(v) => handleChange('maxLevel', v)}
                                options={LEVEL_OPTIONS}
                                placeholder="To..."
                            />
                        </FormField>
                    </div>

                    {/* Visibility & Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Visibility" id="course-visibility">
                            <Select
                                value={values.visibility}
                                onChange={(v) => handleChange('visibility', v)}
                                options={VISIBILITY_OPTIONS}
                            />
                        </FormField>
                        <FormField label="Category" id="course-category">
                            <Select
                                value={values.category}
                                onChange={(v) => handleChange('category', v)}
                                options={CATEGORY_OPTIONS}
                                placeholder="Select category"
                            />
                        </FormField>
                    </div>

                    {/* Difficulty & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Difficulty (1-5)" id="course-difficulty">
                            <div className="flex items-center gap-2">
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    value={values.difficulty || 3}
                                    onChange={(e) => handleChange('difficulty', e.target.value)}
                                    className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="w-8 text-center font-mono text-sm">{values.difficulty || 3}</span>
                            </div>
                        </FormField>
                        <FormField label="Est. Hours" id="course-hours">
                            <Input
                                id="course-hours"
                                type="number"
                                min="1"
                                value={values.estimatedHours || ''}
                                onChange={(e) => handleChange('estimatedHours', e.target.value)}
                                placeholder="e.g., 20"
                            />
                        </FormField>
                    </div>

                    {/* Tags */}
                    <FormField label="Tags (comma-separated)" id="course-tags">
                        <Input
                            id="course-tags"
                            value={values.tags}
                            onChange={(e) => handleChange('tags', e.target.value)}
                            placeholder="e.g., kanji, vocabulary, JLPT"
                        />
                    </FormField>
                </FormCard>
            )}

            {/* Technical Table View */}
            <div className="border rounded-md overflow-hidden bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-secondary/50 text-muted-foreground font-medium border-b">
                            <tr>
                                <th className="px-4 py-3 w-[60px]">ID</th>
                                <th className="px-4 py-3">Course</th>
                                <th className="px-4 py-3 w-[100px]">Level</th>
                                <th className="px-4 py-3 w-[100px]">Category</th>
                                <th className="px-4 py-3 w-[80px]">Diff</th>
                                <th className="px-4 py-3 w-[80px]">Vis</th>
                                <th className="px-4 py-3 w-[100px] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {courses.map(course => (
                                <tr key={course.id} className="hover:bg-secondary/20 transition-colors">
                                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground">#{course.id}</td>
                                    <td className="px-4 py-2">
                                        <div className="font-medium text-foreground">{course.title}</div>
                                        {course.tags && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {course.tags.split(',').map((tag, i) => (
                                                    <span key={i} className="text-xs px-1.5 py-0.5 bg-secondary rounded">
                                                        {tag.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-xs">
                                        {course.levelDisplay || course.level || '-'}
                                    </td>
                                    <td className="px-4 py-2 text-xs text-muted-foreground">
                                        {course.category || '-'}
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        {course.difficulty ? (
                                            <span className="font-mono text-xs">{course.difficulty}/5</span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-4 py-2 text-center text-xs">
                                        {course.visibility === 'PUBLIC' ? '🌍' : '🔒'}
                                    </td>
                                    <td className="px-4 py-2 text-right">
                                        <ActionButtons
                                            onEdit={() => handleEdit(course)}
                                            onDelete={() => handleDelete(course.id)}
                                            isDeleting={deleteLoading === `course-${course.id}`}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
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

