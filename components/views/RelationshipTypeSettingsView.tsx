// components/views/RelationshipTypeSettingsView.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { useProjectSettingsActions } from '../../hooks/useProjectSettingsActions';
import { PlusCircleIcon, EditIcon, TrashIcon, CheckIcon, XIcon, MenuIcon } from '../common/Icons';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';
import { useI18n } from '../../hooks/useI18n';
import { Input, Button } from '../common/ui';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { arrayMove } from '../../utils';

interface SortableTypeItemProps {
    type: string;
    index: number;
    editingIndex: number | null;
    editingValue: string;
    onStartEdit: (index: number) => void;
    onSaveEdit: (index: number) => void;
    onCancelEdit: () => void;
    onDelete: (index: number) => void;
    onValueChange: (value: string) => void;
}

const SortableTypeItem: React.FC<SortableTypeItemProps> = ({ type, index, editingIndex, editingValue, onStartEdit, onSaveEdit, onCancelEdit, onDelete, onValueChange }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: type });
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 'auto', };
    
    return (
        <div ref={setNodeRef} style={style} {...attributes} className="flex items-center justify-between p-2 rounded-md hover:bg-border-color group bg-primary touch-none">
            <div className="flex items-center gap-2 flex-grow">
                <div {...listeners} className="cursor-grab p-1 text-text-secondary/50"><MenuIcon className="w-5 h-5" /></div>
                {editingIndex === index ? (
                    <Input
                        type="text"
                        value={editingValue}
                        onChange={e => onValueChange(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') onSaveEdit(index);
                            if (e.key === 'Escape') onCancelEdit();
                        }}
                        onBlur={() => onSaveEdit(index)}
                        autoFocus
                        className="bg-primary border border-accent rounded-md px-2 py-1 text-sm flex-grow"
                    />
                ) : (
                    <span>{type}</span>
                )}
            </div>
            <div className="space-x-2">
                {editingIndex === index ? (
                    <>
                        <button onClick={() => onSaveEdit(index)} className="p-1 text-text-secondary hover:text-green-400"><CheckIcon className="w-4 h-4" /></button>
                        <button onClick={onCancelEdit} className="p-1 text-text-secondary hover:text-red-500"><XIcon className="w-4 h-4" /></button>
                    </>
                ) : (
                    <>
                        <button onClick={() => onStartEdit(index)} className="p-1 text-text-secondary hover:text-accent opacity-0 group-hover:opacity-100"><EditIcon className="w-4 h-4" /></button>
                        <button onClick={() => onDelete(index)} className="p-1 text-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100"><TrashIcon className="w-4 h-4" /></button>
                    </>
                )}
            </div>
        </div>
    );
};


const RelationshipTypeSettingsView: React.FC = () => {
    const { relationshipTypes } = useAppSelector(state => state.bible.present.knowledge);
    const { updateAllRelationshipTypes } = useProjectSettingsActions();
    const { t } = useI18n();
    const showConfirm = useConfirmationDialog();

    const [draftTypes, setDraftTypes] = useState<string[]>([]);
    const [newType, setNewType] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingValue, setEditingValue] = useState('');
    const [error, setError] = useState('');

    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    useEffect(() => {
        setDraftTypes(relationshipTypes || []);
    }, [relationshipTypes]);

    const isTypeUnique = (checkType: string, indexToExclude?: number): boolean => {
        const lowerType = checkType.trim().toLowerCase();
        return !draftTypes.some((r, i) => r.toLowerCase() === lowerType && i !== indexToExclude);
    };

    const handleAddType = () => {
        if (!newType.trim()) {
            setError(t('validation.error.required', { field: 'Type' }));
            return;
        }
        if (!isTypeUnique(newType)) {
            setError(t('validation.error.duplicate', { name: newType }));
            return;
        }
        const updatedTypes = [...draftTypes, newType.trim()].sort((a,b) => a.localeCompare(b));
        updateAllRelationshipTypes(updatedTypes);
        setNewType('');
        setError('');
    };
    
    const handleStartEdit = (index: number) => {
        setEditingIndex(index);
        setEditingValue(draftTypes[index]);
        setError('');
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
        setEditingValue('');
        setError('');
    };

    const handleSaveEdit = (index: number) => {
        if (!editingValue.trim()) {
            setError('Type cannot be empty.');
            return;
        }
        if (!isTypeUnique(editingValue, index)) {
            setError(`Type "${editingValue.trim()}" already exists.`);
            return;
        }

        const updatedTypes = [...draftTypes];
        updatedTypes[index] = editingValue.trim();
        updateAllRelationshipTypes(updatedTypes);
        handleCancelEdit();
    };

    const handleDeleteType = (index: number) => {
        showConfirm({
            title: "Delete Relationship Type?",
            message: "Are you sure you want to delete this relationship type? This can be undone.",
            onConfirm: () => {
                const updatedTypes = draftTypes.filter((_, i) => i !== index);
                updateAllRelationshipTypes(updatedTypes);
            }
        });
    };
    
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = draftTypes.findIndex(type => type === active.id);
            const newIndex = draftTypes.findIndex(type => type === over.id);
            const reorderedTypes = arrayMove(draftTypes, oldIndex, newIndex);
            setDraftTypes(reorderedTypes);
            updateAllRelationshipTypes(reorderedTypes);
        }
    }, [draftTypes, updateAllRelationshipTypes]);

    return (
        <div className="p-4 md:p-8 h-full flex flex-col">
            <h2 className="text-3xl font-bold text-text-main mb-4 flex-shrink-0">{t('relationshipTypeSettings.title')}</h2>
            <p className="text-text-secondary mb-6 flex-shrink-0">{t('relationshipTypeSettings.description')}</p>
            <div className="flex-grow bg-secondary p-4 rounded-lg border border-border-color h-full flex flex-col max-w-lg mx-auto">
                <h3 className="text-xl font-semibold text-text-main mb-4 flex-shrink-0">{t('relationshipTypeSettings.allTypes')} ({draftTypes.length})</h3>
                <div className="flex-grow overflow-y-auto pr-2 mb-4">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={draftTypes} strategy={verticalListSortingStrategy}>
                            <div className="space-y-2">
                                {draftTypes.map((type, index) => (
                                    <SortableTypeItem
                                        key={type}
                                        type={type}
                                        index={index}
                                        editingIndex={editingIndex}
                                        editingValue={editingValue}
                                        onStartEdit={handleStartEdit}
                                        onSaveEdit={handleSaveEdit}
                                        onCancelEdit={handleCancelEdit}
                                        onDelete={handleDeleteType}
                                        onValueChange={setEditingValue}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
                <div className="flex-shrink-0 border-t border-border-color pt-4">
                     <div className="flex items-center gap-2">
                         <Input
                            type="text"
                            value={newType}
                            onChange={e => { setNewType(e.target.value); setError(''); }}
                            placeholder="Add a new type..."
                            className={`flex-grow bg-primary border rounded-md p-2 text-text-main focus:ring-2 focus:outline-none ${error ? 'border-red-500 focus:ring-red-500' : 'border-border-color focus:ring-accent'}`}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddType(); } }}
                        />
                        <button onClick={handleAddType} className="p-2 text-white bg-accent rounded-md hover:bg-highlight"><PlusCircleIcon className="w-5 h-5" /></button>
                     </div>
                      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default RelationshipTypeSettingsView;
