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

export class ChapterProvider {
    async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        const mangaId = sourceManga.mangaId;
        const allChapters: Chapter[] = [];
        let currentPage = 1;
        let hasMore = true;

        // Fetch all pages - remove tlang filter to get all languages
        while (hasMore) {
            const url = new URL("https://api.weebdex.org")
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

        // Sort chapters by volume and chapter number (ASCENDING - oldest first)
        allChapters.sort((a, b) => {
            const volA = a.volume ?? 0;
            const volB = b.volume ?? 0;

            // First sort by volume (ascending)
            if (volA !== volB) {
                return volA - volB;
            }
            // Then by chapter number (ascending)
            return a.chapNum - b.chapNum;
        });

        // update sortingIndex after sorting
        allChapters.forEach((ch, index) => {
            ch.sortingIndex = index;
        });

        return allChapters;
    }

    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        const chapterId = chapter.chapterId;

        const url = new URL("https://api.weebdex.org")
            .addPathComponent("chapter")
            .addPathComponent(chapterId)
            .toString();

        const request: Request = { url, method: "GET" };
        const json = await fetchJSON<WeebDexChapter>(request);

        return parseChapterDetails(json, chapter);
    }
}
