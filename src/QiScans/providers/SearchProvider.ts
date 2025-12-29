import {
    PagedResults,
    Request,
    SearchQuery,
    SearchResultItem,
    URL,
} from "@paperback/types";
import { QISCANS_API } from "../main";
import { Metadata, QIScansQueryResponse } from "../models";
import { parseSearchResults } from "../parsers";
import { fetchJSON } from "../utils";

const PAGE_SIZE = 20;

export class SearchProvider {
    async getSearchResults(
        query: SearchQuery,
        metadata: Metadata,
    ): Promise<PagedResults<SearchResultItem>> {
        const page = metadata?.page ?? 1;

        // todo: may not need to normalize to +
        const searchTerm = (query.title ?? "")
            .trim()
            .replace(/[’‘]/g, "'")
            .replace(/[“”]/g, '"')
            .replace(/ /g, "-");

        const baseUrl = new URL(QISCANS_API)
            .setQueryItem("perPage", PAGE_SIZE.toString())
            .setQueryItem("page", page.toString())
            .toString();

        const finalUrl = searchTerm
            ? `${baseUrl}&searchTerm=${encodeURIComponent(searchTerm).replace(/%20/g, "+").replace(/%2B/g, "+")}`
            : baseUrl;

        console.log(`[QiScans] Fetching search page ${page} from QiScans API`);

        const request: Request = {
            url: finalUrl,
            method: "GET",
        };

        const json = await fetchJSON<QIScansQueryResponse>(request);

        const results = parseSearchResults(json);
        const extendedJson = json as QIScansQueryResponse & {
            hasMore?: boolean;
            total?: number;
        };
        let hasNext = false;
        if (typeof extendedJson.hasMore === "boolean") {
            hasNext = extendedJson.hasMore;
        } else if (typeof extendedJson.total === "number") {
            const consumed = page * PAGE_SIZE;
            hasNext = consumed < extendedJson.total;
        } else {
            // fallback: probe next page with a 1-item fetch
            try {
                const probeUrl = new URL(QISCANS_API)
                    .setQueryItem("perPage", "1")
                    .setQueryItem("page", (page + 1).toString())
                    .toString();

                const encodedProbeTerm = encodeURIComponent(searchTerm)
                    .replace(/%20/g, "+")
                    .replace(/%2B/g, "+");
                const rawSearch = searchTerm
                    ? `${probeUrl}&searchTerm=${encodedProbeTerm}`
                    : probeUrl;

                const probeRequest: Request = {
                    url: rawSearch,
                    method: "GET",
                };

                const probeJson =
                    await fetchJSON<QIScansQueryResponse>(probeRequest);
                hasNext =
                    Array.isArray(probeJson.posts) &&
                    probeJson.posts.length > 0;
            } catch {
                hasNext = false;
            }
        }

        return {
            items: results,
            metadata: hasNext ? { page: page + 1 } : undefined,
        };
    }
}
