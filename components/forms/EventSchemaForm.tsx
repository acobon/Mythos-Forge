import React, { useState, useReducer, useEffect } from 'react';
import { EntityType, EventSchema, FormField, FormFieldType } from '../../types/index';
import { XIcon, PlusCircleIcon, TrashIcon, HelpCircleIcon } from '../common/Icons';
import { generateUUID, labelToFieldName } from '../../utils';
import { useI18n } from '../../hooks/useI18n';
import { Button, Input, Select } from '../common/ui';

interface EventSchemaFormProps {
    entityType: EntityType;
    onSave: (schema: EventSchema, isEditing: boolean) => void;
    onClose: () => void;
    existingSchema?: EventSchema | null;
    isLabelUnique: (label: string, key?: string) => boolean;
}

type FormState = {
    label: string;
    fields: FormField[];
    summaryTemplate: string;
};

type FormAction =
  | { type: 'SET_LABEL'; payload: string }
  | { type: 'ADD_FIELD' }
  | { type: 'REMOVE_FIELD'; payload: number }
  | { type: 'UPDATE_FIELD'; payload: { index: number; field: Partial<FormField> } }
  | { type: 'SET_STATE', payload: FormState }
  | { type: 'SET_SUMMARY_TEMPLATE', payload: string };

const formReducer = (state: FormState, action: FormAction): FormState => {
    switch (action.type) {
        case 'SET_LABEL':
            return { ...state, label: action.payload };
        case 'ADD_FIELD': {
            const newField: FormField = {
                fieldName: '',
                label: `New Field ${state.fields.length + 1}`,
                fieldType: 'text',
                role: '',
            };
            return { ...state, fields: [...state.fields, newField] };
        }
        case 'REMOVE_FIELD':
            return { ...state, fields: state.fields.filter((_, i) => i !== action.payload) };
        case 'UPDATE_FIELD': {
            const { index, field } = action.payload;
            const newFields = [...state.fields];
            const oldField = newFields[index];
            newFields[index] = { ...oldField, ...field };

            // Auto-generate fieldName only if user changes label and fieldName was empty or auto-generated from a previous label
            if (field.label !== undefined && (oldField.fieldName === '' || oldField.fieldName === labelToFieldName(oldField.label))) {
                newFields[index].fieldName = labelToFieldName(newFields[index].label);
            }

            return { ...state, fields: newFields };
        }
        case 'SET_STATE':
            return action.payload;
        case 'SET_SUMMARY_TEMPLATE':
            return { ...state, summaryTemplate: action.payload };
        default:
            return state;
    }
};

