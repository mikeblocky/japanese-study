import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, Book, X, FolderOpen, Layers, ShieldAlert, Tag } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { useTopics } from '@/hooks/useTopics';
import { useItems } from '@/hooks/useItems';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/management/SharedComponents';

export default function VocabularyTab() {
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formValues, setFormValues] = useState({
        primaryText: '',
        secondaryText: '',
        meaning: '',
        additionalData: {}
    });
    const [newFieldKey, setNewFieldKey] = useState('');

    const { courses } = useCourses();
    const { topics, loadTopics } = useTopics(selectedCourse?.id);
    const { items, loadItems, addItem, updateItem, deleteItem, loading } = useItems(selectedTopic?.id);
    const { user } = useAuth();
    const toast = useToast();

    // Check if current user owns the selected course
    const isOwner = selectedCourse && (selectedCourse.ownerId == null || selectedCourse.ownerId === user?.uid);

    // Effect: Load topics when course changes
    useEffect(() => {
        if (selectedCourse) {
            loadTopics(selectedCourse.id);
            setSelectedTopic(null); // Reset lower selection
        } else {
            setSelectedTopic(null);
        }
    }, [selectedCourse, loadTopics]);

    // Effect: Load items when topic changes
    useEffect(() => {
        if (selectedTopic) {
            loadItems(selectedTopic.id);
        }
    }, [selectedTopic, loadItems]);

    const handleCourseSelect = (course) => {
        setSelectedCourse(course);
        setSelectedTopic(null);
        setShowForm(false);
        setEditingId(null);
    };

    const handleTopicSelect = (topic) => {
        setSelectedTopic(topic);
        setShowForm(false);
        setEditingId(null);
    };

    const handleSubmit = async () => {
        if (!formValues.primaryText || !formValues.secondaryText) {
            toast.error("Primary and Secondary fields are required");
            return;
        }

        const payload = {
            primaryText: formValues.primaryText,
            secondaryText: formValues.secondaryText,
            meaning: formValues.meaning || null,
            additionalData: formValues.additionalData || {}
        };

        const result = editingId
            ? await updateItem(editingId, payload, selectedTopic.id)
            : await addItem(selectedTopic.id, payload);

        if (result.success) {
            toast.success(editingId ? "Word updated" : "Word added");
            closeForm();
        } else {
            toast.error(result.error);
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setFormValues({
            primaryText: item.primaryText || '',
            secondaryText: item.secondaryText || '',
            meaning: item.meaning || '',
            additionalData: item.additionalData ? { ...item.additionalData } : {}
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this word?")) return;
        const result = await deleteItem(id, selectedTopic.id);
        if (result.success) toast.success("Word deleted");
        else toast.error(result.error);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormValues({ primaryText: '', secondaryText: '', meaning: '', additionalData: {} });
        setNewFieldKey('');
    };

    const handleAdditionalFieldChange = (key, value) => {
        setFormValues(prev => ({
            ...prev,
            additionalData: {
                ...prev.additionalData,
                [key]: value
            }
        }));
    };

    const handleRemoveField = (key) => {
        setFormValues(prev => {
            const newData = { ...prev.additionalData };
            delete newData[key];
            return { ...prev, additionalData: newData };
        });
    };

    const handleAddField = () => {
        const key = newFieldKey.trim();
        if (!key) {
            toast.error("Please enter a field name");
            return;
        }
        if (formValues.additionalData[key] !== undefined) {
            toast.error("Field already exists");
            return;
        }
        setFormValues(prev => ({
            ...prev,
            additionalData: { ...prev.additionalData, [key]: '' }
        }));
        setNewFieldKey('');
    };

    // Get dynamic field keys from additionalData (sorted alphabetically)
    const additionalFieldKeys = Object.keys(formValues.additionalData).sort();

    return (
        <div className="space-y-6">
            <PageHeader title="Vocabulary management" subtitle="Pick a course and lesson, then add or edit words inline." />

            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                <Card className="h-full">
                    <CardHeader className="p-4 border-b">
                        <CardTitle className="text-base">Courses</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {courses.length === 0 ? (
                            <div className="p-6 text-sm text-muted-foreground text-center">No courses available.</div>
                        ) : (
                            <div className="divide-y">
                                {courses.map(course => {
                                    const active = selectedCourse?.id === course.id;
                                    const owner = course.ownerId == null || course.ownerId === user?.uid;
                                    return (
                                        <button
                                            key={course.id}
                                            onClick={() => handleCourseSelect(course)}
                                            className={`w-full px-4 py-3 flex items-start justify-between gap-3 text-left transition ${active ? 'bg-secondary/60' : 'hover:bg-secondary/40'}`}
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium leading-tight">{course.title}</span>
                                                </div>
                                                {course.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
                                                )}
                                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                    {course.category && <Badge variant="secondary">{course.category}</Badge>}
                                                    {(course.minLevel || course.maxLevel) && (
                                                        <Badge variant="outline">{course.minLevel || 'N/A'} – {course.maxLevel || 'N/A'}</Badge>
                                                    )}
                                                    {course.difficulty && <Badge variant="outline">{course.difficulty}/5</Badge>}
                                                </div>
                                            </div>
                                            {!owner && <ShieldAlert className="h-4 w-4 text-muted-foreground" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <Card className="h-full">
                        <CardHeader className="p-4 pb-3 space-y-1 border-b">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Layers className="h-4 w-4 text-muted-foreground" /> Lessons / Topics
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">Choose a lesson to see its words.</p>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {topics.length === 0 && selectedCourse && (
                                    <span className="text-sm text-muted-foreground">No lessons yet for this course.</span>
                                )}
                                {topics.map(topic => {
                                    const active = selectedTopic?.id === topic.id;
                                    return (
                                        <Button
                                            key={topic.id}
                                            variant={active ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => handleTopicSelect(topic)}
                                        >
                                            {topic.title}
                                        </Button>
                                    );
                                })}
                            </div>

                            <Separator />

                            {selectedTopic ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Words in</p>
                                            <h3 className="text-lg font-semibold">{selectedTopic.title} <span className="text-sm text-muted-foreground">({items.length})</span></h3>
                                        </div>
                                        <Button
                                            size="sm"
                                            className="gap-2"
                                            onClick={() => setShowForm(true)}
                                            disabled={!isOwner}
                                        >
                                            <Plus className="h-4 w-4" /> Add word
                                        </Button>
                                    </div>

                                    {showForm && (
                                        <Card className="border-primary/50">
                                            <CardContent className="p-4 space-y-4 pt-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Front (Primary)</Label>
                                                        <Input
                                                            value={formValues.primaryText}
                                                            onChange={e => setFormValues({ ...formValues, primaryText: e.target.value })}
                                                            placeholder="猫"
                                                            disabled={!isOwner}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Reading (Secondary)</Label>
                                                        <Input
                                                            value={formValues.secondaryText}
                                                            onChange={e => setFormValues({ ...formValues, secondaryText: e.target.value })}
                                                            placeholder="ねこ"
                                                            disabled={!isOwner}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Meaning</Label>
                                                        <Input
                                                            value={formValues.meaning}
                                                            onChange={e => setFormValues({ ...formValues, meaning: e.target.value })}
                                                            placeholder="Cat"
                                                            disabled={!isOwner}
                                                        />
                                                    </div>
                                                </div>

                                                {additionalFieldKeys.length > 0 && (
                                                    <div className="space-y-3">
                                                        <Label className="text-muted-foreground">Additional Fields</Label>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {additionalFieldKeys.map(key => (
                                                                <div key={key} className="flex items-end gap-2">
                                                                    <div className="flex-1 space-y-1">
                                                                        <Label className="text-xs text-muted-foreground">{key}</Label>
                                                                        <Input
                                                                            value={formValues.additionalData[key] || ''}
                                                                            onChange={e => handleAdditionalFieldChange(key, e.target.value)}
                                                                            placeholder={`Enter ${key}...`}
                                                                            disabled={!isOwner}
                                                                        />
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                                                        onClick={() => handleRemoveField(key)}
                                                                        disabled={!isOwner}
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-end gap-2 pt-2 border-t">
                                                    <div className="flex-1 space-y-1">
                                                        <Label className="text-xs text-muted-foreground">Add custom field</Label>
                                                        <Input
                                                            value={newFieldKey}
                                                            onChange={e => setNewFieldKey(e.target.value)}
                                                            placeholder="Field name (e.g. Notes, Sentence)"
                                                            onKeyDown={e => e.key === 'Enter' && handleAddField()}
                                                            disabled={!isOwner}
                                                        />
                                                    </div>
                                                    <Button variant="outline" size="sm" onClick={handleAddField} disabled={!isOwner}>
                                                        <Plus className="h-4 w-4 mr-1" /> Add
                                                    </Button>
                                                </div>

                                                <div className="flex justify-end gap-2 pt-2">
                                                    <Button variant="ghost" onClick={closeForm}>Cancel</Button>
                                                    <Button onClick={handleSubmit} disabled={!isOwner}>
                                                        <Check className="h-4 w-4 mr-2" /> Save
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    <Card className="bg-card">
                                        <CardContent className="p-0">
                                            <div className="divide-y">
                                                {items.length === 0 ? (
                                                    <div className="p-6 text-sm text-muted-foreground text-center">No words yet. Add one!</div>
                                                ) : (
                                                    items.map(item => {
                                                        const fieldCount = item.additionalData ? Object.keys(item.additionalData).length : 0;
                                                        return (
                                                            <div key={item.id} className="px-4 py-3 flex items-start justify-between gap-3 hover:bg-secondary/30 transition">
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-medium">{item.primaryText}</span>
                                                                        <Badge variant="outline" className="text-xs">{item.secondaryText}</Badge>
                                                                    </div>
                                                                    <p className="text-sm text-muted-foreground">{item.meaning || 'No meaning provided'}</p>
                                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                                                        {fieldCount > 0 && (
                                                                            <Badge variant="secondary" className="flex items-center gap-1 text-[11px]">
                                                                                <Tag className="h-3 w-3" />+{fieldCount}
                                                                            </Badge>
                                                                        )}
                                                                        {item.userSrsInterval && (
                                                                            <Badge variant="outline" className="font-mono">Lv.{item.userSrsInterval}</Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {isOwner && (
                                                                    <div className="flex items-center gap-2">
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                                                                            <Edit2 className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}>
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ) : (
                                <div className="text-center py-10 text-muted-foreground">
                                    <Book className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                    <p>Select a lesson to see its words.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
