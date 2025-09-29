
// forms/ApplyStructureForm.tsx
import React, { useState, useMemo } from 'react';
import { useWorkActions } from '../../hooks/useWorkActions';
import { useI18n } from '../../hooks/useI18n';
import { storyStructures as builtInStructures } from '../../data/story-structures';
import { StoryStructureTemplate, TranslatedStoryStructure, StoryStructureTemplate_BuiltIn } from '../../types';
import { Button, Select } from '../common/ui';
import { useAppSelector } from '../../state/hooks';
import { getTypedObjectValues } from '../../utils';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';

interface ApplyStructureFormProps {
    workId: string;
    onClose: () => void;
}

const ApplyStructureForm: React.FC<ApplyStructureFormProps> = ({ workId, onClose }) => {
    const { applyStoryStructure } = useWorkActions();
    const { t } = useI18n();
    const showConfirm = useConfirmationDialog();
    const { storyStructures: customStructures } = useAppSelector(state => state.bible.present.narrative);

    const allStructures = useMemo(() => {
        const builtIn: { id: string, isCustom: boolean, template: StoryStructureTemplate_BuiltIn }[] = Object.entries(builtInStructures).map(([key, template]) => ({
            id: `builtin-${key}`,
            isCustom: false,
            template: template
        }));

        const custom: { id: string, isCustom: boolean, template: StoryStructureTemplate }[] = (getTypedObjectValues(customStructures) as StoryStructureTemplate[]).map(template => ({
            id: template.id,
            isCustom: true,
            template: template
        }));
        
        return [...builtIn, ...custom];
    }, [customStructures]);

    const [selectedStructureId, setSelectedStructureId] = useState<string>(allStructures[0]?.id || '');
    
    const selectedStructureData = useMemo(() => {
        return allStructures.find(s => s.id === selectedStructureId);
    }, [selectedStructureId, allStructures]);


    const translatedPreview = useMemo((): TranslatedStoryStructure | undefined => {
        if (!selectedStructureData) return undefined;

        if (selectedStructureData.isCustom) {
            const template = selectedStructureData.template as StoryStructureTemplate;
            return {
                name: template.name,
                description: template.description,
                chapters: template.chapters.map(ch => ({ title: ch.title, summary: ch.summary })),
            }
        } else {
            const template = selectedStructureData.template as StoryStructureTemplate_BuiltIn;
             return {
                name: t(template.nameKey),
                description: t(template.descriptionKey),
                chapters: template.chapters.map(ch => ({
                    title: t(ch.titleKey),
                    summary: t(ch.summaryKey)
                }))
            }
        }
    }, [selectedStructureData, t]);

    const handleSubmit = () => {
        if (!translatedPreview) return;
        
        showConfirm({
            title: "Apply Story Structure?",
            message: "This will replace all existing chapters in this work. All scenes will become unassigned. This action can be undone. Are you sure you want to proceed?",
            onConfirm: () => {
                applyStoryStructure({ workId, structure: translatedPreview });
                onClose();
            },
        });
    };

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="structure-select" className="block text-sm font-medium text-text-secondary">
                    Select a Structure Template
                </label>
                <Select
                    id="structure-select"
                    value={selectedStructureId}
                    onChange={(e) => setSelectedStructureId(e.target.value)}
                    className="mt-1"
                >
                    {allStructures.map(({ id, template, isCustom }) => (
                        <option key={id} value={id}>
                            {isCustom ? (template as StoryStructureTemplate).name : t((template as StoryStructureTemplate_BuiltIn).nameKey)} {isCustom && '(Custom)'}
                        </option>
                    ))}
                </Select>
            </div>
            {translatedPreview && (
                <div className="bg-primary p-3 border border-border-color rounded-md">
                    <p className="text-sm text-text-secondary">{translatedPreview.description}</p>

                    <h4 className="font-semibold text-text-main mt-3 mb-1">Generated Chapters:</h4>
                    <ul className="text-xs text-text-secondary list-disc list-inside max-h-40 overflow-y-auto">
                        {translatedPreview.chapters.map(ch => (
                            <li key={ch.title}>{ch.title}</li>
                        ))}
                    </ul>
                </div>
            )}
             <div className="flex justify-end items-center pt-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="button" onClick={handleSubmit}>
                    Apply Structure
                </Button>
            </div>
        </div>
    );
};

export default ApplyStructureForm;
