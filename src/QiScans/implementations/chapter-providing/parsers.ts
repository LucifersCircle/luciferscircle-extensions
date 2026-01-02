import { Chapter, ChapterDetails, SourceManga } from "@paperback/types";
import { QIScansChapter, QIScansChaptersResponse } from "../shared/models";

export function parseChapterList(
    json: QIScansChaptersResponse,
    sourceManga: SourceManga,
): Chapter[] {
    const chapters: QIScansChapter[] = Array.isArray(json.post?.chapters)
        ? json.post.chapters
        : [];

    console.log(
        `[QiScans] parseChapterList: got ${chapters.length} chapters for ${sourceManga.mangaId}`,
    );

    if (chapters.length === 0) {
        console.log(
            "[QiScans] parseChapterList: no chapters found for",
            sourceManga.mangaId,
        );
        return [];
    }

    const sorted = [...chapters].sort((a, b) => {
        if (a.number !== b.number) return a.number - b.number;
        return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
    });

    const unlocked = sorted.filter((ch) => !ch.isLocked);

    const lockedCount = sorted.length - unlocked.length;
    if (lockedCount > 0) {
        console.log(
            `[QiScans] parseChapterList: filtered out ${lockedCount} locked chapters`,
        );
    }

    return unlocked.map((ch, index) => {
        //const isLocked = !!ch.isLocked;
        //const title = isLocked ? "(Locked)" : "";

        return {
            chapterId: ch.slug,
            sourceManga,
            title: "",
            chapNum: ch.number,
            volume: 0,
            volumetitle: "",
            langCode: "en",
            sortingIndex: index,
            publishDate: new Date(ch.createdAt),
        };
    });
}

