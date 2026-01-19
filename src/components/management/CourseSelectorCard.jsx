import { FolderOpen, ShieldAlert, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CourseSelectorCard({
    courses,
    selectedCourse,
    onCourseSelect,
    user,
    showChevron = false,
    compact = false
}) {
    return (
        <Card className="h-full">
            <CardHeader className="p-4 border-b">
                <CardTitle className="text-base">Courses</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {courses.length === 0 ? (
                    <div className="p-6 text-sm text-muted-foreground text-center">
                        No courses available.{!compact && ' Create a course first.'}
                    </div>
                ) : (
                    <div className="divide-y">
                        {courses.map(course => {
                            const active = selectedCourse?.id === course.id;
                            const owner = course.ownerId == null || course.ownerId === user?.uid;
                            return (
                                <button
                                    key={course.id}
                                    onClick={() => onCourseSelect(course)}
                                    className={`w-full px-4 py-3 flex items-start justify-between gap-3 text-left transition ${active ? 'bg-secondary/60' : 'hover:bg-secondary/40'
                                        }`}
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <FolderOpen className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium leading-tight">{course.title}</span>
                                        </div>
                                        {!compact && course.category && (
                                            <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                                        )}
                                        {!compact && course.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {course.description}
                                            </p>
                                        )}
                                        {!compact && (
                                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                {course.category && <Badge variant="secondary">{course.category}</Badge>}
                                                {(course.minLevel || course.maxLevel) && (
                                                    <Badge variant="outline">
                                                        {course.minLevel || 'N/A'} – {course.maxLevel || 'N/A'}
                                                    </Badge>
                                                )}
                                                {course.difficulty && <Badge variant="outline">{course.difficulty}/5</Badge>}
                                            </div>
                                        )}
                                    </div>
                                    {showChevron ? (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                    ) : (
                                        !owner && <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
