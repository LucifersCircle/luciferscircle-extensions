import type {
    DiscoverSection,
    DiscoverSectionItem,
    PagedResults,
    Request,
} from "@paperback/types";
import { DiscoverSectionType, URL } from "@paperback/types";
import { fetchJSON } from "../../services/network";
import {
    type Metadata,
    type WeebDexChapterFeedResponse,
    type WeebDexMangaListResponse,
} from "../shared/models";
import { parseDiscoverItems, parseLatestUpdates } from "./parsers";
import { WEEBDEX_API_DOMAIN } from "../../main";

export class DiscoverProvider {
    async getDiscoverSections(): Promise<DiscoverSection[]> {
        return [
            {
                id: "top-views-24h",
                title: "Top Views (24 Hours)",
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: "top-views-7d",
                title: "Top Views (7 Days)",
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: "top-views-30d",
                title: "Top Views (30 Days)",
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: "latest-updates",
                title: "Latest Updates",
                type: DiscoverSectionType.chapterUpdates,
            },
        ];
    }

    async getDiscoverSectionItems(
        section: DiscoverSection,
        metadata?: Metadata,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        const page = metadata?.page ?? 1;
        const limit = 20;

        // Handle latest updates differently
        if (section.id === "latest-updates") {
            return this.getLatestUpdates(page, limit);
        }

        const urlBuilder = new URL(WEEBDEX_API_DOMAIN)
            .addPathComponent("manga")
            .addPathComponent("top")
            .setQueryItem("limit", limit.toString())
            .setQueryItem("page", page.toString())
            .setQueryItem("contentRating", ["safe", "suggestive", "erotica"]);

        switch (section.id) {
            case "top-views-24h":
                urlBuilder
                    .setQueryItem("rank", "read")
                    .setQueryItem("time", "24h");
                break;

            case "top-views-7d":
                urlBuilder
                    .setQueryItem("rank", "read")
                    .setQueryItem("time", "7d");
                break;

            case "top-views-30d":
                urlBuilder
                    .setQueryItem("rank", "read")
                    .setQueryItem("time", "30d");
                break;

            default:
                throw new Error(
                    `[WeebDex] Unknown discover section: ${section.id}`,
                );
        }

        const url = urlBuilder.toString();
        const request: Request = { url, method: "GET" };
        const json = await fetchJSON<WeebDexMangaListResponse>(request);

        const items = parseDiscoverItems(json);
        const hasMore = items.length >= limit;

        return {
            items,
            metadata: hasMore ? { page: page + 1 } : undefined,
        };
    }

    private async getLatestUpdates(
        page: number,
        limit: number,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        const url = new URL(WEEBDEX_API_DOMAIN)
            .addPathComponent("chapter")
            .addPathComponent("updates") // Changed from "feed" to "updates"
            .setQueryItem("limit", limit.toString())
            .setQueryItem("page", page.toString())
            .setQueryItem("contentRating", ["safe", "suggestive", "erotica"])
            .toString();

        const request: Request = { url, method: "GET" };
        const json = await fetchJSON<WeebDexChapterFeedResponse>(request);

        const items = parseLatestUpdates(json);
        const hasMore = items.length >= limit;

        return {
            items,
            metadata: hasMore ? { page: page + 1 } : undefined,
        };
    }
}
