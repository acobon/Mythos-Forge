






import React, { useState, useMemo } from 'react';
import { Entity, EntityType, HistoricalEvent, TranslationKey, ModalType, Attributes } from '../../types/index';
import EntityForm from './EntityForm';
import { DateTimePicker } from '../common/DateTimePicker';
import { useEntityActions } from '../../hooks/useEntityActions';
import DynamicEventFields from './DynamicEventFields';
import { TextareaWithMentions } from '../common/TextareaWithMentions';
import { isEntityNameDuplicate, getTypedObjectValues } from '../../utils';
import { useEntityEventForm } from '../../hooks/useEntityEventForm';
import { useEntityEvents } from '../../hooks/useEntityEvents';
import { useI18n } from '../../hooks/useI18n';
import { selectEntitiesByType, selectFullStoryBible } from '../../state/selectors';
import { Button, Select } from '../common/ui';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { showDialog, popModal, pushModal } from '../../state/uiSlice';
import { StoryBible } from '../../types/index';

interface EntityEventFormProps {
    entity: Entity;
    eventToEdit?: HistoricalEvent | null;
    onSave: (data: {
        type: string;
        startDateTime: string;
        endDateTime?: string;
        notes: string;
        details: Attributes;
        involvedEntities: { entityId: string; role: string }[];
    }) => Promise<void>;
    onClose: () => void;
}


const EntityEventForm: React.FC<EntityEventFormProps> = ({ entity, eventToEdit, onSave, onClose }) => {
    const dispatch = useAppDispatch();
    const { t } = useI18n();
    const storyBible = useAppSelector(selectFullStoryBible) as StoryBible;
    const { commonRoles, customEventSchemas, entities } = storyBible;
    const { eventGroups, loading: eventsLoading, error: eventsError } = useEntityEvents(entity.type);
    const { createNewEntityObject, addEntity } = useEntityActions();
    
    const entitiesByType = useAppSelector(selectEntitiesByType) as Map<EntityType, Entity[]>;

    const showErrorDialog = (title: string, message: string) => dispatch(showDialog({ title, message }));
    
    const {
        state,
        dispatch: formDispatch,
        handleTypeChange,
        handlePrimaryRoleChange,
        getSubmitData
    } = useEntityEventForm(entity, eventToEdit, storyBible, eventGroups);

    const [isSaving, setIsSaving] = useState(false);
    
    const handleStartCreateEntity = (fieldName: string, entityType: string) => {
        const handleSaveNewEntity = (formData: { name: string; description: string; type: string; templateId?: string; details?: Attributes; }) => {
            if (isEntityNameDuplicate(formData.name, formData.type as EntityType, getTypedObjectValues(entities) as Entity[], null)) {
                showErrorDialog(t('validation.error.duplicateNameTitle'), t('validation.error.duplicateName', { name: formData.name, type: formData.type }));
                return;
            }

            const newEntity = createNewEntityObject(formData.name, formData.description, formData.type, formData.templateId, formData.details);
            addEntity(newEntity);

            formDispatch({ type: 'UPDATE_FIELD', payload: { fieldName, value: newEntity.id } });
            // Close the "new entity" modal after saving.
            dispatch(popModal());
        };
        
        // This opens a *new* modal on top of the current one for inline creation.
        // The GlobalModals component handles the modal stack.
        dispatch(pushModal({
                type: ModalType.NEW_ENTITY,
                props: {
                    entityType,
                    onSave: handleSaveNewEntity,
                }
            }
        ));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const submitData = getSubmitData();
        
        if ('error' in submitData) {
            showErrorDialog(t('validation.error.invalidDateTitle'), submitData.error);
            return;
        }
        
        setIsSaving(true);
        try {
            await onSave(submitData);
        } finally {
            setIsSaving(false);
        }
    };

    if (eventsError) return <div className="text-red-400">Error: {eventsError}</div>;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="eventType" className="block text-sm font-medium text-text-secondary mb-1">{t('eventForm.eventType')}</label>
                <Select id="eventType" value={state.type} onChange={e => handleTypeChange(e.target.value)} disabled={eventsLoading}>
                    {eventsLoading ? <option>{t('app.loading')}</option> : eventGroups.map(({ groupName, events }) => (
                        <optgroup label={groupName} key={groupName}>
                            {events.map(event => <option key={event.key} value={event.key}>{event.key.startsWith('custom:') ? event.label : t(event.label as TranslationKey)}</option>)}
                        </optgroup>
                    ))}
                </Select>
            </div>

            <div className="border border-border-color p-4 rounded-md space-y-4">
                <p className="text-xs text-text-secondary -mb-2">{t('eventForm.timezoneHint')}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DateTimePicker label={t('eventForm.startDate')} value={state.startDateTime} onChange={(v) => formDispatch({type: 'SET_START_DATE_TIME', payload: v})} />
                    <div className="flex items-center h-full pt-5">
                        <input type="checkbox" id="isOngoing" checked={state.isOngoing} onChange={e => formDispatch({type: 'SET_IS_ONGOING', payload: e.target.checked})} className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent" />
                        <label htmlFor="isOngoing" className="ml-2 block text-sm text-text-secondary">{t('eventForm.ongoing')}</label>
                    </div>
                </div>
                {state.isOngoing && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                        <DateTimePicker label={t('eventForm.endDate')} value={state.endDateTime} onChange={(v) => formDispatch({type: 'SET_END_DATE_TIME', payload: v})} />
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text-main">{t('eventForm.detailsTitle')}</h3>
                {state.formSchema.find(f=>f.primaryEntityRoleFields) && (
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">
                            {t('eventForm.primaryRole', { name: entity.name })}
                        </label>
                        <Select
                            value={state.primaryEntityRoleField}
                            onChange={(e) => handlePrimaryRoleChange(e.target.value)}
                        >
                            {state.formSchema
                                .filter(f => f.primaryEntityRoleFields)
                                .flatMap(f => f.primaryEntityRoleFields || [])
                                .map(roleField => (
                                    <option key={roleField} value={roleField}>
                                        {state.formSchema.find(f => f.fieldName === roleField)?.label || roleField}
                                    </option>
                                ))}
                        </Select>
                    </div>
                )}

                <DynamicEventFields
                    formSchema={state.formSchema}
                    formData={state.formData}
                    onFormChange={(fieldName, value) => formDispatch({ type: 'UPDATE_FIELD', payload: { fieldName, value } })}
                    onStartCreateEntity={handleStartCreateEntity}
                    commonRoles={commonRoles}
                    entitiesByType={entitiesByType}
                />
            </div>

            <div>
                <label htmlFor="eventNotes" className="block text-sm font-medium text-text-secondary mb-1">{t('eventForm.notes')}</label>
                <TextareaWithMentions
                    id="eventNotes"
                    value={state.notes}
                    onValueChange={v => formDispatch({type: 'SET_NOTES', payload: v})}
                    rows={3}
                    className="w-full bg-primary border border-border-color rounded-md p-2 text-text-main focus:ring-2 focus:ring-accent focus:outline-none"
                />
            </div>

            <div className="flex justify-end items-center pt-2">
                <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={isSaving} className="ml-2">
                    {isSaving ? t('common.saving') : (eventToEdit ? t('common.saveChanges') : t('eventForm.createButton'))}
                </Button>
            </div>
        </form>
    );
};

export default EntityEventForm;
