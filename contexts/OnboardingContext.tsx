// contexts/OnboardingContext.tsx
import React, { createContext, useState, useCallback, ReactNode, useContext } from 'react';

interface OnboardingContextType {
    register: (key: string, element: HTMLElement | null) => void;
    getTarget: (key: string) => HTMLElement | null;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [refs, setRefs] = useState<Map<string, HTMLElement | null>>(new Map());

    const register = useCallback((key: string, element: HTMLElement | null) => {
        setRefs(prevRefs => {
            const newRefs = new Map(prevRefs);
            if (element) {
                newRefs.set(key, element);
            } else {
                newRefs.delete(key);
            }
            return newRefs;
        });
    }, []);

    const getTarget = useCallback((key: string): HTMLElement | null => {
        return refs.get(key) || null;
    }, [refs]);

    return (
        <OnboardingContext.Provider value={{ register, getTarget }}>
            {children}
        </OnboardingContext.Provider>
    );
};

export const useOnboarding = () => {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
};
