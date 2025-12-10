import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Helper to detect if text contains kanji
 */
const hasKanji = (text) => {
    if (!text) return false;
    // Kanji unicode ranges
    return /[\u4e00-\u9faf\u3400-\u4dbf]/.test(text);
};

/**
 * Helper to detect if text is romaji (Latin alphabet)
 */
const isRomaji = (text) => {
    if (!text) return false;
    // Check if text is primarily Latin alphabet
    return /^[a-zA-Z\s.,!?'-]+$/.test(text.trim());
};

/**
 * Strip kanji from reading text, keeping only hiragana and katakana
 * Sometimes Anki exports have kanji mixed into the reading field
 */
const stripKanji = (text) => {
    if (!text) return '';
    // Remove all kanji characters, keeping hiragana, katakana, and basic punctuation
    return text.replace(/[\u4e00-\u9faf\u3400-\u4dbf]/g, '').trim();
};

/**
 * Furigana component for displaying Japanese text with readings above kanji
 * Uses HTML <ruby> tags for proper semantic rendering
 * 
 * @param {string} text - The kanji/kana text
 * @param {string} reading - The furigana reading (hiragana/katakana)
 * @param {string} className - Optional className for styling
 * @param {boolean} show - Whether to show furigana (default: true)
 */
export default function Furigana({ text, reading, className, show = true }) {
    // Clean up readings first
    let cleanReading = reading ? reading.replace(/[\[\]【】]/g, '').trim() : '';

    // Strip any kanji from the reading (data quality issue from some Anki decks)
    cleanReading = stripKanji(cleanReading);

    // Don't show furigana if:
    // 1. Disabled by prop
    // 2. No reading provided or reading is empty after cleaning
    // 3. Text doesn't contain kanji (pure hiragana/katakana doesn't need furigana)
    // 4. Reading is romaji (we want hiragana/katakana readings, not romanization)
    if (!show || !cleanReading || !hasKanji(text) || isRomaji(cleanReading)) {
        return <span className={className}>{text}</span>;
    }

    return (
        <ruby className={cn("furigana-container", className)}>
            {text}
            <rt className="furigana-text">{cleanReading}</rt>
        </ruby>
    );
}

/**
 * Advanced Furigana component that can parse and split text
 * This version attempts to match individual kanji with their readings
 * For simple cases, use the basic Furigana component above
 */
export function FuriganaAdvanced({ text, reading, className }) {
    if (!text || !reading) return <span className={className}>{text}</span>;

    // For now, use simple ruby tag
    // Future enhancement: Parse and split individual kanji/reading pairs
    return <Furigana text={text} reading={reading} className={className} />;
}
