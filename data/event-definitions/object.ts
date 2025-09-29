import { getRef, summaryField } from './common';
import type { EventDefinition, TranslationKey, Entity } from '../../types/index';
import { EntityType } from '../../types/index';

export const objectEventDefinitions: Record<string, EventDefinition> = {
    'CREATED': {
        isNarrative: true,
        schema: [
            { fieldName: 'object', label: 'Object', fieldType: EntityType.OBJECT, role: 'Object', primaryEntityRoleFields: ['object'] },
            { fieldName: 'creator', label: 'Creator', fieldType: EntityType.CHARACTER, role: 'Creator' },
            { fieldName: 'location', label: 'Creation Location', fieldType: EntityType.LOCATION, role: 'Location' },
        ],
        generateSummary: (_p: Entity, details: Record<string, unknown>, getEntityName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const object = getRef(details, 'object', getEntityName);
            const creator = getRef(details, 'creator', getEntityName);
            const location = getRef(details, 'location', getEntityName);
            if (creator && location) return t('eventSummaries.created.byAndAt', { object, creator, location });
            if (creator) return t('eventSummaries.created.by', { object, creator });
            if (location) return t('eventSummaries.created.at', { object, location });
            return t('eventSummaries.created.simple', { object });
        }
    },
    'DESTROYED': {
        isNarrative: true,
        schema: [
            { fieldName: 'object', label: 'Object', fieldType: EntityType.OBJECT, role: 'Object', primaryEntityRoleFields: ['object'] },
            { fieldName: 'destroyer', label: 'Destroyer', fieldType: EntityType.CHARACTER, role: 'Destroyer' },
        ],
        generateSummary: (_p: Entity, details: Record<string, unknown>, getEntityName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const object = getRef(details, 'object', getEntityName);
            const destroyer = getRef(details, 'destroyer', getEntityName);
            if (destroyer) return t('eventSummaries.destroyedObject.by', { object, destroyer });
            return t('eventSummaries.destroyedObject.simple', { object });
        }
    },
    'STOLEN': {
        isNarrative: true,
        schema: [
            { fieldName: 'object', label: 'Object', fieldType: EntityType.OBJECT, role: 'Object Stolen', primaryEntityRoleFields: ['object'] },
            { fieldName: 'thief', label: 'Thief', fieldType: EntityType.CHARACTER, role: 'Thief' },
            { fieldName: 'previousOwner', label: 'Stolen From', fieldType: EntityType.CHARACTER, role: 'Victim' },
            { fieldName: 'location', label: 'Location of Theft', fieldType: EntityType.LOCATION, role: 'Location' },
        ],
        generateSummary: (_p: Entity, details: Record<string, unknown>, getEntityName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const object = getRef(details, 'object', getEntityName);
            const thief = getRef(details, 'thief', getEntityName);
            const previousOwner = getRef(details, 'previousOwner', getEntityName);
            if (thief && previousOwner) return t('eventSummaries.stolen.full', { object, thief, previousOwner });
            if (thief) return t('eventSummaries.stolen.by', { object, thief });
            if (previousOwner) return t('eventSummaries.stolen.from', { object, previousOwner });
            return t('eventSummaries.stolen.simple', { object });
        }
    },
    'TRANSFERRED': {
        isNarrative: true,
        schema: [
            { fieldName: 'object', label: 'Object', fieldType: EntityType.OBJECT, role: 'Object Transferred', primaryEntityRoleFields: ['object'] },
            { fieldName: 'from', label: 'From', fieldType: EntityType.CHARACTER, role: 'Previous Owner' },
            { fieldName: 'to', label: 'To', fieldType: EntityType.CHARACTER, role: 'New Owner' },
        ],
        generateSummary: (_p: Entity, details: Record<string, unknown>, getEntityName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const object = getRef(details, 'object', getEntityName);
            const from = getRef(details, 'from', getEntityName);
            const to = getRef(details, 'to', getEntityName);
            if (from && to) return t('eventSummaries.transferred.full', { object, from, to });
            return t('eventSummaries.transferred.simple', { object });
        }
    },
    'FOUND': {
        isNarrative: true,
        schema: [
            { fieldName: 'object', label: 'Object', fieldType: EntityType.OBJECT, role: 'Object Found', primaryEntityRoleFields: ['object'] },
            { fieldName: 'finder', label: 'Finder', fieldType: EntityType.CHARACTER, role: 'Finder' },
            { fieldName: 'location', label: 'Location Found', fieldType: EntityType.LOCATION, role: 'Location' },
        ],
        generateSummary: (_p: Entity, details: Record<string, unknown>, getEntityName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const object = getRef(details, 'object', getEntityName);
            const finder = getRef(details, 'finder', getEntityName);
            const location = getRef(details, 'location', getEntityName);
            if (finder && location) return t('eventSummaries.found.full', { object, finder, location });
            if (finder) return t('eventSummaries.found.by', { object, finder });
            if (location) return t('eventSummaries.found.at', { object, location });
            return t('eventSummaries.found.simple', { object });
        }
    },
};