

// components/common/ui/Tabs.tsx
import React, { useState, createContext, useContext, ReactNode, KeyboardEvent, useId } from 'react';

interface TabsContextProps {
    selectedIndex: number;
    setSelectedIndex: (index: number) => void;
    baseId: string;
}

const TabsContext = createContext<TabsContextProps | null>(null);

const useTabs = () => {
    const context = useContext(TabsContext);
    if (!context) {
        throw new Error('useTabs must be used within a Tabs component');
    }
    return context;
};

export const Tabs: React.FC<{ children: ReactNode; defaultValue?: number }> = ({ children, defaultValue = 0 }) => {
    const [selectedIndex, setSelectedIndex] = useState(defaultValue);
    const baseId = useId();
    return (
        <TabsContext.Provider value={{ selectedIndex, setSelectedIndex, baseId }}>
            <div>{children}</div>
        </TabsContext.Provider>
    );
};

export const TabList: React.FC<{ children: ReactNode[] }> = ({ children }) => {
    const { selectedIndex, setSelectedIndex, baseId } = useTabs();
    
    const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
        if (e.key === 'ArrowRight') {
            const nextIndex = (currentIndex + 1) % children.length;
            setSelectedIndex(nextIndex);
            document.getElementById(`${baseId}-tab-${nextIndex}`)?.focus();
        } else if (e.key === 'ArrowLeft') {
            const prevIndex = (currentIndex - 1 + children.length) % children.length;
            setSelectedIndex(prevIndex);
            document.getElementById(`${baseId}-tab-${prevIndex}`)?.focus();
        }
    };
    
    return (
        <div role="tablist" aria-orientation="horizontal" className="border-b border-border-color mb-6 flex items-center gap-4">
            {React.Children.map(children, (child, index) => 
                React.cloneElement(child as React.ReactElement<any>, {
                    index,
                    onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => handleKeyDown(e, index)
                })
            )}
        </div>
    );
};

export const Tab: React.FC<{ children: ReactNode; index?: number; onKeyDown?: (e: KeyboardEvent<HTMLButtonElement>) => void }> = ({ children, index, onKeyDown }) => {
    const { selectedIndex, setSelectedIndex, baseId } = useTabs();
    const isSelected = selectedIndex === index;
    
    return (
        <button
            id={`${baseId}-tab-${index}`}
            role="tab"
            type="button"
            aria-selected={isSelected}
            aria-controls={`${baseId}-panel-${index}`}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => setSelectedIndex(index!)}
            onKeyDown={onKeyDown}
            className={`px-1 pb-2 border-b-2 text-sm font-semibold transition-colors ${
                isSelected
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-secondary hover:border-border-color hover:text-text-main'
            }`}
        >
            {children}
        </button>
    );
};

export const TabPanels: React.FC<{ children: ReactNode[] }> = ({ children }) => {
     return <>{React.Children.map(children, (child, index) => React.cloneElement(child as React.ReactElement<any>, { index }))}</>;
};

export const TabPanel: React.FC<{ children: ReactNode; index?: number }> = ({ children, index }) => {
    const { selectedIndex, baseId } = useTabs();
    const isSelected = selectedIndex === index;

    return (
        <div
            id={`${baseId}-panel-${index}`}
            role="tabpanel"
            tabIndex={0}
            aria-labelledby={`${baseId}-tab-${index}`}
            hidden={!isSelected}
            className="animate-fade-in space-y-6 focus:outline-none"
        >
            {isSelected && children}
        </div>
    );
};
