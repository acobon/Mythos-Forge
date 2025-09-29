// types/enums.ts

export const ViewType = {
    DASHBOARD: 'dashboard',
    ENTITIES: 'entities',
    WORKS_ORGANIZER: 'works-organizer',
    MAP: 'map',
    MANUSCRIPT: 'manuscript',
    PLOTTING: 'plotting',
    TIMELINE: 'timeline',
    RELATIONSHIPS: 'relationships',
    RELATIONSHIP_TYPE_SETTINGS: 'relationship-type-settings',
    MIND_MAP: 'mind-map',
    QUERY: 'query',
    REPORTS: 'reports',
    TAGS: 'tags',
    EVENT_EDITOR: 'event-editor',
    TEMPLATE_EDITOR: 'template-editor',
    STORY_STRUCTURE_EDITOR: 'story-structure-editor',
    ENTITY_TYPE_SETTINGS: 'entity-type-settings',
    PROMPT_EDITOR: 'prompt-editor',
    ROLES: 'roles',
    CALENDAR: 'calendar',
    SNAPSHOTS: 'snapshots',
    THEME_SETTINGS: 'theme-settings',
    WRITING_ANALYTICS: 'analytics',
    RESEARCH: 'research',
    THEMES: 'themes',
    CONFLICTS: 'conflicts',
    MAINTENANCE: 'maintenance',
    NARRATIVE_ANALYSIS: 'narrative-analysis',
    TRASH: 'trash',
    ASSET_MANAGER: 'asset-manager',
    DICTIONARY: 'dictionary',
    HELP: 'help',
} as const;

export type ViewType = (typeof ViewType)[keyof typeof ViewType];

export const EntityType = {
    CHARACTER: 'character',
    LOCATION: 'location',
    OBJECT: 'object',
    ORGANIZATION: 'organization',
} as const;

export type EntityType = (typeof EntityType)[keyof typeof EntityType];

export const ModalType = {
    EVENT: 'event',
    WORLD_EVENT: 'worldEvent',
    NEW_ENTITY: 'newEntity',
    WRITING_GOALS: 'writingGoals',
    EXPORT_MANUSCRIPT: 'exportManuscript',
    WORK: 'work',
    SERIES: 'series',
    COLLECTION: 'collection',
    SCENE: 'scene',
    APPLY_STRUCTURE: 'applyStructure',
    EXPORT_COMPENDIUM: 'exportCompendium',
    CUSTOMIZE_DASHBOARD: 'customizeDashboard',
    DELETE_TEMPLATE: 'deleteTemplate',
    DELETE_ENTITY_TYPE: 'deleteEntityType',
    SAVE_QUERY: 'saveQuery',
    SCENE_HISTORY: 'sceneHistory',
    TIMELINE: 'timeline',
    STORY_STRUCTURE: 'storyStructure',
    DELETE_ENTITY: 'deleteEntity',
    GLOBAL_SEARCH: 'globalSearch',
    SNAPSHOT_INSPECTOR: 'snapshotInspector',
    SNAPSHOT_COMPARISON: 'snapshotComparison',
    ITEM_USAGE: 'itemUsage',
    LINK_ENTITY_TO_NODE: 'linkEntityToNode',
} as const;

export type ModalType = (typeof ModalType)[keyof typeof ModalType];