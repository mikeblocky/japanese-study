import { Edit2, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Table displaying vocabulary items with pagination.
 */
export default function ItemTable({
    items,
    loading,
    showEmptyState,
    currentPage,
    totalPages,
    onPageChange,
    onEditItem,
    onDeleteItem
}) {
    if (loading) {
        return (
            <Card>
                <CardContent className="p-6 space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex gap-4">
                            <Skeleton className="h-4 w-1/4" />
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-4 w-1/6" />
                            <Skeleton className="h-4 w-1/6" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (showEmptyState) {
        return (
            <Card>
                <CardContent className="p-12 text-center">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Select a course or topic</h3>
                    <p className="text-muted-foreground">Choose from the sidebar to view vocabulary items</p>
                </CardContent>
            </Card>
        );
    }

    if (items.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    No items match your search.
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-secondary/40">
                            <tr className="border-b">
                                <th className="px-3 sm:px-4 py-3 text-left font-semibold text-foreground">Term</th>
                                <th className="px-3 sm:px-4 py-3 text-left font-semibold text-foreground">Meaning</th>
                                <th className="px-3 sm:px-4 py-3 text-left font-semibold text-foreground hidden md:table-cell">Course</th>
                                <th className="px-3 sm:px-4 py-3 text-left font-semibold text-foreground hidden lg:table-cell">Topic</th>
                                <th className="px-3 sm:px-4 py-3 text-right font-semibold text-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {items.map(item => (
                                <tr key={item.id} className="hover:bg-secondary/40 transition-colors">
                                    <td className="px-3 sm:px-4 py-3 font-medium">{item.primaryText}</td>
                                    <td className="px-3 sm:px-4 py-3 text-muted-foreground">{item.meaning}</td>
                                    <td className="px-3 sm:px-4 py-3 text-muted-foreground hidden md:table-cell">
                                        <Badge variant="outline" className="text-xs">{item.courseTitle}</Badge>
                                    </td>
                                    <td className="px-3 sm:px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                                        {item.topicTitle}
                                    </td>
                                    <td className="px-3 sm:px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onEditItem(item)}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onDeleteItem(item.id)}
                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                    <Button
                        variant="outline"
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="w-full sm:w-auto"
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="w-full sm:w-auto"
                    >
                        Next
                    </Button>
                </div>
            )}
        </>
    );
}
