import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, Book, X } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { useTopics } from '@/hooks/useTopics';
import { useItems } from '@/hooks/useItems';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

    const handleCourseChange = (e) => {
        const courseId = e.target.value;
        const course = courses.find(c => c.id.toString() === courseId);
        setSelectedCourse(course || null);
    };

    const handleTopicChange = (e) => {
        const topicId = e.target.value;
        const topic = topics.find(t => t.id.toString() === topicId);
        setSelectedTopic(topic || null);
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
            <h2 className="text-xl font-semibold">Vocabulary management</h2>

            {/* Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Course</Label>
                    <select
                        className="w-full h-10 px-3 rounded-md border bg-background"
                        onChange={handleCourseChange}
                        value={selectedCourse?.id || ''}
                    >
                        <option value="">Select Course...</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <Label>Lesson / Topic</Label>
                    <select
                        className="w-full h-10 px-3 rounded-md border bg-background"
                        onChange={handleTopicChange}
                        value={selectedTopic?.id || ''}
                        disabled={!selectedCourse}
                    >
                        <option value="">Select Lesson...</option>
                        {topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                    </select>
                </div>
            </div>

            {/* Content Area */}
            {selectedTopic ? (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-medium text-muted-foreground">
                            Words in "{selectedTopic.title}" ({items.length})
                        </h3>
                        {isOwner && (
                            <Button onClick={() => setShowForm(true)} size="sm" className="gap-2">
                                <Plus className="h-4 w-4" /> Add Word
                            </Button>
                        )}
                    </div>

                    {showForm && (
                        <Card className="border-primary animate-in fade-in slide-in-from-top-2">
                            <CardContent className="p-4 space-y-4 pt-4">
                                {/* Core fields */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Front (Primary)</Label>
                                        <Input
                                            value={formValues.primaryText}
                                            onChange={e => setFormValues({ ...formValues, primaryText: e.target.value })}
                                            placeholder="猫"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Reading (Secondary)</Label>
                                        <Input
                                            value={formValues.secondaryText}
                                            onChange={e => setFormValues({ ...formValues, secondaryText: e.target.value })}
                                            placeholder="ねこ"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Meaning</Label>
                                        <Input
                                            value={formValues.meaning}
                                            onChange={e => setFormValues({ ...formValues, meaning: e.target.value })}
                                            placeholder="Cat"
                                        />
                                    </div>
                                </div>

                                {/* Dynamic additional fields */}
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
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                                        onClick={() => handleRemoveField(key)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Add new field */}
                                <div className="flex items-end gap-2 pt-2 border-t">
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-xs text-muted-foreground">Add custom field</Label>
                                        <Input
                                            value={newFieldKey}
                                            onChange={e => setNewFieldKey(e.target.value)}
                                            placeholder="Field name (e.g. Notes, Sentence)"
                                            onKeyDown={e => e.key === 'Enter' && handleAddField()}
                                        />
                                    </div>
                                    <Button variant="outline" size="sm" onClick={handleAddField}>
                                        <Plus className="h-4 w-4 mr-1" /> Add
                                    </Button>
                                </div>

                                {/* Form actions */}
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button variant="ghost" onClick={closeForm}>Cancel</Button>
                                    <Button onClick={handleSubmit}>
                                        <Check className="h-4 w-4 mr-2" /> Save
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="border rounded-md overflow-hidden bg-card">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-secondary/50 border-b">
                                <tr>
                                    <th className="px-4 py-3">Front</th>
                                    <th className="px-4 py-3">Reading</th>
                                    <th className="px-4 py-3">Meaning</th>
                                    <th className="px-4 py-3 w-[80px] text-center">Fields</th>
                                    <th className="px-4 py-3 w-[80px] text-center">SRS</th>
                                    <th className="px-4 py-3 w-[100px] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center text-muted-foreground">
                                            No words yet. Add one!
                                        </td>
                                    </tr>
                                ) : (
                                    items.map(item => {
                                        const fieldCount = item.additionalData ? Object.keys(item.additionalData).length : 0;
                                        return (
                                            <tr key={item.id} className="hover:bg-secondary/20">
                                                <td className="px-4 py-2 font-medium">{item.primaryText}</td>
                                                <td className="px-4 py-2 text-muted-foreground">{item.secondaryText}</td>
                                                <td className="px-4 py-2 text-muted-foreground">{item.meaning || '-'}</td>
                                                <td className="px-4 py-2 text-center">
                                                    {fieldCount > 0 ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 text-xs font-mono">
                                                            +{fieldCount}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-center text-xs">
                                                    {item.userSrsInterval ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 font-mono">
                                                            Lv.{item.userSrsInterval}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    {isOwner && (
                                                        <div className="flex justify-end gap-1">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
                    <Book className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>Select a Course and Lesson to manage vocabulary</p>
                </div>
            )}
        </div>
    );
}
