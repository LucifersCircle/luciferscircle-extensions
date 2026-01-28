import {
    Form,
    Section,
    SelectRow,
    type FormItemElement,
    type FormSectionElement,
    type SelectRowProps,
} from "@paperback/types";

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
    override getSections(): FormSectionElement[] {
        return [
            Section("original-language", [this.originalLanguageRow()]),
            Section("chapter-language", [this.chapterLanguageRow()]),
        ];
    }

    chapterLanguageRow(): FormItemElement<unknown> {
        const selectedLanguages = this.getChapterLanguages();

        const languageFilterProps: SelectRowProps = {
            title: "Chapter Language Filter",
            subtitle:
                "The default language the filter for chapter list is set to.",
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
                "Only show titles originally published in these languages. Only affects \"Latest Updates\" section and Search.",
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
}
