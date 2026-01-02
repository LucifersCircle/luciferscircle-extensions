import { Request, SourceManga, URL } from "@paperback/types";
import { QISCANS_API, QISCANS_API_BASE } from "../../main";
import {
    QIScansPost,
    QIScansQueryResponse,
    sanitizeId,
} from "../shared/models";
import { getCachedPostById } from "../shared/parsers";
import { fetchJSON } from "../shared/utils";
import { parseMangaDetails } from "./parsers";

export class MangaProvider {
    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        // use cached post from search
        const cached = getCachedPostById(mangaId);
        if (cached) {
            console.log(`[QiScans] MangaProvider: cached.id = ${cached.id}`);
            console.log(
                `[QiScans] MangaProvider: cached.genres = ${JSON.stringify(cached.genres)}`,
            );
            console.log(
                `[QiScans] MangaProvider: genres length = ${cached.genres?.length ?? "undefined"}`,
            );

            // if cached post has no genres but has an ID, fetch by ID to get full data
            if ((!cached.genres || cached.genres.length === 0) && cached.id) {
                console.log(
                    `[QiScans] MangaProvider: cached post for "${mangaId}" has no genres, fetching by ID ${cached.id}`,
                );

                try {
                    const url = `${QISCANS_API_BASE}/v2/posts/${cached.id}`;
                    const request: Request = { url, method: "GET" };
                    const json = await fetchJSON<QIScansPost>(request);

                    if (json) {
                        console.log(
                            `[QiScans] MangaProvider: fetched full data by ID ${cached.id}`,
                        );
                        return parseMangaDetails(json);
                    }
                } catch (error) {
                    const errorMsg =
                        error instanceof Error ? error.message : String(error);
                    console.log(
                        `[QiScans] MangaProvider: failed to fetch by ID, using cached data: ${errorMsg}`,
                    );
                    // fallback to cached data if fetch fails
                    return parseMangaDetails(cached);
                }
            }

            console.log(
                `[QiScans] MangaProvider: using cached post for mangaId="${mangaId}" (slug="${cached.slug}")`,
            );
            return parseMangaDetails(cached);
        }
        // fallback path, mangaId is already sanitizeId(post.slug). Can only approximate
        // todo: fix this fallback, may not need +
        const slugApprox = mangaId;
        const slugWithoutNumericPrefix = slugApprox.replace(/^\d+-/, "");
        const rawSearchTerm = slugWithoutNumericPrefix
            .replace(/-/g, " ")
            .trim();

        if (!rawSearchTerm || rawSearchTerm.length < 2) {
            throw new Error(
                `[QiScans] MangaProvider: cannot derive valid search term from mangaId "${mangaId}"`,
            );
        }

        const searchTerm = encodeURIComponent(rawSearchTerm)
            .replace(/%20/g, "-")
            .replace(/%2B/g, "-");

        const baseUrl = new URL(QISCANS_API)
            .setQueryItem("perPage", "20")
            .setQueryItem("page", "1")
            .toString();

        const finalUrl = `${baseUrl}&searchTerm=${searchTerm}`;

        console.log(
            `[QiScans] MangaProvider: cache miss for "${mangaId}", fallback searchTerm="${searchTerm}" -> ${finalUrl}`,
        );

        const request: Request = { url: finalUrl, method: "GET" };
        const json = await fetchJSON<QIScansQueryResponse>(request);

        if (!json.posts || json.posts.length === 0) {
            throw new Error(
                `[QiScans] No posts found for id "${mangaId}" (fallback searchTerm="${searchTerm}")`,
            );
        }

        // prefer exact ID match via sanitizeId(slug) === mangaId
        let post: QIScansPost | undefined = json.posts.find(
            (p: QIScansPost) => sanitizeId(p.slug) === mangaId,
        );

        // next, try matching slug ignoring numeric prefix
        if (!post) {
            post = json.posts.find((p: QIScansPost) => {
                const apiSlugNoPrefix = p.slug.replace(/^\d+-/, "");
                return apiSlugNoPrefix === slugWithoutNumericPrefix;
            });
        }

        if (!post) {
            throw new Error(
                `[QiScans] MangaProvider: no reliable matching manga found for "${mangaId}" after fallback searchTerm="${searchTerm}".`,
            );
        }

        return parseMangaDetails(post);
    }
}
