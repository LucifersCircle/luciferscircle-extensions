import type {
    PagedResults,
    Request,
    SearchQuery,
    SearchResultItem,
} from "@paperback/types";
import { URL } from "@paperback/types";
import { QISCANS_API } from "../../main";
import type { Metadata, QIScansQueryResponse } from "../shared/models";
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

    let urlBuilder = new URL(QISCANS_API)
        .setQueryItem("perPage", PAGE_SIZE.toString())
        .setQueryItem("page", page.toString());

    if (searchTerm) {
        urlBuilder = urlBuilder.setQueryItem("searchTerm", searchTerm);
    }

    const url = urlBuilder.toString();
    const request: Request = { url, method: "GET" };
    let json = await fetchJSON<QIScansQueryResponse>(request);
    let results = parseSearchResults(json);

    // if no results and search contains straight apostrophe, try with curly
    if (results.length === 0 && searchTerm.includes("'")) {
        const curlySearchTerm = searchTerm.replace(/'/g, "\u2019");
        urlBuilder = urlBuilder.setQueryItem("searchTerm", curlySearchTerm);
        const retryUrl = urlBuilder.toString();
        
        console.log(`[QiScans] No results, retrying with curly apostrophe: ${retryUrl}`);
        
        const retryRequest: Request = { url: retryUrl, method: "GET" };
        json = await fetchJSON<QIScansQueryResponse>(retryRequest);
        results = parseSearchResults(json);
    }

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
