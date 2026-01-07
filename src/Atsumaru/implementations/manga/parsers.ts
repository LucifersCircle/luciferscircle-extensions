// todo: use atsu_base
import type { SourceManga } from "@paperback/types";
import { ContentRating } from "@paperback/types";
import type { AtsuMangaPageResponse } from "../shared/models";

export function parseMangaDetails(html: string, mangaId: string): SourceManga {
    // extract JSON from window.mangaPage = {...}
    const match = html.match(/window\.mangaPage\s*=\s*({[\s\S]*?});/);
    if (!match) {
        throw new Error("[Atsumaru] Could not find manga data in page");
    }

    const json = JSON.parse(match[1]) as AtsuMangaPageResponse;
    const manga = json.mangaPage;

    return {
        mangaId: mangaId,
        mangaInfo: {
            primaryTitle: manga.title,
            secondaryTitles: manga.otherNames,
            thumbnailUrl: `https://atsu.moe/static/${manga.poster.image}`,
            synopsis: manga.synopsis,
            author:
                manga.authors.length > 0
                    ? manga.authors.map((a) => a.name).join(", ")
                    : undefined,
            status: manga.status,
            contentRating: ContentRating.EVERYONE,
            tagGroups:
                manga.tags.length > 0
                    ? [
                          {
                              id: "tags",
                              title: "Tags",
                              tags: manga.tags.map((tag) => ({
                                  id: tag.id,
                                  title: tag.name,
                              })),
                          },
                      ]
                    : [],
            shareUrl: `https://atsu.moe/manga/${mangaId}`,
        },
    };
}
