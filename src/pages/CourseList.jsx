import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import api from '@/lib/api';

export default function CourseList() {
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        api.get('/courses')
            .then(res => setCourses(res.data))
            .catch(err => console.error("Failed to fetch courses", err));
    }, []);

    return (
        <div className="max-w-5xl mx-auto space-y-12">
            <div className="border-b pb-6">
                <h1 className="text-4xl font-light tracking-tight">Courses</h1>
            </div>

            <div className="space-y-4">
                {courses.map((course, i) => (
                    <Link
                        key={course.id}
                        to={`/courses/${course.id}`}
                        className="group flex items-center justify-between py-8 border-b border-border/50 hover:bg-secondary/20 transition-colors px-4 -mx-4 rounded-xl"
                    >
                        <div className="space-y-2">
                            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Level {i === 0 ? 'N5' : 'N4'}</span>
                            <h3 className="text-3xl font-medium group-hover:opacity-70 transition-opacity">{course.title}</h3>
                            <p className="text-muted-foreground max-w-xl">{course.description}</p>
                        </div>

                        <ArrowUpRight className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Link>
                ))}
            </div>
        </div>
    );
}


