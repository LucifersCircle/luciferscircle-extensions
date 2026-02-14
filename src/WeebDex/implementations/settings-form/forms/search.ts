import {
    Form,
    Section,
    SelectRow,
    ToggleRow,
    type FormItemElement,
    type FormSectionElement,
    type SelectRowProps,
    type ToggleRowProps,
} from "@paperback/types";
import {
    getDefaultSearchSort,
    getHideAdultResults,
    getSearchSubtitle,
    setDefaultSearchSort,
    setHideAdultResults,
    setSearchSubtitle,
} from "./main";

const SORT_OPTIONS = [
    { id: "none", title: "None (Default)" },
    { id: "relevance", title: "Relevance" },
    { id: "lastUploadedChapterAt", title: "Latest Updates" },
    { id: "createdAt", title: "Recently Added" },
    { id: "rating", title: "Highest Rated" },
    { id: "views", title: "Most Popular" },
    { id: "follows", title: "Most Followed" },
    { id: "title", title: "Title (A-Z)" },
    { id: "year", title: "Year" },
];

const SUBTITLE_OPTIONS = [
    { id: "status", title: "Status (Default)" },
    { id: "year", title: "Year" },
    { id: "content_rating", title: "Content Rating" },
];

export class SearchSettingsForm extends Form {
    override getSections(): FormSectionElement[] {
        return [
            Section(
                {
                    id: "default-sort",
                    footer: "Sort order applied to all search results by default.",
                },
                [this.defaultSortRow()],
            ),
            Section(
                {
                    id: "hide-adult",
                    footer: "Filters out erotica and pornographic content.",
                },
                [this.hideAdultRow()],
            ),
            Section(
                {
                    id: "search-subtitle",
                    footer: "Information displayed below each search result title.",
                },
                [this.searchSubtitleRow()],
            ),
        ];
    }

    // Row-building methods

    defaultSortRow(): FormItemElement<unknown> {
        const sortProps: SelectRowProps = {
            title: "Default Search Sort",
            options: SORT_OPTIONS,
            value: [getDefaultSearchSort()],
            minItemCount: 1,
            maxItemCount: 1,
            onValueChange: Application.Selector(
                this as SearchSettingsForm,
                "handleDefaultSortChange",
            ),
        };

        return SelectRow("default-search-sort", sortProps);
    }

    hideAdultRow(): FormItemElement<unknown> {
        const hideAdultProps: ToggleRowProps = {
            title: "Hide Adult Results",
            value: getHideAdultResults(),
            onValueChange: Application.Selector(
                this as SearchSettingsForm,
                "handleHideAdultChange",
            ),
        };

        return ToggleRow("hide-adult-results", hideAdultProps);
    }

    searchSubtitleRow(): FormItemElement<unknown> {
        const subtitleProps: SelectRowProps = {
            title: "Search Result Subtitle",
            options: SUBTITLE_OPTIONS,
            value: [getSearchSubtitle()],
            minItemCount: 1,
            maxItemCount: 1,
            onValueChange: Application.Selector(
                this as SearchSettingsForm,
                "handleSearchSubtitleChange",
            ),
        };

        return SelectRow("search-subtitle", subtitleProps);
    }

    // Handler methods

    async handleDefaultSortChange(value: string[]): Promise<void> {
        const selectedValue = value[0] ?? "none";
        setDefaultSearchSort(selectedValue);
        this.reloadForm();
    }

    async handleHideAdultChange(value: boolean): Promise<void> {
        setHideAdultResults(value);
        this.reloadForm();
    }

    async handleSearchSubtitleChange(value: string[]): Promise<void> {
        const selectedValue = value[0] ?? "status";
        setSearchSubtitle(selectedValue);
        this.reloadForm();
    }
}
