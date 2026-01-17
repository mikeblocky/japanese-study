import { cn } from '@/lib/utils';

export function StudyProgress({ current, total }) {
    const progress = total > 0 ? (current / total) * 100 : 0;
    return (
        <div className="h-1 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
    );
}

export function StudyStats({ correct, incorrect, total }) {
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    return (
        <div className="text-center py-8">
            <h2 className="text-2xl font-medium mb-2">Session Complete</h2>
            <p className="text-5xl font-bold">{accuracy}%</p>
            <p className="text-muted-foreground mt-2">{correct} correct · {incorrect} incorrect</p>
        </div>
    );
}

export function isJapanese(text) {
    return /[^\x00-\x7F]/.test(text || '');
}

export function getDisplayContent(item) {
    const data = item.additionalData || {};

    // For manual items (no additionalData), populate it so FlashcardMode has something to show on the back
    if (Object.keys(data).length === 0) {
        if (item.secondaryText) data['Reading'] = item.secondaryText;
        if (item.meaning) data['Meaning'] = item.meaning;
    }

    let term = data['Expression'] || data['Kanji'] || data['Front'] || item.primaryText || '-';
    let english = data['Meaning'] || data['English'] || data['Back'] || item.meaning || '';
    let reading = data['Reading'] || data['Kana'] || data['Furigana'] || item.secondaryText || '';

    if (isJapanese(english) && !isJapanese(reading) && reading) {
        [english, reading] = [reading, english];
    }

    return { term, english, reading, additionalData: data };
}
