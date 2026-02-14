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

/* eslint-enable */
export function capitalize(value: string | undefined): string {
    if (!value) return "";
    return value.charAt(0).toUpperCase() + value.slice(1);
}
