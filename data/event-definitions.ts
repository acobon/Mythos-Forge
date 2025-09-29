

import { StoryBible, EntityType, Entity, EntityId, EventDefinition, EventSchema, TranslationKey } from '../types/index';
import { builtinEventDefinitions } from './builtin-event-definitions';
import { getTypedObjectValues } from '../utils';

// A fallback definition for events that might not be in the map, preventing crashes.
const generateDefaultDefinition = (schema: EventSchema, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string): EventDefinition => {
    return {
        schema: schema.schema,
        generateSummary: (primaryEntity, details, getEntityName) => {
            if (schema.summaryTemplate && schema.summaryTemplate.trim()) {
                let summary = schema.summaryTemplate;
                // Replace primary entity placeholder
                summary = summary.replace(/{primary_entity}/g, `@[${primaryEntity.name}](${primaryEntity.id})`);
                
                // Replace field placeholders
                schema.schema.forEach(field => {
                    const placeholder = new RegExp(`{${field.fieldName}}`, 'g');
                    if (summary.match(placeholder)) {
                        let value = details[field.fieldName];

                        // If the field is an entity link, format it correctly
                        if (getTypedObjectValues(EntityType).includes(field.fieldType as EntityType) && typeof value === 'string' && value) {
                            const refEntityName = getEntityName(value);
                            if (refEntityName !== 'Unknown Entity') {
                                value = `@[${refEntityName}](${value})`;
                            }
                        }
                        
                        summary = summary.replace(placeholder, String(value || ''));
                    }
                });
                
                // Clean up any unused placeholders to avoid showing e.g. "{location}"
                summary = summary.replace(/{[a-zA-Z0-9_]+}/g, '').trim();
                return summary;
            }
             return t('eventSummaries.defaultCustom', { eventLabel: schema.label, entityName: primaryEntity.name, entityId: primaryEntity.id });
        }
    };
};

const fallbackDefinition = (t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string): EventDefinition => ({
    schema: [
        { fieldName: 'summary', label: t('eventSummaries.fallback.summaryLabel'), fieldType: 'textarea', placeholder: t('eventSummaries.fallback.summaryPlaceholder') }
    ],
    generateSummary: (primaryEntity, details, _getEntityName) => {
         if (details.summary && String(details.summary).trim() !== '') return String(details.summary).trim();
         return t('eventSummaries.fallback.defaultSummary', { entityName: primaryEntity.name, entityId: primaryEntity.id });
    }
});

export const getEventDefinition = (customEventSchemas: Record<string, EventSchema[]>, eventType: string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string): EventDefinition => {
    // 1. Check built-in definitions first
    const builtinDef = builtinEventDefinitions[eventType];
    if (builtinDef) {
        return builtinDef;
    }
    
    // 2. If not found, search custom schemas
    for (const entityType in customEventSchemas) {
        const customSchema = customEventSchemas[entityType as EntityType].find(s => s.key === eventType);
        if (customSchema) {
            return generateDefaultDefinition(customSchema, t);
        }
    }

    // 3. Fallback for safety, though this should ideally never be reached
    return fallbackDefinition(t);
};