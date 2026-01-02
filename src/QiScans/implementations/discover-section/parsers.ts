import { DiscoverSectionItem } from "@paperback/types";
import { QIScansV2Response, sanitizeId } from "../shared/models";
import { cachePostFromSearch } from "../shared/parsers";

export function parseDiscoverItems(
    json: QIScansV2Response,
    sectionType: string,
): DiscoverSectionItem[] {
    const posts = json.data ?? [];
    console.log(
        `[QiScans] parseDiscoverItems: sectionType="${sectionType}", posts count=${posts.length}`,
    );

    if (posts.length === 0) {
        console.log(`[QiScans] parseDiscoverItems: No posts in response`);
        return [];
    }

    const items = posts.map((post, index) => {
        const mangaId = sanitizeId(post.slug);

        let imageUrl = post.featuredImage || "";
        if (imageUrl.includes("/file/qiscans/")) {
            const fixed = imageUrl.replace("/file/qiscans/", "/");
            if (index < 3) {
                console.log(
                    `[QiScans] Fixed image URL for "${post.postTitle}"`,
                );
            }
            imageUrl = fixed;
        }

        cachePostFromSearch(post, mangaId);

        // additional chapter info for chapterUpdates
        if (sectionType === "latest") {
            const latestChapter = post.chapters?.[0];

            const item = {
                type: "chapterUpdatesCarouselItem" as const,
                mangaId: mangaId,
                chapterId: latestChapter?.slug || "",
                title: Application.decodeHTMLEntities(post.postTitle),
                imageUrl: imageUrl,
                subtitle: latestChapter
                    ? `Ch. ${latestChapter.number}`
                    : `${post._count?.chapters ?? 0} Chapters`,
            };

            if (index < 3) {
                console.log(
                    `[QiScans] Item ${index}: chapterUpdatesCarouselItem - ${item.title}`,
                );
            }

            return item;
        }

        // all other items
        const item = {
            type: "simpleCarouselItem" as const,
            mangaId: mangaId,
            title: Application.decodeHTMLEntities(post.postTitle),
            imageUrl: imageUrl,
            subtitle: `${post._count?.chapters ?? 0} Chapters`,
        };

        if (index < 3) {
            console.log(
                `[QiScans] Item ${index}: simpleCarouselItem - ${item.title}`,
            );
        }

        return item;
    });

    console.log(
        `[QiScans] parseDiscoverItems: returning ${items.length} items`,
    );
    return items;
}
