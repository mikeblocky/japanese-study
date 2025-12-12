import { useEffect, useMemo, useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

function readEnvFlag() {
    // Vite exposes only VITE_* vars.
    const raw = import.meta.env.VITE_STATIC_UI;
    if (raw === undefined || raw === null) return false;
    const v = String(raw).toLowerCase().trim();
    return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

export function useAnimationsEnabled() {
    const { settings } = useSettings();
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setPrefersReducedMotion(Boolean(media.matches));
        update();

        // Safari < 14 uses addListener/removeListener
        if (typeof media.addEventListener === 'function') {
            media.addEventListener('change', update);
            return () => media.removeEventListener('change', update);
        }

        media.addListener(update);
        return () => media.removeListener(update);
    }, []);

    const staticUiForced = useMemo(() => readEnvFlag(), []);

    // New global UI animations toggle (defaults to false in our settings).
    const uiAnimationsEnabled = settings?.uiAnimations === true;

    return uiAnimationsEnabled && !prefersReducedMotion && !staticUiForced;
}
