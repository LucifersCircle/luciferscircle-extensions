import { ContentRating, SearchResultItem } from "@paperback/types";
import { QIScansQueryResponse, sanitizeId } from "../shared/models";
import { cachePostFromSearch } from "../shared/parsers";

export function parseSearchResults(
    json: QIScansQueryResponse,
): SearchResultItem[] {
    return (json.posts ?? []).map((post) => {
        const mangaId = sanitizeId(post.slug);

        // debug: missing title cover images
        console.log(`[QiScans] Search result: "${post.postTitle}"`);
        console.log(`[QiScans] Image URL: ${post.featuredImage}`);

        let imageUrl = post.featuredImage || "";
        if (imageUrl.includes("/file/qiscans/")) {
            const fixed = imageUrl.replace("/file/qiscans/", "/");
            console.log(`[QiScans] Fixed cover image: ${imageUrl} -> ${fixed}`);
            imageUrl = fixed;
        }

        cachePostFromSearch(post, mangaId);

        return {
            mangaId: mangaId,
            title: Application.decodeHTMLEntities(post.postTitle),
            imageUrl: imageUrl,
            subtitle: `${post._count?.chapters ?? 0} Chapters`,
            contentRating: ContentRating.EVERYONE,
        };
    });
}
