import {
    Chapter,
    ChapterDetails,
    Request,
    SourceManga,
    URL,
} from "@paperback/types";
import { QISCANS_API_BASE, QISCANS_DOMAIN } from "../main";
import { QIScansChaptersResponse } from "../models";
import { parseChapterDetails, parseChapterList } from "../parsers";
import { fetchJSON, fetchText } from "../utils";
import { MangaProvider } from "./MangaProvider";

export class ChapterProvider {
    private mangaProvider: MangaProvider;

    constructor(mangaProvider: MangaProvider) {
        this.mangaProvider = mangaProvider;
    }

    async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        const mangaId = sourceManga.mangaId;

        // ensure postId on additionalInfo
        if (
            !sourceManga.mangaInfo ||
            !sourceManga.mangaInfo.additionalInfo?.postId
        ) {
            console.log(
                `[QiScans] getChapters: fetching missing metadata for ${mangaId}`,
            );
            const updated = await this.mangaProvider.getMangaDetails(mangaId);
            sourceManga.mangaInfo = updated.mangaInfo;
        }

        const postId = sourceManga.mangaInfo?.additionalInfo?.postId;
        if (!postId) {
            throw new Error(
                `[QiScans] getChapters: missing postId for ${mangaId}`,
            );
        }

        const userId = sourceManga.mangaInfo?.additionalInfo?.userId;

        let builder = new URL(QISCANS_API_BASE)
            .addPathComponent("chapters")
            .setQueryItem("postId", postId.toString())
            .setQueryItem("skip", "0")
            .setQueryItem("take", "500")
            .setQueryItem("order", "desc")
            .setQueryItem("search", "");

        if (userId && userId.trim().length > 0) {
            builder = builder.setQueryItem("userId", userId);
        }

        const url = builder.toString();

        console.log("[QiScans] Fetching chapters:", url);

        const request: Request = { url, method: "GET" };
        const json = await fetchJSON<QIScansChaptersResponse>(request);

        return parseChapterList(json, sourceManga);
    }

    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        const sourceManga = chapter.sourceManga;

        // check locked status
        const isLocked =
            typeof chapter.title === "string" &&
            chapter.title.trim().toLowerCase().includes("(locked)");

        if (isLocked) {
            throw new Error(
                "This chapter is locked under QiScans premium (coins required to read).",
            );
        }

        const shareUrl = sourceManga.mangaInfo?.shareUrl;
        if (!shareUrl) {
            throw new Error(
                `[QiScans] Missing shareUrl for mangaId=${sourceManga.mangaId}`,
            );
        }

        const parts = shareUrl.split("/").filter(Boolean);
        const seriesSlug = parts[parts.length - 1];
        const chapterSlug = chapter.chapterId;

        const url = new URL(QISCANS_DOMAIN)
            .addPathComponent("series")
            .addPathComponent(seriesSlug)
            .addPathComponent(chapterSlug)
            .toString();

        console.log(`[QiScans] Fetching chapter page: ${url}`);
        console.log(`[QiScans] Series: "${sourceManga.mangaId}"`);
        console.log(
            `[QiScans] Chapter: ${chapter.chapNum} (${chapter.chapterId})`,
        );

        const html = await fetchText({
            url,
            method: "GET",
        });

        // regex to capture the full images array
        const jsonMatch = html.match(/"images":\s*\[([^\]]+)\]/);

        if (jsonMatch) {
            try {
                console.log(
                    `[QiScans] Raw JSON match length: ${jsonMatch[1].length} chars`,
                );

                // parse the images array from embedded JSON
                const imagesJson = `[${jsonMatch[1]}]`;
                const images = JSON.parse(imagesJson) as Array<{
                    url: string;
                    order: number;
                }>;

                console.log(`[QiScans] Parsed ${images.length} images`);

                // debug: show first few images with their order
                images.slice(0, 3).forEach((img, idx) => {
                    console.log(
                        `[QiScans] Image ${idx}: order=${img.order}, url=${img.url}`,
                    );
                });

                // sort by order and extract URLs
                const pages = images
                    .sort((a, b) => a.order - b.order)
                    .map((img) => img.url)
                    // try multiple URL fixes
                    .map((url) => {
                        let fixed = url;

                        // fix 1: remove /file/qiscans/
                        if (fixed.includes("/file/qiscans/")) {
                            fixed = fixed.replace("/file/qiscans/", "/");
                            console.log(
                                `[QiScans] Applied fix 1: removed /file/qiscans/`,
                            );
                        }

                        // fix 2: handle other potential path issues
                        // todo: more URL testing

                        if (url !== fixed) {
                            console.log(
                                `[QiScans] Fixed URL: ${url} -> ${fixed}`,
                            );
                        }
                        return fixed;
                    });

                console.log(`[QiScans] Final: ${pages.length} pages`);
                if (pages.length > 0) {
                    console.log(`[QiScans] First page: ${pages[0]}`);
                    console.log(
                        `[QiScans] Last page: ${pages[pages.length - 1]}`,
                    );
                }

                return {
                    id: chapter.chapterId,
                    mangaId: sourceManga.mangaId,
                    pages,
                };
            } catch (e) {
                const errorMsg = e instanceof Error ? e.message : String(e);
                console.log(
                    `[QiScans] Failed to parse embedded JSON: ${errorMsg}`,
                );
                console.log(
                    `[QiScans] First 500 chars of match: ${jsonMatch[1].substring(0, 500)}`,
                );
            }
        } else {
            console.log(`[QiScans] No "images": array found in HTML`);
            console.log(`[QiScans] Searching for alternative patterns...`);

            // try to find any image URLs in the HTML
            const urlMatches = html.match(
                /https:\/\/[^"'\s]+\.(?:webp|jpg|png)/g,
            );
            if (urlMatches) {
                console.log(
                    `[QiScans] Found ${urlMatches.length} image URLs in HTML`,
                );
                console.log(
                    `[QiScans] Sample URLs: ${urlMatches.slice(0, 3).join(", ")}`,
                );
            }
        }

        // fallback to HTML parsing
        console.log(`[QiScans] Falling back to HTML parsing`);
        return parseChapterDetails(html, chapter);
    }
}
