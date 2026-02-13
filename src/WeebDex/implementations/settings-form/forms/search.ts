import {
    Form,
    Section,
    SelectRow,
    type FormItemElement,
    type FormSectionElement,
    type SelectRowProps,
} from "@paperback/types";
import { getDefaultSearchSort, setDefaultSearchSort } from "./main";

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

    // Handler methods

    async handleDefaultSortChange(value: string[]): Promise<void> {
        const selectedValue = value[0] ?? "none";
        setDefaultSearchSort(selectedValue);
        this.reloadForm();
    }
}
