
// state/bibleReducer.ts
import { combineReducers, AnyAction } from '@reduxjs/toolkit';
import { StoryBible } from '../types/index';
import { setBible } from './actions';
import projectReducer from './slices/projectSlice';
import entitiesReducer from './slices/entitiesSlice';
import eventsReducer from './slices/eventsSlice';
import narrativeReducer from './slices/narrativeSlice';
import metadataReducer from './slices/metadataSlice';
import knowledgeReducer from './slices/knowledgeSlice';

// Combine all the individual slice reducers into one main reducer for the 'bible' state.
const combinedReducer = combineReducers({
    project: projectReducer,
    entities: entitiesReducer,
    events: eventsReducer,
    narrative: narrativeReducer,
    metadata: metadataReducer,
    knowledge: knowledgeReducer,
});

// The root reducer for the 'bible' slice of the state.
// It delegates most actions to the combined reducer.
// It has a special case for the `setBible` action to completely replace the state,
// which is used for loading a project from a file or IndexedDB.
export const bibleReducer = (state: ReturnType<typeof combinedReducer> | undefined, action: AnyAction): ReturnType<typeof combinedReducer> => {
    // This is the hydration logic. When a project is loaded, this action is dispatched
    // with the full StoryBible payload. We then need to split that payload into the
    // respective slices for the combined reducer.
    if (setBible.match(action)) {
        const bible: StoryBible = action.payload;

        // Deconstruct the full StoryBible object into the shape expected by each slice.
        return {
            project: {
                title: bible.title,
                trash: bible.trash,
                calendar: bible.calendar,
                writingGoals: bible.writingGoals,
                scratchpad: bible.scratchpad,
                map: bible.map,
                writingHistory: bible.writingHistory,
            },
            entities: {
                entities: bible.entities,
                entityTypes: bible.entityTypes,
                entityTemplates: bible.entityTemplates,
            },
            events: {
                events: bible.events,
                worldEvents: bible.worldEvents,
                timelines: bible.timelines,
                customEventSchemas: bible.customEventSchemas,
            },
            narrative: {
                works: bible.works,
                series: bible.series,
                collections: bible.collections,
                scenes: bible.scenes,
                storyStructures: bible.storyStructures,
                selectedWorkId: null,
                selectedSceneId: null,
            },
            metadata: {
                tags: bible.tags,
                themes: bible.themes,
                conflicts: bible.conflicts,
                commonRoles: bible.commonRoles,
                characterPrompts: bible.characterPrompts,
                savedQueries: bible.savedQueries,
                dictionary: bible.dictionary,
            },
            knowledge: {
                researchNotes: bible.researchNotes,
                notebooks: bible.notebooks,
                mindMap: bible.mindMap,
                comments: bible.comments,
                relationships: bible.relationships,
                relationshipTypes: bible.relationshipTypes,
                graphLayout: bible.graphLayout,
            },
        };
    }

    // For all other actions, pass them to the combined reducer.
    return combinedReducer(state, action);
};
