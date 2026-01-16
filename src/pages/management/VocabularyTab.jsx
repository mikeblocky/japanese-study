import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, Book } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { useTopics } from '@/hooks/useTopics';
import { useItems } from '@/hooks/useItems';
import { useToast } from '@/hooks/useToast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function VocabularyTab() {
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formValues, setFormValues] = useState({ primaryText: '', secondaryText: '' });

    const { courses } = useCourses();
    const { topics, loadTopics } = useTopics(selectedCourse?.id);
    const { items, loadItems, addItem, updateItem, deleteItem, loading } = useItems(selectedTopic?.id);
    const toast = useToast();

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
            toast.error("Both fields are required");
            return;
        }

        const payload = {
            primaryText: formValues.primaryText,
            secondaryText: formValues.secondaryText
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
            primaryText: item.primaryText,
            secondaryText: item.secondaryText
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
        setFormValues({ primaryText: '', secondaryText: '' });
    };

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
                        <Button onClick={() => setShowForm(true)} size="sm" className="gap-2">
                            <Plus className="h-4 w-4" /> Add Word
                        </Button>
                    </div>

                    {showForm && (
                        <Card className="border-primary animate-in fade-in slide-in-from-top-2">
                            <CardContent className="p-4 space-y-4 pt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Front (e.g. Kanji)</Label>
                                        <Input
                                            value={formValues.primaryText}
                                            onChange={e => setFormValues({ ...formValues, primaryText: e.target.value })}
                                            placeholder="猫"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Back (e.g. Reading/Meaning)</Label>
                                        <Input
                                            value={formValues.secondaryText}
                                            onChange={e => setFormValues({ ...formValues, secondaryText: e.target.value })}
                                            placeholder="Neko (Cat)"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
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
                                    <th className="px-4 py-3">Back</th>
                                    <th className="px-4 py-3 w-[100px] text-center">SRS Level</th>
                                    <th className="px-4 py-3 w-[100px] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-4 py-8 text-center text-muted-foreground">
                                            No words yet. Add one!
                                        </td>
                                    </tr>
                                ) : (
                                    items.map(item => (
                                        <tr key={item.id} className="hover:bg-secondary/20">
                                            <td className="px-4 py-2 font-medium">{item.primaryText}</td>
                                            <td className="px-4 py-2 text-muted-foreground">{item.secondaryText}</td>
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
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
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
