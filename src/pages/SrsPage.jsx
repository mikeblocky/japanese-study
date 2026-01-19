import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock4, Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageShell, PageHeader } from '@/components/ui/page';

export default function SrsPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await api.get('/progress/studied');
                setItems(res.data || []);
            } catch (err) {
                const msg = err.response?.data?.message || err.message || 'Failed to load SRS items';
                setError(msg);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const { studiedCount, dueSoon } = useMemo(() => {
        const studied = items.length;
        const soon = items.filter(i => i.nextReviewDate && new Date(i.nextReviewDate) <= new Date(Date.now() + 48 * 3600 * 1000)).length;
        return { studiedCount: studied, dueSoon: soon };
    }, [items]);

    return (
        <PageShell>
            <PageHeader
                title="SRS Library"
                description="All words you've studied with their current spaced-repetition intervals."
                className="mb-6"
            >
                <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant="outline" className="gap-2"><Clock4 className="h-4 w-4" /> {studiedCount} words</Badge>
                    <Badge variant="secondary" className="gap-2">{dueSoon} due within 48h</Badge>
                </div>
            </PageHeader>

            <Card className="shadow-sm border-border/60">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        <CardTitle>Studied words</CardTitle>
                    </div>
                    <CardDescription>
                        {loading ? 'Loading your SRS data...' : `${studiedCount} total · ${dueSoon} due soon (<48h)`}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading && (
                        <div className="flex items-center gap-2 px-4 py-6 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                        </div>
                    )}
                    {error && !loading && (
                        <div className="flex items-center gap-2 px-4 py-4 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4" /> {error}
                        </div>
                    )}
                    {!loading && !error && items.length === 0 && (
                        <div className="px-4 py-6 text-sm text-muted-foreground">No studied items yet.</div>
                    )}
                    {!loading && !error && items.length > 0 && (
                        <div className="divide-y divide-border">
                            {items.map(item => (
                                <div key={item.id} className="px-4 py-3 grid gap-2 md:grid-cols-[2fr_1.5fr_1fr] items-start">
                                    <div>
                                        <div className="text-base font-semibold text-foreground">{item.primaryText}</div>
                                        <div className="text-sm text-muted-foreground">{item.secondaryText}</div>
                                    </div>
                                    <div className="text-sm text-foreground/90">{item.meaning}</div>
                                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                        <Badge variant="outline">Interval: {item.interval ?? 0}</Badge>
                                        {item.nextReviewDate && (
                                            <Badge variant="secondary">Due {new Date(item.nextReviewDate).toLocaleDateString()}</Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </PageShell>
    );
}
