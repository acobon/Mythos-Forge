// data/sidebar-config.tsx
import React from 'react';
import {
    LayoutDashboardIcon, UsersIcon, MapPinIcon, FileTextIcon, KanbanSquareIcon,
    ClockIcon, LinkIcon, NotebookIcon, FilterIcon, PieChartIcon,
    BarChartIcon, PaletteIcon, TagIcon, EditIcon, ClipboardListIcon, CalendarDaysIcon,
    ShieldCheckIcon, ArchiveIcon, UploadIcon, DownloadIcon, BookOpenIcon, TrashIcon, SearchIcon, Wand2Icon, BrainCircuitIcon, BookIcon, ImageIcon, AtSignIcon, HelpCircleIcon
} from '../components/common/Icons';
import { TranslationKey, ViewType } from '../types';

export interface SidebarItemConfig {
    id: string;
    labelKey: TranslationKey;
    icon: React.ReactNode;
    view?: ViewType;
    action?: { type: string; payload?: any };
    tooltipKey?: TranslationKey;
    variant?: 'destructive';
}

export interface SidebarSectionConfig {
    titleKey: TranslationKey;
    items: SidebarItemConfig[];
    startCollapsed?: boolean;
}

const iconProps = { className: "w-5 h-5 mr-3" };

export const sidebarConfig: SidebarSectionConfig[] = [
    {
        titleKey: "sidebar.workspace",
        items: [
            { id: 'dashboard', labelKey: 'sidebar.dashboard', icon: <LayoutDashboardIcon {...iconProps} />, view: ViewType.DASHBOARD },
            { id: 'command-palette', labelKey: 'sidebar.commandPalette', icon: <SearchIcon {...iconProps} />, action: { type: 'OPEN_COMMAND_PALETTE' }, tooltipKey: 'sidebar.tooltips.commandPalette' },
            { id: 'global-search', labelKey: 'sidebar.globalSearch', icon: <SearchIcon {...iconProps} />, action: { type: 'OPEN_GLOBAL_SEARCH' } },
            { id: 'entities', labelKey: 'sidebar.entities', icon: <UsersIcon {...iconProps} />, view: ViewType.ENTITIES },
            { id: 'works-organizer', labelKey: 'sidebar.worksOrganizer', icon: <BookOpenIcon {...iconProps} />, view: ViewType.WORKS_ORGANIZER },
            { id: 'map', labelKey: 'sidebar.map', icon: <MapPinIcon {...iconProps} />, view: ViewType.MAP },
            { id: 'mindmap', labelKey: 'sidebar.mindMap', icon: <BrainCircuitIcon {...iconProps} />, view: ViewType.MIND_MAP, tooltipKey: 'sidebar.tooltips.mindMap' },
            { id: 'manuscript', labelKey: 'sidebar.writingStudio', icon: <FileTextIcon {...iconProps} />, view: ViewType.MANUSCRIPT },
            { id: 'plotting', labelKey: 'sidebar.planningBoard', icon: <KanbanSquareIcon {...iconProps} />, view: ViewType.PLOTTING, tooltipKey: 'sidebar.tooltips.plotting' },
            { id: 'timeline', labelKey: 'sidebar.timeline', icon: <ClockIcon {...iconProps} />, view: ViewType.TIMELINE },
            { id: 'relationships', labelKey: 'sidebar.relationships', icon: <LinkIcon {...iconProps} />, view: ViewType.RELATIONSHIPS },
            { id: 'research', labelKey: 'sidebar.research', icon: <NotebookIcon {...iconProps} />, view: ViewType.RESEARCH },
            { id: 'themes', labelKey: 'sidebar.themes', icon: <BookOpenIcon {...iconProps} />, view: ViewType.THEMES },
            { id: 'conflicts', labelKey: 'sidebar.conflicts', icon: <UsersIcon {...iconProps} />, view: ViewType.CONFLICTS },
            { id: 'query', labelKey: 'sidebar.query', icon: <FilterIcon {...iconProps} />, view: ViewType.QUERY, tooltipKey: 'sidebar.tooltips.query' },
            { id: 'reports', labelKey: 'sidebar.reports', icon: <PieChartIcon {...iconProps} />, view: ViewType.REPORTS, tooltipKey: 'sidebar.tooltips.reports' },
            { id: 'narrative-analysis', labelKey: 'sidebar.narrativeAnalysis', icon: <BrainCircuitIcon {...iconProps} />, view: ViewType.NARRATIVE_ANALYSIS, tooltipKey: 'sidebar.tooltips.narrativeAnalysis' },
            { id: 'analytics', labelKey: 'sidebar.analytics', icon: <BarChartIcon {...iconProps} />, view: ViewType.WRITING_ANALYTICS },
        ]
    },
    {
        titleKey: "sidebar.settings",
        startCollapsed: true,
        items: [
            { id: 'theme-settings', labelKey: 'sidebar.theme', icon: <PaletteIcon {...iconProps} />, view: ViewType.THEME_SETTINGS },
            { id: 'tags', labelKey: 'sidebar.tags', icon: <TagIcon {...iconProps} />, view: ViewType.TAGS },
            { id: 'entity-type-settings', labelKey: 'sidebar.entityTypeEditor', icon: <UsersIcon {...iconProps} />, view: ViewType.ENTITY_TYPE_SETTINGS, tooltipKey: 'sidebar.tooltips.entityTypeEditor' },
            { id: 'event-editor', labelKey: 'sidebar.eventEditor', icon: <EditIcon {...iconProps} />, view: ViewType.EVENT_EDITOR, tooltipKey: 'sidebar.tooltips.eventEditor' },
            { id: 'template-editor', labelKey: 'sidebar.templateEditor', icon: <ClipboardListIcon {...iconProps} />, view: ViewType.TEMPLATE_EDITOR, tooltipKey: 'sidebar.tooltips.templateEditor' },
            { id: 'structure-editor', labelKey: 'sidebar.structureEditor', icon: <BookIcon {...iconProps} />, view: ViewType.STORY_STRUCTURE_EDITOR },
            { id: 'prompt-editor', labelKey: 'sidebar.promptEditor', icon: <EditIcon {...iconProps} />, view: ViewType.PROMPT_EDITOR },
            { id: 'dictionary', labelKey: 'sidebar.dictionary', icon: <AtSignIcon {...iconProps} />, view: ViewType.DICTIONARY, tooltipKey: 'sidebar.tooltips.dictionary' },
            { id: 'roles', labelKey: 'sidebar.roleManagement', icon: <TagIcon {...iconProps} />, view: ViewType.ROLES },
            { id: 'relationship-types', labelKey: 'sidebar.relationshipTypes', icon: <LinkIcon {...iconProps} />, view: ViewType.RELATIONSHIP_TYPE_SETTINGS },
            { id: 'calendar', labelKey: 'sidebar.calendar', icon: <CalendarDaysIcon {...iconProps} />, view: ViewType.CALENDAR },
            { id: 'validate', labelKey: 'sidebar.validate', icon: <ShieldCheckIcon {...iconProps} />, action: { type: 'VALIDATE_TIMELINE' }, tooltipKey: 'sidebar.tooltips.validate' },
        ]
    },
    {
        titleKey: "sidebar.project",
        startCollapsed: true,
        items: [
            { id: 'asset-manager', labelKey: 'sidebar.assetManager', icon: <ImageIcon {...iconProps} />, view: ViewType.ASSET_MANAGER, tooltipKey: 'sidebar.tooltips.assetManager' },
            { id: 'snapshots', labelKey: 'sidebar.snapshots', icon: <ArchiveIcon {...iconProps} />, view: ViewType.SNAPSHOTS, tooltipKey: 'sidebar.tooltips.snapshots' },
            { id: 'help', labelKey: 'sidebar.help', icon: <HelpCircleIcon {...iconProps} />, view: ViewType.HELP, tooltipKey: 'sidebar.tooltips.help' },
            { id: 'maintenance', labelKey: 'sidebar.maintenance', icon: <Wand2Icon {...iconProps} />, view: ViewType.MAINTENANCE, tooltipKey: 'sidebar.tooltips.maintenance' },
            { id: 'trash', labelKey: 'sidebar.trash', icon: <TrashIcon {...iconProps} />, view: ViewType.TRASH },
            { id: 'upload-project', labelKey: 'sidebar.uploadProject', icon: <UploadIcon {...iconProps} />, action: { type: 'UPLOAD_PROJECT' } },
            { id: 'import-markdown', labelKey: 'sidebar.importMarkdown', icon: <UploadIcon {...iconProps} />, action: { type: 'IMPORT_MARKDOWN' } },
            { id: 'download-project', labelKey: 'sidebar.downloadProject', icon: <DownloadIcon {...iconProps} />, action: { type: 'DOWNLOAD_PROJECT' } },
            { id: 'export-project-as-markdown', labelKey: 'sidebar.exportProjectAsMarkdown', icon: <BookOpenIcon {...iconProps} />, action: { type: 'EXPORT_PROJECT_AS_MARKDOWN' } },
            { id: 'export-manuscript', labelKey: 'sidebar.exportManuscript', icon: <BookOpenIcon {...iconProps} />, action: { type: 'EXPORT_MANUSCRIPT' } },
            { id: 'export-compendium', labelKey: 'sidebar.exportCompendium', icon: <BookOpenIcon {...iconProps} />, action: { type: 'EXPORT_COMPENDIUM' } },
            { id: 'export-settings', labelKey: 'sidebar.exportSettings', icon: <DownloadIcon {...iconProps} />, action: { type: 'EXPORT_SETTINGS' } },
            { id: 'import-settings', labelKey: 'sidebar.importSettings', icon: <UploadIcon {...iconProps} />, action: { type: 'IMPORT_SETTINGS' } },
        ]
    },
    {
        titleKey: "sidebar.dangerZone",
        items: [
             { id: 'new-project', labelKey: 'sidebar.newProject', icon: <TrashIcon {...iconProps} />, action: { type: 'NEW_PROJECT' }, variant: 'destructive' },
        ]
    }
];