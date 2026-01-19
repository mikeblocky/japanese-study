import { useState } from 'react';
import { BookOpen, List, Upload, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageShell, PageHeader } from '@/components/ui/page';
import { buttonVariants } from '@/components/ui/button';
import CoursesTab from './management/CoursesTab';
import LessonsTab from './management/LessonsTab';
import VocabularyTab from './management/VocabularyTab';
import ImportTab from './management/ImportTab';

export default function ManagementPage() {
    const [activeTab, setActiveTab] = useState('courses');

    const tabs = [
        { id: 'courses', label: 'Courses', icon: BookOpen, component: CoursesTab },
        { id: 'lessons', label: 'Lessons', icon: List, component: LessonsTab },
        { id: 'vocabulary', label: 'Vocabulary', icon: FileText, component: VocabularyTab },
        { id: 'import', label: 'Import', icon: Upload, component: ImportTab },
    ];

    const ActiveComponent = tabs.find(t => t.id === activeTab)?.component;

    return (
        <PageShell>
            <PageHeader
                title="Management"
                description="Courses, lessons, vocabulary, and imports in one place."
            />

            <div className="mb-6 overflow-x-auto">
                <div className="inline-flex rounded-lg border border-border/60 bg-muted/40 p-1 gap-1">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    buttonVariants({ variant: 'ghost', size: 'sm' }),
                                    "whitespace-nowrap gap-2 px-3",
                                    isActive && "bg-background shadow-sm border border-border/60 text-foreground",
                                    !isActive && "text-muted-foreground"
                                )}
                                data-active={isActive}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="hidden sm:inline">{tab.label}</span>
                                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {ActiveComponent && <ActiveComponent />}
        </PageShell>
    );
}
