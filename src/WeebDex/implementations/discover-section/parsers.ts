import type { DiscoverSectionItem } from "@paperback/types";
import { WEEBDEX_COVER_DOMAIN } from "../../main";
import {
    getDiscoverSubtitle,
    getForceDiscoverSubtitle,
} from "../settings-form/forms/main";
import type {
    WeebDexChapterFeedResponse,
    WeebDexManga,
    WeebDexMangaListResponse,
} from "../shared/models";
import { capitalize } from "../shared/utils";

export function parseDiscoverItems(
    json: WeebDexMangaListResponse,
): DiscoverSectionItem[] {
    const manga = json.data ?? [];

    if (manga.length === 0) {
        return [];
    }

    return manga
        .filter((item) => item.title && item.title.trim().length > 0)
        .map((item) => {
            const mangaId = item.id;

            const cover = item.relationships?.cover;
            let imageUrl = "";

            if (cover?.id && cover?.ext) {
                const ext = cover.ext.startsWith(".")
                    ? cover.ext.slice(1)
                    : cover.ext;
                imageUrl = `${WEEBDEX_COVER_DOMAIN}/covers/${mangaId}/${cover.id}.${ext}`;
            }

            return {
                type: "simpleCarouselItem" as const,
                mangaId: mangaId,
                title: item.title,
                imageUrl: imageUrl,
                subtitle: buildDiscoverSubtitle(item),
            };
        });
}

function buildDiscoverSubtitle(item: WeebDexManga): string {
    const setting = getDiscoverSubtitle();

    switch (setting) {
        case "year":
            return item.year?.toString() ?? "";
        case "content_rating":
            return capitalize(item.content_rating);
        default:
            return capitalize(item.status);
    }
}

export function parseLatestUpdates(
    json: WeebDexChapterFeedResponse,
): DiscoverSectionItem[] {
    const chapters = json.data ?? [];

    if (chapters.length === 0) {
        return [];
    }

    return chapters
        .filter((ch) => ch.relationships?.manga?.title)
        .map((ch) => {
            const manga = ch.relationships.manga;
            const mangaId = manga.id;

            const cover = manga.relationships?.cover;
            let imageUrl = "";

            if (cover?.id && cover?.ext) {
                const ext = cover.ext.startsWith(".")
                    ? cover.ext.slice(1)
                    : cover.ext;
                imageUrl = `${WEEBDEX_COVER_DOMAIN}/covers/${mangaId}/${cover.id}.${ext}`;
            }

            let subtitle: string;
            if (getForceDiscoverSubtitle()) {
                subtitle = buildDiscoverSubtitle(manga);
            } else {
                const chapterNum = ch.chapter ? `Ch. ${ch.chapter}` : "";
                const volumeNum = ch.volume ? `Vol. ${ch.volume}` : "";
                subtitle =
                    [volumeNum, chapterNum].filter(Boolean).join(" ") ||
                    "New Chapter";
            }

            return {
                type: "chapterUpdatesCarouselItem" as const,
                mangaId: mangaId,
                chapterId: ch.id,
                title: manga.title,
                imageUrl: imageUrl,
                subtitle: subtitle,
            };
        });
}
