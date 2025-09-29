
// forms/DeleteTemplateConfirmationForm.tsx
import React, { useState, useMemo } from 'react';
import { useAppSelector } from '../../state/hooks';
import { getTypedObjectValues } from '../../utils';
import { Button, Select } from '../common/ui';
import { Entity } from '../../types';

interface DeleteTemplateConfirmationFormProps {
    templateId: string;
    entityType: string;
    onConfirm: (migrationTemplateId?: string) => void;
    onClose: () => void;
}

const DeleteTemplateConfirmationForm: React.FC<DeleteTemplateConfirmationFormProps> = ({ templateId, entityType, onConfirm, onClose }) => {
    const { entities, entityTemplates } = useAppSelector(state => state.bible.present.entities);
    const [migrationTemplateId, setMigrationTemplateId] = useState<string>('');
    
    const affectedCount = useMemo(() => {
        return (getTypedObjectValues(entities) as Entity[]).filter(e => e.templateId === templateId).length;
    }, [entities, templateId]);
    
    const availableTemplates = useMemo(() => {
        return (entityTemplates[entityType] || []).filter(t => t.id !== templateId);
    }, [entityTemplates, entityType, templateId]);
    
    const handleConfirm = () => {
        onConfirm(migrationTemplateId || undefined);
        onClose();
    };

    return (
        <div className="space-y-4">
            <p>This template is currently used by {affectedCount} entities. Please choose a new template to migrate them to, or choose "None" to simply remove the template association.</p>
            
            <div>
                 <label htmlFor="migration-template" className="block text-sm font-medium text-text-secondary">
                    Migrate entities to template:
                </label>
                <Select
                    id="migration-template"
                    value={migrationTemplateId}
                    onChange={(e) => setMigrationTemplateId(e.target.value)}
                    className="w-full mt-1"
                >
                    <option value="">None (Remove Template)</option>
                    {availableTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
            </div>

            <div className="flex justify-end items-center pt-4 space-x-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="button" variant="destructive" onClick={handleConfirm}>
                    Migrate & Delete
                </Button>
            </div>
        </div>
    );
};

export default DeleteTemplateConfirmationForm;
