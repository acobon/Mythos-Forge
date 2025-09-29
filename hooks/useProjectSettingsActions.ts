// hooks/useProjectSettingsActions.ts
import { useCallback } from 'react';
import { StoryBible, CharacterPromptCategory, StoryStructureTemplate, DictionaryEntry } from '../types';
import { useI18n } from './useI18n';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { updateWritingGoals as updateWritingGoalsAction, updateScratchpad as updateScratchpadAction } from '../state/slices/projectSlice';
import { updateCharacterPrompts as updateCharacterPromptsAction, saveDictionaryEntry as saveDictionaryEntryAction, addToDictionary as addToDictionaryAction } from '../state/slices/metadataSlice';
import { saveStoryStructure as saveStoryStructureAction } from '../state/slices/narrativeSlice';
import { updateRelationshipTypes as updateRelationshipTypesAction } from '../state/slices/knowledgeSlice';
import { removeItem } from '../state/actions';

export const useProjectSettingsActions = () => {
    const dispatch = useAppDispatch();
    const { t } = useI18n();
    const { storyStructures } = useAppSelector(state => state.bible.present.narrative);

    const updateWritingGoals = useCallback((goals: StoryBible['writingGoals']) => {
        dispatch(updateWritingGoalsAction(goals));
    }, [dispatch]);

    const updateCharacterPrompts = useCallback((prompts: CharacterPromptCategory[]) => {
        dispatch(updateCharacterPromptsAction(prompts));
    }, [dispatch]);

    const updateScratchpad = useCallback((content: string) => {
        dispatch(updateScratchpadAction(content));
    }, [dispatch]);

    const saveStoryStructure = useCallback((structure: StoryStructureTemplate) => {
        dispatch(saveStoryStructureAction(structure));
    }, [dispatch]);

    const deleteStoryStructure = useCallback((id: string) => {
        const structure = storyStructures[id];
        if (structure) {
            dispatch(removeItem({ item: structure, itemType: 'StoryStructure', deletedAt: new Date().toISOString() }));
        }
    }, [dispatch, storyStructures]);
    
    const saveDictionaryEntry = useCallback((entry: DictionaryEntry) => {
        dispatch(saveDictionaryEntryAction(entry));
    }, [dispatch]);

    const updateAllRelationshipTypes = useCallback((types: string[]) => {
        dispatch(updateRelationshipTypesAction(types));
    }, [dispatch]);

    const addToDictionary = useCallback((term: string) => {
        dispatch(addToDictionaryAction(term));
    }, [dispatch]);

    return {
        updateWritingGoals,
        updateCharacterPrompts,
        updateScratchpad,
        saveStoryStructure,
        deleteStoryStructure,
        saveDictionaryEntry,
        updateAllRelationshipTypes,
        addToDictionary,
    };
};
