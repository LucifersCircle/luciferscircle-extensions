import type { SearchQuery, SearchResultItem } from "@paperback/types";
import { ContentRating } from "@paperback/types";
import { WEEBDEX_COVER_DOMAIN } from "../../main";
import type {
    ExtractedFilters,
    WeebDexMangaListResponse,
} from "../shared/models";

export function extractSearchFilters(query: SearchQuery): ExtractedFilters {
    const status: string[] = [];
    const demographic: string[] = [];
    const contentRating: string[] = [];
    const includedTags: string[] = [];
    const excludedTags: string[] = [];
    let tagMode = "AND";

    if (!query.filters) {
        return {
            status,
            demographic,
            contentRating,
            includedTags,
            excludedTags,
            tagMode,
        };
    }

    for (const filter of query.filters) {
        if (!filter.value || typeof filter.value !== "object") continue;

        const filterValue = filter.value as Record<string, string>;

        switch (filter.id) {
            case "status":
                Object.keys(filterValue).forEach((key) => {
                    if (filterValue[key] === "included") status.push(key);
                });
                break;

            case "demographic":
                Object.keys(filterValue).forEach((key) => {
                    if (filterValue[key] === "included") demographic.push(key);
                });
                break;

            case "contentRating":
                Object.keys(filterValue).forEach((key) => {
                    if (filterValue[key] === "included")
                        contentRating.push(key);
                });
                break;

            case "tags":
                Object.entries(filterValue).forEach(([id, status]) => {
                    if (status === "included") includedTags.push(id);
                    if (status === "excluded") excludedTags.push(id);
                });
                break;

            case "tagMode":
                if (typeof filter.value === "string") {
                    tagMode = filter.value;
                }
                break;
        }
    }

    return {
        status,
        demographic,
        contentRating,
        includedTags,
        excludedTags,
        tagMode,
    };
}

export function parseSearchResults(
    json: WeebDexMangaListResponse,
): SearchResultItem[] {
    const manga = json.data ?? [];

    if (manga.length === 0) {
        return [];
    }

    return manga
        .filter((item) => item.title && item.title.trim().length > 0)
        .map((item) => {
            const mangaId = item.id;

            // Construct cover URL
            const cover = item.relationships?.cover;
            let imageUrl = "";
            if (cover?.id && cover?.ext) {
                const ext = cover.ext.startsWith(".")
                    ? cover.ext.slice(1)
                    : cover.ext;
                imageUrl = `${WEEBDEX_COVER_DOMAIN}/covers/${mangaId}/${cover.id}.${ext}`;
            }

            // Map content rating
            let contentRating = ContentRating.EVERYONE;
            switch (item.content_rating) {
                case "safe":
                    contentRating = ContentRating.EVERYONE;
                    break;
                case "suggestive":
                    contentRating = ContentRating.MATURE;
                    break;
                case "erotica":
                case "pornographic":
                    contentRating = ContentRating.ADULT;
                    break;
            }

            return {
                mangaId: mangaId,
                title: item.title,
                imageUrl: imageUrl,
                subtitle: item.status || "",
                contentRating: contentRating,
            };
        });
}
