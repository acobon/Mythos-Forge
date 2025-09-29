import React, { useState, useMemo } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { Input, Button } from '../common/ui';
import { useFormValidation } from '../../hooks/useFormValidation';
import { FormFieldType } from '../../types';

interface SaveQueryFormProps {
    onSave: (name: string) => void;
    onClose: () => void;
}

const SaveQueryForm: React.FC<SaveQueryFormProps> = ({ onSave, onClose }) => {
    const { t } = useI18n();
    const [name, setName] = useState('');
    
    const validationSchema = useMemo(() => ({
        name: { field: { fieldName: 'name', label: 'Query Name', fieldType: 'text' as FormFieldType, validation: { required: true } } }
    }), []);
    const { errors, validate, clearError } = useFormValidation(validationSchema);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate({ name })) {
            return;
        }
        onSave(name.trim());
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="query-name" className="block text-sm font-medium text-text-secondary">
                    Query Name
                </label>
                <Input
                    id="query-name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) clearError('name');
                    }}
                    error={!!errors.name}
                    className="mt-1"
                    autoFocus
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div className="flex justify-end items-center pt-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                    {t('common.cancel')}
                </Button>
                <Button type="submit" className="ml-2">
                    {t('common.save')}
                </Button>
            </div>
        </form>
    );
};

export default SaveQueryForm;