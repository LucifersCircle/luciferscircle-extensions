import {
    Form,
    NavigationRow,
    Section,
    SelectRow,
    ToggleRow,
    type FormItemElement,
    type FormSectionElement,
    type SelectRowProps,
    type ToggleRowProps,
} from "@paperback/types";
import { WEEBDEX_API_DOMAIN } from "../../main";
import { fetchJSON } from "../../services/network";
import { type WeebDexTagListResponse } from "../shared/models";
import {
    getChapterLanguages,
    getDataSaver,
    getExcludedTags,
    getItemsPerPage,
    getOriginalLanguages,
    setChapterLanguages,
    setDataSaver,
    setExcludedTags,
    setItemsPerPage,
    setOriginalLanguages,
} from "./main";
import { AVAILABLE_LANGUAGES } from "./models";

// ============================
// Site Settings Form
// ============================

class SiteSettingsForm extends Form {
    private tags?: WeebDexTagListResponse;
    private tagsLoadError?: Error;

    override formWillAppear(): void {
        fetchJSON<WeebDexTagListResponse>({
            url: `${WEEBDEX_API_DOMAIN}/manga/tag?limit=100`,
            method: "GET",
        })
            .then((tags) => {
                this.tags = tags;
                this.reloadForm();
            })
            .catch((error) => {
                this.tagsLoadError = error as Error;
                console.error("Failed to load tags:", error);
                this.reloadForm();
            });
    }

    override getSections(): FormSectionElement[] {
        return [
            Section("original-language", [this.originalLanguageRow()]),
            Section("chapter-language", [this.chapterLanguageRow()]),
            Section("tag-exclusion", [this.tagExclusionRow()]),
            Section("items-per-page", [this.itemsPerPageRow()]),
            Section("data-saver", [this.dataSaverRow()]),
        ];
    }

    // Row-building methods

    chapterLanguageRow(): FormItemElement<unknown> {
        const languageFilterProps: SelectRowProps = {
            title: "Chapter Language Filter",
            subtitle: `The default language(s) you want to see in the chapter list.\nAffects:\n- Chapter List\n- Chapter Version Priority list`,
            options: [
                { id: "all", title: "All Languages" },
                ...AVAILABLE_LANGUAGES,
            ],
            value: getChapterLanguages(),
            minItemCount: 0,
            maxItemCount: AVAILABLE_LANGUAGES.length + 1,
            onValueChange: Application.Selector(
                this as SiteSettingsForm,
                "handleChapterLanguageChange",
            ),
        };

        return SelectRow("chapter-language-filter", languageFilterProps);
    }

    originalLanguageRow(): FormItemElement<unknown> {
        const languageFilterProps: SelectRowProps = {
            title: "Original Language Filter",
            subtitle:
                'Only show titles originally published in these languages.\nAffects:\n- "Latest Updates" section\n- Search',
            options: [
                { id: "all", title: "All Languages" },
                ...AVAILABLE_LANGUAGES,
            ],
            value: getOriginalLanguages(),
            minItemCount: 0,
            maxItemCount: AVAILABLE_LANGUAGES.length + 1,
            onValueChange: Application.Selector(
                this as SiteSettingsForm,
                "handleOriginalLanguageChange",
            ),
        };

        return SelectRow("original-language-filter", languageFilterProps);
    }

    tagExclusionRow(): FormItemElement<unknown> {
        // If tags haven't loaded yet, show loading state
        if (!this.tags && !this.tagsLoadError) {
            const loadingProps: SelectRowProps = {
                title: "Tag Exclusion Filter",
                subtitle: "Loading tags...",
                options: [],
                value: [],
                minItemCount: 0,
                maxItemCount: 1,
                onValueChange: Application.Selector(
                    this as SiteSettingsForm,
                    "handleTagExclusionChange",
                ),
            };
            return SelectRow("tag-exclusion-filter", loadingProps);
        }

        // If there was an error loading tags
        if (this.tagsLoadError) {
            const errorProps: SelectRowProps = {
                title: "Tag Exclusion Filter",
                subtitle: "Failed to load tags. Please try again later.",
                options: [],
                value: [],
                minItemCount: 0,
                maxItemCount: 1,
                onValueChange: Application.Selector(
                    this as SiteSettingsForm,
                    "handleTagExclusionChange",
                ),
            };
            return SelectRow("tag-exclusion-filter", errorProps);
        }

        // Build tag options with group labels
        const tagOptions = this.tags!.data.map((tag) => ({
            id: tag.id,
            title: tag.name,
        }));

        const tagFilterProps: SelectRowProps = {
            title: "Tag Exclusion Filter",
            subtitle: `Prevent showing titles that contain any of the selected tags.\nAffects:\n- "Latest Updates" section\n- Search\n- Will be hidden from search "Filters"`,
            options: tagOptions,
            value: getExcludedTags(),
            minItemCount: 0,
            maxItemCount: tagOptions.length,
            onValueChange: Application.Selector(
                this as SiteSettingsForm,
                "handleTagExclusionChange",
            ),
        };

        return SelectRow("tag-exclusion-filter", tagFilterProps);
    }

