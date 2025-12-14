import { cn } from '@/lib/utils';
import Furigana from '@/components/Furigana';
import { getTextSize, getDisplayContent } from './StudyComponents';

/**
 * Quiz mode for study sessions.
 * Shows term/meaning and multiple choice options.
 */
export default function QuizMode({
    displayContent,
    quizOptions,
    quizDirection,
    onAnswer,
    feedback,
    currentItemId,
    showFurigana
}) {
    return (
        <div className="space-y-8">
            <div className="text-center space-y-4 py-8">
                {quizDirection === 'reverse' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Select the Japanese Term
                    </span>
                )}
                <h2 className={cn("font-bold", getTextSize(quizDirection === 'reverse' ? displayContent.english : displayContent.term))}>
                    {quizDirection === 'reverse' ? (
                        displayContent.english
                    ) : (
                        <Furigana
                            text={displayContent.term}
                            reading={displayContent.reading}
                            show={showFurigana}
                        />
                    )}
                </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quizOptions.map((option, idx) => {
                    const optContent = getDisplayContent(option);
                    const isCorrect = option.id === currentItemId;
                    return (
                        <button
                            key={option.id}
                            disabled={feedback !== null}
                            onClick={() => onAnswer(isCorrect)}
                            className={cn(
                                "p-5 rounded-xl border-2 text-left transition-all",
                                feedback === null && "hover:border-primary hover:shadow-lg bg-card",
                                feedback === 'correct' && isCorrect && "border-green-500 bg-green-50",
                                feedback === 'incorrect' && isCorrect && "border-green-500 bg-green-50",
                                feedback === 'incorrect' && !isCorrect && "opacity-50",
                                !feedback && "border-border"
                            )}
                        >
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-secondary text-xs font-medium text-muted-foreground mb-2">
                                {idx + 1}
                            </span>
                            {quizDirection === 'reverse' ? (
                                <div>
                                    <span className="font-semibold text-lg block">{optContent.term}</span>
                                    {optContent.reading && (
                                        <div className="text-sm text-muted-foreground mt-1">{optContent.reading}</div>
                                    )}
                                </div>
                            ) : (
                                <span className="font-semibold">{optContent.english}</span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
