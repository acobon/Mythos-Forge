import React, { useState, useReducer, useEffect, useMemo } from 'react';
import { EntityType, EntityTemplate, FormField, FormFieldType } from '../../types/index';
import { XIcon, PlusCircleIcon, TrashIcon } from '../common/Icons';
import { generateUUID, labelToFieldName } from '../../utils';
import { useI18n } from '../../hooks/useI18n';
import { Button, Input, Select } from '../common/ui';

interface TemplateSchemaFormProps {
    entityType: EntityType;
    onSave: (template: EntityTemplate, isEditing: boolean) => void;
    onClose: () => void;
    existingTemplate?: EntityTemplate | null;
    isNameUnique: (name: string, id?: string) => boolean;
}

type FormState = {
    name: string;
    fields: FormField[];
};

type FormAction =
  | { type: 'SET_NAME'; payload: string }
  | { type: 'ADD_FIELD' }
  | { type: 'REMOVE_FIELD'; payload: number }
  | { type: 'UPDATE_FIELD'; payload: { index: number; field: Partial<FormField> } }
  | { type: 'SET_STATE', payload: FormState };

const formReducer = (state: FormState, action: FormAction): FormState => {
    switch (action.type) {
        case 'SET_NAME':
            return { ...state, name: action.payload };
        case 'ADD_FIELD': {
            const newField: FormField = {
                fieldName: '', // Start empty to encourage auto-generation
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
        default:
            return state;
    }
};

const TemplateSchemaForm: React.FC<TemplateSchemaFormProps> = ({ entityType, onSave, onClose, existingTemplate, isNameUnique }) => {
    const { t } = useI18n();
    const isEditing = !!existingTemplate;
    const [state, dispatch] = useReducer(formReducer, { name: '', fields: [] });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const uniqueIdPrefix = useMemo(() => `tpl-form-${Math.random().toString(36).substr(2, 9)}`, []);


    useEffect(() => {
        if (existingTemplate) {
            dispatch({ type: 'SET_STATE', payload: { name: existingTemplate.name, fields: existingTemplate.schema } });
        }
    }, [existingTemplate]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!state.name.trim()) {
            newErrors.name = t('validation.error.required', { field: t('templateSchema.name') });
        } else if (!isNameUnique(state.name, existingTemplate?.id)) {
            newErrors.name = t('validation.error.duplicate', { name: state.name });
        }
        
        const fieldNames = new Set<string>();
        state.fields.forEach((field, index) => {
            if (!field.label.trim()) newErrors[`field_label_${index}`] = t('validation.error.required', { field: t('templateSchema.fieldLabel') });
            if (!field.fieldName.trim()) {
                newErrors[`field_name_${index}`] = t('validation.error.required', { field: t('templateSchema.fieldName') });
            } else if (!/^[a-zA-Z0-9_]+$/.test(field.fieldName)) {
                newErrors[`field_name_${index}`] = t('validation.error.fieldNameFormat');
            } else if (fieldNames.has(field.fieldName)) {
                newErrors[`field_name_${index}`] = t('validation.error.fieldNameUnique');
            }
            fieldNames.add(field.fieldName);
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
        
        const id = existingTemplate?.id || `template:${entityType.toLowerCase()}:${generateUUID()}`;
        const finalTemplate: EntityTemplate = {
            id,
            name: state.name.trim(),
            entityType,
            schema: state.fields,
        };
        onSave(finalTemplate, isEditing);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border border-border-color p-4 rounded-md">
                <label htmlFor="templateName" className="block text-sm font-medium text-text-secondary">{t('templateSchema.name')}</label>
                <Input
                    id="templateName"
                    type="text"
                    value={state.name}
                    onChange={e => {
                        dispatch({ type: 'SET_NAME', payload: e.target.value });
                        clearError('name');
                    }}
                    placeholder={t('templateSchema.namePlaceholder')}
                    error={!!errors.name}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
                <h3 className="text-lg font-semibold text-text-main mb-2">{t('templateSchema.attributesTitle')}</h3>
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                    {state.fields.map((field, index) => (
                        <div key={index} className="bg-primary border border-border-color p-4 rounded-lg space-y-3 relative animate-fade-in">
                            <button type="button" onClick={() => dispatch({type: 'REMOVE_FIELD', payload: index})} className="absolute top-2 right-2 p-1.5 text-text-secondary hover:text-red-500 rounded-full hover:bg-border-color/50 transition-colors" aria-label={t('templateSchema.removeAttribute')}>
                                <XIcon className="w-4 h-4" />
                            </button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div>
                                    <label htmlFor={`${uniqueIdPrefix}-field-label-${index}`} className="block text-xs font-medium text-text-secondary">{t('templateSchema.fieldLabel')}</label>
                                    <Input id={`${uniqueIdPrefix}-field-label-${index}`} type="text" value={field.label} onChange={e => { dispatch({type: 'UPDATE_FIELD', payload: {index, field: {label: e.target.value}}}); clearError(`field_label_${index}`) }} placeholder={t('templateSchema.fieldLabelPlaceholder')} error={!!errors[`field_label_${index}`]} />
                                    {errors[`field_label_${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`field_label_${index}`]}</p>}
                                </div>
                                <div>
                                    <label htmlFor={`${uniqueIdPrefix}-field-name-${index}`} className="block text-xs font-medium text-text-secondary">{t('templateSchema.fieldName')}</label>
                                    <Input id={`${uniqueIdPrefix}-field-name-${index}`} type="text" value={field.fieldName} onChange={e => { dispatch({type: 'UPDATE_FIELD', payload: {index, field: {fieldName: e.target.value.replace(/\s/g, '_')}}}); clearError(`field_name_${index}`) }} placeholder={t('templateSchema.fieldNamePlaceholder')} error={!!errors[`field_name_${index}`]} />
                                     {errors[`field_name_${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`field_name_${index}`]}</p>}
                                </div>
                                <div>
                                    <label htmlFor={`${uniqueIdPrefix}-field-type-${index}`} className="block text-xs font-medium text-text-secondary">{t('templateSchema.fieldType')}</label>
                                    <Select id={`${uniqueIdPrefix}-field-type-${index}`} value={field.fieldType} onChange={e => dispatch({type: 'UPDATE_FIELD', payload: {index, field: {fieldType: e.target.value as FormFieldType}}})}>
                                        <option value="text">{t('eventSchema.fieldType.text')}</option>
                                        <option value="textarea">{t('eventSchema.fieldType.textarea')}</option>
                                        <option value="date">{t('eventSchema.fieldType.date')}</option>
                                        <option value={EntityType.CHARACTER}>{EntityType.CHARACTER}</option>
                                        <option value={EntityType.LOCATION}>{EntityType.LOCATION}</option>
                                        <option value={EntityType.OBJECT}>{EntityType.OBJECT}</option>
                                        <option value={EntityType.ORGANIZATION}>{EntityType.ORGANIZATION}</option>
                                    </Select>
                                </div>
                                 <div>
                                    <label htmlFor={`${uniqueIdPrefix}-field-placeholder-${index}`} className="block text-xs font-medium text-text-secondary">{t('templateSchema.fieldPlaceholder')}</label>
                                    <Input id={`${uniqueIdPrefix}-field-placeholder-${index}`} type="text" value={field.placeholder || ''} onChange={e => dispatch({type: 'UPDATE_FIELD', payload: {index, field: {placeholder: e.target.value}}})} placeholder={t('templateSchema.fieldPlaceholderEx')} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={() => dispatch({type: 'ADD_FIELD'})} className="mt-4 flex items-center text-sm text-accent hover:text-highlight font-semibold">
                    <PlusCircleIcon className="w-5 h-5 mr-2" /> {t('templateSchema.addAttribute')}
                </button>
            </div>

            <div className="flex justify-end items-center pt-2">
                <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}
                </Button>
                <Button type="submit" className="ml-2">
                    {isEditing ? t('common.saveChanges') : t('templateSchema.createButton')}
                </Button>
            </div>
        </form>
    );
};

export default TemplateSchemaForm;