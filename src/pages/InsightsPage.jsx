import { useEffect, useMemo, useState } from 'react';
import {
    Activity,
    AlertCircle,
    ArrowUpRight,
    BarChart3,
    BookOpenCheck,
    Clock4,
    ListChecks,
    RefreshCw,
    Sparkles,
    TimerReset
} from 'lucide-react';
import { PageShell, PageHeader } from '@/components/ui/page';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useInsights } from '@/hooks/useInsights';

const fmt = new Intl.NumberFormat('en-US');

export default function InsightsPage() {
    const { data, loading, error, loadInsights } = useInsights();
    const [graphDays, setGraphDays] = useState(30);

    useEffect(() => {
        loadInsights();
    }, [loadInsights]);

    const dailySeries = data?.last30Days || [];
    const rangeSeries = useMemo(() => {
        const take = Math.min(graphDays, dailySeries.length || graphDays);
        return dailySeries.slice(Math.max(dailySeries.length - take, 0));
    }, [dailySeries, graphDays]);
    const maxDaily = useMemo(() => Math.max(1, ...rangeSeries.map(d => d.studiedCount || 0)), [rangeSeries]);

    const totalWords = data?.totalWords ?? 0;
    const studiedWords = data?.studiedWords ?? 0;
    const dueForReview = data?.dueForReview ?? 0;
    const mastered = Math.max(studiedWords - dueForReview, 0);
    const backlog = Math.max(totalWords - studiedWords, 0);
    const ringTotal = Math.max(1, mastered + dueForReview + backlog);

    const ringSegments = [
        { label: 'Due soon', value: dueForReview, color: '#f97316' },
        { label: 'Reviewed', value: mastered, color: '#10b981' },
        { label: 'Unseen', value: backlog, color: '#94a3b8' }
    ];

    const studiedRange = rangeSeries.reduce((sum, p) => sum + (p.studiedCount || 0), 0);
    const sparkWidth = Math.max(260, rangeSeries.length * 12);
    const sparkHeight = 140;
    const sparkPoints = rangeSeries.map((point, idx) => {
        const x = rangeSeries.length <= 1
            ? sparkWidth / 2
            : (idx / (rangeSeries.length - 1)) * sparkWidth;
        const y = sparkHeight - 10 - ((point.studiedCount || 0) / maxDaily) * (sparkHeight - 30);
        return { x, y, value: point.studiedCount };
    });

    const areaPath = sparkPoints.length
        ? [
            `M 0 ${sparkHeight}`,
            ...sparkPoints.map(p => `L ${p.x} ${p.y}`),
            `L ${sparkWidth} ${sparkHeight}`,
            'Z'
        ].join(' ')
        : '';

    const linePath = sparkPoints.length
        ? sparkPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
        : '';

    const sparkStartLabel = rangeSeries.length ? rangeSeries[0].date : '';
    const sparkEndLabel = rangeSeries.length ? rangeSeries[rangeSeries.length - 1].date : '';

    const ringStyle = () => {
        let start = 0;
        const stops = ringSegments.map(seg => {
            const deg = (seg.value / ringTotal) * 360;
            const end = start + deg;
            const tuple = `${seg.color} ${start}deg ${end}deg`;
            start = end;
            return tuple;
        });
        return { background: `conic-gradient(${stops.join(', ')})` };
    };

    const primaryStats = [
        {
            label: 'Courses',
            value: data?.totalCourses ?? 0,
            hint: 'Active containers',
            accent: 'bg-emerald-500/15 text-emerald-600'
        },
        {
            label: 'Lessons',
            value: data?.totalLessons ?? 0,
            hint: 'Units in courses',
            accent: 'bg-blue-500/15 text-blue-600'
        },
        {
            label: 'Words',
            value: data?.totalWords ?? 0,
            hint: 'Schedulable vocab',
            accent: 'bg-orange-500/15 text-orange-600'
        },
        {
            label: 'Studied words',
            value: data?.studiedWords ?? 0,
            hint: 'Touched at least once',
            accent: 'bg-indigo-500/15 text-indigo-600'
        },
    ];

    return (
        <PageShell className="pb-16">
            <div className="max-w-6xl mx-auto space-y-8">

                <div className="space-y-3">
                    <PageHeader
                        title="Insights"
                        subtitle="Operational view of your courses, lessons, and study momentum."
                        action={
                            <Button variant="outline" size="sm" onClick={() => loadInsights()} disabled={loading} className="gap-2">
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        }
                    />
                    <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
                        <div className="flex flex-col md:flex-row md:items-center justify-between px-6 py-5 gap-4">
                            <div className="space-y-1">
                                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/80">
                                    <Sparkles className="h-4 w-4" /> Management radar
                                </div>
                                <p className="text-lg text-white/80">High-signal metrics and recent movements across your workspace.</p>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-white/80">
                                <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                                    <Clock4 className="h-4 w-4" />
                                    <span>Rolling 30 days</span>
                                </div>
                                <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                                    <BarChart3 className="h-4 w-4" />
                                    <span>Per-course progress</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <Card className="border-destructive/30 bg-destructive/5">
                        <CardHeader className="flex flex-row items-center gap-2 pb-2">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                            <CardTitle className="text-destructive">{error}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-sm text-destructive/90">
                            Try refreshing, or verify the backend is running.
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 items-stretch">
                    {primaryStats.map((stat) => (
                        <Card key={stat.label} className="border-border/70 h-full bg-gradient-to-br from-background to-muted/40">
                            <div className="flex h-full flex-col items-center justify-center gap-2 py-5 text-center">
                                <div className="text-sm font-semibold text-muted-foreground">{stat.label}</div>
                                <div className="text-4xl font-bold tracking-tight leading-none">{loading ? '—' : fmt.format(stat.value)}</div>
                                <Badge variant="secondary" className={`${stat.accent} border-0 text-[11px] px-3 py-1`}>{stat.hint}</Badge>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] items-start">
                    <Card className="border-border/70 shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <BarChart3 className="h-5 w-5 text-primary" /> Course breakdown
                                    </CardTitle>
                                    <CardDescription>Progress and density by course. Sorted by word count.</CardDescription>
                                </div>
                                <Badge variant="outline" className="text-[11px]">
                                    Avg progress {Math.round(data?.avgCourseProgress ?? 0)}%
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="p-6 text-sm text-muted-foreground">Loading…</div>
                            ) : (data?.courseInsights?.length ? (
                                <div className="divide-y">
                                    {data.courseInsights.map((course) => (
                                        <div key={course.id} className="px-5 py-4 flex flex-col gap-3 hover:bg-accent/40 transition">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <BookOpenCheck className="h-4 w-4 text-primary" />
                                                        <span className="font-semibold text-foreground/90">{course.title}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                        <Badge variant="outline">{course.lessons} lessons</Badge>
                                                        <Badge variant="secondary">{course.words} words</Badge>
                                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700">
                                                            {Math.round(course.progressPercent)}% learned
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="text-right text-xs text-muted-foreground">
                                                    <div>Updated {course.updatedAt ? new Date(course.updatedAt).toLocaleDateString() : '—'}</div>
                                                </div>
                                            </div>
                                            <div className="h-2 rounded-full bg-secondary overflow-hidden">
                                                <div
                                                    className="h-full bg-primary"
                                                    style={{ width: `${Math.min(100, Math.round(course.progressPercent || 0))}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 text-sm text-muted-foreground">No courses found.</div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-border/70 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <TimerReset className="h-5 w-5 text-primary" /> SRS status
                            </CardTitle>
                            <CardDescription>Pending reviews and recent activity.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-[1.1fr_auto] items-center">
                                <div className="rounded-xl border bg-muted/40 p-4 flex flex-col items-center text-center gap-2 h-full">
                                    <p className="text-sm font-semibold text-muted-foreground">Due within 48h</p>
                                    <p className="text-4xl font-bold leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>{loading ? '—' : fmt.format(dueForReview)}</p>
                                    <p className="text-xs text-muted-foreground">of {fmt.format(studiedWords)} studied / {fmt.format(totalWords)} total</p>
                                    <Badge variant="secondary" className="gap-2 mt-1">
                                        <Clock4 className="h-4 w-4" /> Next 48h
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-6 justify-center">
                                    <div className="relative h-32 w-32 flex items-center justify-center shrink-0 self-center">
                                        <div className="absolute inset-0 rounded-full" style={ringStyle()}></div>
                                        <div className="absolute inset-4 rounded-full bg-background border border-border/70"></div>
                                        <div className="relative text-center leading-tight">
                                            <div className="text-2xl font-bold">{loading ? '—' : Math.round((mastered / ringTotal) * 100)}%</div>
                                            <div className="text-[11px] text-muted-foreground">Mastered</div>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm min-w-[140px]">
                                        {ringSegments.map(seg => (
                                            <div key={seg.label} className="flex items-center gap-2 justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
                                                    <span className="text-muted-foreground">{seg.label}</span>
                                                </div>
                                                <span className="font-semibold w-10 text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>{loading ? '—' : fmt.format(seg.value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <Separator />
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Activity className="h-4 w-4" /> Last {graphDays} days
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-xs text-muted-foreground">{fmt.format(studiedRange)} studied</div>
                                        <div className="flex rounded-lg border bg-muted/60 overflow-hidden">
                                            {[30, 14, 7].map(days => (
                                                <button
                                                    key={days}
                                                    type="button"
                                                    onClick={() => setGraphDays(days)}
                                                    className={`px-3 py-1 text-xs font-semibold transition ${graphDays === days ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'}`}
                                                >
                                                    {days}d
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full">
                                    {sparkPoints.length ? (
                                        <svg
                                            viewBox={`0 0 ${sparkWidth} ${sparkHeight}`}
                                            className="w-full h-40"
                                            preserveAspectRatio="none"
                                        >
                                            <defs>
                                                <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
                                                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
                                                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                            <path d={areaPath} fill="url(#sparkFill)" />
                                            <path d={linePath} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" />
                                            {sparkPoints.map((p, idx) => (
                                                <circle key={idx} cx={p.x} cy={p.y} r={3} fill="hsl(var(--primary))" />
                                            ))}
                                        </svg>
                                    ) : (
                                        <div className="text-sm text-muted-foreground">No study activity in the last 30 days.</div>
                                    )}
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{sparkStartLabel}</span>
                                    <span>{sparkEndLabel}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-border/70">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <ListChecks className="h-5 w-5 text-primary" /> Recent changes
                        </CardTitle>
                        <CardDescription>Audit events across courses, lessons, and words.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
                        ) : (data?.recentActivity?.length ? (
                            <div className="divide-y">
                                {data.recentActivity.map((log, idx) => (
                                    <div key={`${log.createdAt}-${idx}`} className="px-5 py-4 flex items-center justify-between gap-3 hover:bg-accent/30 transition">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap text-sm">
                                                <Badge variant="outline" className="uppercase tracking-wide text-[11px]">
                                                    {log.entityType}
                                                </Badge>
                                                {log.entityId && (
                                                    <Badge variant="outline" className="text-[11px]">ID #{log.entityId}</Badge>
                                                )}
                                                <Badge variant="secondary" className="text-xs">{log.action}</Badge>
                                                {log.actorUserId && (
                                                    <Badge variant="outline" className="text-[11px]">User {log.actorUserId}</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-foreground/90">{log.details || 'No details provided'}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                                            </p>
                                        </div>
                                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 text-sm text-muted-foreground">No activity yet.</div>
                        ))}
                    </CardContent>
                </Card>

            </div>
        </PageShell>
    );
}
