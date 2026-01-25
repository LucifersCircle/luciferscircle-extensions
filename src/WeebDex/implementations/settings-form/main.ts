import { Form, type SettingsFormProviding } from "@paperback/types";
import { WeebDexSettingsForm } from "./form";

export class SettingsFormProvider implements SettingsFormProviding {
    async getSettingsForm(): Promise<Form> {
        return new WeebDexSettingsForm();
    }
}
