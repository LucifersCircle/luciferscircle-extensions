// todo: use atsu_base
import type { DiscoverSection, DiscoverSectionItem } from "@paperback/types";
import { DiscoverSectionType } from "@paperback/types";
import type { AtsuHomePageResponse } from "../shared/models";

export function parseDiscoverSections(
    json: AtsuHomePageResponse,
): DiscoverSection[] {
    const sections = json.homePage.sections;

    // filter for carousel sections only and map to DiscoverSection
    return sections
        .filter(
            (section) =>
                section.type === "carousel" && section.key !== "hot-updates",
        )
        .map((section) => ({
            id: section.key,
            title: section.title || "Unknown",
            type: DiscoverSectionType.simpleCarousel,
        }));
}

export function parseDiscoverItems(
    json: AtsuHomePageResponse,
    sectionId: string,
): DiscoverSectionItem[] {
    const sections = json.homePage.sections;

    // find the section matching the sectionId
    const section = sections.find((s) => s.key === sectionId);

    if (!section || !section.items) {
        return [];
    }

    // map items to DiscoverSectionItem format
    return section.items.map((item) => ({
        type: "simpleCarouselItem" as const,
        mangaId: item.id,
        title: item.title,
        imageUrl: `https://atsu.moe/static/${item.image}`,
        subtitle: item.type, // shows "Manwha", "Manga", etc.
    }));
}
