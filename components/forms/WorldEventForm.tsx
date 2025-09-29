






import React, { useState, useMemo, useEffect } from 'react';
import { WorldEvent, Entity, EntityId, FormFieldType } from '../../types/index';
import { TextareaWithMentions } from '../common/TextareaWithMentions';
import { DateTimePicker } from '../common/DateTimePicker';
import { useI18n } from '../../hooks/useI18n';
import { useFormValidation } from '../../hooks/useFormValidation';
import { Input, Button } from '../common/ui/index';
import { useAppSelector } from '../../state/hooks';
import { getTypedObjectValues } from '../../utils';

interface WorldEventFormProps {
    onSave: (data: {
        id?: string;
        title: string;
        content: string;
        dateTime: string;
        entities: EntityId[];
        category?: string;
    }) => void | Promise<void>;
    onClose: () => void;
    eventToEdit?: WorldEvent | null;
    prefilledDateTime?: string;
}

const WorldEventForm: React.FC<WorldEventFormProps> = ({ onSave, onClose, eventToEdit, prefilledDateTime }) => {
    const { t } = useI18n();
    const entities = useAppSelector(state => state.bible.present.entities.entities);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('');
    const [selectedEntities, setSelectedEntities] = useState<EntityId[]>([]);
    const [dateTime, setDateTime] = useState(prefilledDateTime || new Date().toISOString());
    
    const [isSaving, setIsSaving] = useState(false);
    const entitiesArray = useMemo(() => getTypedObjectValues(entities) as Entity[], [entities]);

    const validationSchema = useMemo(() => ({
        title: {
            field: { fieldName: 'title', label: t('worldEventForm.title'), fieldType: 'text' as FormFieldType, validation: { required: true } },
        }
    }), [t]);
    
    const { errors, validate, clearError } = useFormValidation(validationSchema);


    useEffect(() => {
        if (eventToEdit) {
            setTitle(eventToEdit.title);
            setContent(eventToEdit.content);
            setDateTime(eventToEdit.dateTime);
            setSelectedEntities(eventToEdit.entities || []);
            setCategory(eventToEdit.category || '');
        } else {
            setDateTime(prefilledDateTime || new Date().toISOString());
        }
    }, [eventToEdit, prefilledDateTime]);

    const handleToggleEntity = (entityId: EntityId) => {
        setSelectedEntities(prev =>
            prev.includes(entityId) ? prev.filter(id => id !== entityId) : [...prev, entityId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate({ title })) {
            return;
        }
        setIsSaving(true);
        try {
            await onSave({ id: eventToEdit?.id, title: title.trim(), content, dateTime, entities: selectedEntities, category: category.trim() || undefined });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="worldEventTitle" className="block text-sm font-medium text-text-secondary">{t('worldEventForm.title')}</label>
                <Input
                    id="worldEventTitle"
                    type="text"
                    value={title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setTitle(e.target.value);
                        if (errors.title) clearError('title');
                    }}
                    required
                    placeholder={t('worldEventForm.titlePlaceholder')}
                    error={!!errors.title}
                    className="mt-1"
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>

            <div>
                <label htmlFor="worldEventCategory" className="block text-sm font-medium text-text-secondary">{t('worldEventForm.category')}</label>
                <Input
                    id="worldEventCategory"
                    type="text"
                    value={category}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCategory(e.target.value)}
                    placeholder={t('worldEventForm.categoryPlaceholder')}
                    className="mt-1"
                />
            </div>

            <div>
                <label htmlFor="worldEventContent" className="block text-sm font-medium text-text-secondary">{t('common.description')}</label>
                <TextareaWithMentions
                    id="worldEventContent"
                    value={content}
                    onValueChange={setContent}
                    rows={4}
                    placeholder={t('worldEventForm.descriptionPlaceholder')}
                    className="w-full mt-1 bg-primary border border-border-color rounded-md p-2 text-text-main focus:ring-2 focus:ring-accent focus:outline-none"
                />
            </div>
            
            <div className="border border-border-color p-4 rounded-md space-y-4">
                <DateTimePicker 
                    label={t('worldEventForm.dateTimeLabel')}
                    value={dateTime}
                    onChange={setDateTime}
                />
                <p className="text-xs text-text-secondary mt-1">{t('eventForm.timezoneHint')}</p>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-text-secondary">{t('worldEventForm.relatedEntities')}</label>
                <div className="mt-1 w-full max-h-48 overflow-y-auto bg-primary border border-border-color rounded-md p-2 space-y-1">
                    {entitiesArray.length > 0 ? (
                        entitiesArray.map((entity: Entity) => (
                            <button
                                type="button"
                                key={entity.id}
                                onClick={() => handleToggleEntity(entity.id)}
                                className={`w-full text-left p-2 text-sm rounded-md transition-colors ${selectedEntities.includes(entity.id) ? 'bg-accent text-white' : 'hover:bg-secondary'}`}
                            >
                                {entity.name} <span className="text-xs opacity-70">({entity.type})</span>
                            </button>
                        ))
                    ) : (
                        <p className="text-sm text-text-secondary/70 p-2">{t('worldEventForm.noEntities')}</p>
                    )}
                </div>
            </div>

            <div className="flex justify-end items-center pt-2">
                <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={isSaving} className="ml-2">
                    {isSaving ? t('common.saving') : t('worldEventForm.saveButton')}
                </Button>
            </div>
        </form>
    );
};

export default WorldEventForm;
