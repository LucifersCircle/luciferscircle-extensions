import {
    URL,
    type PagedResults,
    type Request,
    type SearchQuery,
    type SearchResultItem,
} from "@paperback/types";
import { QISCANS_API } from "../../main";
import { type Metadata, type QIScansQueryResponse } from "../shared/models";
import { fetchJSON } from "../shared/utils";
import { parseSearchResults } from "./parsers";

const PAGE_SIZE = 20;

export class SearchProvider {
    async getSearchResults(
        query: SearchQuery,
        metadata: Metadata,
    ): Promise<PagedResults<SearchResultItem>> {
        const page = metadata?.page ?? 1;

        const searchTerm = (query.title ?? "")
            .trim()
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/\s+/g, " ");
        console.log(`[QiScans] Search term: "${searchTerm}"`);

        let urlBuilder = new URL(QISCANS_API)
            .setQueryItem("perPage", PAGE_SIZE.toString())
            .setQueryItem("page", page.toString());

        if (searchTerm) {
            urlBuilder = urlBuilder.setQueryItem("searchTerm", searchTerm);
        }

        const url = urlBuilder.toString();

        console.log(`[QiScans] Fetching search page ${page}: ${url}`);

        const request: Request = {
            url,
            method: "GET",
        };

        const json = await fetchJSON<QIScansQueryResponse>(request);
        const results = parseSearchResults(json);

        // check if there's a next page based on totalCount
        const hasNext = json.totalCount
            ? page * PAGE_SIZE < json.totalCount
            : results.length >= PAGE_SIZE;

        return {
            items: results,
            metadata: hasNext ? { page: page + 1 } : undefined,
        };
    }
}
