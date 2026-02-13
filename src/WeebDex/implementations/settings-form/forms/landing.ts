import {
    Form,
    NavigationRow,
    Section,
    type FormSectionElement,
} from "@paperback/types";
import { SearchSettingsForm } from "./search";
import { SiteSettingsForm } from "./site";

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
                NavigationRow("discover_settings", {
                    title: "Discover Settings",
                    form: new SearchSettingsForm(),
                }),
                NavigationRow("chapter_settings", {
                    title: "Chapter Settings",
                    form: new SearchSettingsForm(),
                }),
            ]),
        ];
    }
}
