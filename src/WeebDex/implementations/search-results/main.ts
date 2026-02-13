import type {
    PagedResults,
    Request,
    SearchFilter,
    SearchQuery,
    SearchResultItem,
    SortingOption,
} from "@paperback/types";
import { URL } from "@paperback/types";
import { WEEBDEX_API_DOMAIN } from "../../main";
import { fetchJSON } from "../../services/network";
import {
    getExcludedTags,
    getItemsPerPage,
    getOriginalLanguages,
} from "../settings-form/forms/main";
import type {
    Metadata,
    WeebDexMangaListResponse,
    WeebDexTagListResponse,
} from "../shared/models";
import { extractSearchFilters, parseSearchResults } from "./parsers";

export class SearchProvider {
    async getSearchFilters(): Promise<SearchFilter[]> {
        // Fetch available tags from API
        const tagsUrl = new URL(WEEBDEX_API_DOMAIN)
            .addPathComponent("manga")
            .addPathComponent("tag")
            .setQueryItem("limit", "100")
            .toString();

        const tagsRequest: Request = { url: tagsUrl, method: "GET" };
        const tagsJson = await fetchJSON<WeebDexTagListResponse>(tagsRequest);

        const filters: SearchFilter[] = [];

        // Status filter
        filters.push({
            type: "multiselect",
            id: "status",
            title: "Publication Status",
            options: [
                { id: "ongoing", value: "Ongoing" },
                { id: "completed", value: "Completed" },
                { id: "hiatus", value: "Hiatus" },
                { id: "cancelled", value: "Cancelled" },
            ],
            value: {},
            allowExclusion: false,
            allowEmptySelection: true,
            maximum: undefined,
        });

        // Demographic filter
        filters.push({
            type: "multiselect",
            id: "demographic",
            title: "Demographic",
            options: [
                { id: "shounen", value: "Shounen" },
                { id: "shoujo", value: "Shoujo" },
                { id: "seinen", value: "Seinen" },
                { id: "josei", value: "Josei" },
                { id: "none", value: "None" },
            ],
            value: {},
            allowExclusion: false,
            allowEmptySelection: true,
            maximum: undefined,
        });

        // Content rating filter
        filters.push({
            type: "multiselect",
            id: "contentRating",
            title: "Content Rating",
            options: [
                { id: "safe", value: "Safe" },
                { id: "suggestive", value: "Suggestive" },
                { id: "erotica", value: "Erotica" },
                { id: "pornographic", value: "Pornographic" },
            ],
            value: {},
            allowExclusion: false,
            allowEmptySelection: true,
            maximum: undefined,
        });

        const excludedTagIds = getExcludedTags();
        const availableTags = tagsJson.data.filter(
            (tag) => !excludedTagIds.includes(tag.id),
        );

        // Tags filter
        filters.push({
            type: "multiselect",
            id: "tags",
            title: "Tags",
            options: availableTags.map((tag) => ({
                id: tag.id,
                value: tag.name,
            })),
            value: {},
            allowExclusion: true,
            allowEmptySelection: true,
            maximum: undefined,
        });

        // Tag mode filter (dropdown instead of select)
        filters.push({
            type: "multiselect",
            id: "tagMode",
            title: "Tag Inclusion Mode. Only one applies.",
            options: [
                { id: "AND", value: "AND - Must match ALL selected tags" },
                { id: "OR", value: "OR - Can match ANY selected tag" },
            ],
            value: { AND: "included" }, // Default to AND being selected
            allowExclusion: false,
            allowEmptySelection: false,
            maximum: 1, // Only allow selecting one at a time
        });

        return filters;
    }

    async getSortingOptions(): Promise<SortingOption[]> {
        return [
            { id: "none", label: "None" },
            { id: "relevance", label: "Relevance" },
            { id: "lastUploadedChapterAt", label: "Latest Updates" },
            { id: "createdAt", label: "Recently Added" },
            { id: "rating", label: "Highest Rated" },
            { id: "views", label: "Most Popular" },
            { id: "follows", label: "Most Followed" },
            { id: "title", label: "Title (A-Z)" },
            { id: "year", label: "Year" },
        ];
    }

    async getSearchResults(
        query: SearchQuery,
        metadata?: Metadata,
        sortingOption?: SortingOption,
    ): Promise<PagedResults<SearchResultItem>> {
        const page = metadata?.page ?? 1;
        const limit = parseInt(getItemsPerPage(), 10);
        const searchTerm = query.title?.trim() || "";

        const urlBuilder = new URL(WEEBDEX_API_DOMAIN)
            .addPathComponent("manga")
            .setQueryItem("limit", limit.toString())
            .setQueryItem("page", page.toString());

        // Add search term if provided
        if (searchTerm) {
            urlBuilder.setQueryItem("title", searchTerm);
        }

        // Extract and apply filters
        const filters = extractSearchFilters(query);

        // Apply status filter
        if (filters.status.length > 0) {
            urlBuilder.setQueryItem("status", filters.status);
        }

        // Apply demographic filter
        if (filters.demographic.length > 0) {
            urlBuilder.setQueryItem("demographic", filters.demographic);
        }

        // Apply content rating filter
        if (filters.contentRating.length > 0) {
            urlBuilder.setQueryItem("contentRating", filters.contentRating);
        } else {
            // Default content ratings
            urlBuilder.setQueryItem("contentRating", [
                "safe",
                "suggestive",
                "erotica",
            ]);
        }

        // Apply tag filters
        if (filters.includedTags.length > 0) {
            urlBuilder.setQueryItem("tag", filters.includedTags);
        }
        // Apply tag exclusions from settings (merge with user's excluded tags)
        const settingsExcludedTags = getExcludedTags();
        if (settingsExcludedTags.length > 0) {
            const allExcludedTags = [
                ...new Set([...filters.excludedTags, ...settingsExcludedTags]),
            ];
            urlBuilder.setQueryItem("tagx", allExcludedTags);
        } else if (filters.excludedTags.length > 0) {
            urlBuilder.setQueryItem("tagx", filters.excludedTags);
        }

        // Apply tag mode
        if (filters.tagMode) {
            urlBuilder.setQueryItem("tmod", filters.tagMode);
        }

        // Apply original language filter from settings
        const selectedLanguages = getOriginalLanguages();
        if (!selectedLanguages.includes("all")) {
            urlBuilder.setQueryItem("lang", selectedLanguages);
        }

        // Add sorting
        const sortId = sortingOption?.id || "none";
        if (sortId !== "none") {
            urlBuilder.setQueryItem("sort", sortId);
            urlBuilder.setQueryItem("order", "desc");
        }

        const url = urlBuilder.toString();
        const request: Request = { url, method: "GET" };
        const json = await fetchJSON<WeebDexMangaListResponse>(request);

        const items = parseSearchResults(json);
        const hasMore = items.length >= limit;

        return {
            items,
            metadata: hasMore ? { page: page + 1 } : undefined,
        };
    }
}
