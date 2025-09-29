import { useState, useCallback } from 'react';
import { FormField } from '../types';

interface ValidationSchema<T> {
    [fieldName: string]: {
        field: FormField;
        isUnique?: (value: string) => boolean;
        custom?: (value: any, formData: T) => string | undefined;
    };
}

export const useFormValidation = <T extends Record<string, any>>(schema: ValidationSchema<T>) => {
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = useCallback((formData: T): boolean => {
        const newErrors: Record<string, string> = {};

        for (const fieldName in schema) {
            const { field, isUnique, custom } = schema[fieldName];
            const value = formData[fieldName];
            const validationRules = field.validation;

            if (validationRules?.required && (!value || (typeof value === 'string' && !value.trim()))) {
                newErrors[fieldName] = `${field.label} is required.`;
                continue;
            }

            if (typeof value === 'string') {
                if (validationRules?.minLength && value.trim().length < validationRules.minLength) {
                    newErrors[fieldName] = `${field.label} must be at least ${validationRules.minLength} characters.`;
                    continue;
                }
                if (validationRules?.maxLength && value.trim().length > validationRules.maxLength) {
                    newErrors[fieldName] = `${field.label} cannot exceed ${validationRules.maxLength} characters.`;
                    continue;
                }
            }
            
            if (isUnique && typeof value === 'string' && !isUnique(value)) {
                 newErrors[fieldName] = `${field.label} "${value}" already exists.`;
                 continue;
            }

            if (custom) {
                const customError = custom(value, formData);
                if (customError) {
                    newErrors[fieldName] = customError;
                    continue;
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [schema]);

    const clearError = useCallback((fieldName: string) => {
        setErrors(prev => {
            if (!prev[fieldName]) return prev;
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
        });
    }, []);

    const manualSetErrors = useCallback((newErrors: Record<string, string>) => {
        setErrors(newErrors);
    }, []);

    return { errors, validate, clearError, setErrors: manualSetErrors };
};