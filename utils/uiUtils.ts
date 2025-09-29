import { LOCAL_STORAGE_THEME_KEY } from '../constants';

const COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#f59e0b', // amber-500
  '#eab308', // yellow-500
  '#84cc16', // lime-500
  '#22c55e', // green-500
  '#10b981', // emerald-500
  '#14b8a6', // teal-500
  '#06b6d4', // cyan-500
  '#0ea5e9', // sky-500
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#a855f7', // purple-500
  '#d946ef', // fuchsia-500
  '#ec4899', // pink-500
  '#f43f5e', // rose-500
  '#78716c', // stone-500
];

export const generateTagColor = (index: number): string => {
    return COLORS[index % COLORS.length];
};

export const applyInitialTheme = () => {
    try {
        const theme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY) || 'system';
        const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.classList.toggle('theme-dark', isDark);
    } catch (e) {
        // Fallback to dark theme on error
        document.documentElement.classList.add('theme-dark');
    }
};