export function parseChapterDetails(
    html: string,
    chapter: Chapter,
): ChapterDetails {
    // only accept real reader images under some */upload(s)/series/* path
    // this catches:
    //   - https://storage.qiscans.org//upload/series/
    //   - https://storage.qiscans.com/upload/series/
    //   - https://cdn.qiscans.org/public/upload/series/
    //   - https://media.quantumscans.org/file/.../uploads/series/
    //
    // and *excludes* things like:
    //   - https://qiscans.org/wp-content/uploads/
    //
    // allows spaces in the filename (e.g. "BA_Chapter 8_01.webp")
    // only forbids quotes and backslashes now, not whitespace
    const pageRegex =
        /https?:\/\/[^"'\\]*?\/uploads?\/series\/[^"'\\]+?\.(?:webp|jpe?g|png)/gi;

    const rawMatches = html.match(pageRegex) ?? [];

    if (rawMatches.length === 0) {
        console.log(
            `[QiScans] parseChapterDetails: no matches for uploads/series in ` +
                `mangaId=${chapter.sourceManga.mangaId}, chapterId=${chapter.chapterId}`,
        );
        throw new Error(
            "No chapter page data could be parsed from QiScans for this chapter.",
        );
    }

    console.log(
        `[QiScans] parseChapterDetails: found ${rawMatches.length} raw image URLs ` +
            `for mangaId=${chapter.sourceManga.mangaId}, chapterId=${chapter.chapterId}`,
    );

    const normalised = rawMatches.map((u) =>
        // collapse any accidental "//" except after "http(s):"
        u.replace(/([^:])\/\/+/g, "$1/"),
    );

    // dedupe URLs
    const unique = Array.from(new Set(normalised));

    type PageEntry = {
        url: string;
        order?: number;
        sortKey?: number;
    };

    // group by "directory" (everything up to the last '/filename.ext')
    const groups = new Map<string, PageEntry[]>();

    for (const url of unique) {
        const dir = url.replace(/\/[^/?#]+(\?.*)?$/, ""); // strip filename + query
        const entry: PageEntry = { url };
        const list = groups.get(dir);
        if (list) {
            list.push(entry);
        } else {
            groups.set(dir, [entry]);
        }
    }

    if (groups.size === 0) {
        console.log(
            `[QiScans] parseChapterDetails: after grouping, no dirs for ` +
                `mangaId=${chapter.sourceManga.mangaId}, chapterId=${chapter.chapterId}`,
        );
        throw new Error(
            "No chapter page data could be parsed from QiScans for this chapter.",
        );
    }

    // debug: show directory counts
    for (const [dir, list] of groups.entries()) {
        console.log(
            `[QiScans] parseChapterDetails: dir=${dir} has ${list.length} candidate images`,
        );
    }

    // helper: fallback order from trailing number in filename (…/01.webp, …/2203.jpg, etc.)
    const getNumFromFilename = (url: string): number => {
        const m = url.match(/(\d+)\.(?:webp|jpe?g|png)(?:\?|$)/i);
        return m ? Number.parseInt(m[1], 10) : 0;
    };

    // try to read nearby `order: <n>` for each entry (per directory)
    const windowRadius = 400;

    for (const list of groups.values()) {
        for (const entry of list) {
            const idx = html.indexOf(entry.url);
            if (idx === -1) continue;

            // only look *after* the URL, to prevent grabbing an earlier image’s `"order": 0` from above
            const start = idx;
            const end = Math.min(html.length, idx + windowRadius);
            const rawSnippet = html.slice(start, end);

            // locally unescape \" → " to match "order":49
            const snippet = rawSnippet.replace(/\\"/g, '"');

            // handle both: ("order": 3) (order: 3)
            const match = snippet.match(/["']?order["']?\s*:\s*(\d+)/);

            if (!match) continue;

            const parsed = Number.parseInt(match[1], 10);
            if (!Number.isNaN(parsed)) {
                entry.order = parsed;
            }
        }
    }

    // pick the directory with the most pages – it should be the actual reader image folder
    let bestDir: string | null = null;
    let bestList: PageEntry[] | null = null;

    for (const [dir, list] of groups.entries()) {
        if (!bestList || list.length > bestList.length) {
            bestDir = dir;
            bestList = list;
        }
    }

    if (!bestDir || !bestList || bestList.length === 0) {
        console.log(
            `[QiScans] parseChapterDetails: no bestDir/bestList for ` +
                `mangaId=${chapter.sourceManga.mangaId}, chapterId=${chapter.chapterId}`,
        );
        throw new Error(
            "No chapter page data could be parsed from QiScans for this chapter.",
        );
    }

    console.log(
        `[QiScans] parseChapterDetails: chosen bestDir=${bestDir} with ${bestList.length} images ` +
            `for mangaId=${chapter.sourceManga.mangaId}, chapterId=${chapter.chapterId}`,
    );

    // compute sortKey: Prefer explicit `order`. Fallback to numeric part of filename
    for (const entry of bestList) {
        const fallbackNum = getNumFromFilename(entry.url);
        entry.sortKey = entry.order ?? fallbackNum;
    }

    const anyExplicitOrder = bestList.some((e) => e.order !== undefined);

    // debug: show first few entries before sorting
    console.log(
        `[QiScans] parseChapterDetails: first 10 before sort (hasExplicitOrder=${anyExplicitOrder})`,
    );
    bestList.slice(0, 10).forEach((e, idx) => {
        console.log(
            `[QiScans]   [${idx}] url=${e.url} order=${e.order ?? "none"} ` +
                `fallbackNum=${getNumFromFilename(e.url)} sortKey=${e.sortKey ?? "none"}`,
        );
    });

    if (anyExplicitOrder) {
        // only sort when there's *some* explicitly order values
        bestList.sort((a, b) => {
            const aKey = a.sortKey ?? 0;
            const bKey = b.sortKey ?? 0;
            if (aKey !== bKey) return aKey - bKey;
            return a.url.localeCompare(b.url);
        });

        console.log(
            `[QiScans] parseChapterDetails: applied sort by (order ?? filenameNumber) ` +
                `for mangaId=${chapter.sourceManga.mangaId}, chapterId=${chapter.chapterId}`,
        );
    } else {
        // otherwise trust the HTML order from the page
        console.log(
            `[QiScans] parseChapterDetails: no explicit 'order' fields found; ` +
                `keeping HTML discovery order for mangaId=${chapter.sourceManga.mangaId}, ` +
                `chapterId=${chapter.chapterId}`,
        );
    }

    // debug: show first few after sorting / keeping order
    console.log("[QiScans] parseChapterDetails: first 10 after sort/keep:");
    bestList.slice(0, 10).forEach((e, idx) => {
        console.log(
            `[QiScans]   [${idx}] url=${e.url} order=${e.order ?? "none"} sortKey=${
                e.sortKey ?? "none"
            }`,
        );
    });

    const pages = bestList.map((e) => e.url);

    // strip /file/qiscans/ from URLs found in HTML
    const fixedPages = pages.map((url) => {
        const fixed = url.replace("/file/qiscans/", "/");
        if (url !== fixed) {
            console.log(`[QiScans] HTML parser fixed URL: ${url} -> ${fixed}`);
        }
        return fixed;
    });

    return {
        id: chapter.chapterId,
        mangaId: chapter.sourceManga.mangaId,
        pages: fixedPages,
    };
}
