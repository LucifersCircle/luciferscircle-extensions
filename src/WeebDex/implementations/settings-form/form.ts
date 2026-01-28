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
import { WEEBDEX_API_DOMAIN } from "../../main";
import { fetchJSON } from "../../services/network";
import { type WeebDexTagListResponse } from "../shared/models";

const AVAILABLE_LANGUAGES = [
    { id: "en", title: "English" },
    { id: "ja", title: "Japanese" },
    { id: "ko", title: "Korean" },
    { id: "zh", title: "Chinese (Simplified)" },
    { id: "zh-hk", title: "Chinese (Traditional)" },
    { id: "id", title: "Indonesian" },
    { id: "jv", title: "Javanese" },
    { id: "vi", title: "Vietnamese" },
    { id: "af", title: "Afrikaans" },
    { id: "sq", title: "Albanian" },
    { id: "ar", title: "Arabic" },
    { id: "az", title: "Azerbaijani" },
    { id: "eu", title: "Basque" },
    { id: "be", title: "Belarusian" },
    { id: "bn", title: "Bengali" },
    { id: "bg", title: "Bulgarian" },
    { id: "my", title: "Burmese" },
    { id: "ca", title: "Catalan" },
    { id: "cv", title: "Chuvash" },
    { id: "hr", title: "Croatian" },
    { id: "cs", title: "Czech" },
    { id: "da", title: "Danish" },
    { id: "nl", title: "Dutch" },
    { id: "eo", title: "Esperanto" },
    { id: "et", title: "Estonian" },
    { id: "tl", title: "Filipino" },
    { id: "fi", title: "Finnish" },
    { id: "fr", title: "French" },
    { id: "ka", title: "Georgian" },
    { id: "de", title: "German" },
    { id: "el", title: "Greek" },
    { id: "he", title: "Hebrew" },
    { id: "hi", title: "Hindi" },
    { id: "hu", title: "Hungarian" },
    { id: "ga", title: "Irish" },
    { id: "it", title: "Italian" },
    { id: "kk", title: "Kazakh" },
    { id: "la", title: "Latin" },
    { id: "lt", title: "Lithuanian" },
    { id: "ms", title: "Malay" },
    { id: "mn", title: "Mongolian" },
    { id: "ne", title: "Nepali" },
    { id: "no", title: "Norwegian" },
    { id: "fa", title: "Persian" },
    { id: "pl", title: "Polish" },
    { id: "pt", title: "Portuguese" },
    { id: "pt-br", title: "Portuguese (Brazil)" },
    { id: "ro", title: "Romanian" },
    { id: "ru", title: "Russian" },
    { id: "sr", title: "Serbian" },
    { id: "sk", title: "Slovak" },
    { id: "sl", title: "Slovenian" },
    { id: "es", title: "Spanish" },
    { id: "es-la", title: "Spanish (LATAM)" },
    { id: "sv", title: "Swedish" },
    { id: "tam", title: "Tamil" },
    { id: "te", title: "Telugu" },
    { id: "th", title: "Thai" },
    { id: "tr", title: "Turkish" },
    { id: "uk", title: "Ukrainian" },
    { id: "ur", title: "Urdu" },
    { id: "uz", title: "Uzbek" },
];

export class WeebDexSettingsForm extends Form {
    private tags?: WeebDexTagListResponse;
    private tagsLoadError?: Error;

    override formWillAppear(): void {
        // Fetch tags when form loads
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

    chapterLanguageRow(): FormItemElement<unknown> {
        const selectedLanguages = this.getChapterLanguages();

        const languageFilterProps: SelectRowProps = {
            title: "Chapter Language Filter",
            subtitle: `The default language(s) you want to see in the chapter list.\nAffects:\n- Chapter List\n- Chapter Version Priority list`,
            options: [
                { id: "all", title: "All Languages" },
                ...AVAILABLE_LANGUAGES,
            ],
            value: selectedLanguages,
            minItemCount: 0,
            maxItemCount: AVAILABLE_LANGUAGES.length + 1,
            onValueChange: Application.Selector(
                this as WeebDexSettingsForm,
                "handleChapterLanguageChange",
            ),
        };

        return SelectRow("chapter-language-filter", languageFilterProps);
    }

    originalLanguageRow(): FormItemElement<unknown> {
        const selectedLanguages = this.getOriginalLanguages();

        const languageFilterProps: SelectRowProps = {
            title: "Original Language Filter",
            subtitle:
                'Only show titles originally published in these languages.\nAffects:\n- "Latest Updates" section\n- Search',
            options: [
                { id: "all", title: "All Languages" },
                ...AVAILABLE_LANGUAGES,
            ],
            value: selectedLanguages,
            minItemCount: 0,
            maxItemCount: AVAILABLE_LANGUAGES.length + 1,
            onValueChange: Application.Selector(
                this as WeebDexSettingsForm,
                "handleOriginalLanguageChange",
            ),
        };

        return SelectRow("original-language-filter", languageFilterProps);
    }

    tagExclusionRow(): FormItemElement<unknown> {
        const selectedTags = this.getExcludedTags();

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
                    this as WeebDexSettingsForm,
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
                    this as WeebDexSettingsForm,
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
            subtitle: `Prevent showing titles that contain any of the selected tags.\nAffects:\n- "Latest Updates" section\n- Search`,
            options: tagOptions,
            value: selectedTags,
            minItemCount: 0,
            maxItemCount: tagOptions.length,
            onValueChange: Application.Selector(
                this as WeebDexSettingsForm,
                "handleTagExclusionChange",
            ),
        };

        return SelectRow("tag-exclusion-filter", tagFilterProps);
    }

