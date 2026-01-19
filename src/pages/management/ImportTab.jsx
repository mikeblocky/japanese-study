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
    const [includeMedia, setIncludeMedia] = useState(false);

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
            formData.append('skipMedia', includeMedia ? 'false' : 'true');
            formData.append('textOnly', includeMedia ? 'false' : 'true');
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
            const input = document.getElementById('anki-file');
            if (input) input.value = '';
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

                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField label="Include media" id="include-media">
                                <div className="flex items-center justify-between rounded-md border px-3 py-2 bg-background">
                                    <div className="text-sm text-muted-foreground">Images & audio (slower)</div>
                                    <Switch
                                        id="include-media"
                                        checked={includeMedia}
                                        onCheckedChange={setIncludeMedia}
                                        disabled={importing}
                                    />
                                </div>
                            </FormField>
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
                            <div className="flex items-center gap-2">
                                <Info className="h-3.5 w-3.5" />
                                Media adds size but is required for audio/images.
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

                    <Card className="border border-amber-300/60 bg-amber-50/60">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-amber-700 text-base">
                                <AlertCircle className="h-5 w-5" /> Media persistence warning
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-amber-800 space-y-2">
                            <p>On Render, media stored on the local disk disappears after restart. Use a persistent disk or re-import with media each deploy.</p>
                            <p className="text-xs text-amber-700/90">If you imported without media, images/audio will not be visible or playable. If you imported with media and see 404s or missing playback after a restart, re-import the deck with media and ensure storage is persistent.</p>
                            <p className="text-xs text-amber-700/90">Audio/video playback requires media to be included; text-only imports will show words but no media assets.</p>
                        </CardContent>
                    </Card>

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
                                    <li>Check “Include media”</li>
                                </ol>
                            </div>
                            <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs">
                                Large decks with media can take a few minutes; keep the tab open until done.
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
