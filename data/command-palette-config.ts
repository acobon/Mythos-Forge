// data/command-palette-config.ts
import React from 'react';
import { 
    PlusCircleIcon, UserIcon, MapPinIcon, DiamondIcon, UsersIcon, LayoutDashboardIcon, 
    FileTextIcon, KanbanSquareIcon, ClockIcon, LinkIcon, FilterIcon, PieChartIcon, 
    BarChartIcon, PaletteIcon, TagIcon, EditIcon, ClipboardListIcon, CalendarDaysIcon, 
    ShieldCheckIcon, ArchiveIcon, MinimizeIcon,
    BrainCircuitIcon, BookOpenIcon, NotebookIcon, SearchIcon
} from '../components/common/Icons';
import { EntityType, UIState, Entity, Work, CommandAction, TranslationKey, ViewType, ModalType, InvolvedEntity } from '../types';
import { useEventActions } from '../hooks/useEventActions';

interface Context {
    uiState: UIState;
    uiDispatch: React.Dispatch<any>;
    addNewEntity: (type: EntityType) => void;
    selectedEntity?: Entity;
    selectedWork?: Work;
    t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string;
    navigateToView: (view: ViewType) => void;
}

export const getCommandPaletteActions = (context: Context): CommandAction[] => {
    const { uiState, uiDispatch, addNewEntity, selectedEntity, selectedWork, t, navigateToView } = context;
    const { activeView } = uiState;
    const iconProps = { className: "w-5 h-5 mr-3 text-text-secondary" };

    const staticActions: CommandAction[] = [
        // Creation
        { id: 'new-character', label: 'New Character', category: 'Create', keywords: 'person', icon: React.createElement(UserIcon, iconProps), execute: () => addNewEntity(EntityType.CHARACTER) },
        { id: 'new-location', label: 'New Location', category: 'Create', keywords: 'place map', icon: React.createElement(MapPinIcon, iconProps), execute: () => addNewEntity(EntityType.LOCATION) },
        { id: 'new-object', label: 'New Object', category: 'Create', keywords: 'item thing', icon: React.createElement(DiamondIcon, iconProps), execute: () => addNewEntity(EntityType.OBJECT) },
        { id: 'new-organization', label: 'New Organization', category: 'Create', keywords: 'group faction', icon: React.createElement(UsersIcon, iconProps), execute: () => addNewEntity(EntityType.ORGANIZATION) },
        { id: 'add-world-event', label: 'Add World Event', category: 'Create', keywords: 'timeline history', icon: React.createElement(PlusCircleIcon, iconProps), execute: () => uiDispatch({ type: 'PUSH_MODAL', payload: { type: ModalType.WORLD_EVENT, props: {} } }) },
        
        // Navigation
        { id: 'nav-dashboard', label: 'Go to Dashboard', category: 'Navigate', icon: React.createElement(LayoutDashboardIcon, iconProps), execute: () => navigateToView(ViewType.DASHBOARD), condition: () => activeView !== ViewType.DASHBOARD },
        { id: 'nav-entities', label: 'Go to Entities', category: 'Navigate', icon: React.createElement(UsersIcon, iconProps), execute: () => navigateToView(ViewType.ENTITIES), condition: () => activeView !== ViewType.ENTITIES },
        { id: 'nav-works-organizer', label: 'Go to Works Organizer', category: 'Navigate', icon: React.createElement(BookOpenIcon, iconProps), execute: () => navigateToView(ViewType.WORKS_ORGANIZER), condition: () => activeView !== ViewType.WORKS_ORGANIZER },
        { id: 'nav-map', label: 'Go to Interactive Map', category: 'Navigate', icon: React.createElement(MapPinIcon, iconProps), execute: () => navigateToView(ViewType.MAP), condition: () => activeView !== ViewType.MAP },
        { id: 'nav-manuscript', label: 'Go to Manuscript', category: 'Navigate', icon: React.createElement(FileTextIcon, iconProps), execute: () => navigateToView(ViewType.MANUSCRIPT), condition: () => activeView !== ViewType.MANUSCRIPT },
        { id: 'nav-plotting', label: 'Go to Plotting Board', category: 'Navigate', icon: React.createElement(KanbanSquareIcon, iconProps), execute: () => navigateToView(ViewType.PLOTTING), condition: () => activeView !== ViewType.PLOTTING },
        { id: 'nav-timeline', label: 'Go to World Timeline', category: 'Navigate', icon: React.createElement(ClockIcon, iconProps), execute: () => navigateToView(ViewType.TIMELINE), condition: () => activeView !== ViewType.TIMELINE },
        { id: 'nav-relationships', label: 'Go to Relationships', category: 'Navigate', icon: React.createElement(LinkIcon, iconProps), execute: () => navigateToView(ViewType.RELATIONSHIPS), condition: () => activeView !== ViewType.RELATIONSHIPS },
        { id: 'nav-research', label: 'Go to Research', category: 'Navigate', icon: React.createElement(NotebookIcon, iconProps), execute: () => navigateToView(ViewType.RESEARCH), condition: () => activeView !== ViewType.RESEARCH },
        { id: 'nav-themes', label: 'Go to Themes', category: 'Navigate', icon: React.createElement(BookOpenIcon, iconProps), execute: () => navigateToView(ViewType.THEMES), condition: () => activeView !== ViewType.THEMES },
        { id: 'nav-conflicts', label: 'Go to Conflicts', category: 'Navigate', icon: React.createElement(UsersIcon, iconProps), execute: () => navigateToView(ViewType.CONFLICTS), condition: () => activeView !== ViewType.CONFLICTS },
        { id: 'nav-query', label: 'Go to Query & Filter', category: 'Navigate', icon: React.createElement(FilterIcon, iconProps), execute: () => navigateToView(ViewType.QUERY), condition: () => activeView !== ViewType.QUERY },
        { id: 'nav-reports', label: 'Go to Project Reports', category: 'Navigate', icon: React.createElement(PieChartIcon, iconProps), execute: () => navigateToView(ViewType.REPORTS), condition: () => activeView !== ViewType.REPORTS },
        { id: 'nav-analytics', label: 'Go to Writing Analytics', category: 'Navigate', icon: React.createElement(BarChartIcon, iconProps), execute: () => navigateToView(ViewType.WRITING_ANALYTICS), condition: () => activeView !== ViewType.WRITING_ANALYTICS },
        { id: 'nav-theme-settings', label: 'Go to Theme Settings', category: 'Navigate', icon: React.createElement(PaletteIcon, iconProps), execute: () => navigateToView(ViewType.THEME_SETTINGS), condition: () => activeView !== ViewType.THEME_SETTINGS },
        { id: 'nav-tags', label: 'Go to Tags', category: 'Navigate', icon: React.createElement(TagIcon, iconProps), execute: () => navigateToView(ViewType.TAGS), condition: () => activeView !== ViewType.TAGS },
        { id: 'nav-event-editor', label: 'Go to Event Editor', category: 'Navigate', icon: React.createElement(EditIcon, iconProps), execute: () => navigateToView(ViewType.EVENT_EDITOR), condition: () => activeView !== ViewType.EVENT_EDITOR },
        { id: 'nav-template-editor', label: 'Go to Template Editor', category: 'Navigate', icon: React.createElement(ClipboardListIcon, iconProps), execute: () => navigateToView(ViewType.TEMPLATE_EDITOR), condition: () => activeView !== ViewType.TEMPLATE_EDITOR },
        { id: 'nav-prompt-editor', label: 'Go to Prompt Editor', category: 'Navigate', icon: React.createElement(EditIcon, iconProps), execute: () => navigateToView(ViewType.PROMPT_EDITOR), condition: () => activeView !== ViewType.PROMPT_EDITOR },
        { id: 'nav-roles', label: 'Go to Role Management', category: 'Navigate', icon: React.createElement(TagIcon, iconProps), execute: () => navigateToView(ViewType.ROLES), condition: () => activeView !== ViewType.ROLES },
        { id: 'nav-calendar', label: 'Go to Calendar Settings', category: 'Navigate', icon: React.createElement(CalendarDaysIcon, iconProps), execute: () => navigateToView(ViewType.CALENDAR), condition: () => activeView !== ViewType.CALENDAR },
        { id: 'nav-snapshots', label: 'Go to Snapshots', category: 'Navigate', icon: React.createElement(ArchiveIcon, iconProps), execute: () => navigateToView(ViewType.SNAPSHOTS), condition: () => activeView !== ViewType.SNAPSHOTS },
    ];
    
    // The useEventActions hook cannot be used directly here, but we can replicate its onSave logic.
    const { saveEvent } = useEventActions();
    const handleSaveEvent = async (data: { type: string; startDateTime: string; endDateTime?: string | undefined; notes: string; details: Record<string, any>; involvedEntities: InvolvedEntity[]; }) => {
        if (selectedEntity) {
            await saveEvent(selectedEntity.id, data);
            uiDispatch({ type: 'POP_MODAL' });
        }
    };

    const conditionalActions: CommandAction[] = [
        {
            id: 'add-event',
            label: `Add Event to "${selectedEntity?.name}"`,
            category: 'Action',
            keywords: 'new create history timeline',
            icon: React.createElement(PlusCircleIcon, iconProps),
            execute: () => uiDispatch({ type: 'PUSH_MODAL', payload: { type: ModalType.EVENT, props: { onSave: handleSaveEvent } } }),
            condition: () => !!selectedEntity && activeView === ViewType.ENTITIES,
        },
        {
            id: 'add-scene',
            label: `Add New Scene to "${selectedWork?.title}"`,
            category: 'Create',
            keywords: 'manuscript chapter write',
            icon: React.createElement(PlusCircleIcon, iconProps),
            execute: () => uiDispatch({ type: 'PUSH_MODAL', payload: { type: ModalType.SCENE, props: { workId: selectedWork!.id } } }),
            condition: () => !!selectedWork && activeView === ViewType.MANUSCRIPT,
        },
        {
            id: 'toggle-distraction-free',
            label: 'Toggle Distraction Free Mode',
            category: 'Action',
            keywords: 'zen focus write view',
            icon: React.createElement(MinimizeIcon, iconProps),
            execute: () => uiDispatch({ type: 'TOGGLE_DISTRACTION_FREE_MODE' }),
            condition: () => activeView === ViewType.MANUSCRIPT,
        }
    ];

    return [
        ...staticActions,
        ...conditionalActions,
    ].filter(action => action.condition ? action.condition() : true);
};
