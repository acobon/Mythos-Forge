// services/onboardingRefService.ts
const onboardingRefs = new Map<string, HTMLElement | null>();

export const onboardingRefService = {
    register: (key: string, ref: HTMLElement | null) => {
        if (ref) {
            onboardingRefs.set(key, ref);
        } else {
            onboardingRefs.delete(key);
        }
    },
    get: (key: string): HTMLElement | null | undefined => {
        return onboardingRefs.get(key);
    },
};
