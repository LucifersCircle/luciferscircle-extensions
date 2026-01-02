import { ContentRating, SearchResultItem } from "@paperback/types";
import { QIScansQueryResponse } from "../shared/models";

export function parseSearchResults(
    json: QIScansQueryResponse,
): SearchResultItem[] {
    return (json.posts ?? []).map((post) => {
        const mangaId = post.id.toString();

        let imageUrl = post.featuredImage || "";
        if (imageUrl.includes("/file/qiscans/")) {
            imageUrl = imageUrl.replace("/file/qiscans/", "/");
        }

        return {
            mangaId: mangaId,
            title: Application.decodeHTMLEntities(post.postTitle),
            imageUrl: imageUrl,
            subtitle: `${post._count?.chapters ?? 0} Chapters`,
            contentRating: ContentRating.EVERYONE,
        };
    });
}
