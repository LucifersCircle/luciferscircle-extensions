import type {
    PagedResults,
    Request,
    SearchFilter,
    SearchQuery,
    SearchResultItem,
    SortingOption,
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
        sortingOption?: SortingOption,
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

        // get sort from filter
        const sortFilter = query.filters?.find((f) => f.id === "sort");
        const sortBy = (sortFilter?.value as string) || "createdAt";
        urlBuilder = urlBuilder.setQueryItem("orderBy", sortBy);

        // get status from sorting option
        if (sortingOption?.id) {
            urlBuilder = urlBuilder.setQueryItem(
                "seriesStatus",
                sortingOption.id,
            );
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

    async getSearchFilters(): Promise<SearchFilter[]> {
        const sortFilter: SearchFilter = {
            type: "dropdown",
            id: "sort",
            title: "Sort By",
            options: [
                { id: "createdAt", value: "Created At" },
                { id: "updatedAt", value: "Updated At" },
                { id: "totalViews", value: "Views" },
                { id: "postTitle", value: "Title" },
            ],
            value: "createdAt",
        };

        return [sortFilter];
    }

    async getSortingOptions(): Promise<SortingOption[]> {
        return [
            { id: "", label: "All" },
            { id: "ONGOING", label: "Ongoing" },
            { id: "HIATUS", label: "Hiatus" },
            { id: "DROPPED", label: "Dropped" },
            { id: "COMPLETED", label: "Completed" },
        ];
    }
}
