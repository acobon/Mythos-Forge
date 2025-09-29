
import React, { PropsWithChildren } from 'react';
import { renderHook, RenderHookOptions } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { bibleReducer as rootBibleReducer } from '../state/bibleReducer';
import { HistoryState, withHistory } from '../state/history';
import uiReducer from '../state/uiSlice';
import { StoryBible, UIState } from '../types/index';
import { deepClone } from '../utils';
import { defaultStoryBible } from '../data/defaults';

interface ExtendedRenderHookOptions<T> extends Omit<RenderHookOptions<T>, 'wrapper'> {
    preloadedState?: Partial<{ bible: HistoryState<ReturnType<typeof rootBibleReducer>>; ui: UIState }>;
    initialStoryBible?: Partial<StoryBible>;
}

const bibleReducer = withHistory(rootBibleReducer);

const createTestStore = (preloadedState?: Partial<{ bible: HistoryState<ReturnType<typeof rootBibleReducer>>; ui: UIState }>, initialStoryBible?: Partial<StoryBible>) => {
    
    const initialPresent = { ...deepClone(defaultStoryBible), ...initialStoryBible };

    // This correctly builds the initial state for each slice based on the provided bible object.
    const initialBibleState = rootBibleReducer(undefined, { type: '@@INIT' });
    Object.assign(initialBibleState.project, { 
        title: initialPresent.title, trash: initialPresent.trash, calendar: initialPresent.calendar, 
        writingGoals: initialPresent.writingGoals, scratchpad: initialPresent.scratchpad, map: initialPresent.map 
    });
    Object.assign(initialBibleState.entities, {
        entities: initialPresent.entities, entityTypes: initialPresent.entityTypes, entityTemplates: initialPresent.entityTemplates
    });
    Object.assign(initialBibleState.events, {
        events: initialPresent.events, worldEvents: initialPresent.worldEvents, timelines: initialPresent.timelines, customEventSchemas: initialPresent.customEventSchemas
    });
    Object.assign(initialBibleState.narrative, {
        works: initialPresent.works, series: initialPresent.series, collections: initialPresent.collections, scenes: initialPresent.scenes, storyStructures: initialPresent.storyStructures
    });
    Object.assign(initialBibleState.metadata, {
        tags: initialPresent.tags, themes: initialPresent.themes, conflicts: initialPresent.conflicts, commonRoles: initialPresent.commonRoles,
        characterPrompts: initialPresent.characterPrompts, savedQueries: initialPresent.savedQueries, dictionary: initialPresent.dictionary
    });
    Object.assign(initialBibleState.knowledge, {
        researchNotes: initialPresent.researchNotes, notebooks: initialPresent.notebooks, mindMap: initialPresent.mindMap,
        comments: initialPresent.comments, relationships: initialPresent.relationships, relationshipTypes: initialPresent.relationshipTypes, graphLayout: initialPresent.graphLayout
    });
    
    const fullPreloadedState = {
        bible: {
            past: [],
            present: initialBibleState,
            future: [],
            ...preloadedState?.bible,
        },
        ui: preloadedState?.ui,
    };

    return configureStore({
        reducer: { bible: bibleReducer, ui: uiReducer },
        preloadedState: fullPreloadedState,
    });
};

export function renderHookWithProviders<Result, Props>(
    hook: (props: Props) => Result,
    { preloadedState, initialStoryBible, ...renderOptions }: ExtendedRenderHookOptions<Props> = {}
) {
    const store = createTestStore(preloadedState, initialStoryBible);

    function Wrapper({ children }: PropsWithChildren<{}>): React.ReactElement {
        return (
            <Provider store={store}>
                {children}
            </Provider>
        );
    }

    const rendered = renderHook(hook, { wrapper: Wrapper, ...renderOptions });

    return {
        ...rendered,
        store,
    };
}
