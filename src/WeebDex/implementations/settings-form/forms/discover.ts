import { Form, Section, type FormSectionElement } from "@paperback/types";

export class DiscoverSettingsForm extends Form {
    override getSections(): FormSectionElement[] {
        return [Section("placeholder", [])];
    }
}
