import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * PageShell - Main page container with consistent spacing and layout.
 */
function PageShell({ children, className, ...props }) {
    return (
        <div
            className={cn("min-h-screen pb-16 pt-8 sm:pt-10 animate-in fade-in duration-300", className)}
            {...props}
        >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
                {children}
            </div>
        </div>
    )
}

/**
 * PageHeader - Standard page header with title and description.
 */
function PageHeader({ title, description, className, children, ...props }) {
    return (
        <div className={cn("space-y-1.5 sm:space-y-3 mb-6 sm:mb-8", className)} {...props}>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
                {title}
            </h1>
            {description && (
                <p className="text-sm sm:text-lg text-muted-foreground">
                    {description}
                </p>
            )}
            {children}
        </div>
    )
}

export { PageShell, PageHeader }
