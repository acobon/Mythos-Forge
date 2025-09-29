import React, { useState, useMemo } from 'react';
import { EntityTypeDefinition, Entity } from '../../types/index';
import { getTypedObjectValues } from '../../utils';
import { useAppSelector } from '../../state/hooks';
import { Button, Select } from '../common/ui';
import { useI18n } from '../../hooks/useI18n';

interface DeleteEntityTypeConfirmationFormProps {
    entityType: EntityTypeDefinition;
    onConfirm: (migrationTypeId: string) => void;
    onClose: () => void;
}

const DeleteEntityTypeConfirmationForm: React.FC<DeleteEntityTypeConfirmationFormProps> = ({ entityType, onConfirm, onClose }) => {
    const { t } = useI18n();
    const { entities, entityTypes } = useAppSelector(state => state.bible.present.entities);
    
    const [migrationKey, setMigrationKey] = useState<string>('');

    const affectedEntities = useMemo(() => {
        return (getTypedObjectValues(entities) as Entity[]).filter(e => e.type === entityType.key);
    }, [entities, entityType.key]);

    const availableMigrationTypes = useMemo(() => {
        return entityTypes.filter(t => t.key !== entityType.key);
    }, [entityTypes, entityType.key]);

    const handleConfirm = () => {
        if (!migrationKey) return;
        onConfirm(migrationKey);
        onClose();
    };
    
    return (
        <div className="space-y-4">
            <p>{t('entityTypeSettings.delete.inUse.message', { typeName: entityType.name, count: affectedEntities.length })}</p>
            
            <ul className="text-sm list-disc list-inside max-h-32 overflow-y-auto bg-primary p-2 my-2 rounded-md border border-border-color">
                {affectedEntities.slice(0, 10).map(e => <li key={e.id}>{e.name}</li>)}
                {affectedEntities.length > 10 && <li>...and {affectedEntities.length - 10} more.</li>}
            </ul>

            <div>
                <label htmlFor="migration-select" className="block text-sm font-medium text-text-secondary">
                    Migrate these entities to type:
                </label>
                <Select
                    id="migration-select"
                    value={migrationKey}
                    onChange={(e) => setMigrationKey(e.target.value)}
                    className="w-full mt-1"
                >
                    <option value="">Select a new type...</option>
                    {availableMigrationTypes.map(t => <option key={t.key} value={t.key}>{t.name}</option>)}
                </Select>
            </div>
            <p className="text-xs text-text-secondary">This action can be undone.</p>
            <div className="flex justify-end items-center pt-4 space-x-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                    {t('common.cancel')}
                </Button>
                <Button type="button" variant="destructive" onClick={handleConfirm} disabled={!migrationKey}>
                    {t('entityTypeSettings.delete.inUse.reassign')} & Delete
                </Button>
            </div>
        </div>
    );
};

export default DeleteEntityTypeConfirmationForm;
