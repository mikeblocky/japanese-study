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
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">Import from Anki</h2>
                <p className="text-muted-foreground text-sm mt-1">
                    Import your Anki decks (.apkg files) to quickly populate courses and lessons
                </p>
            </div>

            <Card className="border-primary">
                <CardHeader>
                    <CardTitle>Upload Anki Deck</CardTitle>
                    <CardDescription>
                        Select an .apkg file exported from Anki Desktop
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="anki-file" className="block text-sm font-medium">
                            Deck File (.apkg) *
                        </label>
                        <input
                            id="anki-file"
                            type="file"
                            accept=".apkg"
                            onChange={(e) => setAnkiFile(e.target.files?.[0] || null)}
                            disabled={importing}
                            className="block w-full text-sm text-muted-foreground
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-medium
                                file:bg-primary file:text-primary-foreground
                                hover:file:bg-primary/90
                                file:cursor-pointer cursor-pointer
                                disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {ankiFile && (
                            <p className="text-xs text-muted-foreground">
                                Selected: {ankiFile.name} ({(ankiFile.size / 1024 / 1024).toFixed(2)} MB)
                            </p>
                        )}
                    </div>

                    {progress && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            {progress}
                        </div>
                    )}

                    <Button
                        onClick={handleImport}
                        disabled={!ankiFile || importing}
                        className="w-full"
                    >
                        {importing ? (
                            <>
                                <div className="mr-2 h-4 w-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Import Deck
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {result && (
                <Card className={result.success ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}>
                    <CardHeader>
                        <div className="flex items-start gap-3">
                            {result.success ? (
                                <CheckCircle className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                            ) : (
                                <AlertCircle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                                <CardTitle className={result.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                                    {result.success ? 'Import Successful' : 'Import Failed'}
                                </CardTitle>
                                <CardDescription className="mt-1 whitespace-pre-wrap">
                                    {result.message}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    {result.success && result.details && (
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="flex flex-col items-center p-3 rounded-lg bg-background">
                                    <p className="text-2xl font-bold text-blue-500">{result.details.courses}</p>
                                    <p className="text-xs text-muted-foreground">Courses</p>
                                </div>
                                <div className="flex flex-col items-center p-3 rounded-lg bg-background">
                                    <p className="text-2xl font-bold text-purple-500">{result.details.lessons}</p>
                                    <p className="text-xs text-muted-foreground">Lessons</p>
                                </div>
                                <div className="flex flex-col items-center p-3 rounded-lg bg-background">
                                    <p className="text-2xl font-bold text-green-500">{result.details.words}</p>
                                    <p className="text-xs text-muted-foreground">Words</p>
                                </div>
                                <div className="flex flex-col items-center p-3 rounded-lg bg-background">
                                    <p className="text-2xl font-bold text-orange-500">{result.details.skipped}</p>
                                    <p className="text-xs text-muted-foreground">Skipped</p>
                                </div>
                            </div>
                        </CardContent>
                    )}
                    {!result.success && result.technicalDetails && (
                        <CardContent>
                            <details className="text-xs">
                                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                    Technical details
                                </summary>
                                <pre className="mt-2 p-2 rounded bg-background text-xs overflow-x-auto">
                                    {result.technicalDetails}
                                </pre>
                            </details>
                        </CardContent>
                    )}
                </Card>
            )}

            <Card className="bg-blue-500/5 border-blue-500/20">
                <CardHeader>
                    <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                            <CardTitle className="text-base">How to export from Anki</CardTitle>
                            <CardDescription className="mt-1.5 space-y-1">
                                <p>1. Open Anki Desktop</p>
                                <p>2. Select the deck you want to export</p>
                                <p>3. Click <strong>File → Export</strong></p>
                                <p>4. Export format: <strong>Anki Deck Package (*.apkg)</strong></p>
                                <p>5. Uncheck "Include scheduling information"</p>
                                <p>6. Click <strong>Export</strong> and select a location</p>
                                <p>7. Upload the .apkg file here</p>
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>
        </div>
    );
}
