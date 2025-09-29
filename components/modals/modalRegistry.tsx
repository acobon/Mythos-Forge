// components/modals/modalRegistry.tsx
import React from 'react';
import { Modal } from '../common/ui/Modal';
import ValidationReportModal from '../ValidationReportModal';
import CommandPalette from '../CommandPalette';
import { ModalType, ModalPayloads, StoryBible, Entity, EntityTypeDefinition, TrashedItem, Snapshot } from '../../types/index';
import * as reportingService from '../../services/reportingService';

// Import all modal components
import EntityEventForm from '../forms/EntityEventForm';
import WorldEventForm from '../forms/WorldEventForm';
import EntityForm from '../forms/EntityForm';
import WritingGoalsForm from '../forms/WritingGoalsForm';
import ExportManuscriptForm from '../forms/ExportManuscriptForm';
import WorkForm from '../forms/WorkForm';
import SeriesCollectionForm from '../forms/SeriesCollectionForm';
import NarrativeSceneForm from '../forms/NarrativeSceneForm';
import ApplyStructureForm from '../forms/ApplyStructureForm';
import ExportCompendiumForm from '../forms/ExportCompendiumForm';
import CustomizeDashboardForm from '../forms/CustomizeDashboardForm';
import DeleteTemplateConfirmationForm from '../forms/DeleteTemplateConfirmationForm';
import DeleteEntityTypeConfirmationForm from '../forms/DeleteEntityTypeConfirmationForm';
import SaveQueryForm from '../forms/SaveQueryForm';
import SceneHistoryModal from './SceneHistoryModal';
import TimelineForm from '../forms/TimelineForm';
import StoryStructureForm from '../forms/StoryStructureForm';
import DestructiveConfirmationModal from './DestructiveConfirmationModal';
import GlobalSearchView from '../views/GlobalSearchView';
import SnapshotInspectorModal from './SnapshotInspectorModal';
import SnapshotComparisonModal from './SnapshotComparisonModal';
import ItemUsageReport from '../views/reports/ItemUsageReport';
import LinkEntityModal from './LinkEntityModal';

type ModalConfigEntry<K extends keyof ModalPayloads> = {
    component: React.ComponentType<any>;
    title: (props: ModalPayloads[K], storyBible: StoryBible, selectedEntity?: Entity) => string;
    size?: 'sm' | 'md' | 'lg' | 'auto';
    prepareProps?: (props: ModalPayloads[K], storyBible: StoryBible, selectedEntity?: Entity) => any;
};

type ModalRegistry = {
    [K in keyof ModalPayloads]?: ModalConfigEntry<K>;
};

