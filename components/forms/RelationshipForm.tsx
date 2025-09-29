// components/forms/RelationshipForm.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Entity, EntityId, Relationship, RelationshipStatus, StoryBible } from '../../types';
import { useAppSelector } from '../../state/hooks';
import { getTypedObjectValues } from '../../utils';
import { PlusCircleIcon, TrashIcon } from '../common/Icons';
import { DateTimePicker } from '../common/DateTimePicker';
import { useI18n } from '../../hooks/useI18n';
import { Button, Select } from '../common/ui';

interface RelationshipFormProps {
    onSave: (data: { id?: string; entityIds: [EntityId, EntityId]; statuses: RelationshipStatus[] }) => void;
    onClose: () => void;
    relationshipToEdit?: Relationship | null;
}

const RelationshipForm: React.FC<RelationshipFormProps> = ({ onSave, onClose, relationshipToEdit }) => {
    const { entities } = useAppSelector(state => state.bible.present.entities);
    const { relationshipTypes } = useAppSelector(state => state.bible.present.knowledge);
    const { t } = useI18n();

    const entitiesArray = useMemo(() => (getTypedObjectValues(entities) as Entity[]).sort((a,b) => a.name.localeCompare(b.name)), [entities]);
    const [entity1Id, setEntity1Id] = useState<EntityId>('');
    const [entity2Id, setEntity2Id] = useState<EntityId>('');
    const [statuses, setStatuses] = useState<RelationshipStatus[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (relationshipToEdit) {
            setEntity1Id(relationshipToEdit.entityIds[0]);
            setEntity2Id(relationshipToEdit.entityIds[1]);
            setStatuses(relationshipToEdit.statuses);
        } else {
            setStatuses([{ id: `status-${Date.now()}`, type: relationshipTypes[0] || '', startDate: new Date().toISOString() }]);
        }
    }, [relationshipToEdit, relationshipTypes]);

    const handleStatusChange = (index: number, field: keyof RelationshipStatus, value: string) => {
        setStatuses(prev => {
            const newStatuses = [...prev];
            const statusToUpdate = { ...newStatuses[index] };
            (statusToUpdate as any)[field] = value;
            newStatuses[index] = statusToUpdate;
            return newStatuses;
        });
    };

    const addStatus = () => {
        setStatuses(prev => [...prev, { id: `status-${Date.now()}`, type: '', startDate: new Date().toISOString() }]);
    };
    
    const removeStatus = (index: number) => {
        setStatuses(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!entity1Id || !entity2Id) {
            setError('Please select two entities.');
            return;
        }
        if (entity1Id === entity2Id) {
            setError(t('relationshipForm.error.selfRelationship'));
            return;
        }
        if (statuses.some(s => !s.type.trim())) {
            setError(t('relationshipForm.error.typeRequired'));
            return;
        }

        onSave({ id: relationshipToEdit?.id, entityIds: [entity1Id, entity2Id], statuses });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="entity1" className="block text-sm font-medium text-text-secondary">{t('relationshipForm.entity1')}</label>
                    <Select id="entity1" value={entity1Id} onChange={e => setEntity1Id(e.target.value)} disabled={!!relationshipToEdit}>
                        <option value="">{t('common.select')}</option>
                        {entitiesArray.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </Select>
                </div>
                <div>
                    <label htmlFor="entity2" className="block text-sm font-medium text-text-secondary">{t('relationshipForm.entity2')}</label>
                    <Select id="entity2" value={entity2Id} onChange={e => setEntity2Id(e.target.value)} disabled={!!relationshipToEdit}>
                         <option value="">{t('common.select')}</option>
                         {entitiesArray.filter(e => e.id !== entity1Id).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </Select>
                </div>
            </div>
            
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {statuses.map((status, index) => (
                    <div key={status.id} className="p-3 bg-primary border border-border-color rounded-md space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-text-secondary">{t('relationshipForm.type')}</label>
                                <Select value={status.type} onChange={e => handleStatusChange(index, 'type', e.target.value)}>
                                     <option value="">{t('common.select')}</option>
                                     {relationshipTypes.map(rt => <option key={rt} value={rt}>{rt}</option>)}
                                </Select>
                            </div>
                            <DateTimePicker label={t('relationshipForm.startDate')} value={status.startDate} onChange={val => handleStatusChange(index, 'startDate', val)} />
                        </div>
                        {statuses.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => removeStatus(index)} className="text-red-500"><TrashIcon className="w-4 h-4 mr-1"/> {t('relationshipForm.removeStatus')}</Button>}
                    </div>
                ))}
            </div>
             <Button type="button" variant="ghost" onClick={addStatus} className="flex items-center text-accent hover:text-highlight"><PlusCircleIcon className="w-5 h-5 mr-2" /> {t('relationshipForm.addStatus')}</Button>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex justify-end pt-4">
                <Button type="submit">{t('relationshipForm.saveButton')}</Button>
            </div>
        </form>
    );
};

export default RelationshipForm;
