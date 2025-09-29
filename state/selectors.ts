
import { createSelector } from 'reselect';
import { Entity, EntityId, HistoricalEvent, EntityType, RelationshipListItem, Relationship, NarrativeScene, StoryBible } from '../types';
import { sortHistoricalEvents, getTypedObjectValues } from '../utils';
import { RootState } from './store';

// Base selectors to get slices of the state
const selectBible = (state: RootState) => state.bible.present;
const selectUI = (state: RootState) => state.ui;
const selectEntitiesState = (state: RootState) => selectBible(state).entities.entities;
const selectEntityTypesState = (state: RootState) => selectBible(state).entities.entityTypes;
const selectEventsState = (state: RootState) => selectBible(state).events.events;
const selectRelationshipsState = (state: RootState) => selectBible(state).knowledge.relationships;
const selectScenesState = (state: RootState) => selectBible(state).narrative.scenes;
const selectUnsavedChanges = (state: RootState) => selectUI(state).unsavedChanges;

export const selectFullStoryBible = createSelector(
    [selectBible],
    (presentState): StoryBible => ({
        title: presentState.project.title,
        entityTypes: presentState.entities.entityTypes,
        entities: presentState.entities.entities,
        events: presentState.events.events,
        relationships: presentState.knowledge.relationships,
        worldEvents: presentState.events.worldEvents,
        timelines: presentState.events.timelines,
        customEventSchemas: presentState.events.customEventSchemas,
        entityTemplates: presentState.entities.entityTemplates,
        calendar: presentState.project.calendar,
        works: presentState.narrative.works,
        series: presentState.narrative.series,
        collections: presentState.narrative.collections,
        scenes: presentState.narrative.scenes,
        tags: presentState.metadata.tags,
        comments: presentState.knowledge.comments,
        commonRoles: presentState.metadata.commonRoles,
        relationshipTypes: presentState.knowledge.relationshipTypes,
        characterPrompts: presentState.metadata.characterPrompts,
        dictionary: presentState.metadata.dictionary,
        map: presentState.project.map,
        researchNotes: presentState.knowledge.researchNotes,
        notebooks: presentState.knowledge.notebooks,
        graphLayout: presentState.knowledge.graphLayout,
        mindMap: presentState.knowledge.mindMap,
        writingGoals: presentState.project.writingGoals,
        writingHistory: presentState.project.writingHistory,
        themes: presentState.metadata.themes,
        conflicts: presentState.metadata.conflicts,
        savedQueries: presentState.metadata.savedQueries,
        storyStructures: presentState.narrative.storyStructures,
        scratchpad: presentState.project.scratchpad,
        trash: presentState.project.trash,
    })
);


export const selectEntitiesArray = createSelector(
    [selectEntitiesState],
    (entities) => getTypedObjectValues(entities) as Entity[]
);

export const selectHasUnsavedChanges = createSelector(
    [selectUnsavedChanges],
    (unsavedChanges) => Object.keys(unsavedChanges).length > 0
);

export const selectEntityMap = createSelector(
    [selectEntitiesArray],
    (entitiesArray): Map<EntityId, Entity> => new Map(entitiesArray.map(e => [e.id, e]))
);

export const selectEntitiesByType = createSelector(
    [selectEntitiesArray, selectEntityTypesState],
    (allEntities, entityTypes): Map<EntityType, Entity[]> => {
        const entitiesByType = new Map<EntityType, Entity[]>();
        
        entityTypes.forEach(typeDef => {
            entitiesByType.set(typeDef.key as EntityType, []);
        });

        for (const entity of allEntities) {
            const entityList = entitiesByType.get(entity.type as EntityType);
            if (entityList) {
                entityList.push(entity);
            }
        }

        entitiesByType.forEach(list => list.sort((a, b) => a.name.localeCompare(b.name)));
        return entitiesByType;
    }
);

export const selectEventsByEntityId = createSelector(
    [selectEntitiesArray, selectEventsState],
    (entities, events): Map<EntityId, HistoricalEvent[]> => {
        const eventsByEntityId = new Map<EntityId, HistoricalEvent[]>();
        for (const entity of entities) {
            eventsByEntityId.set(entity.id, []);
        }
        for (const event of (getTypedObjectValues(events) as HistoricalEvent[])) {
            event.involvedEntities.forEach(inv => {
                eventsByEntityId.get(inv.entityId)?.push(event);
            });
        }
        for (const entityEvents of eventsByEntityId.values()) {
            entityEvents.sort(sortHistoricalEvents);
        }
        return eventsByEntityId;
    }
);

export const selectAllRelationships = createSelector(
    [selectEntityMap, selectEventsState, selectRelationshipsState],
    (entityMap, events, relationships): RelationshipListItem[] => {
        const edgeMap = new Map<string, { count: number; isExplicit: boolean; explicitLabel?: string; explicitId?: string; explicitRel?: Relationship }>();

        (getTypedObjectValues(events) as HistoricalEvent[]).forEach(event => {
            if (event.involvedEntities.length > 1) {
                for (let i = 0; i < event.involvedEntities.length; i++) {
                    for (let j = i + 1; j < event.involvedEntities.length; j++) {
                        const id1 = event.involvedEntities[i].entityId;
                        const id2 = event.involvedEntities[j].entityId;
                        const key = [id1, id2].sort().join('--');
                        const existing = edgeMap.get(key) || { count: 0, isExplicit: false };
                        edgeMap.set(key, { ...existing, count: existing.count + 1 });
                    }
                }
            }
        });

        (getTypedObjectValues(relationships) as Relationship[]).forEach(rel => {
            const [id1, id2] = rel.entityIds;
            const key = [id1, id2].sort().join('--');
            const existing = edgeMap.get(key) || { count: 0 };
            const currentStatus = rel.statuses[rel.statuses.length - 1];
            edgeMap.set(key, { ...existing, isExplicit: true, explicitLabel: currentStatus?.type, explicitId: rel.id, explicitRel: rel });
        });

        const allRelationships: RelationshipListItem[] = [];
        edgeMap.forEach((data, key) => {
            const [id1, id2] = key.split('--');
            const entity1 = entityMap.get(id1);
            const entity2 = entityMap.get(id2);
            if (!entity1 || !entity2) return;
            const [displayEntity1, displayEntity2] = [entity1, entity2].sort((a, b) => a.name.localeCompare(b.name));
            allRelationships.push({
                id: data.explicitId || key,
                relationship: data.explicitRel || { id: key, entityIds: [displayEntity1.id, displayEntity2.id], statuses: []},
                entity1: displayEntity1,
                entity2: displayEntity2,
                label: data.explicitLabel || `${data.count} shared event${data.count > 1 ? 's' : ''}`,
                isExplicit: !!data.isExplicit
            });
        });

        allRelationships.sort((a, b) => a.entity1.name.localeCompare(b.entity1.name) || a.entity2.name.localeCompare(b.entity2.name));
        return allRelationships;
    }
);

export const selectWordCountByScene = createSelector(
    [selectScenesState],
    (scenes) => {
        const wordCountByScene = new Map<string, number>();
        for (const scene of (getTypedObjectValues(scenes) as NarrativeScene[])) {
            if (scene) {
                wordCountByScene.set(scene.id, scene.wordCount);
            }
        }
        return wordCountByScene;
    }
);

export const selectTotalWordCount = createSelector(
    [selectScenesState],
    (scenes): number => {
        let totalWordCount = 0;
        for (const scene of (getTypedObjectValues(scenes) as NarrativeScene[])) {
            if (scene) {
                totalWordCount += scene.wordCount;
            }
        }
        return totalWordCount;
    }
);