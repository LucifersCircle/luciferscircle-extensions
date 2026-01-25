import type {
    Chapter,
    ChapterDetails,
    Request,
    SourceManga,
} from "@paperback/types";
import { URL } from "@paperback/types";
import { fetchJSON } from "../../services/network";
import type {
    WeebDexChapter,
    WeebDexChapterFeedResponse,
} from "../shared/models";
import { parseChapterDetails, parseChapterList } from "./parsers";
import { WEEBDEX_API_DOMAIN } from "../../main";

export class ChapterProvider {
    async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        const mangaId = sourceManga.mangaId;
        const allChapters: Chapter[] = [];
        let currentPage = 1;
        let hasMore = true;

        // Fetch all pages - remove tlang filter to get all languages
        while (hasMore) {
            const url = new URL(WEEBDEX_API_DOMAIN)
                .addPathComponent("manga")
                .addPathComponent(mangaId)
                .addPathComponent("chapters")
                .setQueryItem("limit", "100")
                .setQueryItem("page", currentPage.toString())
                // Removed tlang filter - we want all languages
                .toString();

            const request: Request = { url, method: "GET" };
            const json = await fetchJSON<WeebDexChapterFeedResponse>(request);

            const chapters = parseChapterList(json, sourceManga);
            allChapters.push(...chapters);

            hasMore = json.data.length >= 100;
            currentPage++;
        }

        // update sortingIndex
        allChapters.forEach((ch, index) => {
            ch.sortingIndex = index;
        });

        return allChapters;
    }

    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        const chapterId = chapter.chapterId;

        const url = new URL(WEEBDEX_API_DOMAIN)
            .addPathComponent("chapter")
            .addPathComponent(chapterId)
            .toString();

        const request: Request = { url, method: "GET" };
        const json = await fetchJSON<WeebDexChapter>(request);

        return parseChapterDetails(json, chapter);
    }
}