const EventSchemaForm: React.FC<EventSchemaFormProps> = ({ entityType, onSave, onClose, existingSchema, isLabelUnique }) => {
    const { t } = useI18n();
    const isEditing = !!existingSchema;
    const [state, dispatch] = useReducer(formReducer, { label: '', fields: [], summaryTemplate: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (existingSchema) {
            dispatch({ type: 'SET_STATE', payload: { label: existingSchema.label, fields: existingSchema.schema, summaryTemplate: existingSchema.summaryTemplate || '' } });
        }
    }, [existingSchema]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!state.label.trim()) {
            newErrors.label = t('validation.error.required', { field: t('eventSchema.label') });
        } else if (!isLabelUnique(state.label, existingSchema?.key)) {
            newErrors.label = t('validation.error.duplicate', { name: state.label });
        }
        
        const fieldNames = new Set<string>();
        state.fields.forEach((field, index) => {
            if (!field.label.trim()) newErrors[`field_label_${index}`] = t('validation.error.required', { field: t('eventSchema.fieldLabel')});
            if (!field.fieldName.trim()) {
                newErrors[`field_name_${index}`] = t('validation.error.required', { field: t('eventSchema.fieldName')});
            } else if (!/^[a-zA-Z0-9_]+$/.test(field.fieldName)) {
                newErrors[`field_name_${index}`] = t('validation.error.fieldNameFormat');
            } else if (fieldNames.has(field.fieldName)) {
                newErrors[`field_name_${index}`] = t('validation.error.fieldNameUnique');
            }
            fieldNames.add(field.fieldName);

            const entityTypes: string[] = [EntityType.CHARACTER, EntityType.LOCATION, EntityType.OBJECT, EntityType.ORGANIZATION];
            if (entityTypes.includes(field.fieldType) && !field.role?.trim() && (!field.allowedRoles || field.allowedRoles.length === 0)) {
                 newErrors[`field_role_${index}`] = t('validation.error.roleRequired');
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const clearError = (key: string) => {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[key];
            return newErrors;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        const key = existingSchema?.key || `custom:${entityType.toLowerCase()}:${generateUUID()}`;
        const finalSchema: EventSchema = {
            key,
            label: state.label.trim(),
            entityType,
            schema: state.fields.map(f => ({...f, allowedRoles: f.allowedRoles?.filter(r => r.trim())})),
            summaryTemplate: state.summaryTemplate.trim() || undefined,
        };
        onSave(finalSchema, isEditing);
    };
    
    const baseInputClasses = "w-full bg-primary border rounded-md p-2 text-text-main focus:ring-2 focus:outline-none transition-colors";

    const isEntityField = (field: FormField) => {
        return [EntityType.CHARACTER, EntityType.LOCATION, EntityType.OBJECT, EntityType.ORGANIZATION].includes(field.fieldType as EntityType);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border border-border-color p-4 rounded-md">
                <label htmlFor="eventLabel" className="block text-sm font-medium text-text-secondary">{t('eventSchema.label')}</label>
                <Input
                    id="eventLabel"
                    type="text"
                    value={state.label}
                    onChange={e => {
                        dispatch({ type: 'SET_LABEL', payload: e.target.value });
                        clearError('label');
                    }}
                    placeholder={t('eventSchema.labelPlaceholder')}
                    error={!!errors.label}
                />
                {errors.label && <p className="text-red-500 text-xs mt-1">{errors.label}</p>}
            </div>

            <div>
                <h3 className="text-lg font-semibold text-text-main mb-2">{t('eventSchema.fieldsTitle')}</h3>
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                    {state.fields.map((field, index) => (
                        <div key={index} className="bg-primary border border-border-color p-4 rounded-lg space-y-3 relative animate-fade-in">
                             <button type="button" onClick={() => dispatch({type: 'REMOVE_FIELD', payload: index})} className="absolute top-2 right-2 p-1.5 text-text-secondary hover:text-red-500 rounded-full hover:bg-border-color/50 transition-colors" aria-label={t('eventSchema.removeField')}>
                                <XIcon className="w-4 h-4" />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div>
                                    <label htmlFor={`field-label-${index}`} className="block text-xs font-medium text-text-secondary">{t('eventSchema.fieldLabel')}</label>
                                    <Input id={`field-label-${index}`} type="text" value={field.label} onChange={e => { dispatch({type: 'UPDATE_FIELD', payload: {index, field: {label: e.target.value}}}); clearError(`field_label_${index}`) }} placeholder={t('eventSchema.fieldLabelPlaceholder')} error={!!errors[`field_label_${index}`]} />
                                    {errors[`field_label_${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`field_label_${index}`]}</p>}
                                </div>
                                <div>
                                    <label htmlFor={`field-name-${index}`} className="block text-xs font-medium text-text-secondary">{t('eventSchema.fieldName')}</label>
                                    <Input id={`field-name-${index}`} type="text" value={field.fieldName} onChange={e => { dispatch({type: 'UPDATE_FIELD', payload: {index, field: {fieldName: e.target.value.replace(/\s/g, '_')}}}); clearError(`field_name_${index}`) }} placeholder={t('eventSchema.fieldNamePlaceholder')} error={!!errors[`field_name_${index}`]} />
                                     {errors[`field_name_${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`field_name_${index}`]}</p>}
                                </div>
                                <div>
                                    <label htmlFor={`field-type-${index}`} className="block text-xs font-medium text-text-secondary">{t('eventSchema.fieldType')}</label>
                                    <Select id={`field-type-${index}`} value={field.fieldType} onChange={e => dispatch({type: 'UPDATE_FIELD', payload: {index, field: {fieldType: e.target.value as FormFieldType}}})}>
                                        <option value="text">{t('eventSchema.fieldType.text')}</option>
                                        <option value="textarea">{t('eventSchema.fieldType.textarea')}</option>
                                        <option value="date">{t('eventSchema.fieldType.date')}</option>
                                        <option value={EntityType.CHARACTER}>{EntityType.CHARACTER}</option>
                                        <option value={EntityType.LOCATION}>{EntityType.LOCATION}</option>
                                        <option value={EntityType.OBJECT}>{EntityType.OBJECT}</option>
                                        <option value={EntityType.ORGANIZATION}>{EntityType.ORGANIZATION}</option>
                                    </Select>
                                </div>
                                {isEntityField(field) && (
                                    <>
                                        <div>
                                            <label htmlFor={`field-role-${index}`} className="block text-xs font-medium text-text-secondary">{t('eventSchema.defaultRole')}</label>
                                            <Input id={`field-role-${index}`} type="text" value={field.role} onChange={e => { dispatch({type: 'UPDATE_FIELD', payload: {index, field: {role: e.target.value}}}); clearError(`field_role_${index}`) }} placeholder={t('eventSchema.defaultRolePlaceholder')} error={!!errors[`field_role_${index}`]} />
                                            {errors[`field_role_${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`field_role_${index}`]}</p>}
                                        </div>
                                        <div className="md:col-span-2">
                                            <label htmlFor={`field-allowed-roles-${index}`} className="block text-xs font-medium text-text-secondary">{t('eventSchema.allowedRoles')}</label>
                                            <Input id={`field-allowed-roles-${index}`} type="text" value={(field.allowedRoles || []).join(', ')} onChange={e => dispatch({type: 'UPDATE_FIELD', payload: {index, field: {allowedRoles: e.target.value.split(',').map(r => r.trim())}}})} placeholder={t('eventSchema.allowedRolesPlaceholder')} />
                                            <p className="text-xs text-text-secondary/80 mt-1">{t('eventSchema.allowedRolesHint')}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={() => dispatch({type: 'ADD_FIELD'})} className="mt-4 flex items-center text-sm text-accent hover:text-highlight font-semibold">
                    <PlusCircleIcon className="w-5 h-5 mr-2" /> {t('eventSchema.addField')}
                </button>
            </div>
            
            <div className="border border-border-color p-4 rounded-md">
                 <label htmlFor="summaryTemplate" className="block text-sm font-medium text-text-secondary">{t('eventSchema.summaryTemplate')}</label>
                 <textarea
                    id="summaryTemplate"
                    value={state.summaryTemplate}
                    onChange={e => dispatch({ type: 'SET_SUMMARY_TEMPLATE', payload: e.target.value })}
                    placeholder={t('eventSchema.summaryTemplatePlaceholder')}
                    rows={3}
                    className={`${baseInputClasses} mt-1`}
                />
                <p className="text-xs text-text-secondary/80 mt-1 flex items-center gap-1">
                    <HelpCircleIcon className="w-3 h-3 flex-shrink-0"/>
                    <span>{t('eventSchema.summaryTemplateHint')}</span>
                </p>
            </div>

            <div className="flex justify-end items-center pt-2">
                <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
                <Button type="submit" className="ml-2">
                    {isEditing ? t('common.saveChanges') : t('eventSchema.createButton')}
                </Button>
            </div>
        </form>
    );
};

export default EventSchemaForm;