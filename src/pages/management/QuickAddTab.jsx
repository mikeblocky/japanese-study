import { useState, useEffect } from 'react';
import { Plus, Trash2, FileText } from 'lucide-react';
import api from '@/lib/api';
import { useCourses } from '@/hooks/useCourses';
import { useForm } from '@/hooks/useForm';
import { useToast } from '@/hooks/useToast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function QuickAddTab() {
    const [quickAddTopics, setQuickAddTopics] = useState([]);
    const [recentlyAdded, setRecentlyAdded] = useState([]);
    const [deleteLoading, setDeleteLoading] = useState(null);

    // Custom hooks!
    const { courses } = useCourses();
    const { values, handleChange, setFieldValue } = useForm({
        course: '',
        topic: '',
        primaryText: '',
        secondaryText: '',
        meaning: ''
    });
    const toast = useToast();

    // Load topics when course selected
    useEffect(() => {
        if (values.course) {
            api.get(`/courses/${values.course}/topics`)
                .then(res => setQuickAddTopics(res.data || []))
                .catch(() => setQuickAddTopics([]));
        } else {
            setQuickAddTopics([]);
            setFieldValue('topic', '');
        }
    }, [values.course, setFieldValue]);

    const handleQuickAdd = async () => {
        if (!values.topic) {
            toast.error('Please select a lesson first');
            return;
        }
        if (!values.primaryText || !values.meaning) {
            toast.error('Please fill in the Japanese term and meaning');
            return;
        }

        try {
            const res = await api.post(`/topics/${values.topic}/items`, {
                primaryText: values.primaryText,
                secondaryText: values.secondaryText || '',
                meaning: values.meaning
            });

            // Add to recently added list
            const topic = quickAddTopics.find(t => t.id.toString() === values.topic);
            const course = courses.find(c => c.id.toString() === values.course);

            setRecentlyAdded(prev => [{
                ...res.data,
                topicTitle: topic?.title,
                courseTitle: course?.title,
                id: res.data?.id || Date.now()
            }, ...prev].slice(0, 10));

            // Clear word fields but keep course/topic selected
            setFieldValue('primaryText', '');
            setFieldValue('secondaryText', '');
            setFieldValue('meaning', '');

            toast.success('Word added!');

            // Focus back to first input
            document.getElementById('quick-word')?.focus();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add word');
        }
    };

    const handleDeleteRecent = async (itemId) => {
        if (!confirm('Delete this word?')) return;

        setDeleteLoading(`word-${itemId}`);
        try {
            await api.delete(`/items/${itemId}`);
            setRecentlyAdded(prev => prev.filter(w => w.id !== itemId));
            toast.success('Word deleted');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete');
        } finally {
            setDeleteLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">Quick Add Words</h2>
                <p className="text-muted-foreground text-sm mt-1">
                    Add vocabulary words quickly without leaving this page
                </p>
            </div>

            <Card className="border-primary">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Add New Word</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Course</Label>
                            <select
                                value={values.course}
                                onChange={(e) => handleChange('course', e.target.value)}
                                className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background"
                            >
                                <option value="">Select course...</option>
                                {courses.map(c => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Lesson</Label>
                            <select
                                value={values.topic}
                                onChange={(e) => handleChange('topic', e.target.value)}
                                disabled={!values.course}
                                className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background disabled:opacity-50"
                            >
                                <option value="">Select lesson...</option>
                                {quickAddTopics.map(t => (
                                    <option key={t.id} value={t.id}>{t.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="quick-word" className="text-xs">Japanese *</Label>
                            <Input
                                id="quick-word"
                                value={values.primaryText}
                                onChange={(e) => handleChange('primaryText', e.target.value)}
                                placeholder="こんにちは"
                                className="h-9"
                                onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="quick-reading" className="text-xs">Reading</Label>
                            <Input
                                id="quick-reading"
                                value={values.secondaryText}
                                onChange={(e) => handleChange('secondaryText', e.target.value)}
                                placeholder="konnichiwa"
                                className="h-9"
                                onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="quick-meaning" className="text-xs">Meaning *</Label>
                            <Input
                                id="quick-meaning"
                                value={values.meaning}
                                onChange={(e) => handleChange('meaning', e.target.value)}
                                placeholder="Hello"
                                className="h-9"
                                onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                            />
                        </div>
                    </div>

                    <Button onClick={handleQuickAdd} className="w-full" disabled={!values.topic}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Word
                    </Button>
                </CardContent>
            </Card>

            {/* Recently Added */}
            {recentlyAdded.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Recently Added</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {recentlyAdded.map(word => (
                            <div key={word.id} className="flex items-center justify-between p-2 rounded border">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{word.primaryText}</span>
                                        {word.secondaryText && (
                                            <span className="text-xs text-muted-foreground">({word.secondaryText})</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{word.meaning}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {word.courseTitle} • {word.topicTitle}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteRecent(word.id)}
                                    disabled={deleteLoading === `word-${word.id}`}
                                    className="text-destructive hover:text-destructive"
                                >
                                    {deleteLoading === `word-${word.id}` ? (
                                        <div className="h-4 w-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {recentlyAdded.length === 0 && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                            Words you add will appear here
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
