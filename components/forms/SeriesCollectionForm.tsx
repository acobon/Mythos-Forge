import React, { useState, useEffect, useMemo } from 'react';
import { Series, Collection, Tag, FormFieldType } from '../../types';
import EntityAssociations from '../views/detail/EntityAssociations';
import { useTagActions } from '../../hooks/useTagActions';
import { generateTagColor, getTypedObjectValues } from '../../utils';
import { useAppSelector } from '../../state/hooks';
import { Input, Textarea, Button } from '../common/ui';
import { useFormValidation } from '../../hooks/useFormValidation';

interface SeriesCollectionFormProps {
    type: 'Series' | 'Collection';
    onSave: (data: Partial<Series | Collection> & { title: string }, isEditing: boolean) => void;
    onClose: () => void;
    itemToEdit?: Series | Collection | null;
}

const SeriesCollectionForm: React.FC<SeriesCollectionFormProps> = ({ type, onSave, onClose, itemToEdit }) => {
    const { tags } = useAppSelector(state => state.bible.present.metadata);
    const { createTag } = useTagActions();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tagIds, setTagIds] = useState<string[]>([]);
    
    const allTagsArray = getTypedObjectValues(tags) as Tag[];
    const tagMap = useMemo(() => new Map(allTagsArray.map(t => [t.id, t])), [allTagsArray]);

    const validationSchema = useMemo(() => ({
        title: { field: { fieldName: 'title', label: 'Title', fieldType: 'text' as FormFieldType, validation: { required: true } } }
    }), []);
    const { errors, validate, clearError } = useFormValidation(validationSchema);


    useEffect(() => {
        if (itemToEdit) {
            setTitle(itemToEdit.title);
            setDescription(itemToEdit.description);
            setTagIds(itemToEdit.tagIds || []);
        }
    }, [itemToEdit]);
    
    const handleCreateTag = (name: string) => {
        const newColor = generateTagColor(allTagsArray.length);
        const newTag = createTag(name, newColor);
        if (newTag) {
            setTagIds(prev => [...prev, newTag.id]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate({ title })) return;
        
        onSave({ id: itemToEdit?.id, title, description, tagIds }, !!itemToEdit);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="item-title" className="block text-sm font-medium text-text-secondary">{type} Title</label>
                <Input id="item-title" type="text" value={title} onChange={e => { setTitle(e.target.value); clearError('title'); }} className="mt-1" error={!!errors.title} autoFocus />
                 {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>
            <div>
                <label htmlFor="item-desc" className="block text-sm font-medium text-text-secondary">Description (Optional)</label>
                <Textarea id="item-desc" value={description} onChange={e => setDescription(e.target.value)} rows={4} className="mt-1" />
            </div>

             <EntityAssociations
                label="Tags"
                itemTypeName="Tag"
                allItems={allTagsArray.map(tag => ({ id: tag.id, name: tag.label }))}
                selectedIds={tagIds}
                onUpdate={setTagIds}
                chipColorClass="bg-gray-500/20 text-gray-300"
                onCreateNew={handleCreateTag}
                tagMap={tagMap}
            />
            
            <div className="flex justify-end items-center pt-2">
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit" className="ml-2">
                    {itemToEdit ? `Save ${type}` : `Create ${type}`}
                </Button>
            </div>
        </form>
    );
};

export default SeriesCollectionForm;