    itemsPerPageRow(): FormItemElement<unknown> {
        const itemsPerPageProps: SelectRowProps = {
            title: "Items Per Page",
            subtitle: `How many items to load per page.\nAffects:\n- Expanded "Discover" sections\n- Search`,
            options: [
                { id: "28", title: "28" },
                { id: "42", title: "42 (Default)" },
                { id: "56", title: "56" },
                { id: "70", title: "70" },
                { id: "84", title: "84" },
                { id: "98", title: "98" },
            ],
            value: [getItemsPerPage()],
            minItemCount: 0,
            maxItemCount: 1,
            onValueChange: Application.Selector(
                this as SiteSettingsForm,
                "handleItemsPerPageChange",
            ),
        };

        return SelectRow("items-per-page", itemsPerPageProps);
    }

    dataSaverRow(): FormItemElement<unknown> {
        const dataSaverProps: ToggleRowProps = {
            title: "Data Saver",
            subtitle: `Reduce data usage by viewing lower quality versions of chapters.\nAffects:\n- Chapter Images`,
            value: getDataSaver(),
            onValueChange: Application.Selector(
                this as SiteSettingsForm,
                "handleDataSaverChange",
            ),
        };

        return ToggleRow("data-saver", dataSaverProps);
    }

    // Handler methods

    async handleChapterLanguageChange(value: string[]): Promise<void> {
        let finalValue = value;

        if (value.includes("all") && value.length > 1) {
            const previousValue = getChapterLanguages();
            if (!previousValue.includes("all")) {
                finalValue = ["all"];
            } else {
                finalValue = value.filter((v) => v !== "all");
            }
        }

        if (finalValue.length === 0) {
            finalValue = ["all"];
        }

        setChapterLanguages(finalValue);
        this.reloadForm();
    }

    async handleOriginalLanguageChange(value: string[]): Promise<void> {
        let finalValue = value;

        if (value.includes("all") && value.length > 1) {
            const previousValue = getOriginalLanguages();
            if (!previousValue.includes("all")) {
                finalValue = ["all"];
            } else {
                finalValue = value.filter((v) => v !== "all");
            }
        }

        if (finalValue.length === 0) {
            finalValue = ["all"];
        }

        setOriginalLanguages(finalValue);
        this.reloadForm();
    }

    async handleTagExclusionChange(value: string[]): Promise<void> {
        setExcludedTags(value);
        this.reloadForm();
    }

    async handleItemsPerPageChange(value: string[]): Promise<void> {
        const selectedValue = value[0] ?? "42";
        setItemsPerPage(selectedValue);
        this.reloadForm();
    }

    async handleDataSaverChange(value: boolean): Promise<void> {
        setDataSaver(value);
        this.reloadForm();
    }
}

// ============================
// Search Settings Form
// ============================

class SearchSettingsForm extends Form {
    override getSections(): FormSectionElement[] {
        return [Section("placeholder", [])];
    }
}

// ============================
// Hub Settings Form
// ============================

export class WeebDexSettingsForm extends Form {
    override getSections(): FormSectionElement[] {
        return [
            Section("mainSettings", [
                NavigationRow("site_settings", {
                    title: "Site Settings",
                    form: new SiteSettingsForm(),
                }),
                NavigationRow("search_settings", {
                    title: "Search Settings",
                    form: new SearchSettingsForm(),
                }),
            ]),
        ];
    }
}
