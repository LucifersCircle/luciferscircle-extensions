import { ContentRating, SourceInfo, SourceIntents } from "@paperback/types";

export default {
    name: "QiScans",
    description: "Extension that pulls content from qiscans.org.",
    version: "1.0.0-alpha.6",
    icon: "icon.png",
    language: "en",
    contentRating: ContentRating.EVERYONE,
    capabilities: [
        //SourceIntents.CLOUDFLARE_BYPASS_REQUIRED,
        SourceIntents.DISCOVER_SECIONS,
        SourceIntents.MANGA_CHAPTERS,
        SourceIntents.MANGA_SEARCH,
    ],
    badges: [],
    developers: [
        {
            name: "Lucifers Circle",
        },
    ],
} satisfies SourceInfo;
