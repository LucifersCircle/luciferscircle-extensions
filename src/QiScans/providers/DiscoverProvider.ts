import {
    DiscoverSection,
    DiscoverSectionItem,
    DiscoverSectionType,
    PagedResults,
    Request,
} from "@paperback/types";
import { QISCANS_API_BASE } from "../main";
import { Metadata, QIScansV2Response } from "../models";
import { parseDiscoverItems } from "../parsers";
import { fetchJSON } from "../utils";

export class DiscoverProvider {
    async getDiscoverSections(): Promise<DiscoverSection[]> {
        return [
            {
                id: "featured",
                title: "Featured",
                type: DiscoverSectionType.prominentCarousel,
            },
            {
                id: "popular",
                title: "Popular Today",
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: "pinned",
                title: "Pinned",
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: "latest",
                title: "Latest Updates",
                type: DiscoverSectionType.chapterUpdates,
            },
            {
                id: "editors-pick",
                title: "Editor's Pick",
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: "new",
                title: "New Fresh Series",
                type: DiscoverSectionType.simpleCarousel,
            },
        ];
    }

    async getDiscoverSectionItems(
        section: DiscoverSection,
        metadata?: Metadata,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        const page = metadata?.page ?? 1;
        let perPage = 15;
        let skipItems = 0; // they dont give an api for some carousel items, getting creative instead of parsing html selectors
        let url: string;

        switch (section.id) {
            case "featured":
                // show last 15
                perPage = 25;
                skipItems = 10;
                url = `${QISCANS_API_BASE}/v2/posts?featured=true&perPage=${perPage}&page=${page}`;
                break;

            case "popular":
                url = `${QISCANS_API_BASE}/v2/posts?sortBy=totalViews&sortOrder=desc&perPage=${perPage}&page=${page}`;
                break;

            case "pinned":
                url = `${QISCANS_API_BASE}/v2/posts?pinned=true&perPage=${perPage}&page=${page}`;
                break;

            case "latest":
                url = `${QISCANS_API_BASE}/v2/posts?sortBy=lastChapterAddedAt&sortOrder=desc&perPage=${perPage}&page=${page}`;
                break;

            case "editors-pick":
                perPage = 40;
                skipItems = 25;
                url = `${QISCANS_API_BASE}/v2/posts?editorsPick=true&perPage=${perPage}&page=${page}`;
                break;

            case "new":
                url = `${QISCANS_API_BASE}/v2/posts?sortBy=createdAt&sortOrder=desc&perPage=${perPage}&page=${page}`;
                break;

            default:
                throw new Error(
                    `[QiScans] Unknown discover section: ${section.id}`,
                );
        }

        console.log(
            `[QiScans] Fetching discover section "${section.id}" page ${page}: ${url}`,
        );

        try {
            const request: Request = {
                url,
                method: "GET",
            };

            const json = await fetchJSON<QIScansV2Response>(request);
            let items = parseDiscoverItems(json, section.id);

            if (skipItems > 0 && items.length > skipItems) {
                console.log(
                    `[QiScans] Skipping first ${skipItems} items for "${section.id}"`,
                );
                items = items.slice(skipItems);
            }

            // only "pinned" and "latest" sections support pagination
            const canPaginate =
                section.id === "pinned" || section.id === "latest";
            const hasMore = canPaginate && items.length >= 15;

            return {
                items,
                metadata: hasMore ? { page: page + 1 } : undefined,
            };
        } catch (error) {
            console.error(
                `[QiScans] Error in getDiscoverSectionItems for "${section.id}":`,
                error,
            );
            throw error;
        }
    }
}
