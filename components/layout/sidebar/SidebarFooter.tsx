// components/layout/sidebar/SidebarFooter.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../../../state/hooks';
import { toggleTheme, setLocale, toggleSidebarCollapsed } from '../../../state/uiSlice';
import { useI18n } from '../../../hooks/useI18n';
import { TranslationKey } from '../../../types';
import { Button } from '../../common/ui';
import { SunIcon, MoonIcon, SettingsIcon, ChevronsRightIcon } from '../../common/Icons';

const SidebarFooter: React.FC = () => {
    const dispatch = useAppDispatch();
    const { theme, locale, isSidebarCollapsed } = useAppSelector(state => state.ui);
    const { t } = useI18n();
    const langRef = useRef<HTMLDivElement>(null);
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (langRef.current && !langRef.current.contains(event.target as Node)) {
                setIsLangMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [langRef]);

    const handleThemeToggle = () => dispatch(toggleTheme());

    const getNextThemeInfo = () => {
        if (theme === 'light') return { next: 'dark', labelKey: 'sidebar.theme.dark' as TranslationKey };
        if (theme === 'dark') return { next: 'system', labelKey: 'sidebar.theme.system' as TranslationKey };
        return { next: 'light', labelKey: 'sidebar.theme.light' as TranslationKey };
    };

    const ThemeIcon = () => {
        if (theme === 'light') return <SunIcon className="w-5 h-5" />;
        if (theme === 'dark') return <MoonIcon className="w-5 h-5" />;
        return <SettingsIcon className="w-5 h-5" />;
    };

    const nextThemeInfo = getNextThemeInfo();

    return (
        <div className={`p-4 border-t border-border-color flex-shrink-0 space-y-2 ${isSidebarCollapsed ? '!p-2' : ''}`}>
            <div className={`flex items-center ${isSidebarCollapsed ? 'flex-col gap-2' : 'justify-between'}`}>
                {!isSidebarCollapsed && <span className="font-semibold text-sm">{t('sidebar.appearance')}</span>}
                <Button variant="ghost" size="icon" onClick={handleThemeToggle} className="p-1 rounded-md hover:bg-primary" title={t('sidebar.toggleTheme', { theme: t(nextThemeInfo.labelKey) })}>
                    <ThemeIcon />
                </Button>
            </div>
            <div ref={langRef} className="relative">
                {!isSidebarCollapsed && (
                    <div className="flex items-center justify-between text-sm">
                        <label htmlFor="language-select" className="font-semibold">{t('sidebar.language')}</label>
                        <button onClick={() => setIsLangMenuOpen(o => !o)} className="px-2 py-1 rounded hover:bg-primary">{String(locale).toUpperCase()}</button>
                    </div>
                )}
                {isLangMenuOpen && !isSidebarCollapsed && (
                    <div className="absolute bottom-full right-0 mb-1 w-28 rounded-md bg-primary border border-border-color shadow-lg p-1 z-10">
                        <button onClick={() => { dispatch(setLocale('en')); setIsLangMenuOpen(false); }} className="w-full text-left px-2 py-1 rounded hover:bg-secondary">English</button>
                        <button onClick={() => { dispatch(setLocale('es')); setIsLangMenuOpen(false); }} className="w-full text-left px-2 py-1 rounded hover:bg-secondary">Español</button>
                    </div>
                )}
            </div>
            <Button variant="ghost" onClick={() => dispatch(toggleSidebarCollapsed())} className="w-full !justify-center hidden md:!flex">
                <ChevronsRightIcon className={`w-5 h-5 transition-transform duration-300 ${isSidebarCollapsed ? '' : 'rotate-180'}`} />
            </Button>
        </div>
    );
};

export default SidebarFooter;