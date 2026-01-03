import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";

export default defineConfig([
    {
        files: ["**/*.ts"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: "./tsconfig.json",
                tsconfigRootDir: new URL(".", import.meta.url).pathname,
                sourceType: "module",
                ecmaVersion: "latest",
            },
        },
        plugins: { "@typescript-eslint": tsPlugin },
        rules: {
            "@typescript-eslint/no-unused-vars": [
                "error",
                { varsIgnorePattern: "^_" },
            ],
            "@typescript-eslint/require-await": "off",
        },
    },
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
        },
    },
    {
        ignores: ["bundles"],
    },
]);
