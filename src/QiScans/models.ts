// todo: clean up interfaces
export interface QIScansQueryResponse {
    posts: QIScansPost[];
    totalCount: number;
}

export interface QIScansPost {
    id: number;
    slug: string;
    postTitle: string;
    postContent: string;
    isNovel: boolean;
    isNew: boolean;
    chaptersPricing: number;
    featuredImage: string;
    postStatus: string;
    postType: string;
    author?: string;
    artist?: string;
    seriesType?: string;
    seriesStatus?: string;
    totalViews?: number;
    alternativeTitles?: string;
    genres: QIScansGenre[];
    chapters: QIScansChapter[];
    _count: { chapters: number };
    averageRating?: number;
    createdAt: string;
    updatedAt: string;
    lastChapterAddedAt?: string;
}

export interface QIScansGenre {
    id: number;
    name: string;
    color?: string;
}

export interface QIScansChapter {
    id: number;
    number: number;
    title: string | null;
    slug: string;
    mangaPostId: number;
    createdAt: string;
    isLocked: boolean;
    isAccessible: boolean;
}

export interface QIScansChaptersResponse {
    post: {
        slug: string;
        chapters: QIScansChapter[];
    };
    totalChapterCount: number;
}

export interface QIScansImage {
    id: number;
    height: number;
    width: number;
    url: string;
    order: number;
}

export interface QIScansChapterImagesPayload {
    id?: number;
    images?: QIScansImage[];
    pages?: (string | { url: string })[];
}

export interface QIScansChapterPagesResponse {
    images?: QIScansImage[];
    pages?: (string | { url: string })[];
    chapter?: QIScansChapterImagesPayload;
}

export type Metadata = {
    page?: number;
    completed?: boolean;
};

export function sanitizeId(id: string): string {
    const sanitized = id
        .replace(/[^a-zA-Z0-9._\-@()[\]%?#+=/&:]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    if (!sanitized) {
        throw new Error(
            `[QiScans] sanitizeId: cannot derive valid identifier from "${id}"`,
        );
    }

    return sanitized;
}
