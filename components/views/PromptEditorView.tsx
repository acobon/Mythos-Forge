
import React, { useReducer } from 'react';
import { useAppSelector } from '../../state/hooks';
import { useProjectSettingsActions } from '../../hooks/useProjectSettingsActions';
import { CharacterPromptCategory, CharacterPrompt } from '../../types';
import { PlusCircleIcon, TrashIcon } from '../common/Icons';
import { generateId } from '../../utils';

type Action =
    | { type: 'UPDATE_CATEGORY_LABEL'; payload: { index: number; label: string } }
    | { type: 'ADD_CATEGORY' }
    | { type: 'DELETE_CATEGORY'; payload: { index: number } }
    | { type: 'ADD_PROMPT'; payload: { catIndex: number } }
    | { type: 'UPDATE_PROMPT_LABEL'; payload: { catIndex: number; promptIndex: number; label: string } }
    | { type: 'DELETE_PROMPT'; payload: { catIndex: number; promptIndex: number } }
    | { type: 'SET_ALL'; payload: CharacterPromptCategory[] };

const promptReducer = (state: CharacterPromptCategory[], action: Action): CharacterPromptCategory[] => {
    switch (action.type) {
        case 'SET_ALL':
            return action.payload;
        case 'ADD_CATEGORY':
            return [...state, { key: generateId('promptcat'), label: 'New Category', prompts: [] }];
        case 'DELETE_CATEGORY':
            return state.filter((_, i) => i !== action.payload.index);
        case 'UPDATE_CATEGORY_LABEL':
            return state.map((cat, i) => i === action.payload.index ? { ...cat, label: action.payload.label } : cat);
        case 'ADD_PROMPT':
            return state.map((cat, i) => {
                if (i === action.payload.catIndex) {
                    const newPrompt: CharacterPrompt = { key: generateId('prompt'), label: 'New Prompt' };
                    return { ...cat, prompts: [...cat.prompts, newPrompt] };
                }
                return cat;
            });
        case 'DELETE_PROMPT':
            return state.map((cat, i) => {
                if (i === action.payload.catIndex) {
                    return { ...cat, prompts: cat.prompts.filter((_, j) => j !== action.payload.promptIndex) };
                }
                return cat;
            });
        case 'UPDATE_PROMPT_LABEL':
            return state.map((cat, i) => {
                if (i === action.payload.catIndex) {
                    return {
                        ...cat,
                        prompts: cat.prompts.map((p, j) => j === action.payload.promptIndex ? { ...p, label: action.payload.label } : p)
                    };
                }
                return cat;
            });
        default:
            return state;
    }
};

const PromptEditorView = () => {
    const { updateCharacterPrompts } = useProjectSettingsActions();
    const { characterPrompts } = useAppSelector(state => state.bible.present.metadata);

    const [draft, dispatch] = useReducer(promptReducer, characterPrompts);

    const handleSave = () => {
        updateCharacterPrompts(draft);
        // Could add a save status indicator here
    };

    const handleReset = () => {
        dispatch({ type: 'SET_ALL', payload: characterPrompts });
    };

    return (
        <div className="p-4 md:p-8 h-full flex flex-col">
            <header className="flex justify-between items-center mb-6 flex-shrink-0">
                <div>
                    <h2 className="text-3xl font-bold text-text-main">Character Prompts</h2>
                    <p className="text-text-secondary mt-1">Customize the guiding questions for character creation.</p>
                </div>
                <div className="space-x-2">
                    <button onClick={handleReset} className="px-4 py-2 text-sm font-semibold rounded-md bg-secondary text-text-secondary hover:bg-border-color">Reset</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold rounded-md bg-accent text-white hover:bg-highlight">Save Changes</button>
                </div>
            </header>
            <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                {draft.map((category, catIndex) => (
                    <div key={category.key} className="bg-secondary p-4 rounded-lg border border-border-color">
                        <div className="flex items-center justify-between mb-3">
                            <input
                                type="text"
                                value={category.label}
                                onChange={(e) => dispatch({ type: 'UPDATE_CATEGORY_LABEL', payload: { index: catIndex, label: e.target.value } })}
                                className="text-xl font-bold bg-transparent focus:outline-none focus:bg-primary rounded px-2 -mx-2"
                            />
                            <button onClick={() => dispatch({ type: 'DELETE_CATEGORY', payload: { index: catIndex } })} className="p-1 text-text-secondary hover:text-red-500 rounded-full" title={`Delete category "${category.label}"`}>
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {category.prompts.map((prompt, promptIndex) => (
                                <div key={prompt.key} className="flex items-center gap-2 bg-primary p-2 rounded-md">
                                    <input
                                        type="text"
                                        value={prompt.label}
                                        onChange={(e) => dispatch({ type: 'UPDATE_PROMPT_LABEL', payload: { catIndex, promptIndex, label: e.target.value } })}
                                        className="flex-grow bg-transparent focus:outline-none focus:bg-secondary rounded px-2 text-sm"
                                    />
                                    <button onClick={() => dispatch({ type: 'DELETE_PROMPT', payload: { catIndex, promptIndex } })} className="p-1 text-text-secondary hover:text-red-500 rounded-full" title={`Delete prompt "${prompt.label}"`}>
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button onClick={() => dispatch({ type: 'ADD_PROMPT', payload: { catIndex } })} className="flex items-center text-sm text-accent hover:text-highlight font-semibold pt-2">
                                <PlusCircleIcon className="w-5 h-5 mr-2" />
                                Add Prompt
                            </button>
                        </div>
                    </div>
                ))}
                <button onClick={() => dispatch({ type: 'ADD_CATEGORY' })} className="w-full text-center py-3 border-2 border-dashed border-border-color rounded-lg text-text-secondary hover:bg-secondary hover:border-accent">
                    Add New Category
                </button>
            </div>
        </div>
    );
};

export default PromptEditorView;