    itemsPerPageRow(): FormItemElement<unknown> {
        const selectedValue = this.getItemsPerPage();

        const itemsPerPageProps: SelectRowProps = {
            title: "Items Per Page",
            subtitle:
                `How many items to load per page.\nAffects:\n- Expanded "Discover" sections\n- Search`,
            options: [
                { id: "20", title: "20" },
                { id: "30", title: "30" },
                { id: "42", title: "42 (Default)" },
                { id: "50", title: "50" },
                { id: "70", title: "70" },
                { id: "100", title: "100" },
            ],
            value: [selectedValue],
            minItemCount: 0,
            maxItemCount: 1,
            onValueChange: Application.Selector(
                this as WeebDexSettingsForm,
                "handleItemsPerPageChange",
            ),
        };

        return SelectRow("items-per-page", itemsPerPageProps);
    }

    dataSaverRow(): FormItemElement<unknown> {
        const dataSaverEnabled = this.getDataSaverSetting();

        const dataSaverProps: ToggleRowProps = {
            title: "Data Saver",
            subtitle: `Reduce data usage by viewing lower quality versions of chapters.\nAffects:\n- Chapter Images`,
            value: dataSaverEnabled,
            onValueChange: Application.Selector(
                this as WeebDexSettingsForm,
                "handleDataSaverChange",
            ),
        };

        return ToggleRow("data-saver", dataSaverProps);
    }

    // Getter methods
    getChapterLanguages(): string[] {
        const saved = Application.getState("weebdex-chapter-language-filter");
        if (!saved) return ["all"];
        return JSON.parse(saved as string) as string[];
    }

    getOriginalLanguages(): string[] {
        const saved = Application.getState("weebdex-original-language-filter");
        if (!saved) return ["all"];
        return JSON.parse(saved as string) as string[];
    }

    getExcludedTags(): string[] {
        const saved = Application.getState("weebdex-excluded-tags");
        if (!saved) return [];
        return JSON.parse(saved as string) as string[];
    }

    getItemsPerPage(): string {
        const saved = Application.getState("weebdex-items-per-page");
        return (saved as string) ?? "42"; // Default to 42
    }

    getDataSaverSetting(): boolean {
        const saved = Application.getState("weebdex-data-saver");
        return (saved as boolean) ?? false; // Default to false (OFF)
    }

    // Handler methods
    async handleChapterLanguageChange(value: string[]): Promise<void> {
        let finalValue = value;

        // If "all" is selected, only keep "all"
        if (value.includes("all") && value.length > 1) {
            // If "all" was just added, keep only "all"
            const previousValue = this.getChapterLanguages();
            if (!previousValue.includes("all")) {
                finalValue = ["all"];
            } else {
                // If "all" was already selected, remove it (user selected a specific language)
                finalValue = value.filter((v) => v !== "all");
            }
        }

        // If no selection, default to "all"
        if (finalValue.length === 0) {
            finalValue = ["all"];
        }

        Application.setState(
            JSON.stringify(finalValue),
            "weebdex-chapter-language-filter",
        );
        this.reloadForm();
    }

    async handleOriginalLanguageChange(value: string[]): Promise<void> {
        let finalValue = value;

        // If "all" is selected, only keep "all"
        if (value.includes("all") && value.length > 1) {
            // If "all" was just added, keep only "all"
            const previousValue = this.getOriginalLanguages();
            if (!previousValue.includes("all")) {
                finalValue = ["all"];
            } else {
                // If "all" was already selected, remove it (user selected a specific language)
                finalValue = value.filter((v) => v !== "all");
            }
        }

        // If no selection, default to "all"
        if (finalValue.length === 0) {
            finalValue = ["all"];
        }

        Application.setState(
            JSON.stringify(finalValue),
            "weebdex-original-language-filter",
        );
        this.reloadForm();
    }

    async handleTagExclusionChange(value: string[]): Promise<void> {
        Application.setState(JSON.stringify(value), "weebdex-excluded-tags");
        this.reloadForm();
    }

    async handleItemsPerPageChange(value: string[]): Promise<void> {
        const selectedValue = value[0] ?? "42";
        Application.setState(selectedValue, "weebdex-items-per-page");
        this.reloadForm();
    }

    async handleDataSaverChange(value: boolean): Promise<void> {
        Application.setState(value, "weebdex-data-saver");
        this.reloadForm();
    }
}
