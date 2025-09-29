// types/ui.ts
import React from 'react';
import {
    EntityId,
    EntityTypeDefinition,
    Entity
} from './entities';
import {
    Inconsistency
} from './validation';
import {
    Locale
} from './i18n';
import {
    ViewType,
    ModalType
} from './enums';
import {
    Work,
    NarrativeScene,
    Series,
    Collection,
    Timeline,
    StoryStructureTemplate
} from './narrative';
import {
    InvolvedEntity
} from './events';
import {
    Snapshot
} from './snapshots';
import {
    Attributes
} from './forms';

// --- UI State ---
export interface UIState {
    activeView: ViewType;
    selectedId: EntityId | null; // e.g., the selected entity
    lastSelectedId: Record<string, EntityId | null>;
    modalStack: ModalState[];
    processingStack: ProcessingState[];
    onboardingStatus: OnboardingStatus;
    isSidebarOpen: boolean;
    isSidebarCollapsed: boolean;
    sidebarWidth: number;
    isValidationModalOpen: boolean;
    validationIssues: Inconsistency[];
    highlightEventId: string | null;
    dialogState: DialogState;
    isCommandPaletteOpen: boolean;
    referencePanelEntityId: EntityId | null;
    pinnedReferenceIds: EntityId[];
    typewriterMode: boolean;
    selectedWorkId: string | null;
    selectedSceneId: string | null;
    selectedNoteId: string | null;
    navigationState: { source: 'validation' } | null;
    theme: 'dark' | 'light' | 'system';
    distractionFreeMode: boolean;
    autosaveDelay: number;
    locale: Locale;
    customTheme: any | null; // Can be a complex object of colors
    dashboardLayout: string[];
    dashboardWidgets: Record<string, boolean>;
    toasts: ToastMessage[];
    unsavedChanges: Record<string, boolean>;
}

export type TimelineViewMode = 'combined' | 'swimlane';

export interface ProcessingState {
    message: string;
    progress?: number | null;
}

export type OnboardingStatus = 'pending' | 'active' | 'complete';

export interface DialogState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm?: () => void | Promise<void>;
    onClose?: () => void;
    confirmText?: string;
    cancelText?: string;
    actions?: {
        text: string;
        onClick: () => void | Promise<void>;
        variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
    }[];
}

// --- Modals ---
// This uses a discriminated union pattern.
export type ModalPayloads = {
    [ModalType.EVENT]: {
        eventId?: string;
        onSave: (data: { type: string; startDateTime: string; endDateTime?: string; notes: string; details: Attributes; involvedEntities: InvolvedEntity[] }) => Promise<void>;
    };
    [ModalType.WORLD_EVENT]: {
        eventId?: string; timelineId: string; onSave: (data: any) => void; prefilledDateTime?: string;
    };
    [ModalType.NEW_ENTITY]: {
        entityType: string; onSave: (data: any) => void; prefilledName?: string;
    };
    [ModalType.WRITING_GOALS]: {
        onSave: (goals: any) => void;
    };
    [ModalType.EXPORT_MANUSCRIPT]: {};
    [ModalType.WORK]: {
        workId?: string; onSave: (data: any, isEditing: boolean) => void;
    };
    [ModalType.SERIES]: {
        seriesId?: string; onSave: (data: any) => void;
    };
    [ModalType.COLLECTION]: {
        collectionId?: string; onSave: (data: any) => void;
    };
    [ModalType.SCENE]: {
        workId: string; sceneId?: string; onSave: (workId: string, sceneData: any) => void; chapterId?: string;
    };
    [ModalType.APPLY_STRUCTURE]: {
        workId: string;
    };
    [ModalType.EXPORT_COMPENDIUM]: {};
    [ModalType.CUSTOMIZE_DASHBOARD]: {};
    [ModalType.DELETE_TEMPLATE]: {
        templateId: string; entityType: string; onConfirm: (migrationTemplateId?: string) => void;
    };
    [ModalType.DELETE_ENTITY_TYPE]: {
        entityType: EntityTypeDefinition; onConfirm: (migrationTypeKey: string) => void;
    };
    [ModalType.SAVE_QUERY]: {
        onSave: (name: string) => void;
    };
    [ModalType.SCENE_HISTORY]: {
        sceneId: string;
    };
    [ModalType.TIMELINE]: {
        timelineId?: string; onSave: (data: any) => void;
    };
    [ModalType.STORY_STRUCTURE]: {
        structureId?: string;
    };
    [ModalType.DELETE_ENTITY]: {
        itemName: string; onConfirm: () => void; title: string; message: string;
    };
    [ModalType.GLOBAL_SEARCH]: {};
    [ModalType.SNAPSHOT_INSPECTOR]: {
        snapshot: Snapshot;
    };
    [ModalType.SNAPSHOT_COMPARISON]: {};
    [ModalType.ITEM_USAGE]: {
        itemId: string; itemName: string; itemType: 'Tag' | 'Theme' | 'Conflict';
    };
    [ModalType.LINK_ENTITY_TO_NODE]: {
        onSelect: (entityId: EntityId) => void;
    };
};

export type ModalState = {
    [K in keyof ModalPayloads]: {
        type: K;
        props: ModalPayloads[K];
    }
}[keyof ModalPayloads] | { type: null, props: {} };

// --- Toasts ---
export interface ToastMessage {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
    duration?: number;
}

// --- Querying ---
export interface FilterRule {
    id: string;
    subject: 'eventType' | 'eventDate' | 'involvedEntity' | 'sceneContent' | 'noteContent';
    operator: 'is' | 'is_not' | 'is_before' | 'is_after' | 'has' | 'has_not' | 'contains' | 'does_not_contain' | 'is_empty' | 'is_not_empty';
    value: any;
    entityProperty?: 'type' | 'name' | 'template' | 'templateAttribute';
    templateId?: string;
    attributeName?: string;
}

export type MatchType = 'AND' | 'OR';

export interface SavedQuery {
    id: string;
    name: string;
    rules: FilterRule[];
    matchType: MatchType;
}

// --- Settings ---
export interface UISettings {
    theme: 'dark' | 'light' | 'system';
    activeView: ViewType;
    lastSelectedId: Record<string, EntityId | null>;
    isSidebarOpen: boolean;
    autosaveDelay: number;
    locale: Locale;
    customTheme: any | null;
    dashboardLayout: string[];
    dashboardWidgets: Record<string, boolean>;
}

// --- Command Palette ---
export interface CommandAction {
    id: string;
    label: string;
    category: string;
    keywords?: string;
    icon: React.ReactNode;
    execute: () => void;
    condition?: () => boolean;
}
