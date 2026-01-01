import {
    BasicRateLimiter,
    CloudflareError,
    CookieStorageInterceptor,
    type Chapter,
    type ChapterDetails,
    type ChapterProviding,
    type CloudflareBypassRequestProviding,
    type Cookie,
    type DiscoverSection,
    type DiscoverSectionItem,
    type DiscoverSectionProviding,
    type Extension,
    type MangaProviding,
    type PagedResults,
    type Request,
    type SearchFilter,
    type SearchQuery,
    type SearchResultItem,
    type SearchResultsProviding,
    type SourceManga,
} from "@paperback/types";
import { Metadata } from "./models";
import { QiScansInterceptor } from "./network";
import { ChapterProvider } from "./providers/ChapterProvider";
import { DiscoverProvider } from "./providers/DiscoverProvider";
import { MangaProvider } from "./providers/MangaProvider";
import { SearchProvider } from "./providers/SearchProvider";

export const QISCANS_DOMAIN = "https://qiscans.org";
export const QISCANS_API = "https://api.qiscans.org/api/query";
export const QISCANS_API_BASE = "https://api.qiscans.org/api";

type QiScansImplementation = Extension &
    SearchResultsProviding &
    MangaProviding &
    ChapterProviding &
    DiscoverSectionProviding &
    CloudflareBypassRequestProviding;

export class QiScansExtension implements QiScansImplementation {
    private searchProvider = new SearchProvider();
    private mangaProvider = new MangaProvider();
    private chapterProvider = new ChapterProvider(this.mangaProvider);
    private discoverProvider = new DiscoverProvider();
    private cookieStorageInterceptor = new CookieStorageInterceptor({
        storage: "stateManager",
    });
    private globalRateLimiter = new BasicRateLimiter("rateLimiter", {
        numberOfRequests: 6,
        bufferInterval: 1,
        ignoreImages: true,
    });
    private qiscansInterceptor = new QiScansInterceptor("qiscans-interceptor");

    async initialise(): Promise<void> {
        this.globalRateLimiter.registerInterceptor();
        this.cookieStorageInterceptor.registerInterceptor();
        this.qiscansInterceptor.registerInterceptor();
    }

    async saveCloudflareBypassCookies(cookies: Cookie[]): Promise<void> {
        for (const cookie of cookies) {
            if (
                cookie.name.startsWith("cf") ||
                cookie.name.startsWith("_cf") ||
                cookie.name.startsWith("__cf")
            ) {
                this.cookieStorageInterceptor.setCookie(cookie);
            }
        }
    }

    // todo: remove duplicate
    private checkCloudflareStatus(status: number): void {
        if (status === 503 || status === 403) {
            throw new CloudflareError({ url: QISCANS_DOMAIN, method: "GET" });
        }
    }

    async getSearchFilters(): Promise<SearchFilter[]> {
        return [];
    }

    async getSearchResults(
        query: SearchQuery,
        metadata: Metadata,
        //sortingOption: unknown,
    ): Promise<PagedResults<SearchResultItem>> {
        return this.searchProvider.getSearchResults(query, metadata);
    }

    async getMangaDetails(mangaId: string): Promise<SourceManga> {
        return this.mangaProvider.getMangaDetails(mangaId);
    }

    async getChapters(sourceManga: SourceManga): Promise<Chapter[]> {
        return this.chapterProvider.getChapters(sourceManga);
    }

    async getChapterDetails(chapter: Chapter): Promise<ChapterDetails> {
        return this.chapterProvider.getChapterDetails(chapter);
    }

    async getDiscoverSections(): Promise<DiscoverSection[]> {
        return this.discoverProvider.getDiscoverSections();
    }

    async getDiscoverSectionItems(
        section: DiscoverSection,
        metadata: Metadata | undefined,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        return this.discoverProvider.getDiscoverSectionItems(section, metadata);
    }

    async bypassCloudflareRequest(request: Request): Promise<Request> {
        return request;
    }
}

export const QiScans = new QiScansExtension();
