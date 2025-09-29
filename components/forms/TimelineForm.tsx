// components/forms/TimelineForm.tsx
import React, { useState, useEffect } from 'react';
import { Timeline } from '../../types';
import { useI18n } from '../../hooks/useI18n';
import { Input, Textarea, Button } from '../common/ui';

interface TimelineFormProps {
    onSave: (data: Partial<Timeline> & { name: string }) => void;
    onClose: () => void;
    timelineToEdit?: Timeline | null;
}

const TimelineForm: React.FC<TimelineFormProps> = ({ onSave, onClose, timelineToEdit }) => {
    const { t } = useI18n();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (timelineToEdit) {
            setName(timelineToEdit.name);
            setDescription(timelineToEdit.description || '');
        }
    }, [timelineToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave({ id: timelineToEdit?.id, name, description });
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="timeline-name" className="block text-sm font-medium text-text-secondary">Timeline Name</label>
                <Input
                    id="timeline-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="mt-1"
                    autoFocus
                    required
                />
            </div>
            <div>
                <label htmlFor="timeline-desc" className="block text-sm font-medium text-text-secondary">Description (Optional)</label>
                <Textarea
                    id="timeline-desc"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    className="mt-1"
                />
            </div>
            <div className="flex justify-end pt-2 space-x-2">
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit">Save Timeline</Button>
            </div>
        </form>
    );
};

export default TimelineForm;