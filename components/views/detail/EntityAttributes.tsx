






import React, { useState, useMemo } from 'react';
import { Entity, EntityType, Entity as EntityTypeObject, ModalType } from '../../../types';
import { useAppSelector, useAppDispatch } from '../../../state/hooks';
import { useEntityActions } from '../../../hooks/useEntityActions';
import DynamicEventFields from '../../forms/DynamicEventFields';
import EntityForm from '../../forms/EntityForm';
import { isEntityNameDuplicate, getTypedObjectValues } from '../../../utils';
import { selectEntitiesByType } from '../../../state/selectors';
import { Modal } from '../../common/ui';
import { showDialog, pushModal, popModal } from '../../../state/uiSlice';

interface EntityAttributesProps<T extends Entity> {
    entity: T;
    draft: T;
    updateDraft: (field: string, value: any) => void;
}

const EntityAttributes = <T extends Entity>({ entity, draft, updateDraft }: EntityAttributesProps<T>) => {
    const { entityTemplates, entities: allEntities } = useAppSelector(state => state.bible.present.entities);
    const { commonRoles } = useAppSelector(state => state.bible.present.metadata);
    const { createNewEntityObject, addEntity } = useEntityActions();
    const dispatch = useAppDispatch();
    
    const entitiesByType = useAppSelector(selectEntitiesByType) as Map<EntityType, Entity[]>;

    const availableTemplates = entityTemplates[entity.type] || [];
    const currentTemplate = availableTemplates.find(t => t.id === draft.templateId);

    const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTemplateId = e.target.value;
        updateDraft('templateId', newTemplateId || undefined);
    };

    const handleStartCreateEntity = (fieldName: string, entityType: string) => {
        const handleSaveNewEntity = (data: { name: string; description: string; type: string; templateId?: string; details?: Record<string, any>; }) => {
            if (isEntityNameDuplicate(data.name, data.type as EntityType, getTypedObjectValues(allEntities) as Entity[], null)) {
                dispatch(showDialog({ title: "Duplicate Name", message: `An entity named "${data.name}" already exists.` }));
                return;
            }
            const newEntity = createNewEntityObject(data.name, data.description, data.type, data.templateId, data.details);
            addEntity(newEntity);
            updateDraft('details', { ...(draft.details || {}), [fieldName]: newEntity.id });
            dispatch(popModal());
        };

        dispatch(pushModal({
            type: ModalType.NEW_ENTITY,
            props: {
                entityType: entityType as string,
                onSave: handleSaveNewEntity,
            }
        }));
    };


    return (
        <section>
            
            <div className="bg-secondary p-4 rounded-md border border-border-color space-y-4">
                <div>
                    <label htmlFor="entity-template" className="block text-sm font-medium text-text-secondary mb-1">Template</label>
                    <select
                        id="entity-template"
                        value={draft.templateId || ''}
                        onChange={handleTemplateChange}
                        className="w-full bg-primary border border-border-color rounded-md p-2 text-text-main focus:ring-2 focus:ring-accent focus:outline-none"
                    >
                        <option value="">None</option>
                        {availableTemplates.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>
                {currentTemplate && (
                    <DynamicEventFields
                        formSchema={currentTemplate.schema}
                        formData={draft.details || {}}
                        onFormChange={(fieldName, value) => updateDraft('details', { ...(draft.details || {}), [fieldName]: value })}
                        onStartCreateEntity={handleStartCreateEntity as any}
                        commonRoles={commonRoles}
                        entitiesByType={entitiesByType}
                    />
                )}
            </div>
        </section>
    );
};

export default EntityAttributes;
