// components/views/detail/CharacterPrompts.tsx
import React from 'react';
import { CharacterEntity, CharacterPromptCategory } from '../../../types';
import { TextareaWithMentions } from '../../common/TextareaWithMentions';
import { useAppSelector } from '../../../state/hooks';

interface CharacterPromptsProps {
    prompts: Record<string, string>;
    updateDraft: (field: string, value: any) => void;
}

const CharacterPrompts: React.FC<CharacterPromptsProps> = ({ prompts, updateDraft }) => {
    const { characterPrompts } = useAppSelector(state => state.bible.present.metadata);

    const handlePromptChange = (key: string, value: string) => {
        updateDraft('prompts', { ...prompts, [key]: value });
    };

    return (
        <div className="bg-secondary p-4 mt-2 rounded-md border border-border-color space-y-4">
            {(characterPrompts || []).map((category: CharacterPromptCategory) => (
                <details key={category.key} open>
                    <summary className="font-semibold text-lg text-text-main cursor-pointer">{category.label}</summary>
                    <div className="mt-2 space-y-3 pl-4 border-l-2 border-border-color">
                        {category.prompts.map(prompt => (
                            <div key={prompt.key}>
                                <label className="block text-sm font-medium text-text-secondary">{prompt.label}</label>
                                <TextareaWithMentions
                                    value={prompts[prompt.key] || ''}
                                    onValueChange={(value) => handlePromptChange(prompt.key, value)}
                                    rows={2}
                                    className="w-full mt-1 bg-primary border border-border-color rounded-md p-2"
                                />
                            </div>
                        ))}
                    </div>
                </details>
            ))}
        </div>
    );
};

export default CharacterPrompts;
