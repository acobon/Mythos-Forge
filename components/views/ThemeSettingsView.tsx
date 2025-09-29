import React, { useState, useEffect } from 'react';
import { SunIcon, MoonIcon, RefreshCwIcon } from '../common/Icons';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { toggleTheme, setCustomTheme, resetTheme, showDialog, setAutosaveDelay } from '../../state/uiSlice';

type ThemeColors = {
    primary: string;
    secondary: string;
    accent: string;
    highlight: string;
    'text-main': string;
    'text-secondary': string;
    'border-color': string;
    'viz-1': string;
    'viz-2': string;
    'viz-3': string;
    'viz-4': string;
    'viz-5': string;
    'viz-6': string;
    'viz-7': string;
};

const defaultLightTheme: ThemeColors = {
    primary: '#f9fafb',
    secondary: '#f3f4f6',
    accent: '#d97706',
    highlight: '#f59e0b',
    'text-main': '#111827',
    'text-secondary': '#4b5563',
    'border-color': '#d1d5db',
    'viz-1': '#7c3aed',
    'viz-2': '#059669',
    'viz-3': '#db2777',
    'viz-4': '#d97706',
    'viz-5': '#2563eb',
    'viz-6': '#dc2626',
    'viz-7': '#0891b2',
};

const defaultDarkTheme: ThemeColors = {
    primary: '#282c34',
    secondary: '#3a4049',
    accent: '#f59e0b',
    highlight: '#fbbf24',
    'text-main': '#f3f4f6',
    'text-secondary': '#9ca3af',
    'border-color': '#4b5563',
    'viz-1': '#8b5cf6',
    'viz-2': '#10b981',
    'viz-3': '#ec4899',
    'viz-4': '#f59e0b',
    'viz-5': '#3b82f6',
    'viz-6': '#ef4444',
    'viz-7': '#06b6d4',
};

// --- COLOR CONTRAST UTILITIES ---
const hexToRgb = (hex: string): [number, number, number] | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
};

