/* eslint-disable */
export function applyMixins(derivedCtor: any, constructors: any[]) {
    constructors.forEach((baseCtor) => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
            Object.defineProperty(
                derivedCtor.prototype,
                name,
                Object.getOwnPropertyDescriptor(baseCtor.prototype, name) ||
                    Object.create(null),
            );
        });
    });
}

export function getExcludedTags(): string[] {
    const saved = Application.getState("weebdex-excluded-tags");
    if (!saved) return [];
    return JSON.parse(saved as string) as string[];
}

export function getOriginalLanguages(): string[] {
    const saved = Application.getState("weebdex-original-language-filter");
    if (!saved) return ["all"];
    return JSON.parse(saved as string) as string[];
}
