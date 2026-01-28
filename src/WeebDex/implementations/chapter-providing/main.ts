import type {
    Chapter,
    ChapterDetails,
    Request,
    SourceManga,
} from "@paperback/types";
import { URL } from "@paperback/types";
import { WEEBDEX_API_DOMAIN } from "../../main";
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

        // Fetch all pages
        while (hasMore) {
            const url = new URL(WEEBDEX_API_DOMAIN)
                .addPathComponent("manga")
                .addPathComponent(mangaId)
                .addPathComponent("chapters")
                .setQueryItem("limit", "100")
                .setQueryItem("page", currentPage.toString())
                .toString();

            const request: Request = { url, method: "GET" };
            const json = await fetchJSON<WeebDexChapterFeedResponse>(request);

            const chapters = parseChapterList(json, sourceManga);
            allChapters.push(...chapters);

            hasMore = json.data.length >= 100;
            currentPage++;
        }

        // Filter by selected language from settings
        const selectedLanguages = this.getSelectedLanguages();
        const filteredChapters = selectedLanguages.includes("all")
            ? allChapters
            : allChapters.filter((ch) =>
                  selectedLanguages.includes(ch.langCode),
              );

        // Update sortingIndex after filtering
        const maxIndex = filteredChapters.length - 1;
        filteredChapters.forEach((ch, index) => {
            ch.sortingIndex = maxIndex - index;
        });

        return filteredChapters;
    }

    private getSelectedLanguages(): string[] {
        const saved = Application.getState("weebdex-chapter-language-filter");
        if (!saved) return ["all"];
        return JSON.parse(saved as string) as string[];
    }

    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        const chapterId = chapter.chapterId;

        const url = new URL(WEEBDEX_API_DOMAIN)
            .addPathComponent("chapter")
            .addPathComponent(chapterId)
            .toString();

        const request: Request = { url, method: "GET" };
        const json = await fetchJSON<WeebDexChapter>(request);

        const dataSaver = this.getDataSaverSetting();
        return parseChapterDetails(json, chapter, dataSaver);
    }

    private getDataSaverSetting(): boolean {
        const saved = Application.getState("weebdex-data-saver");
        return (saved as boolean) ?? false;
    }
}
