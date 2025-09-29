// --- STORAGE AND DATABASE KEYS ---
export const IDB_NAME = 'MythosForgeDB';
export const IDB_VERSION = 5; // Incremented version for schema change
export const IDB_SNAPSHOTS_STORE = 'snapshots';
export const IDB_IMAGES_STORE = 'images';
export const IDB_DOCUMENTS_STORE = 'documents'; // For large text content (scenes, notes)
export const IDB_BIBLE_STORE = 'storyBibleSlices';

// Granular stores for main state
export const IDB_PROJECT_STORE = 'project';
export const IDB_ENTITIES_STORE = 'entities';
export const IDB_EVENTS_STORE = 'events';
export const IDB_NARRATIVE_STORE = 'narrative';
export const IDB_METADATA_STORE = 'metadata';
export const IDB_KNOWLEDGE_STORE = 'knowledge';


export const LOCAL_STORAGE_THEME_KEY = 'mythos-theme';
export const LOCAL_STORAGE_LOCALE_KEY = 'mythos-locale';
export const LOCAL_STORAGE_CUSTOM_THEME_KEY = 'mythos-custom-theme';
export const LOCAL_STORAGE_ONBOARDING_KEY = 'mythos-onboardingStatus_v1';
export const LOCAL_STORAGE_AUTOSAVE_DELAY_KEY = 'mythos-autosaveDelay';

// --- UI LAYOUT CONSTANTS ---
export const ENTITY_LIST_ITEM_HEIGHT = 40;
export const RESEARCH_NOTE_ITEM_HEIGHT = 60;
export const TAG_ITEM_HEIGHT = 40;


// Textarea with mentions dropdown constants
export const MENTION_DROPDOWN_HEIGHT = 240; // max-h-60
export const MENTION_POPUP_WIDTH = 256; // w-64

// Popover width for Character Arc scene/event linking
export const POPOVER_WIDTH = 320; // w-80

// Timeline Chart constants (using REM for scalability)
export const TIMELINE_POPUP_WIDTH_REM = 16; // 256px
export const TIMELINE_POPUP_VERTICAL_SPACING_REM = 10.625; // 170px
export const TIMELINE_POPUP_MAX_CONTENT_HEIGHT_REM = 8; // 128px
export const TIMELINE_SWIMLANE_HEIGHT_REM = 5; // 80px

// Relationship Graph constants
export const RELATIONSHIP_GRAPH_NODE_RADIUS = 30;
export const RELATIONSHIP_GRAPH_FONT_SIZE = 12;

// Reports View constants
export const VIRTUALIZED_MATRIX_CELL_SIZE = 100;

// --- Z-INDEX HIERARCHY ---
export const Z_INDEX = {
    STICKY_HEADER: 20,
    SIDEBAR: 30,
    ONBOARDING: 40,
    CONTEXT_MENU: 45,
    MODAL: 50,
    PROCESSING_OVERLAY: 100,
};

// --- CORE DATA CONSTANTS ---
export const VITAL_EVENTS = {
    BIRTH: 'BIRTH',
    DEATH: 'DEATH',
} as const;

export const WORK_TYPE = {
    NOVEL: 'Novel',
    NOVELLA: 'Novella',
    SHORT_STORY: 'Short Story',
    OTHER: 'Other',
} as const;

export const WORK_STATUS = {
    PLANNING: 'Planning',
    DRAFTING: 'Drafting',
    REVISING: 'Revising',
    COMPLETE: 'Complete',
} as const;

export const CONFLICT_TYPE = {
    INTERNAL: 'Internal',
    EXTERNAL: 'External',
} as const;

export const CONFLICT_STATUS = {
    ACTIVE: 'Active',
    RESOLVED: 'Resolved',
} as const;

export const REPORT_TYPE = {
    ORPHANED: 'orphaned',
    POV: 'pov',
    INTERACTION_MATRIX: 'interactionMatrix',
    RELATIONSHIP_MAP: 'relationshipMap',
    WORD_COUNT_TREND: 'wordCountTrend',
    SCENE_PACING: 'scenePacing',
    TAG_THEME_FREQUENCY: 'tagThemeFrequency',
    CHARACTER_MENTIONS: 'characterMentions',
    ITEM_USAGE: 'itemUsage',
} as const;