// forms/StoryStructureForm.tsx
import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { StoryStructureTemplate, StoryStructureChapter } from '../../types/index';
import { useI18n } from '../../hooks/useI18n';
import { generateId, arrayMove } from '../../utils';
import { Button, Input, Textarea } from '../common/ui';
import { PlusCircleIcon, TrashIcon, MenuIcon } from '../common/Icons';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableChapterItemProps {
    chapter: StoryStructureChapter;
    index: number;
    onUpdate: (index: number, updates: Partial<StoryStructureChapter>) => void;
    onRemove: (index: number) => void;
    isReadOnly?: boolean;
}

const SortableChapterItem: React.FC<SortableChapterItemProps> = memo(({ chapter, index, onUpdate, onRemove, isReadOnly }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: chapter.id, disabled: isReadOnly });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    return (
        <div ref={setNodeRef} style={style} {...attributes} className="bg-primary border border-border-color p-3 rounded-lg space-y-2 touch-none">
            <div className="flex items-center gap-2">
                {!isReadOnly && <div {...listeners} className="cursor-grab p-1 text-text-secondary"><MenuIcon className="w-5 h-5" /></div>}
                <Input
                    type="text"
                    value={chapter.title}
                    onChange={e => onUpdate(index, { title: e.target.value })}
                    placeholder="Chapter/Beat Title"
                    className="flex-grow font-semibold"
                    readOnly={isReadOnly}
                    aria-label={`Title for chapter ${index + 1}`}
                />
                {!isReadOnly && <button type="button" onClick={() => onRemove(index)} className="p-1 text-text-secondary hover:text-red-500" aria-label={`Delete chapter ${chapter.title}`}><TrashIcon className="w-4 h-4" /></button>}
            </div>
            <Textarea
                value={chapter.summary}
                onChange={e => onUpdate(index, { summary: e.target.value })}
                placeholder="Description of this beat..."
                rows={2}
                className="text-sm"
                readOnly={isReadOnly}
                aria-label={`Summary for chapter ${chapter.title}`}
            />
        </div>
    );
});
SortableChapterItem.displayName = 'SortableChapterItem';

interface StoryStructureFormProps {
    structureToEdit: StoryStructureTemplate | null;
    onSave: (structure: StoryStructureTemplate) => void;
    onCancel: () => void;
    isNameUnique: (name: string, id?: string) => boolean;
    isReadOnly?: boolean;
}

const StoryStructureForm: React.FC<StoryStructureFormProps> = ({ structureToEdit, onSave, onCancel, isNameUnique, isReadOnly = false }) => {
    const { t } = useI18n();
    const showConfirm = useConfirmationDialog();
    const isNew = !structureToEdit?.id;
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [chapters, setChapters] = useState<StoryStructureChapter[]>([]);
    const [error, setError] = useState('');
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    useEffect(() => {
        if (structureToEdit) {
            setName(structureToEdit.name);
            setDescription(structureToEdit.description);
            setChapters(structureToEdit.chapters);
        }
    }, [structureToEdit]);

    const handleChapterUpdate = useCallback((index: number, updates: Partial<StoryStructureChapter>) => {
        setChapters(prev => prev.map((ch, i) => i === index ? { ...ch, ...updates } : ch));
    }, []);

    const handleAddChapter = useCallback(() => {
        setChapters(prev => [...prev, { id: generateId('ch'), title: `Chapter ${prev.length + 1}`, summary: '' }]);
    }, []);

    const handleRemoveChapter = useCallback((index: number) => {
        showConfirm({
            title: 'Delete Chapter?',
            message: `Are you sure you want to delete the chapter "${chapters[index].title}"?`,
            onConfirm: () => {
                setChapters(prev => prev.filter((_, i) => i !== index));
            },
        });
    }, [chapters, showConfirm]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = chapters.findIndex(ch => ch.id === active.id);
            const newIndex = chapters.findIndex(ch => ch.id === over.id);
            setChapters(currentChapters => arrayMove(currentChapters, oldIndex, newIndex));
        }
    }, [chapters]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) return;
        if (!name.trim()) {
            setError("Template name cannot be empty.");
            return;
        }
        if (!isNameUnique(name, structureToEdit?.id)) {
            setError("A template with this name already exists.");
            return;
        }

        onSave({
            id: structureToEdit?.id || generateId('struct'),
            name: name.trim(),
            description: description.trim(),
            chapters,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-xl font-semibold text-text-main">{isNew ? 'Create New Template' : (isReadOnly ? 'View Template' : 'Edit Template')}</h3>
            <div>
                <label htmlFor="struct-name" className="block text-sm font-medium text-text-secondary">Template Name</label>
                <Input id="struct-name" type="text" value={name} onChange={e => { setName(e.target.value); setError(''); }} placeholder="e.g., Save the Cat Beat Sheet" error={!!error} readOnly={isReadOnly} />
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
            <div>
                <label htmlFor="struct-desc" className="block text-sm font-medium text-text-secondary">Description</label>
                <Textarea id="struct-desc" value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="A brief description of this structure." readOnly={isReadOnly} />
            </div>
            <div>
                <h4 className="text-lg font-semibold text-text-main mb-2">Chapters / Beats</h4>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={chapters.map(c => c.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3">
                            {chapters.map((chapter, index) => (
                                <SortableChapterItem key={chapter.id} chapter={chapter} index={index} onUpdate={handleChapterUpdate} onRemove={handleRemoveChapter} isReadOnly={isReadOnly} />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
                {!isReadOnly && (
                    <Button type="button" variant="ghost" onClick={handleAddChapter} className="mt-3 flex items-center text-accent hover:text-highlight">
                        <PlusCircleIcon className="w-5 h-5 mr-2" /> Add Chapter
                    </Button>
                )}
            </div>
            <div className="flex justify-end pt-2 space-x-2">
                <Button type="button" variant="ghost" onClick={onCancel}>{isNew ? 'Cancel' : 'Close'}</Button>
                {!isReadOnly && <Button type="submit">{isNew ? 'Create Template' : 'Save Changes'}</Button>}
            </div>
        </form>
    );
};

export default StoryStructureForm;
