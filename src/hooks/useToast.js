import { useContext } from 'react';
import { ToastContext } from '@/contexts/ToastContext';

/**
 * Custom hook for showing toast notifications
 * Replaces alert() with better UX
 * 
 * @example
 * const toast = useToast();
 * toast.success('Course created!');
 * toast.error('Failed to save');
 */
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        // Fallback to console if ToastProvider not in tree
        return {
            success: (msg) => console.log('✓', msg),
            error: (msg) => console.error('✗', msg),
            info: (msg) => console.info('ℹ', msg),
            warning: (msg) => console.warn('⚠', msg),
        };
    }
    return context;
}
