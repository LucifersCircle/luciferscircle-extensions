import { Form, Section, type FormSectionElement } from "@paperback/types";

export class ChapterSettingsForm extends Form {
    override getSections(): FormSectionElement[] {
        return [Section("placeholder", [])];
    }
}
