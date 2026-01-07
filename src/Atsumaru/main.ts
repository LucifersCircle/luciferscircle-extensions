import type { Cookie, Extension, MangaProviding } from "@paperback/types";
import { BasicRateLimiter, CookieStorageInterceptor } from "@paperback/types";
import { ChapterProvider } from "./implementations/chapter-providing/main";
import { DiscoverProvider } from "./implementations/discover-section/main";
import { MangaProvider } from "./implementations/manga/main";
import { SearchProvider } from "./implementations/search-results/main";
import { applyMixins } from "./implementations/shared/utils";
import { QiScansInterceptor } from "./services/network";

export const ATSUMARU_DOMAIN = "https://atsu.moe";
export const ATSUMARU_API_BASE = "https://atsu.moe/api";

export interface AtsumaruImplementation
    extends SearchProvider, MangaProvider, ChapterProvider, DiscoverProvider {}

export class AtsumaruExtension implements Omit<
    Extension,
    keyof MangaProviding
> {
    cookieStorageInterceptor = new CookieStorageInterceptor({
        storage: "stateManager",
    });
    globalRateLimiter = new BasicRateLimiter("rateLimiter", {
        numberOfRequests: 10,
        bufferInterval: 1,
        ignoreImages: true,
    });
    qiscansInterceptor = new QiScansInterceptor("qiscans-interceptor");

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

    async bypassCloudflareRequest(request: Request): Promise<Request> {
        return request;
    }
}

applyMixins(AtsumaruExtension, [
    SearchProvider,
    MangaProvider,
    ChapterProvider,
    DiscoverProvider,
]);

export const Atsumaru = new AtsumaruExtension();
