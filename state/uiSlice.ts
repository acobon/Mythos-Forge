

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { EntityId, DialogState, OnboardingStatus, UIState, Inconsistency, Locale, ModalState, ProcessingState, ToastMessage, ViewType } from '../types/index';
import { LOCAL_STORAGE_ONBOARDING_KEY, LOCAL_STORAGE_THEME_KEY, LOCAL_STORAGE_CUSTOM_THEME_KEY, LOCAL_STORAGE_LOCALE_KEY, LOCAL_STORAGE_AUTOSAVE_DELAY_KEY } from '../constants';

export const initialState: UIState = {
  activeView: 'dashboard',
  selectedId: null,
  lastSelectedId: {},
  modalStack: [],
  processingStack: [],
  onboardingStatus: (localStorage.getItem(LOCAL_STORAGE_ONBOARDING_KEY) as OnboardingStatus) || 'pending',
  isSidebarOpen: false,
  isSidebarCollapsed: false, // New state for desktop collapsed view
  sidebarWidth: 288,
  isValidationModalOpen: false,
  validationIssues: [],
  highlightEventId: null,
  dialogState: { isOpen: false, title: '', message: '' },
  isCommandPaletteOpen: false,
  referencePanelEntityId: null,
  pinnedReferenceIds: [],
  typewriterMode: false, // New
  selectedWorkId: null,
  selectedSceneId: null,
  selectedNoteId: null,
  navigationState: null,
  theme: (localStorage.getItem(LOCAL_STORAGE_THEME_KEY) as 'dark' | 'light' | 'system') || 'system',
  distractionFreeMode: false,
  autosaveDelay: Number(localStorage.getItem(LOCAL_STORAGE_AUTOSAVE_DELAY_KEY)) || 1500,
  locale: (localStorage.getItem(LOCAL_STORAGE_LOCALE_KEY) as Locale) || 'en',
  customTheme: JSON.parse(localStorage.getItem(LOCAL_STORAGE_CUSTOM_THEME_KEY) || 'null'),
  dashboardLayout: ['stats', 'actions', 'writingGoals', 'recentlyEdited', 'scratchpad', 'gettingStarted'],
  dashboardWidgets: {
    stats: true,
    actions: true,
    writingGoals: true,
    recentlyEdited: true,
    scratchpad: true,
    gettingStarted: true,
  },
  toasts: [],
  unsavedChanges: {},
};

