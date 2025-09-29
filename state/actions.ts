// state/actions.ts
import { createAction, createAsyncThunk } from '@reduxjs/toolkit';
import { StoryBible, TrashedItem } from '../types/index';
import * as idbService from '../services/idbService';
import { defaultStoryBible } from '../data/defaults';

// Action to hydrate the entire bible state at once, e.g., on initial load or project import.
export const setBible = createAction<StoryBible>('bible/setBible');

// Action to atomically remove an item from its slice and add it to the trash.
export const removeItem = createAction<TrashedItem>('bible/removeItem');

export const loadInitialData = createAsyncThunk<StoryBible, void>(
    'bible/loadInitial',
    async (_, { dispatch, getState }) => {
        try {
            const storedBible = await idbService.getBible();
            const loadedBible = storedBible || defaultStoryBible;
            // The bibleReducer will handle this action to hydrate the state
            dispatch(setBible(loadedBible));
            return loadedBible;
        } catch (error) {
            console.error("Failed to load initial data from IndexedDB:", error);
            // Fallback to default state
            dispatch(setBible(defaultStoryBible));
            return defaultStoryBible;
        }
    }
);

// New action for merging tags
export const mergeTags = createAction<{ sourceTagId: string, targetTagId: string }>('bible/mergeTags');

export const cleanBrokenReferences = createAction('bible/cleanBrokenReferences');
export const cleanOrphanedItems = createAction<{ tags: string[], themes: string[], conflicts: string[] }>('bible/cleanOrphanedItems');
export const cleanOrphanedScenes = createAction<{ idsToDelete: string[] }>('bible/cleanOrphanedScenes');