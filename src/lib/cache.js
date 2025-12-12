const now = () => Date.now();

export function loadCachedJson(key) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function saveCachedJson(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // ignore quota / private mode
    }
}

export function getCachedWithTtl(key, ttlMs) {
    const payload = loadCachedJson(key);
    if (!payload || typeof payload !== 'object') return { hit: false, value: null, stale: true };

    const { t, v } = payload;
    if (typeof t !== 'number') return { hit: false, value: null, stale: true };

    const age = now() - t;
    const stale = age > ttlMs;
    return { hit: true, value: v ?? null, stale };
}

export async function fetchJsonWithCache({
    key,
    ttlMs,
    fetcher,
    onCached,
}) {
    const cached = getCachedWithTtl(key, ttlMs);
    if (cached.hit && cached.value != null) {
        onCached?.(cached.value, { stale: cached.stale });
        if (!cached.stale) return cached.value;
    }

    const fresh = await fetcher();
    saveCachedJson(key, { t: now(), v: fresh });
    return fresh;
}
