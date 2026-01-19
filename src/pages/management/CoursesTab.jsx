import { useState } from 'react';
import { Plus, Trash2, ShieldAlert, FolderOpen, Tag, Filter } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, PageHeader } from '@/components/management/SharedComponents';
import { Switch } from '@/components/ui/switch';

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



export default function CoursesTab() {
    const [editingId, setEditingId] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(null);
    const [filterText, setFilterText] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterLevel, setFilterLevel] = useState('');
    const [showMineOnly, setShowMineOnly] = useState(false);
    const { user } = useAuth();

    const { courses, loading, addCourse, updateCourse, deleteCourse } = useCourses();
    const [values, setValues] = useState({
        title: '',
        description: '',
        minLevel: '',
        maxLevel: '',
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
            setEditingId(result.course?.id || null);
            if (result.course) setSelectedCourse(result.course);
            else setSelectedCourse(null);
            reset();
        } else {
            toast.error(result.error || 'Operation failed');
        }
    };

    const handleEdit = (course) => {
        setEditingId(course.id);
        setSelectedCourse(course);
        setValues({
            title: course.title || '',
            description: course.description || '',
            minLevel: course.minLevel || '',
            maxLevel: course.maxLevel || '',

            tags: course.tags || '',
            category: course.category || '',
            difficulty: course.difficulty || 3,
            estimatedHours: course.estimatedHours || '',
        });
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this course? All lessons and words will be deleted.')) return;
        setDeleteLoading(`course-${id}`);
        const result = await deleteCourse(id);
        setDeleteLoading(null);
        if (result.success) {
            toast.success('Course deleted');
            if (selectedCourse?.id === id) {
                setSelectedCourse(null);
                setEditingId(null);
                reset();
            }
        } else toast.error(result.error || 'Failed to delete');
    };

    const isOwner = selectedCourse ? (selectedCourse.ownerId == null || selectedCourse.ownerId === user?.uid) : true;
    const disableEdits = selectedCourse && !isOwner;

    const filteredCourses = courses.filter(course => {
        const matchesOwner = !showMineOnly || course.ownerId == null || course.ownerId === user?.uid;
        const matchesText = !filterText ||
            course.title?.toLowerCase().includes(filterText.toLowerCase()) ||
            course.tags?.toLowerCase().includes(filterText.toLowerCase());
        const matchesCategory = !filterCategory || course.category === filterCategory;
        const matchesLevel = !filterLevel || course.minLevel === filterLevel || course.maxLevel === filterLevel;
        return matchesOwner && matchesText && matchesCategory && matchesLevel;
    });

    const resetFilters = () => {
        setFilterText('');
        setFilterCategory('');
        setFilterLevel('');
        setShowMineOnly(false);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Course management"
                action={
                    <Button onClick={() => { setEditingId(null); setSelectedCourse(null); reset(); }} className="gap-2 w-full sm:w-auto">
                        <Plus className="h-4 w-4" /> New course
                    </Button>
                }
            />
            <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                <Card className="h-full">
                    <CardHeader className="p-4 border-b space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <CardTitle className="text-base">Courses</CardTitle>
                            <Badge variant="outline" className="text-[11px]">{filteredCourses.length} shown</Badge>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Filter className="h-4 w-4" />
                                Quick filters
                            </div>
                            <div className="space-y-2">
                                <Input
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                    placeholder="Search title or tags"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <Select
                                        value={filterCategory}
                                        onChange={setFilterCategory}
                                        options={CATEGORY_OPTIONS}
                                        placeholder="Category"
                                    />
                                    <Select
                                        value={filterLevel}
                                        onChange={setFilterLevel}
                                        options={LEVEL_OPTIONS}
                                        placeholder="Level"
                                    />
                                </div>
                                <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Switch checked={showMineOnly} onCheckedChange={setShowMineOnly} id="mine-only" />
                                        <label htmlFor="mine-only" className="text-sm">Only my courses</label>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={resetFilters}>Clear</Button>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {filteredCourses.length === 0 && !loading ? (
                            <div className="p-6 text-sm text-muted-foreground text-center">No courses yet. Create one to start.</div>
                        ) : (
                            <div className="divide-y">
                                {filteredCourses.map(course => {
                                    const active = selectedCourse?.id === course.id;
                                    const owner = course.ownerId == null || course.ownerId === user?.uid;
                                    return (
                                        <button
                                            key={course.id}
                                            onClick={() => handleEdit(course)}
                                            className={`w-full text-left px-4 py-3 flex items-start justify-between gap-3 transition ${active ? 'bg-secondary/60' : 'hover:bg-secondary/40'}`}
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium leading-tight">{course.title}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                    {course.category && <Badge variant="secondary">{course.category}</Badge>}
                                                    {(course.minLevel || course.maxLevel) && (
                                                        <Badge variant="outline">{course.minLevel || 'N/A'} – {course.maxLevel || 'N/A'}</Badge>
                                                    )}
                                                    {course.difficulty && <Badge variant="outline">{course.difficulty}/5</Badge>}
                                                </div>
                                                {course.tags && (
                                                    <div className="flex flex-wrap gap-1 text-[11px] text-muted-foreground">
                                                        {course.tags.split(',').map((tag, i) => (
                                                            <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary/70">
                                                                <Tag className="h-3 w-3" />{tag.trim()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {course.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
                                                )}
                                            </div>
                                            {!owner && <ShieldAlert className="h-4 w-4 text-muted-foreground" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="h-fit border-primary/50">
                    <CardHeader className="pb-3 space-y-1">
                        <CardTitle className="text-base">{editingId ? 'Edit course' : 'Add course'}</CardTitle>
                        {selectedCourse && !isOwner && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <ShieldAlert className="h-4 w-4" />
                                You can view this course but only the owner can edit or remove it.
                            </div>
                        )}
                    </CardHeader>
                    <Separator />
                    <CardContent className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="course-title">Course Title *</Label>
                            <Input
                                id="course-title"
                                value={values.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                placeholder="e.g., JLPT N5 Vocabulary"
                                disabled={disableEdits}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="course-description">Description</Label>
                            <Input
                                id="course-description"
                                value={values.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="Brief course description"
                                disabled={disableEdits}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="course-min-level">Min Level</Label>
                                <Select
                                    value={values.minLevel}
                                    onChange={(v) => handleChange('minLevel', v)}
                                    options={LEVEL_OPTIONS}
                                    placeholder="From..."
                                    disabled={disableEdits}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="course-max-level">Max Level</Label>
                                <Select
                                    value={values.maxLevel}
                                    onChange={(v) => handleChange('maxLevel', v)}
                                    options={LEVEL_OPTIONS}
                                    placeholder="To..."
                                    disabled={disableEdits}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="course-category">Category</Label>
                            <Select
                                value={values.category}
                                onChange={(v) => handleChange('category', v)}
                                options={CATEGORY_OPTIONS}
                                placeholder="Select category"
                                disabled={disableEdits}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="course-difficulty">Difficulty (1-5)</Label>
                                <div className="flex items-center gap-2">
                                    <input
                                        id="course-difficulty"
                                        type="range"
                                        min="1"
                                        max="5"
                                        value={values.difficulty || 3}
                                        onChange={(e) => handleChange('difficulty', e.target.value)}
                                        className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                                        disabled={disableEdits}
                                    />
                                    <span className="w-8 text-center font-mono text-sm">{values.difficulty || 3}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="course-hours">Est. Hours</Label>
                                <Input
                                    id="course-hours"
                                    type="number"
                                    min="1"
                                    value={values.estimatedHours || ''}
                                    onChange={(e) => handleChange('estimatedHours', e.target.value)}
                                    placeholder="e.g., 20"
                                    disabled={disableEdits}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="course-tags">Tags (comma-separated)</Label>
                            <Input
                                id="course-tags"
                                value={values.tags}
                                onChange={(e) => handleChange('tags', e.target.value)}
                                placeholder="e.g., kanji, vocabulary, JLPT"
                                disabled={disableEdits}
                            />
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                            <Button onClick={handleSubmit} className="flex-1 sm:flex-none sm:w-auto" disabled={disableEdits}>
                                {editingId ? 'Update' : 'Create'}
                            </Button>
                            <Button variant="outline" onClick={() => { setSelectedCourse(null); setEditingId(null); reset(); }} className="flex-1 sm:flex-none sm:w-auto">
                                Cancel
                            </Button>
                            {editingId && isOwner && (
                                <Button
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDelete(editingId)}
                                    disabled={deleteLoading === `course-${editingId}`}
                                >
                                    {deleteLoading === `course-${editingId}` ? (
                                        <div className="h-4 w-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                    ) : (
                                        <><Trash2 className="h-4 w-4 mr-2" />Remove</>
                                    )}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div >
    );
}