export const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setView: (state, action: PayloadAction<ViewType>) => {
            state.lastSelectedId[state.activeView] = state.selectedId;
            state.activeView = action.payload;
            state.selectedId = null;
            state.navigationState = null;
        },
        setSelectedId: (state, action: PayloadAction<EntityId | null>) => {
            state.selectedId = action.payload;
            state.navigationState = null;
        },
        navigateToEntity: (state, action: PayloadAction<{ entityId: EntityId, source?: 'validation', highlightEventId?: string }>) => {
            state.activeView = 'entities';
            state.selectedId = action.payload.entityId;
            state.navigationState = action.payload.source ? { source: action.payload.source } : null;
            state.highlightEventId = action.payload.highlightEventId || null;
            state.isValidationModalOpen = action.payload.source === 'validation' ? false : state.isValidationModalOpen;
        },
        pushProcessing: (state, action: PayloadAction<{ message: string, progress?: number | null }>) => {
            state.processingStack.push(action.payload);
        },
        popProcessing: (state) => {
            state.processingStack.pop();
        },
        updateProcessing: (state, action: PayloadAction<{ progress: number }>) => {
            if (state.processingStack.length > 0) {
                const lastItem = state.processingStack[state.processingStack.length - 1];
                if (lastItem) {
                    lastItem.progress = action.payload.progress;
                }
            }
        },
        setSidebarOpen: (state, action: PayloadAction<boolean>) => {
            state.isSidebarOpen = action.payload;
        },
        toggleSidebarCollapsed: (state) => {
            state.isSidebarCollapsed = !state.isSidebarCollapsed;
        },
        setSidebarWidth: (state, action: PayloadAction<number>) => {
            state.sidebarWidth = action.payload;
        },
        setHighlightEvent: (state, action: PayloadAction<string | null>) => {
            state.highlightEventId = action.payload;
        },
        pushModal: (state, action: PayloadAction<Exclude<ModalState, { type: null }>>) => {
            state.modalStack.push(action.payload);
        },
        popModal: (state) => {
            state.modalStack.pop();
        },
        startOnboarding: (state) => {
            state.onboardingStatus = 'active';
        },
        completeOnboarding: (state) => {
            localStorage.setItem(LOCAL_STORAGE_ONBOARDING_KEY, 'complete');
            state.onboardingStatus = 'complete';
        },
        openValidationModal: (state, action: PayloadAction<Inconsistency[]>) => {
            state.isValidationModalOpen = true;
            state.validationIssues = action.payload;
        },
        closeValidationModal: (state) => {
            state.isValidationModalOpen = false;
            state.navigationState = null;
        },
        showDialog: (state, action: PayloadAction<Partial<DialogState> & { title: string, message: string }>) => {
            state.dialogState = { ...action.payload, isOpen: true };
        },
        hideDialog: (state) => {
            state.dialogState = { isOpen: false, title: '', message: '' };
        },
        toggleCommandPalette: (state) => {
            state.isCommandPaletteOpen = !state.isCommandPaletteOpen;
        },
        setReferencePanelId: (state, action: PayloadAction<EntityId | null>) => {
            state.referencePanelEntityId = action.payload;
        },
        pinReferenceId: (state, action: PayloadAction<EntityId>) => {
            if (!state.pinnedReferenceIds.includes(action.payload)) {
                state.pinnedReferenceIds.push(action.payload);
            }
            state.referencePanelEntityId = action.payload;
        },
        unpinReferenceId: (state, action: PayloadAction<EntityId>) => {
            state.pinnedReferenceIds = state.pinnedReferenceIds.filter(id => id !== action.payload);
            if (state.referencePanelEntityId === action.payload) {
                state.referencePanelEntityId = state.pinnedReferenceIds[0] || null;
            }
        },
        toggleTypewriterMode: (state) => {
            state.typewriterMode = !state.typewriterMode;
        },
        setSelectedNoteId: (state, action: PayloadAction<string | null>) => {
            state.selectedNoteId = action.payload;
        },
        navigateToNote: (state, action: PayloadAction<{ noteId: string }>) => {
            state.activeView = 'research';
            state.selectedNoteId = action.payload.noteId;
        },
        navigateToWorldEvent: (state, action: PayloadAction<{ eventId: string }>) => {
            state.activeView = 'timeline';
            state.highlightEventId = action.payload.eventId;
        },
        toggleTheme: (state) => {
            const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
            const currentIndex = themes.indexOf(state.theme);
            const newTheme = themes[(currentIndex + 1) % themes.length];
            localStorage.setItem(LOCAL_STORAGE_THEME_KEY, newTheme);
            state.theme = newTheme;
        },
        toggleDistractionFreeMode: (state) => {
            state.distractionFreeMode = !state.distractionFreeMode;
        },
        setCustomTheme: (state, action: PayloadAction<UIState['customTheme']>) => {
            localStorage.setItem(LOCAL_STORAGE_CUSTOM_THEME_KEY, JSON.stringify(action.payload));
            state.customTheme = action.payload;
        },
        resetTheme: (state) => {
            localStorage.removeItem(LOCAL_STORAGE_CUSTOM_THEME_KEY);
            state.customTheme = null;
        },
        setLocale: (state, action: PayloadAction<Locale>) => {
            localStorage.setItem(LOCAL_STORAGE_LOCALE_KEY, action.payload as string);
            state.locale = action.payload;
        },
        setAutosaveDelay: (state, action: PayloadAction<number>) => {
            const delay = Math.max(500, Math.min(5000, action.payload));
            state.autosaveDelay = delay;
            localStorage.setItem(LOCAL_STORAGE_AUTOSAVE_DELAY_KEY, String(delay));
        },
        applySettings: (state, action: PayloadAction<Partial<UIState>>) => {
            const { theme, activeView, lastSelectedId, isSidebarOpen, autosaveDelay, locale, customTheme, dashboardLayout, dashboardWidgets } = action.payload;
            if (theme) state.theme = theme;
            if (activeView) state.activeView = activeView;
            if (lastSelectedId) state.lastSelectedId = lastSelectedId;
            if (isSidebarOpen) state.isSidebarOpen = isSidebarOpen;
            if (autosaveDelay) state.autosaveDelay = autosaveDelay;
            if (locale) state.locale = locale;
            if (customTheme) state.customTheme = customTheme;
            if (dashboardLayout) state.dashboardLayout = dashboardLayout;
            if (dashboardWidgets) state.dashboardWidgets = dashboardWidgets;
        },
        setDashboardLayout: (state, action: PayloadAction<string[]>) => {
            state.dashboardLayout = action.payload;
        },
        setDashboardWidgets: (state, action: PayloadAction<Record<string, boolean>>) => {
            state.dashboardWidgets = action.payload;
        },
        addToast: (state, action: PayloadAction<Omit<ToastMessage, 'id'>>) => {
            state.toasts.push({ ...action.payload, id: crypto.randomUUID() });
        },
        removeToast: (state, action: PayloadAction<string>) => {
            state.toasts = state.toasts.filter(t => t.id !== action.payload);
        },
        addUnsavedChange: (state, action: PayloadAction<string>) => {
            state.unsavedChanges[action.payload] = true;
        },
        removeUnsavedChange: (state, action: PayloadAction<string>) => {
            delete state.unsavedChanges[action.payload];
        },
    },
});

export const { 
    setView, setSelectedId, navigateToEntity, pushProcessing, popProcessing, updateProcessing,
    setSidebarOpen, toggleSidebarCollapsed, setSidebarWidth, setHighlightEvent, pushModal, popModal, startOnboarding, completeOnboarding,
    openValidationModal, closeValidationModal, showDialog, hideDialog, toggleCommandPalette,
    setReferencePanelId, pinReferenceId, unpinReferenceId, toggleTypewriterMode,
    toggleTheme,
    toggleDistractionFreeMode, setCustomTheme, resetTheme, setLocale, applySettings,
    setSelectedNoteId, navigateToNote, navigateToWorldEvent, setDashboardLayout,
    setDashboardWidgets, addToast, removeToast, setAutosaveDelay,
    addUnsavedChange, removeUnsavedChange
} = uiSlice.actions;

export default uiSlice.reducer;