const getLuminance = (r: number, g: number, b: number): number => {
    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

const getContrastRatio = (color1: string, color2: string): number => {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    if (!rgb1 || !rgb2) return 1;
    const lum1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
    const lum2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
    return lum1 > lum2 ? (lum1 + 0.05) / (lum2 + 0.05) : (lum2 + 0.05) / (lum1 + 0.05);
};

const getWcagRating = (ratio: number): 'Fail' | 'AA' | 'AAA' => {
    if (ratio >= 7) return 'AAA';
    if (ratio >= 4.5) return 'AA';
    return 'Fail';
};

const ContrastChecker: React.FC<{ fg: string; bg: string; label: string }> = ({ fg, bg, label }) => {
    const ratio = getContrastRatio(fg, bg);
    const rating = getWcagRating(ratio);
    const ratingColors = {
        Fail: 'text-red-400',
        AA: 'text-yellow-400',
        AAA: 'text-green-400',
    };
    return (
        <div className="flex justify-between items-center text-sm p-2 bg-primary rounded">
            <span className="text-text-secondary">{label}</span>
            <div className="flex items-center gap-2">
                 {rating === 'Fail' && <span className="text-red-400 font-bold" title="Low contrast">⚠️</span>}
                 <span className={`${ratingColors[rating]} font-mono font-bold`}>{rating}</span>
                 <span className="text-text-secondary font-mono">{ratio.toFixed(2)}:1</span>
            </div>
        </div>
    );
};


const ThemeSettingsView: React.FC = () => {
    const dispatch = useAppDispatch();
    const { theme, customTheme, autosaveDelay } = useAppSelector(state => state.ui);
    const [colors, setColors] = useState<ThemeColors>(customTheme || (theme === 'dark' ? defaultDarkTheme : defaultLightTheme));

    useEffect(() => {
        setColors(customTheme || (theme === 'dark' ? defaultDarkTheme : defaultLightTheme));
    }, [customTheme, theme]);

    const handleColorChange = (key: keyof ThemeColors, value: string) => {
        setColors(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        dispatch(setCustomTheme(colors));
    };

    const handleReset = () => {
        dispatch(showDialog({
                title: 'Reset Theme?',
                message: 'Are you sure you want to discard your custom colors and reset to the default theme?',
                onConfirm: () => {
                    dispatch(resetTheme());
                    setColors(theme === 'dark' ? defaultDarkTheme : defaultLightTheme);
                }
            }
        ));
    };
    
    const handleToggleBaseTheme = () => {
        dispatch(toggleTheme());
    };

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            <h2 className="text-3xl font-bold text-text-main mb-4">Theme & Appearance</h2>
            <div className="space-y-6 max-w-4xl">
                <section className="bg-secondary p-4 rounded-lg border border-border-color">
                    <h3 className="text-xl font-semibold mb-2">Base Theme</h3>
                    <div className="flex items-center justify-between">
                        <p className="text-text-secondary">Select the base light or dark theme.</p>
                        <button onClick={handleToggleBaseTheme} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary hover:bg-border-color">
                            {theme === 'dark' ? <SunIcon className="w-5 h-5"/> : <MoonIcon className="w-5 h-5"/>}
                            <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'}</span>
                        </button>
                    </div>
                </section>

                <section className="bg-secondary p-4 rounded-lg border border-border-color">
                    <h3 className="text-xl font-semibold mb-2">General Settings</h3>
                    <div>
                        <label htmlFor="autosave-delay" className="block text-sm font-medium text-text-secondary">
                            Autosave Delay ({autosaveDelay}ms)
                        </label>
                        <input
                            id="autosave-delay"
                            type="range"
                            min="500"
                            max="5000"
                            step="250"
                            value={autosaveDelay}
                            onChange={e => dispatch(setAutosaveDelay(Number(e.target.value)))}
                            className="w-full h-2 bg-primary rounded-lg appearance-none cursor-pointer mt-1 accent-accent"
                        />
                        <div className="flex justify-between text-xs text-text-secondary px-1">
                            <span>Faster (500ms)</span>
                            <span>Slower (5s)</span>
                        </div>
                    </div>
                </section>
                
                <section className="bg-secondary p-4 rounded-lg border border-border-color">
                    <h3 className="text-xl font-semibold mb-4">Custom Colors</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-3">
                             <h4 className="font-bold text-text-secondary">Core Palette</h4>
                            {Object.entries(colors).slice(0, 7).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between">
                                    <label htmlFor={`color-${key}`} className="capitalize text-text-main">{key.replace('-', ' ')}</label>
                                    <input
                                        id={`color-${key}`}
                                        type="color"
                                        value={value}
                                        onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                                        className="bg-transparent border-0 rounded-md"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="space-y-3">
                             <h4 className="font-bold text-text-secondary">Data Visualization</h4>
                              {Object.entries(colors).slice(7).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between">
                                    <label htmlFor={`color-${key}`} className="capitalize text-text-main">{key.replace('-', ' ')}</label>
                                    <input
                                        id={`color-${key}`}
                                        type="color"
                                        value={value}
                                        onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                                        className="bg-transparent border-0 rounded-md"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="space-y-3">
                            <h4 className="font-bold text-text-secondary">Accessibility Check</h4>
                            <ContrastChecker fg={colors['text-main']} bg={colors.primary} label="Main Text / Primary BG" />
                            <ContrastChecker fg={colors['text-main']} bg={colors.secondary} label="Main Text / Secondary BG" />
                            <ContrastChecker fg={colors['text-secondary']} bg={colors.primary} label="Subtle Text / Primary BG" />
                            <ContrastChecker fg={colors['text-secondary']} bg={colors.secondary} label="Subtle Text / Secondary BG" />
                            <ContrastChecker fg={colors.accent} bg={colors.primary} label="Accent / Primary BG" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button onClick={handleReset} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary hover:bg-border-color">
                            <RefreshCwIcon className="w-4 h-4" /> Reset to Default
                        </button>
                        <button onClick={handleSave} className="px-4 py-1.5 rounded-md bg-accent text-white hover:bg-highlight">
                            Apply Custom Theme
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ThemeSettingsView;