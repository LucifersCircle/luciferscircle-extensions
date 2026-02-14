import {
    Form,
    Section,
    ToggleRow,
    type FormItemElement,
    type FormSectionElement,
    type ToggleRowProps,
} from "@paperback/types";
import { getHiddenDiscoverSections, setHiddenDiscoverSections } from "./main";

export class DiscoverSettingsForm extends Form {
    override getSections(): FormSectionElement[] {
        return [
            Section(
                {
                    id: "section-visibility",
                    footer: "Toggle discover sections on or off.",
                },
                [
                    this.topViews24hRow(),
                    this.topViews7dRow(),
                    this.topViews30dRow(),
                    this.latestUpdatesRow(),
                ],
            ),
        ];
    }

    // Row-building methods

    private isVisible(sectionId: string): boolean {
        return !getHiddenDiscoverSections().includes(sectionId);
    }

    topViews24hRow(): FormItemElement<unknown> {
        const props: ToggleRowProps = {
            title: "Top Views (24 Hours)",
            value: this.isVisible("top-views-24h"),
            onValueChange: Application.Selector(
                this as DiscoverSettingsForm,
                "handleTopViews24h",
            ),
        };
        return ToggleRow("toggle-top-views-24h", props);
    }

    topViews7dRow(): FormItemElement<unknown> {
        const props: ToggleRowProps = {
            title: "Top Views (7 Days)",
            value: this.isVisible("top-views-7d"),
            onValueChange: Application.Selector(
                this as DiscoverSettingsForm,
                "handleTopViews7d",
            ),
        };
        return ToggleRow("toggle-top-views-7d", props);
    }

    topViews30dRow(): FormItemElement<unknown> {
        const props: ToggleRowProps = {
            title: "Top Views (30 Days)",
            value: this.isVisible("top-views-30d"),
            onValueChange: Application.Selector(
                this as DiscoverSettingsForm,
                "handleTopViews30d",
            ),
        };
        return ToggleRow("toggle-top-views-30d", props);
    }

    latestUpdatesRow(): FormItemElement<unknown> {
        const props: ToggleRowProps = {
            title: "Latest Updates",
            value: this.isVisible("latest-updates"),
            onValueChange: Application.Selector(
                this as DiscoverSettingsForm,
                "handleLatestUpdates",
            ),
        };
        return ToggleRow("toggle-latest-updates", props);
    }

    // Handler methods

    private updateHiddenSections(sectionId: string, visible: boolean): void {
        let hidden = getHiddenDiscoverSections();

        if (visible) {
            hidden = hidden.filter((id) => id !== sectionId);
        } else {
            if (!hidden.includes(sectionId)) {
                hidden = [...hidden, sectionId];
            }
        }

        setHiddenDiscoverSections(hidden);
        this.reloadForm();
    }

    async handleTopViews24h(value: boolean): Promise<void> {
        this.updateHiddenSections("top-views-24h", value);
    }

    async handleTopViews7d(value: boolean): Promise<void> {
        this.updateHiddenSections("top-views-7d", value);
    }

    async handleTopViews30d(value: boolean): Promise<void> {
        this.updateHiddenSections("top-views-30d", value);
    }

    async handleLatestUpdates(value: boolean): Promise<void> {
        this.updateHiddenSections("latest-updates", value);
    }
}
