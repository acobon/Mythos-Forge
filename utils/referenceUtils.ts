
import { EntityId, Entity } from './types';
import { escapeRegExp } from './textUtils';

export const makeReferenceUpdater = (entityId: EntityId, newName: string) => {
    const referenceRegex = new RegExp(`@\\[([^\\]]+)\\]\\((${escapeRegExp(entityId)})\\)`, 'g');
    const replacement = `@[${newName}](${entityId})`;
    return (text: string): string => {
        if (typeof text !== 'string' || !text || !text.includes(`(${entityId})`)) {
            return text;
        }
        return text.replace(referenceRegex, replacement);
    };
};

/**
 * Creates a function to handle references to a deleted entity.
 * This function is now DESTRUCTIVE. It finds all references to the deleted
 * entity and replaces the markdown link with the plain text display name.
 * @param entity The entity being deleted.
 * @returns A function that takes text and returns it with references removed.
 */
export const makeReferenceDeleter = (entity: Entity) => {
    // This regex finds references to the specific entityId and captures the display name.
    const referenceRegex = new RegExp(`@\\[([^\\]]+)\\]\\((${escapeRegExp(entity.id)})\\)`, 'g');
    
    return (text: string): string => {
        if (typeof text !== 'string' || !text || !text.includes(`(${entity.id})`)) {
            return text;
        }
        // It replaces the entire markdown link, e.g., "@[John Doe](char-123)", with just the display name, "John Doe".
        return text.replace(referenceRegex, '$1');
    };
};


/**
 * Recursively traverses an object or array and applies an update function to all string values.
 * Returns a new object/array, suitable for use outside of an Immer producer.
 * @param obj The object or array to process.
 * @param updateFn The function to apply to each string.
 * @returns A new object or array with updated strings.
 */
export const deepApplyReferenceUpdates = (obj: any, updateFn: (text: string) => string): any => {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => deepApplyReferenceUpdates(item, updateFn));
    }

    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (typeof value === 'string') {
                newObj[key] = updateFn(value);
            } else if (typeof value === 'object') {
                newObj[key] = deepApplyReferenceUpdates(value, updateFn);
            } else {
                newObj[key] = value;
            }
        }
    }
    return newObj;
};
