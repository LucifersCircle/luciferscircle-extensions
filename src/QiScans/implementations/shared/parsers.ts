import { QIScansPost, sanitizeId } from "./models";

// cache: mangaId (sanitized slug) -> full QIScansPost
const postCache: Record<string, QIScansPost> = {};
const MAX_CACHE_SIZE = 500;
const cacheKeys: string[] = [];

export function cachePostFromSearch(
    post: QIScansPost,
    keyOverride?: string,
): void {
    const key = keyOverride ?? sanitizeId(post.slug);

    // remove oldest entry if cache is full
    if (cacheKeys.length >= MAX_CACHE_SIZE && !postCache[key]) {
        const oldestKey = cacheKeys.shift();
        if (oldestKey) delete postCache[oldestKey];
    }

    postCache[key] = post;

    if (!cacheKeys.includes(key)) cacheKeys.push(key);
}

export function getCachedPostById(idOrSlug: string): QIScansPost | undefined {
    return postCache[idOrSlug] || postCache[sanitizeId(idOrSlug)];
}
