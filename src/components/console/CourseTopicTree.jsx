import { ChevronRight, Search, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Mobile-friendly course/topic filter sidebar for WordConsole.
 */
export default function CourseTopicTree({
    courses = [],
    coursesLoading,
    selectedCourse,
    selectedTopic,
    expandedCourses = {},
    searchQuery = '',
    mobileFiltersOpen,
    onSearchChange,
    onSelectCourse,
    onSelectTopic,
    onToggleCourse,
    onCloseMobile
}) {
    // Safe courses array
    const safeCourses = Array.isArray(courses) ? courses : [];

    return (
        <>
            {/* Mobile overlay */}
            {mobileFiltersOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onCloseMobile}
                />
            )}

            <aside className={cn(
                "fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl border-t shadow-2xl",
                "md:relative md:bottom-auto md:w-64 md:bg-transparent md:shadow-none md:border md:rounded-xl",
                "transition-transform duration-300 ease-out",
                mobileFiltersOpen ? "translate-y-0" : "translate-y-full md:translate-y-0"
            )}>
                {/* Mobile header */}
                <div className="flex items-center justify-between p-4 border-b md:hidden">
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        <span className="font-semibold">Filters</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onCloseMobile}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="p-4 max-h-[70vh] overflow-y-auto md:max-h-[calc(100vh-200px)]">
                    {/* Search */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Search words..."
                            className="pl-9 h-10"
                        />
                    </div>

                    {/* All courses button */}
                    <Button
                        variant={selectedCourse === 'all' ? "secondary" : "ghost"}
                        onClick={() => { onSelectCourse('all'); onCloseMobile?.(); }}
                        className="w-full justify-start mb-3 h-10"
                    >
                        All courses
                    </Button>

                    <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                        Courses
                    </div>

                    {/* Courses list */}
                    {coursesLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-10 w-full rounded-lg" />
                            ))}
                        </div>
                    ) : safeCourses.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No courses available
                        </p>
                    ) : (
                        <div className="space-y-1">
                            {safeCourses.map(course => {
                                const topics = Array.isArray(course.topics) ? course.topics : [];
                                const isExpanded = expandedCourses[course.id];
                                const isSelected = String(selectedCourse) === String(course.id) && selectedTopic === 'all';

                                return (
                                    <div key={course.id} className="space-y-1">
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onToggleCourse(course.id)}
                                                className="h-9 w-9 p-0 shrink-0"
                                                disabled={topics.length === 0}
                                            >
                                                <ChevronRight className={cn(
                                                    "h-4 w-4 transition-transform",
                                                    isExpanded && "rotate-90",
                                                    topics.length === 0 && "opacity-30"
                                                )} />
                                            </Button>
                                            <Button
                                                variant={isSelected ? "secondary" : "ghost"}
                                                onClick={() => { onSelectCourse(course.id); onCloseMobile?.(); }}
                                                className="flex-1 justify-start h-9 px-2 text-sm truncate"
                                            >
                                                <span className="truncate">{course.title}</span>
                                                {topics.length > 0 && (
                                                    <span className="ml-auto text-xs text-muted-foreground">
                                                        {topics.length}
                                                    </span>
                                                )}
                                            </Button>
                                        </div>

                                        {isExpanded && topics.length > 0 && (
                                            <div className="ml-5 pl-3 border-l-2 border-border/60 space-y-1">
                                                {topics.map(topic => {
                                                    const isTopicSelected = String(selectedTopic) === String(topic.id);
                                                    return (
                                                        <Button
                                                            key={topic.id}
                                                            variant={isTopicSelected ? "secondary" : "ghost"}
                                                            onClick={(e) => { onSelectTopic(topic.id, course.id, e); onCloseMobile?.(); }}
                                                            className="w-full justify-start h-8 px-2 text-xs"
                                                        >
                                                            <span className="truncate">{topic.title}</span>
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
