import type { MangaInfo, SourceManga } from "@paperback/types";
import { ContentRating } from "@paperback/types";
import { WEEBDEX_COVER_DOMAIN, WEEBDEX_DOMAIN } from "../../main";
import type { WeebDexManga } from "../shared/models";

export function parseMangaDetails(
    manga: WeebDexManga,
    mangaId: string,
): SourceManga {
    // Build cover URL
    const cover = manga.relationships?.cover;
    let coverUrl = "";
    if (cover?.id && cover?.ext) {
        const ext = cover.ext.startsWith(".") ? cover.ext.slice(1) : cover.ext;
        coverUrl = `${WEEBDEX_COVER_DOMAIN}/covers/${mangaId}/${cover.id}.${ext}`;
    }

    // Extract authors
    const authors =
        manga.relationships?.authors?.map((a) => a.name).join(", ") ||
        undefined;

    // Extract artists
    const artists =
        manga.relationships?.artists?.map((a) => a.name).join(", ") ||
        undefined;

    // Extract alternative titles
    const secondaryTitles: string[] = [];
    if (manga.alt_titles) {
        for (const lang in manga.alt_titles) {
            secondaryTitles.push(...manga.alt_titles[lang]);
        }
    }

    // Map content rating
    let contentRating = ContentRating.EVERYONE;
    switch (manga.content_rating) {
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

    // Build tag groups
    const tagGroups = [];

    // Add demographic and status tags
    const infoTags = [];
    if (manga.demographic) {
        infoTags.push({
            id: `demographic-${manga.demographic}`,
            title:
                manga.demographic.charAt(0).toUpperCase() +
                manga.demographic.slice(1),
        });
    }
    if (manga.status) {
        infoTags.push({
            id: `status-${manga.status}`,
            title: manga.status.charAt(0).toUpperCase() + manga.status.slice(1),
        });
    }
    if (infoTags.length > 0) {
        tagGroups.push({
            id: "info",
            title: "Info",
            tags: infoTags,
        });
    }

    // Add genre/theme tags
    if (manga.relationships?.tags && manga.relationships.tags.length > 0) {
        tagGroups.push({
            id: "tags",
            title: "Tags",
            tags: manga.relationships.tags.map((tag) => ({
                id: tag.id,
                title: tag.name,
            })),
        });
    }

    const mangaInfo: MangaInfo = {
        primaryTitle: manga.title,
        secondaryTitles: secondaryTitles,
        thumbnailUrl: coverUrl,
        status: manga.status || "Unknown",
        author: authors,
        artist: artists,
        synopsis: manga.description || "No description available.",
        contentRating: contentRating,
        tagGroups: tagGroups,
        shareUrl: `${WEEBDEX_DOMAIN}/title/${mangaId}`,
    };

    return {
        mangaId: mangaId,
        mangaInfo: mangaInfo,
    };
}
