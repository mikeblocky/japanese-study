import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, FileText, Info } from 'lucide-react';
import api from '@/lib/api';
import { useCourses } from '@/hooks/useCourses';
import { useToast } from '@/hooks/useToast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ImportTab() {
    const [ankiFile, setAnkiFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState(null);
    const [progress, setProgress] = useState(null);
    const [visibility, setVisibility] = useState('PRIVATE');

    const { loadCourses } = useCourses(false); // Don't auto-load
    const toast = useToast();

    const handleImport = async () => {
        if (!ankiFile) {
            toast.error('Please select an Anki deck file (.apkg)');
            return;
        }

        // Validate file
        if (!ankiFile.name.endsWith('.apkg')) {
            setResult({
                success: false,
                message: 'Invalid file type. Please select a .apkg file exported from Anki.'
            });
            return;
        }

        // Check file size (max 50MB)
        const maxSize = 50 * 1024 * 1024;
        if (ankiFile.size > maxSize) {
            setResult({
                success: false,
                message: 'File is too large. Maximum file size is 50MB. Try exporting a smaller deck.'
            });
            return;
        }

        try {
            setImporting(true);
            setResult(null);
            setProgress('Uploading file...');

            const formData = new FormData();
            formData.append('file', ankiFile);
            formData.append('skipMedia', 'true');
            formData.append('textOnly', 'true');
            formData.append('visibility', visibility);

            setProgress('Processing deck...');

            const res = await api.post('/import/anki', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 300000, // 5 minute timeout
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(`Uploading... ${percentCompleted}%`);
                }
            });

            const coursesCount = res.data.coursesCreated || 0;
            const topicsCount = res.data.topicsCreated || 0;
            const itemsCount = res.data.itemsCreated || 0;
            const skippedCount = res.data.skippedItems || 0;

            let message = `Successfully imported: ${coursesCount} course${coursesCount !== 1 ? 's' : ''}, ${topicsCount} lesson${topicsCount !== 1 ? 's' : ''}, ${itemsCount} word${itemsCount !== 1 ? 's' : ''}`;

            if (skippedCount > 0) {
                message += `. Skipped ${skippedCount} item${skippedCount !== 1 ? 's' : ''} with media or unsupported content.`;
            }

            setResult({
                success: true,
                message: message,
                data: res.data,
                details: {
                    courses: coursesCount,
                    lessons: topicsCount,
                    words: itemsCount,
                    skipped: skippedCount,
                    warnings: res.data.warnings || []
                }
            });

            setAnkiFile(null);
            document.getElementById('anki-file').value = '';
            loadCourses(); // Refresh courses
            toast.success('Import successful!');
        } catch (err) {
            console.error('Failed to import Anki deck', err);

            let errorMessage = 'Failed to import Anki deck. ';
            let technicalDetails = '';

            if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
                errorMessage += 'Import timed out after 5 minutes. This usually means Render free tier is sleeping or overloaded. Try again in 1-2 minutes after the service wakes up.';
                technicalDetails = 'Timeout after 300 seconds';
            } else if (err.response?.status === 500) {
                errorMessage += 'Server error occurred. The backend service might still be starting up (Render free tier can take 1-2 minutes to wake up). Please wait a moment and try again.';
                technicalDetails = err.response?.data?.error || err.response?.data?.message || 'Internal server error';
            } else if (err.response?.status === 413) {
                errorMessage += 'File is too large for the server. Try exporting a smaller deck.';
                technicalDetails = 'File size exceeds server limit';
            } else if (err.response?.status === 400) {
                errorMessage += err.response.data?.message || 'Invalid deck format. Make sure you exported it correctly from Anki.';
                technicalDetails = err.response?.data?.error || 'Bad request';
            } else if (err.response?.status === 403) {
                errorMessage += 'Access denied. You need admin privileges to import decks.';
                technicalDetails = 'Authorization failed';
            } else if (err.message.includes('Network Error') || err.message.includes('ERR_QUIC') || err.message.includes('ERR_CONNECTION')) {
                errorMessage += 'Network connection error. The backend service might be down or restarting. If using Render free tier, the service may be sleeping and will wake up in 1-2 minutes. Please try again shortly.';
                technicalDetails = err.message;
            } else {
                errorMessage += err.response?.data?.message || err.message || 'Unknown error occurred. Please try again.';
                technicalDetails = err.response?.data?.error || err.message || 'Unknown error';
            }

            setResult({
                success: false,
                message: errorMessage,
                technicalDetails: technicalDetails
            });

            toast.error('Import failed');
        } finally {
            setImporting(false);
            setProgress(null);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Import Content</h2>
                <p className="text-muted-foreground mt-1">
                    Upload your Anki decks (.apkg) to automatically create courses, lessons, and vocabulary.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Upload Deck
                        </CardTitle>
                        <CardDescription>
                            Select an .apkg file (Max 50MB)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col items-center justify-center p-6 bg-muted/10 rounded-lg border border-muted/20">
                            <input
                                id="anki-file"
                                type="file"
                                accept=".apkg"
                                onChange={(e) => setAnkiFile(e.target.files?.[0] || null)}
                                disabled={importing}
                                className="hidden"
                            />
                            <label
                                htmlFor="anki-file"
                                className={`flex flex-col items-center gap-2 cursor-pointer text-center ${importing ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                    <FileText className="h-6 w-6 text-primary" />
                                </div>
                                {ankiFile ? (
                                    <div className="space-y-1">
                                        <p className="font-medium text-foreground">{ankiFile.name}</p>
                                        <p className="text-xs text-muted-foreground">{(ankiFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <p className="font-medium text-foreground">Click to browse</p>
                                        <p className="text-xs text-muted-foreground">or drag and drop here</p>
                                    </div>
                                )}
                            </label>
                        </div>

                        {progress && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Processing...</span>
                                    <span>{progress.includes('%') ? progress.split('... ')[1] : ''}</span>
                                </div>
                                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary animate-pulse"
                                        style={{ width: '100%' }} // Indeterminate for now unless backend sends exact %
                                    />
                                </div>
                                <p className="text-xs text-center text-muted-foreground animate-pulse">{progress}</p>
                            </div>
                        )}

                        <Button
                            onClick={handleImport}
                            disabled={!ankiFile || importing}
                            className="w-full"
                            size="lg"
                        >
                            {importing ? 'Importing...' : 'Start Import'}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-secondary/20 border-none">
                    <CardHeader>
                        <div className="flex items-center gap-2 text-primary">
                            <Info className="h-5 w-5" />
                            <CardTitle className="text-lg">Export Guide</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="space-y-2">
                            <h4 className="font-medium text-foreground">Prepare your deck in Anki:</h4>
                            <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground ml-1">
                                <li>Open <strong>Anki Desktop</strong></li>
                                <li>Click the gear icon next to your deck</li>
                                <li>Select <strong>Export</strong></li>
                                <li>Format: <strong>Anki Deck Package (*.apkg)</strong></li>
                                <li>Uncheck <em>"Include scheduling information"</em></li>
                                <li>Check <em>"Include media"</em> (images/audio supported)</li>
                                <li>Click <strong>Export</strong> to save the file</li>
                            </ol>
                        </div>
                        <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
                            <strong>Note:</strong> Large decks with lots of media may take a few minutes to process. Please be patient.
                        </div>
                    </CardContent>
                </Card>
            </div>

            {result && (
                <Card className={`border ${result.success ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            {result.success ? (
                                <CheckCircle className="h-6 w-6 text-green-500" />
                            ) : (
                                <AlertCircle className="h-6 w-6 text-red-500" />
                            )}
                            <div>
                                <CardTitle className={result.success ? 'text-green-600' : 'text-red-600'}>
                                    {result.success ? 'Import Complete' : 'Import Failed'}
                                </CardTitle>
                                <CardDescription className="font-mono text-xs mt-1">
                                    {result.technicalDetails}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    {result.success && result.details && (
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <StatBox label="Courses" value={result.details.courses} color="text-blue-500" />
                                <StatBox label="Lessons" value={result.details.lessons} color="text-purple-500" />
                                <StatBox label="Words" value={result.details.words} color="text-emerald-500" />
                                <StatBox label="Skipped" value={result.details.skipped} color="text-orange-500" />
                            </div>
                            <p className="mt-4 text-sm text-center text-muted-foreground">{result.message}</p>
                        </CardContent>
                    )}

                    {!result.success && (
                        <CardContent>
                            <p className="text-sm text-red-600/90 dark:text-red-400/90">{result.message}</p>
                        </CardContent>
                    )}
                </Card>
            )}
        </div>
    );
}

function StatBox({ label, value, color }) {
    return (
        <div className="bg-background border rounded-lg p-3 text-center shadow-sm">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{label}</div>
        </div>
    );
}
