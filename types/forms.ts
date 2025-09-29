// types/forms.ts

export type AttributeValue = string | number | boolean | string[] | null;
export interface Attributes extends Record<string, AttributeValue | undefined> {}

export type FormFieldType = 'text' | 'textarea' | 'date' | 'select' | string; // string represents an entity type key

export interface FormField {
    fieldName: string; // camelCase
    label: string; // Title Case
    fieldType: FormFieldType;
    options?: string[]; // For 'select'
    role?: string; // For entity types, e.g. "Perpetrator", "Victim"
    allowedRoles?: string[]; // For dynamic role suggestions
    placeholder?: string;
    primaryEntityRoleFields?: string[]; // For defining which fields this entity can be
    validation?: {
        required?: boolean;
        minLength?: number;
        maxLength?: number;
    };
}
