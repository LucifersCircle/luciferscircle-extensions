import { Form, type SettingsFormProviding } from "@paperback/types";
import { WeebDexSettingsForm } from "./landing";

// ============================
// Chapter Language Filter
// ============================

export function getChapterLanguages(): string[] {
    return (
        (Application.getState("weebdex-chapter-language-filter") as
            | string[]
            | undefined) ?? ["all"]
    );
}

export function setChapterLanguages(value: string[]): void {
    Application.setState(value, "weebdex-chapter-language-filter");
}

// ============================
// Original Language Filter
// ============================

export function getOriginalLanguages(): string[] {
    return (
        (Application.getState("weebdex-original-language-filter") as
            | string[]
            | undefined) ?? ["all"]
    );
}

export function setOriginalLanguages(value: string[]): void {
    Application.setState(value, "weebdex-original-language-filter");
}

// ============================
// Tag Exclusion Filter
// ============================

export function getExcludedTags(): string[] {
    return (
        (Application.getState("weebdex-excluded-tags") as
            | string[]
            | undefined) ?? []
    );
}

export function setExcludedTags(value: string[]): void {
    Application.setState(value, "weebdex-excluded-tags");
}

// ============================
// Items Per Page
// ============================

export function getItemsPerPage(): string {
    return (
        (Application.getState("weebdex-items-per-page") as
            | string
            | undefined) ?? "42"
    );
}

export function setItemsPerPage(value: string): void {
    Application.setState(value, "weebdex-items-per-page");
}

// ============================
// Data Saver
// ============================

export function getDataSaver(): boolean {
    return (
        (Application.getState("weebdex-data-saver") as boolean | undefined) ??
        false
    );
}

export function setDataSaver(value: boolean): void {
    Application.setState(value, "weebdex-data-saver");
}

// ============================
// Default Search Sort
// ============================

export function getDefaultSearchSort(): string {
    return (
        (Application.getState("weebdex-default-search-sort") as
            | string
            | undefined) ?? "none"
    );
}

export function setDefaultSearchSort(value: string): void {
    Application.setState(value, "weebdex-default-search-sort");
}

// ============================
// Hide Adult Results
// ============================

export function getHideAdultResults(): boolean {
    return (
        (Application.getState("weebdex-hide-adult-results") as
            | boolean
            | undefined) ?? false
    );
}

export function setHideAdultResults(value: boolean): void {
    Application.setState(value, "weebdex-hide-adult-results");
}

// ============================
// Settings Form Provider
// ============================

export class SettingsFormProvider implements SettingsFormProviding {
    async getSettingsForm(): Promise<Form> {
        return new WeebDexSettingsForm();
    }
}
