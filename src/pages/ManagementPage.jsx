import { useState } from 'react';
import { BookOpen, List, Upload, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageShell, PageHeader } from '@/components/ui/page';
import CoursesTab from './management/CoursesTab';
import LessonsTab from './management/LessonsTab';
import QuickAddTab from './management/QuickAddTab';
import ImportTab from './management/ImportTab';

export default function ManagementPage() {
    const [activeTab, setActiveTab] = useState('courses');

    const tabs = [
        { id: 'courses', label: 'Courses', icon: BookOpen, component: CoursesTab },
        { id: 'lessons', label: 'Lessons', icon: List, component: LessonsTab },
        { id: 'words', label: 'Quick Add', icon: FileText, component: QuickAddTab },
        { id: 'import', label: 'Import', icon: Upload, component: ImportTab },
    ];

    const ActiveComponent = tabs.find(t => t.id === activeTab)?.component;

    return (
        <PageShell>
            <PageHeader
                title="Management"
                description="Manage courses, lessons, and import content"
            />

            {/* Tab Navigation */}
            <div className="flex gap-1 sm:gap-2 mb-6 border-b overflow-x-auto">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium border-b-2 transition-colors whitespace-nowrap",
                                activeTab === tab.id
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            <span className="hidden xs:inline sm:inline">{tab.label}</span>
                            <span className="xs:hidden sm:hidden">{tab.label.split(' ')[0]}</span>
                        </button>
                    );
                })}
            </div>

            {/* Active Tab Content */}
            {ActiveComponent && <ActiveComponent />}
        </PageShell>
    );
}
