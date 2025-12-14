import { X, Check, Edit2, Trash2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Reusable form card wrapper with header and close button.
 */
export function FormCard({ title, onClose, children, onSubmit, submitLabel = 'Add', isEditing = false }) {
    return (
        <Card className="border-primary">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>{isEditing ? `Edit ${title}` : `Add new ${title}`}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {children}
                <div className="flex gap-2 pt-2">
                    <Button onClick={onSubmit} className="flex-1">
                        <Check className="mr-2 h-4 w-4" />
                        {isEditing ? 'Update' : submitLabel}
                    </Button>
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Cancel
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Empty state placeholder with icon and optional action button.
 */
export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
    return (
        <Card>
            <CardContent className="p-12 text-center">
                <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-muted-foreground mb-4">{description}</p>
                {actionLabel && onAction && (
                    <Button onClick={onAction}>
                        <Plus className="mr-2 h-4 w-4" />
                        {actionLabel}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Inline action buttons (edit/delete) with loading state.
 */
export function ActionButtons({ onEdit, onDelete, isDeleting = false }) {
    return (
        <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0">
                <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                disabled={isDeleting}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
                {isDeleting ? (
                    <div className="h-3.5 w-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                )}
            </Button>
        </div>
    );
}

/**
 * Form field with label - reduces repetitive markup.
 */
export function FormField({ label, id, children, required = false }) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}{required && ' *'}</Label>
            {children}
        </div>
    );
}

/**
 * Select dropdown styled consistently.
 */
export function Select({ value, onChange, options, placeholder, disabled = false, className = '' }) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`w-full h-10 px-3 rounded-md border border-input bg-background disabled:opacity-50 ${className}`}
        >
            <option value="">{placeholder}</option>
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    );
}

/**
 * Page header with title and optional action.
 */
export function PageHeader({ title, subtitle, action }) {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 className="text-xl font-semibold">{title}</h2>
                {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            {action}
        </div>
    );
}
