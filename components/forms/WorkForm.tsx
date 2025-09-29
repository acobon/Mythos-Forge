// components/forms/WorkForm.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Work, WorkStatus, WorkType, FormFieldType } from '../../types/index';
import { useAppSelector } from '../../state/hooks';
import { getTypedObjectValues } from '../../utils';
import { Input, Textarea, Select, Button } from '../common/ui';
import { useFormValidation } from '../../hooks/useFormValidation';
import { useI18n } from '../../hooks/useI18n';
import { WORK_STATUS, WORK_TYPE } from '../../constants';

interface WorkFormProps {
    onSave: (data: Partial<Work> & { title: string }, isEditing: boolean) => void;
    onClose: () => void;
    workToEdit?: Work | null;
}

const WorkForm: React.FC<WorkFormProps> = ({ onSave, onClose, workToEdit }) => {
    const { t } = useI18n();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [workType, setWorkType] = useState<WorkType>(WORK_TYPE.NOVEL);
    const [status, setStatus] = useState<WorkStatus>(WORK_STATUS.PLANNING);
    
    const validationSchema = useMemo(() => ({
        title: { field: { fieldName: 'title', label: 'Title', fieldType: 'text' as FormFieldType, validation: { required: true } } }
    }), []);
    const { errors, validate, clearError } = useFormValidation(validationSchema);

    useEffect(() => {
        if (workToEdit) {
            setTitle(workToEdit.title);
            setDescription(workToEdit.description);
            setWorkType(workToEdit.workType);
            setStatus(workToEdit.status);
        }
    }, [workToEdit]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate({ title })) return;
        
        onSave({ id: workToEdit?.id, title, description, workType, status }, !!workToEdit);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="work-title" className="block text-sm font-medium text-text-secondary">Title</label>
                <Input id="work-title" type="text" value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setTitle(e.target.value); clearError('title'); }} className="mt-1" error={!!errors.title} autoFocus />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>
            <div>
                <label htmlFor="work-desc" className="block text-sm font-medium text-text-secondary">Description (Optional)</label>
                <Textarea id="work-desc" value={description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} rows={3} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="work-type" className="block text-sm font-medium text-text-secondary">Type</label>
                    <Select id="work-type" value={workType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setWorkType(e.target.value as WorkType)} className="mt-1">
                        {(Object.values(WORK_TYPE) as WorkType[]).map(type => <option key={type} value={type}>{type}</option>)}
                    </Select>
                </div>
                <div>
                    <label htmlFor="work-status" className="block text-sm font-medium text-text-secondary">Status</label>
                    <Select id="work-status" value={status} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as WorkStatus)} className="mt-1">
                         {(Object.values(WORK_STATUS) as WorkStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                </div>
            </div>
            <div className="flex justify-end items-center pt-2">
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit" className="ml-2">
                    {workToEdit ? `Save Work` : `Create Work`}
                </Button>
            </div>
        </form>
    );
};

export default WorkForm;