export const modalRegistry: ModalRegistry = {
    [ModalType.EVENT]: {
        component: EntityEventForm,
        title: (props, storyBible, selectedEntity) => props.eventId ? 'Edit Event' : `Add Event to ${selectedEntity?.name}`,
        size: 'lg',
        prepareProps: (props, storyBible, selectedEntity) => ({
            ...props,
            entity: selectedEntity,
            eventToEdit: props.eventId ? storyBible.events[props.eventId] : null,
        }),
    },
    [ModalType.WORLD_EVENT]: {
        component: WorldEventForm,
        title: (props) => props.eventId ? 'Edit World Event' : 'Add World Event',
        size: 'md',
        prepareProps: (props, storyBible) => ({
            ...props,
            eventToEdit: props.eventId ? storyBible.worldEvents[props.eventId] : null,
        }),
    },
    [ModalType.NEW_ENTITY]: {
        component: EntityForm,
        title: (props, storyBible) => {
            const typeName = storyBible.entityTypes.find((et: EntityTypeDefinition) => et.key === props.entityType)?.name || props.entityType;
            return `Create New ${typeName}`;
        },
        size: 'md',
        prepareProps: (props, storyBible) => ({
            ...props,
            templates: storyBible.entityTemplates[props.entityType] || [],
        }),
    },
    [ModalType.WRITING_GOALS]: {
        component: WritingGoalsForm,
        title: () => 'Set Writing Goals',
        size: 'sm',
        prepareProps: (props, storyBible) => ({
            ...props,
            goals: storyBible.writingGoals,
        }),
    },
    [ModalType.EXPORT_MANUSCRIPT]: {
        component: ExportManuscriptForm,
        title: () => 'Export Manuscript',
        size: 'lg',
    },
    [ModalType.WORK]: {
        component: WorkForm,
        title: (props) => props.workId ? 'Edit Work' : 'Create New Work',
        size: 'md',
        prepareProps: (props, storyBible) => ({
            ...props,
            workToEdit: props.workId ? storyBible.works[props.workId] : null,
        }),
    },
    [ModalType.SERIES]: {
        component: SeriesCollectionForm,
        title: (props) => props.seriesId ? 'Edit Series' : 'Create New Series',
        size: 'md',
        prepareProps: (props, storyBible) => ({
            ...props,
            type: 'Series',
            itemToEdit: props.seriesId ? storyBible.series[props.seriesId] : null,
        }),
    },
    [ModalType.COLLECTION]: {
        component: SeriesCollectionForm,
        title: (props) => props.collectionId ? 'Edit Collection' : 'Create New Collection',
        size: 'md',
        prepareProps: (props, storyBible) => ({
            ...props,
            type: 'Collection',
            itemToEdit: props.collectionId ? storyBible.collections[props.collectionId] : null,
        }),
    },
    [ModalType.SCENE]: {
        component: NarrativeSceneForm,
        title: (props) => props.sceneId ? 'Edit Scene Details' : 'Create New Scene',
        size: 'lg',
        prepareProps: (props, storyBible) => ({
            ...props,
            plotId: props.workId,
            sceneToEdit: props.sceneId ? storyBible.scenes[props.sceneId] : null,
        }),
    },
    [ModalType.APPLY_STRUCTURE]: {
        component: ApplyStructureForm,
        title: () => 'Apply Story Structure',
        size: 'md',
    },
    [ModalType.EXPORT_COMPENDIUM]: {
        component: ExportCompendiumForm,
        title: () => 'Export Story Compendium',
        size: 'md',
    },
    [ModalType.CUSTOMIZE_DASHBOARD]: {
        component: CustomizeDashboardForm,
        title: () => 'Customize Dashboard',
        size: 'sm',
    },
    [ModalType.DELETE_TEMPLATE]: {
        component: DeleteTemplateConfirmationForm,
        title: () => 'Delete Template',
        size: 'md',
    },
    [ModalType.DELETE_ENTITY_TYPE]: {
        component: DeleteEntityTypeConfirmationForm,
        title: () => 'Delete Entity Type',
        size: 'md',
    },
    [ModalType.SAVE_QUERY]: {
        component: SaveQueryForm,
        title: () => 'Save Query',
        size: 'sm',
    },
    [ModalType.SCENE_HISTORY]: {
        component: SceneHistoryModal,
        title: (props, storyBible) => `History for "${storyBible.scenes[props.sceneId]?.title}"`,
        size: 'lg',
    },
    [ModalType.TIMELINE]: {
        component: TimelineForm,
        title: (props) => props.timelineId ? 'Edit Timeline' : 'Create Timeline',
        size: 'sm',
        prepareProps: (props, storyBible) => ({
            ...props,
            timelineToEdit: props.timelineId ? storyBible.timelines[props.timelineId] : null,
        }),
    },
    [ModalType.STORY_STRUCTURE]: {
        component: StoryStructureForm,
        title: (props) => props.structureId ? 'Edit Story Structure' : 'Create Story Structure',
        size: 'lg',
        prepareProps: (props, storyBible) => ({
            structureToEdit: props.structureId ? storyBible.storyStructures[props.structureId] : null,
            isNameUnique: (name: string, id?: string) => !Object.values(storyBible.storyStructures).some((s: any) => s.name.toLowerCase() === name.toLowerCase() && s.id !== id),
        }),
    },
    [ModalType.DELETE_ENTITY]: {
        component: DestructiveConfirmationModal,
        title: (props) => props.title,
        size: 'sm',
    },
    [ModalType.GLOBAL_SEARCH]: {
        component: GlobalSearchView,
        title: () => 'Global Search',
        size: 'md',
    },
    [ModalType.SNAPSHOT_INSPECTOR]: {
        component: SnapshotInspectorModal,
        title: (props) => `Snapshot: ${props.snapshot.message}`,
        size: 'lg',
    },
    [ModalType.SNAPSHOT_COMPARISON]: {
        component: SnapshotComparisonModal,
        title: () => 'Compare Snapshots',
        size: 'lg',
    },
    [ModalType.ITEM_USAGE]: {
        component: ItemUsageReport,
        title: (props) => `Usage Report for "${props.itemName}"`,
        size: 'md',
        prepareProps: (props, storyBible) => {
            const usage = reportingService.getItemUsageDetails(storyBible, props.itemId, props.itemType);
            return {
                ...props,
                data: usage,
                isModal: true,
            };
        }
    },
    [ModalType.LINK_ENTITY_TO_NODE]: {
        component: LinkEntityModal,
        title: () => 'Link Entity to Node',
        size: 'md',
    },
};