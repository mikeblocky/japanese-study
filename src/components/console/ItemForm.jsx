import { X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

/**
 * Form for adding or editing vocabulary items.
 */
export default function ItemForm({
    isEditing,
    formData,
    courses,
    onFormChange,
    onSubmit,
    onClose
}) {
    return (
        <Card className="border-primary">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>{isEditing ? 'Edit word' : 'Add new word'}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="term">Japanese Term *</Label>
                        <Input
                            id="term"
                            value={formData.primaryText}
                            onChange={(e) => onFormChange({ ...formData, primaryText: e.target.value })}
                            placeholder="e.g., こんにちは"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reading">Reading (Optional)</Label>
                        <Input
                            id="reading"
                            value={formData.secondaryText}
                            onChange={(e) => onFormChange({ ...formData, secondaryText: e.target.value })}
                            placeholder="e.g., konnichiwa"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="meaning">Meaning *</Label>
                    <Input
                        id="meaning"
                        value={formData.meaning}
                        onChange={(e) => onFormChange({ ...formData, meaning: e.target.value })}
                        placeholder="e.g., Hello"
                    />
                </div>
                {!isEditing && (
                    <div className="space-y-2">
                        <Label htmlFor="topic">Topic *</Label>
                        <select
                            id="topic"
                            value={formData.topicId}
                            onChange={(e) => onFormChange({ ...formData, topicId: e.target.value })}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        >
                            <option value="">Select a topic</option>
                            {courses.flatMap(course =>
                                course.topics.map(topic => (
                                    <option key={topic.id} value={topic.id}>
                                        {course.title} - {topic.title}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                )}
                <div className="flex gap-2 pt-2">
                    <Button onClick={onSubmit} className="flex-1">
                        <Check className="mr-2 h-4 w-4" />
                        {isEditing ? 'Update' : 'Add'}
                    </Button>
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
