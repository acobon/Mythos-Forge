import { getRef, summaryField } from './common';
import type { EventDefinition, TranslationKey, Entity } from '../../types/index';
import { EntityType } from '../../types/index';

export const locationEventDefinitions: Record<string, EventDefinition> = {
    'FOUNDED': {
        isNarrative: true,
        schema: [
            { fieldName: 'location', label: 'Location', fieldType: EntityType.LOCATION, role: 'Location', primaryEntityRoleFields: ['location'] },
            { fieldName: 'founder', label: 'Founder', fieldType: EntityType.CHARACTER, role: 'Founder' },
            { fieldName: 'foundingOrganization', label: 'Founding Organization', fieldType: EntityType.ORGANIZATION, role: 'Founder' },
        ],
        generateSummary: (_p: Entity, details: Record<string, unknown>, getEntityName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const location = getRef(details, 'location', getEntityName);
            const founder = getRef(details, 'founder', getEntityName) || getRef(details, 'foundingOrganization', getEntityName);
            if (founder) return t('eventSummaries.founded.by', { location, founder });
            return t('eventSummaries.founded.simple', { location });
        }
    },
    'DESTROYED': {
        isNarrative: true,
        schema: [
            { fieldName: 'location', label: 'Location', fieldType: EntityType.LOCATION, role: 'Location', primaryEntityRoleFields: ['location'] },
            { fieldName: 'destroyer', label: 'Destroyer', fieldType: EntityType.CHARACTER, role: 'Destroyer' },
            { fieldName: 'destroyingOrganization', label: 'Destroying Organization', fieldType: EntityType.ORGANIZATION, role: 'Destroyer' },
            { fieldName: 'cause', label: 'Cause', fieldType: 'text', placeholder: 'e.g., War, Natural Disaster, Plague' }
        ],
        generateSummary: (_p: Entity, details: Record<string, unknown>, getEntityName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const location = getRef(details, 'location', getEntityName);
            const destroyer = getRef(details, 'destroyer', getEntityName) || getRef(details, 'destroyingOrganization', getEntityName);
            const cause = details.cause;
            if (destroyer && cause) return t('eventSummaries.destroyed.byAndCause', { location, destroyer, cause: String(cause) });
            if (destroyer) return t('eventSummaries.destroyed.by', { location, destroyer });
            if (cause) return t('eventSummaries.destroyed.cause', { location, cause: String(cause) });
            return t('eventSummaries.destroyed.simple', { location });
        }
    },
    'BATTLE': {
        isNarrative: true,
        schema: [
            { fieldName: 'location', label: 'Location', fieldType: EntityType.LOCATION, role: 'Battleground', primaryEntityRoleFields: ['location'] },
            { fieldName: 'name', label: 'Name of Battle', fieldType: 'text', placeholder: 'e.g., The Battle of Helm\'s Deep' },
            { fieldName: 'aggressor', label: 'Aggressor', fieldType: EntityType.ORGANIZATION, role: 'Aggressor' },
            { fieldName: 'defender', label: 'Defender', fieldType: EntityType.ORGANIZATION, role: 'Defender' },
            { fieldName: 'victor', label: 'Victor', fieldType: EntityType.ORGANIZATION, role: 'Victor' },
        ],
        generateSummary: (_p: Entity, details: Record<string, unknown>, getEntityName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const battleName = String(details.name || 'A battle');
            const location = getRef(details, 'location', getEntityName);
            const victor = getRef(details, 'victor', getEntityName);
            if (victor) return t('eventSummaries.battle.withVictor', { battleName, location, victor });
            return t('eventSummaries.battle.base', { battleName, location });
        }
    },
    'RENAMED': {
        schema: [
            { fieldName: 'location', label: 'Location', fieldType: EntityType.LOCATION, role: 'Location', primaryEntityRoleFields: ['location'] },
            { fieldName: 'previousName', label: 'Previous Name', fieldType: 'text' },
        ],
        generateSummary: (primaryEntity: Entity, details: Record<string, unknown>, _getEntityName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const previousName = String(details.previousName || 'The location');
            const newName = `@[${primaryEntity.name}](${primaryEntity.id})`;
            return t('eventSummaries.renamed', { previousName, newName });
        }
    },
    'DISCOVERED': {
        isNarrative: true,
        schema: [
            { fieldName: 'location', label: 'Location', fieldType: EntityType.LOCATION, role: 'Location', primaryEntityRoleFields: ['location'] },
            { fieldName: 'discoverer', label: 'Discoverer', fieldType: EntityType.CHARACTER, role: 'Discoverer' },
        ],
        generateSummary: (_p: Entity, details: Record<string, unknown>, getEntityName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const location = getRef(details, 'location', getEntityName);
            const discoverer = getRef(details, 'discoverer', getEntityName);
            if (discoverer) return t('eventSummaries.discovered.by', { location, discoverer });
            return t('eventSummaries.discovered.simple', { location });
        }
    },
};