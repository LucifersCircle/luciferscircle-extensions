import type { Chapter, SourceManga } from "@paperback/types";
import type { AtsuChaptersResponse } from "../shared/models";

export function parseChapterList(
    json: AtsuChaptersResponse,
    sourceManga: SourceManga,
): Chapter[] {
    return json.chapters.map((ch) => ({
        chapterId: ch.id,
        sourceManga,
        title: "",
        chapNum: ch.number,
        volume: 0,
        langCode: "en",
        sortingIndex: ch.index,
        publishDate: new Date(ch.createdAt),
    }));
}
