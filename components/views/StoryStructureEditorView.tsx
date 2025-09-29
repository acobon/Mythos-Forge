import React, { useState, useMemo } from 'react';
import { useAppSelector } from '../../state/hooks';
import { useI18n } from '../../hooks/useI18n';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';
import { StoryStructureTemplate, StoryStructureTemplate_BuiltIn, TranslatedStoryStructure } from '../../types';
import { useProjectSettingsActions } from '../../hooks/useProjectSettingsActions';
import { getTypedObjectValues } from '../../utils';
import { BookIcon, EditIcon, TrashIcon, PlusCircleIcon, EyeIcon } from '../common/Icons';
import StoryStructureForm from '../forms/StoryStructureForm';
import EmptyState from '../common/EmptyState';
import { Button } from '../common/ui';
import { storyStructures as builtInStructures } from '../../data/story-structures';

const StoryStructureEditorView: React.FC = () => {
    const { t } = useI18n();
    const showConfirm = useConfirmationDialog();
    const { storyStructures: customStructures } = useAppSelector(state => state.bible.present.narrative);
    const { saveStoryStructure, deleteStoryStructure } = useProjectSettingsActions();

    const [editingStructure, setEditingStructure] = useState<StoryStructureTemplate | null>(null);
    const [viewingStructure, setViewingStructure] = useState<TranslatedStoryStructure | null>(null);

    const customStructuresArray = useMemo(() => {
        return (getTypedObjectValues(customStructures) as StoryStructureTemplate[]).sort((a, b) => a.name.localeCompare(b.name));
    }, [customStructures]);

    const builtInStructuresArray = useMemo(() => {
        return Object.entries(builtInStructures).map(([key, template]) => ({
            id: `builtin-${key}`,
            isCustom: false,
            template: template,
            translated: {
                name: t(template.nameKey),
                description: t(template.descriptionKey),
                chapters: template.chapters.map(ch => ({ id: ch.titleKey, title: t(ch.titleKey), summary: t(ch.summaryKey) })),
            }
        })).sort((a,b) => a.translated.name.localeCompare(b.translated.name));
    }, [t]);

    const isNameUnique = (name: string, id?: string): boolean => {
        const lowerName = name.trim().toLowerCase();
        return !customStructuresArray.some(s => s.name.toLowerCase() === lowerName && s.id !== id);
    };

    const handleSave = (structure: StoryStructureTemplate) => {
        saveStoryStructure(structure);
        setEditingStructure(null);
    };

    const handleDelete = (id: string) => {
        showConfirm({
            title: "Delete Structure Template?",
            message: "Are you sure you want to delete this template? This action can be undone.",
            onConfirm: () => {
                if (editingStructure?.id === id) {
                    setEditingStructure(null);
                }
                deleteStoryStructure(id);
            },
        });
    };
    
    const handleAddNew = () => {
        setViewingStructure(null);
        setEditingStructure({ id: '', name: '', description: '', chapters: [] });
    };
    
    const handleView = (structure: TranslatedStoryStructure) => {
        setEditingStructure(null);
        setViewingStructure(structure);
    };
    
    const handleEdit = (structure: StoryStructureTemplate) => {
        setViewingStructure(null);
        setEditingStructure(structure);
    };

    const handleCancel = () => {
        setEditingStructure(null);
        setViewingStructure(null);
    }

    const currentFormStructure = useMemo(() => {
        if (editingStructure) return editingStructure;
        if (viewingStructure) {
            return {
                id: viewingStructure.name, // Just for keying
                name: viewingStructure.name,
                description: viewingStructure.description,
                chapters: viewingStructure.chapters,
            };
        }
        return null;
    }, [editingStructure, viewingStructure]);

    return (
        <div className="p-4 md:p-8 h-full flex flex-col">
            <h2 className="text-3xl font-bold text-text-main mb-4 flex-shrink-0">Story Structure Editor</h2>
            <p className="text-text-secondary mb-6 flex-shrink-0">
                Create and manage your own reusable plotting templates for structuring your works.
            </p>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
                <div className="md:col-span-1 bg-secondary p-4 rounded-lg border border-border-color h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4 flex-shrink-0">
                        <h3 className="text-xl font-semibold text-text-main">Templates</h3>
                        <button onClick={handleAddNew} className="p-2 text-text-secondary hover:text-accent" aria-label="Add New Template" title="Add New Template">
                            <PlusCircleIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto pr-2">
                        <h4 className="text-sm font-bold text-text-secondary uppercase mb-2">Custom</h4>
                        {customStructuresArray.length > 0 ? (
                            <div className="space-y-2">
                                {customStructuresArray.map(structure => (
                                    <div key={structure.id} className="flex items-center justify-between p-2 rounded-md hover:bg-border-color group">
                                        <button className="flex-grow text-left" onClick={() => handleEdit(structure)}>
                                            <p className={`font-semibold ${(editingStructure?.id === structure.id) ? 'text-accent' : 'text-text-main'}`}>{structure.name}</p>
                                        </button>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
                                            <button onClick={() => handleEdit(structure)} className="p-1 text-text-secondary hover:text-accent"><EditIcon className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(structure.id)} className="p-1 text-text-secondary hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                           <div className="text-center text-sm text-text-secondary py-4">No custom structures yet.</div>
                        )}

                        <h4 className="text-sm font-bold text-text-secondary uppercase mt-4 mb-2">Built-in</h4>
                        <div className="space-y-2">
                             {builtInStructuresArray.map(structure => (
                                <div key={structure.id} className="flex items-center justify-between p-2 rounded-md hover:bg-border-color group">
                                    <button className="flex-grow text-left" onClick={() => handleView(structure.translated)}>
                                        <p className={`font-semibold ${(viewingStructure?.name === structure.translated.name) ? 'text-accent' : 'text-text-main'}`}>{structure.translated.name}</p>
                                    </button>
                                     <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleView(structure.translated)} className="p-1 text-text-secondary hover:text-accent"><EyeIcon className="w-4 h-4"/></button>
                                     </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="md:col-span-2 bg-secondary p-4 rounded-lg border border-border-color h-full flex flex-col">
                     {currentFormStructure ? (
                        <div className="flex-grow overflow-y-auto pr-2">
                            <StoryStructureForm
                                key={currentFormStructure.id}
                                structureToEdit={currentFormStructure as StoryStructureTemplate}
                                onSave={handleSave}
                                onCancel={handleCancel}
                                isNameUnique={isNameUnique}
                                isReadOnly={!!viewingStructure}
                            />
                        </div>
                    ) : (
                        <EmptyState
                            icon={<BookIcon className="w-16 h-16" />}
                            title="Select or Create a Template"
                            description="Select a template from the list to edit, or create a new one to get started."
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default StoryStructureEditorView;