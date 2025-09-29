import React, { useState, useMemo } from 'react';
import { FormField, Entity, EntityType, Attributes, AttributeValue } from '../../types/index';
import { TextareaWithMentions } from '../common/TextareaWithMentions';
import { Input, Select } from '../common/ui';

interface DynamicEventFieldsProps {
    formSchema: FormField[];
    formData: Attributes;
    onFormChange: (fieldName: string, value: AttributeValue) => void;
    onStartCreateEntity?: (fieldName: string, entityType: EntityType) => void;
    commonRoles: string[];
    entitiesByType: Map<string, Entity[]>;
}

const EntityFieldWithRole: React.FC<{
    field: FormField;
    entityId: string;
    role: string;
    onEntityChange: (id: string) => void;
    onRoleChange: (role: string) => void;
    commonRoles: string[];
    allAvailableEntities: Entity[];
    onStartCreateEntity?: (fieldName: string, entityType: EntityType) => void;
}> = ({ field, entityId, role, onEntityChange, onRoleChange, commonRoles, allAvailableEntities, onStartCreateEntity }) => {
    
    const defaultRole = field.role || 'Participant';

    const allRoles = useMemo(() => {
        const roles = field.allowedRoles && field.allowedRoles.length > 0
            ? field.allowedRoles
            : [defaultRole, ...commonRoles];
        return Array.from(new Set(roles));
    }, [defaultRole, commonRoles, field.allowedRoles]);

    const isCustom = !allRoles.includes(role);
    const [showCustom, setShowCustom] = useState(isCustom && !!role);

    const handleRoleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === '__CUSTOM__') {
            setShowCustom(true);
            onRoleChange(''); // Clear role to force custom input
        } else {
            setShowCustom(false);
            onRoleChange(e.target.value);
        }
    };
    
    const handleEntityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === '__CREATE_NEW__') {
            onStartCreateEntity?.(field.fieldName, field.fieldType as EntityType);
        } else {
            onEntityChange(e.target.value);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">{field.label}</label>
                <Select 
                    value={entityId || ''} 
                    onChange={handleEntityChange} 
                >
                    <option value="">None</option>
                    <option value="__CREATE_NEW__">-- Create New --</option>
                    {allAvailableEntities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </Select>
            </div>
             <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">Role</label>
                {showCustom ? (
                     <Input 
                        type="text" 
                        value={role} 
                        onChange={e => onRoleChange(e.target.value)} 
                        placeholder="Custom role..."
                    />
                ) : (
                    <Select value={role || defaultRole} onChange={handleRoleSelectChange}>
                        {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
                        <option value="__CUSTOM__">-- Custom --</option>
                    </Select>
                )}
            </div>
        </div>
    );
};


const DynamicEventFields: React.FC<DynamicEventFieldsProps> = ({ formSchema, formData, onFormChange, onStartCreateEntity, commonRoles, entitiesByType }) => {
    
    const renderField = (field: FormField) => {
        const { fieldName, label, fieldType, placeholder } = field;
        const value = formData[fieldName];

        switch (fieldType) {
            case EntityType.CHARACTER:
            case EntityType.LOCATION:
            case EntityType.OBJECT:
            case EntityType.ORGANIZATION: {
                const availableEntities = entitiesByType.get(fieldType as EntityType) || [];
                
                const handleEntitySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
                    if (e.target.value === '__CREATE_NEW__') {
                        onStartCreateEntity?.(fieldName, fieldType as EntityType);
                    } else {
                        onFormChange(fieldName, e.target.value);
                    }
                };

                if (field.role || (field.allowedRoles && field.allowedRoles.length > 0)) {
                    return (
                        <EntityFieldWithRole 
                            key={fieldName}
                            field={field}
                            entityId={value as string}
                            role={formData[`${fieldName}_role`] as string || field.role || ''}
                            onEntityChange={(id) => onFormChange(fieldName, id)}
                            onRoleChange={(role) => onFormChange(`${fieldName}_role`, role)}
                            commonRoles={commonRoles}
                            allAvailableEntities={availableEntities}
                            onStartCreateEntity={onStartCreateEntity}
                        />
                    );
                }

                return (
                    <div key={fieldName}>
                        <label className="block text-sm font-medium text-text-secondary">{label}</label>
                        <Select 
                            value={(value as string) || ''} 
                            onChange={handleEntitySelect}
                            className="mt-1"
                        >
                            <option value="">None</option>
                            <option value="__CREATE_NEW__">-- Create New --</option>
                            {availableEntities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </Select>
                    </div>
                );
            }
            case 'textarea':
                return (
                    <div key={fieldName}>
                        <label className="block text-sm font-medium text-text-secondary">{label}</label>
                        <TextareaWithMentions
                            value={(value as string) || ''}
                            onValueChange={(val) => onFormChange(fieldName, val)}
                            placeholder={placeholder}
                            rows={3}
                            className="w-full mt-1 bg-primary border border-border-color rounded-md p-2 text-text-main focus:ring-2 focus:ring-accent focus:outline-none"
                        />
                    </div>
                );
            case 'date':
                return (
                    <div key={fieldName}>
                        <label className="block text-sm font-medium text-text-secondary">{label}</label>
                        <Input
                            type="date"
                            value={value ? new Date(value as string).toISOString().split('T')[0] : ''}
                            onChange={e => onFormChange(fieldName, new Date(e.target.value).toISOString())}
                            className="mt-1"
                        />
                    </div>
                );
            default: // text
                return (
                    <div key={fieldName}>
                        <label className="block text-sm font-medium text-text-secondary">{label}</label>
                        <Input
                            type="text"
                            value={(value as string) || ''}
                            onChange={e => onFormChange(fieldName, e.target.value)}
                            placeholder={placeholder}
                            className="mt-1"
                        />
                    </div>
                );
        }
    };
    
    return (
        <div className="space-y-4">
            {formSchema.map(renderField)}
        </div>
    );
};

export default DynamicEventFields;