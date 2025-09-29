import { FormField, EntityId } from '../../types/index';

export const summaryField: FormField = {
    fieldName: 'summary',
    label: 'Summary',
    fieldType: 'textarea',
    placeholder: 'Provide a complete summary for this event. This will be used as the full description.'
};

export const getRef = (details: Record<string, unknown>, key: string, getEntityName: (id: EntityId) => string): string => {
    const entityId = details[key];
    if (entityId && typeof entityId === 'string') {
        const entityName = getEntityName(entityId);
        if (entityName && entityName !== 'Unknown Entity') {
            return `@[${entityName}](${entityId})`;
        }
    }
    return '';
};