
// state/slices/metadataSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Tag, Theme, Conflict, CharacterPromptCategory, SavedQuery, TrashedItem, DictionaryEntry } from '../../types/index';
import { defaultStoryBible } from '../../data/defaults';
import { restoreFromTrash } from './projectSlice';
import { cleanOrphanedItems, mergeTags, removeItem } from '../actions';
import { deepApplyReferenceUpdates, makeReferenceDeleter, makeReferenceUpdater, generateId } from '../../utils';

interface MetadataState {
    tags: Record<string, Tag>;
    themes: Record<string, Theme>;
    conflicts: Record<string, Conflict>;
    commonRoles: string[];
    characterPrompts: CharacterPromptCategory[];
    savedQueries: Record<string, SavedQuery>;
    dictionary: Record<string, DictionaryEntry>;
}

const initialState: MetadataState = {
    tags: defaultStoryBible.tags,
    themes: defaultStoryBible.themes,
    conflicts: defaultStoryBible.conflicts,
    commonRoles: defaultStoryBible.commonRoles,
    characterPrompts: defaultStoryBible.characterPrompts,
    savedQueries: defaultStoryBible.savedQueries,
    dictionary: defaultStoryBible.dictionary,
};

const metadataSlice = createSlice({
    name: 'metadata',
    initialState,
    reducers: {
        createTag: (state, action: PayloadAction<Tag>) => {
            state.tags[action.payload.id] = action.payload;
        },
        updateTag: (state, action: PayloadAction<Tag>) => {
            state.tags[action.payload.id] = { ...action.payload, lastModified: new Date().toISOString() };
        },
        saveTheme: (state, action: PayloadAction<Theme>) => {
            state.themes[action.payload.id] = action.payload;
        },
        saveConflict: (state, action: PayloadAction<Conflict>) => {
            state.conflicts[action.payload.id] = action.payload;
        },
        updateCommonRoles: (state, action: PayloadAction<string[]>) => {
            state.commonRoles = action.payload;
        },
        updateCharacterPrompts: (state, action: PayloadAction<CharacterPromptCategory[]>) => {
            state.characterPrompts = action.payload;
        },
        saveQuery: (state, action: PayloadAction<SavedQuery>) => {
            state.savedQueries[action.payload.id] = action.payload;
        },
        saveDictionaryEntry: (state, action: PayloadAction<DictionaryEntry>) => {
            state.dictionary[action.payload.id] = action.payload;
        },
        addToDictionary: (state, action: PayloadAction<string>) => {
            const term = action.payload;
            const existingEntry = Object.values(state.dictionary).find((e: DictionaryEntry) => e.term.toLowerCase() === term.toLowerCase());
            if (!existingEntry) {
                const newEntry: DictionaryEntry = {
                    id: generateId('dict'),
                    term,
                    definition: 'Added from editor',
                    caseSensitive: term !== term.toLowerCase(),
                };
                state.dictionary[newEntry.id] = newEntry;
            }
        },
        importDictionaryEntries: (state, action: PayloadAction<DictionaryEntry[]>) => {
            action.payload.forEach(entry => {
                const existingEntry = (Object.values(state.dictionary) as DictionaryEntry[]).find(e => 
                    e.caseSensitive ? e.term === entry.term : e.term.toLowerCase() === entry.term.toLowerCase()
                );
                if (existingEntry) {
                    state.dictionary[existingEntry.id] = { ...existingEntry, ...entry, id: existingEntry.id };
                } else {
                    state.dictionary[entry.id] = entry;
                }
            });
        },
    },
    extraReducers: builder => {
        builder
            .addCase(restoreFromTrash, (state, action: PayloadAction<{ item: TrashedItem }>) => {
                const { item, itemType } = action.payload.item;
                switch(itemType) {
                    case 'Tag':
                        state.tags[(item as Tag).id] = item as Tag;
                        break;
                    case 'Theme':
                        state.themes[(item as Theme).id] = item as Theme;
                        break;
                    case 'Conflict':
                        state.conflicts[(item as Conflict).id] = item as Conflict;
                        break;
                    case 'SavedQuery':
                        state.savedQueries[(item as SavedQuery).id] = item as SavedQuery;
                        break;
                    case 'DictionaryEntry':
                        state.dictionary[(item as DictionaryEntry).id] = item as DictionaryEntry;
                        break;
                }
            })
            .addCase(cleanOrphanedItems, (state, action) => {
                action.payload.tags.forEach(id => delete state.tags[id]);
                action.payload.themes.forEach(id => delete state.themes[id]);
                action.payload.conflicts.forEach(id => delete state.conflicts[id]);
            })
            .addCase(removeItem, (state, action: PayloadAction<TrashedItem>) => {
                const { item, itemType } = action.payload;
                if (itemType === 'Tag') delete state.tags[(item as Tag).id];
                if (itemType === 'Theme') delete state.themes[(item as Theme).id];
                if (itemType === 'Conflict') delete state.conflicts[(item as Conflict).id];
                if (itemType === 'SavedQuery') delete state.savedQueries[(item as SavedQuery).id];
                if (itemType === 'DictionaryEntry') delete state.dictionary[(item as DictionaryEntry).id];
            })
            .addCase(mergeTags, (state, action) => {
                delete state.tags[action.payload.sourceTagId];
            });
    }
});

export const {
    createTag, updateTag,
    saveTheme,
    saveConflict,
    updateCommonRoles, updateCharacterPrompts,
    saveQuery, 
    saveDictionaryEntry, 
    addToDictionary,
    importDictionaryEntries,
} = metadataSlice.actions;

export default metadataSlice.reducer;
