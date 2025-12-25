import { Request, SourceManga, URL } from "@paperback/types";
import { QISCANS_API } from "../main"; // api.qiscans.org/api/query

import { QIScansPost, QIScansQueryResponse, sanitizeId } from "../models";
import { getCachedPostById, parseMangaDetails } from "../parsers";
import { fetchJSON } from "../utils";

export class MangaProvider {
    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        // use cached post from search
        const cached = getCachedPostById(mangaId);
        if (cached) {
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
            .replace(/%20/g, "+")
            .replace(/%2B/g, "+");

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
