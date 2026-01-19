import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, FileText, Info, Shield } from 'lucide-react';
import api from '@/lib/api';
import { useCourses } from '@/hooks/useCourses';
import { useToast } from '@/hooks/useToast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, PageHeader, FormField } from '@/components/management/SharedComponents';

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

        // Check file size (max 200MB for media imports)
        const maxSize = 200 * 1024 * 1024;
        if (ankiFile.size > maxSize) {
            setResult({
                success: false,
                message: 'File is too large. Maximum file size is 200MB. Try exporting a smaller deck.'
            });
            return;
        }

        try {
            setImporting(true);
            setResult(null);
            setProgress('Uploading file...');

            const formData = new FormData();
            formData.append('file', ankiFile);
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
                message += `. Skipped ${skippedCount} item${skippedCount !== 1 ? 's' : ''}.`;
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
            const input = document.getElementById('anki-file');
            if (input) input.value = '';
            loadCourses();
            toast.success('Import successful!');
        } catch (err) {

            const errorMap = {
                'ECONNABORTED': 'Import timed out. Render free tier may be sleeping. Try again in 1-2 minutes.',
                500: 'Server error. Backend may be starting up (Render free tier takes 1-2 min). Wait and retry.',
                413: 'File too large. Try a smaller deck.',
                400: err.response?.data?.message || 'Invalid deck format.',
                403: 'Access denied. Admin privileges required.',
                'Network Error': 'Network error. Backend may be down or restarting. Retry shortly.'
            };

            let errorMessage = 'Failed to import Anki deck. ';
            const errorKey = err.code || err.response?.status || (err.message?.includes('Network') ? 'Network Error' : null);
            errorMessage += errorMap[errorKey] || err.response?.data?.message || err.message || 'Unknown error.';

            setResult({
                success: false,
                message: errorMessage,
                technicalDetails: err.response?.data?.error || err.message || 'Unknown error'
            });

            toast.error('Import failed');
        } finally {
            setImporting(false);
            setProgress(null);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Deck import"
                subtitle="Upload an Anki .apkg to generate courses, lessons, and vocabulary automatically."
            />

            <div className="grid gap-6 xl:grid-cols-[440px_1fr]">
                <Card className="h-fit border-primary/40">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Upload deck</CardTitle>
                        <CardDescription>Select an .apkg file (max 200MB). Keep this tab open while it processes.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors bg-muted/10">
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
                                className={`flex flex-col items-center justify-center px-6 py-8 text-center cursor-pointer ${importing ? 'opacity-60 pointer-events-none' : ''}`}
                            >
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
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
                            <div className="space-y-1">
                                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                                    <div className="h-full bg-primary animate-pulse" style={{ width: '100%' }} />
                                </div>
                                <p className="text-xs text-muted-foreground">{progress}</p>
                            </div>
                        )}

                        <div className="grid gap-4">
                            <FormField label="Visibility" id="visibility">
                                <Select
                                    value={visibility}
                                    onChange={setVisibility}
                                    options={[
                                        { value: 'PRIVATE', label: 'Private (only you)' },
                                        { value: 'PUBLIC', label: 'Public' },
                                    ]}
                                    placeholder="Choose visibility"
                                    disabled={importing}
                                />
                            </FormField>
                        </div>

                        <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Shield className="h-3.5 w-3.5" />
                                Decks stay private by default; flip to Public if you want to share.
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                                onClick={handleImport}
                                disabled={!ankiFile || importing}
                                className="flex-1"
                                size="lg"
                            >
                                {importing ? 'Importing...' : 'Start import'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setAnkiFile(null);
                                    const input = document.getElementById('anki-file');
                                    if (input) input.value = '';
                                }}
                                disabled={importing}
                                className="sm:w-32"
                            >
                                Clear
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-4">
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
                                            {result.success ? 'Import complete' : 'Import failed'}
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



                    <Card className="bg-secondary/20 border-none">
                        <CardHeader>
                            <div className="flex items-center gap-2 text-primary">
                                <Info className="h-5 w-5" />
                                <CardTitle className="text-lg">Export guide</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="space-y-1">
                                <h4 className="font-medium text-foreground">From Anki Desktop:</h4>
                                <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-1">
                                    <li>Deck gear → Export</li>
                                    <li>Format: Anki Deck Package (*.apkg)</li>
                                    <li>Uncheck “Include scheduling information”</li>
                                </ol>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
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
