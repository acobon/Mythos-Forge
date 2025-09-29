






import React, { useState, useMemo, useEffect } from 'react';
import { EntityTypeDefinition, EntityTemplate, FormFieldType, Entity, Attributes, EntityType } from '../../types/index';
import DynamicEventFields from './DynamicEventFields';
import { isEntityNameDuplicate } from '../../utils';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';
import { useI18n } from '../../hooks/useI18n';
import { useFormValidation } from '../../hooks/useFormValidation';
import { selectEntitiesByType } from '../../state/selectors';
import { Input, Textarea, Select, Button } from '../common/ui/index';
import { useAppSelector } from '../../state/hooks';

interface EntityFormProps {
    entityType: string;
    onSave: (entity: {
        name: string;
        description: string;
        type: string;
        templateId?: string;
        details?: Attributes;
    }) => void;
    onClose: () => void;
    templates: EntityTemplate[];
    prefilledName?: string;
}

const EntityForm: React.FC<EntityFormProps> = ({ entityType, onSave, onClose, templates, prefilledName }) => {
    const { t } = useI18n();
    const commonRoles = useAppSelector(state => state.bible.present.metadata.commonRoles);
    const entityTypes = useAppSelector(state => state.bible.present.entities.entityTypes);
    const entitiesByType = useAppSelector(selectEntitiesByType) as Map<EntityType, Entity[]>;
    const [name, setName] = useState(prefilledName || '');
    const [description, setDescription] = useState('');
    const [templateId, setTemplateId] = useState<string | undefined>(undefined);
    const [details, setDetails] = useState<Attributes>({});
    
    const currentEntityType = entityTypes.find(et => et.key === entityType);

    const entitiesForType = useMemo(() => entitiesByType.get(entityType as EntityType) || [], [entitiesByType, entityType]);

    const validationSchema = useMemo(() => ({
        name: {
            field: { fieldName: 'name', label: t('common.name'), fieldType: 'text' as FormFieldType, validation: { required: true } },
            isUnique: (value: string) => !isEntityNameDuplicate(value, entityType, entitiesForType, null)
        }
    }), [t, entityType, entitiesForType]);
    
    const { errors, validate, clearError } = useFormValidation(validationSchema);

    const selectedTemplate = useMemo(() => {
        return templates.find(t => t.id === templateId);
    }, [templates, templateId]);
    
    useEffect(() => {
        setDetails({});
    }, [templateId]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = { name: name.trim(), description, type: entityType, templateId, details };
        if (!validate(formData)) {
            return;
        }
        onSave(formData);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value);
        if (errors.name) clearError('name');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="entity-name" className="block text-sm font-medium text-text-secondary">{t('common.name')}</label>
                <Input
                    id="entity-name"
                    type="text"
                    value={name}
                    onChange={handleNameChange}
                    error={!!errors.name}
                    className="mt-1"
                    autoFocus
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
                <label htmlFor="entity-description" className="block text-sm font-medium text-text-secondary">{t('common.description')}</label>
                <Textarea
                    id="entity-description"
                    rows={3}
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                    className="mt-1"
                />
            </div>
            {templates.length > 0 && (
                 <div>
                    <label htmlFor="entity-template" className="block text-sm font-medium text-text-secondary">{t('common.templateOptional')}</label>
                    <Select
                        id="entity-template"
                        value={templateId || ''}
                        onChange={e => setTemplateId(e.target.value || undefined)}
                        className="mt-1"
                    >
                        <option value="">{t('common.none')}</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Select>
                </div>
            )}
            
            {selectedTemplate && (
                 <div className="border-t border-border-color pt-4">
                    <h4 className="text-md font-semibold text-text-main mb-2">{selectedTemplate.name} {t('common.attributes')}</h4>
                    <DynamicEventFields
                        formSchema={selectedTemplate.schema}
                        formData={details}
                        onFormChange={(fieldName, value) => setDetails(prev => ({ ...prev, [fieldName]: value }))}
                        commonRoles={commonRoles}
                        entitiesByType={entitiesByType}
                    />
                </div>
            )}

            <div className="flex justify-end items-center pt-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                    {t('common.cancel')}
                </Button>
                <Button type="submit" className="ml-2">
                    {t('common.createEntityType', { type: currentEntityType?.name || entityType })}
                </Button>
            </div>
        </form>
    );
};

export default EntityForm;
