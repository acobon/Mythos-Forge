import { getRef, summaryField } from './common';
import type { EventDefinition, TranslationKey, Entity } from '../../types/index';
import { EntityType } from '../../types/index';

export const organizationEventDefinitions: Record<string, EventDefinition> = {
    'FORMED': {
        isNarrative: true,
        schema: [
            { fieldName: 'organization', label: 'Organization', fieldType: EntityType.ORGANIZATION, role: 'Organization', primaryEntityRoleFields: ['organization'] },
            { fieldName: 'founder', label: 'Founder', fieldType: EntityType.CHARACTER, role: 'Founder' },
            { fieldName: 'location', label: 'Headquarters', fieldType: EntityType.LOCATION, role: 'Headquarters' },
        ],
        generateSummary: (_p: Entity, details: Record<string, unknown>, getEntityName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const organization = getRef(details, 'organization', getEntityName);
            const founder = getRef(details, 'founder', getEntityName);
            const location = getRef(details, 'location', getEntityName);
            if (founder && location) return t('eventSummaries.formed.full', { organization, founder, location });
            if (founder) return t('eventSummaries.formed.by', { organization, founder });
            if (location) return t('eventSummaries.formed.at', { organization, location });
            return t('eventSummaries.formed.simple', { organization });
        }
    },
    'DISBANDED': {
        isNarrative: true,
        schema: [ 
            { fieldName: 'organization', label: 'Organization', fieldType: EntityType.ORGANIZATION, role: 'Organization', primaryEntityRoleFields: ['organization'] },
            summaryField 
        ],
        generateSummary: (_p: Entity, details: Record<string, unknown>, getEntityName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            if (details.summary && String(details.summary).trim() !== '') return String(details.summary).trim();
            const entityRef = getRef(details, 'organization', getEntityName);
            return `${entityRef} was disbanded.`;
        }
    },
    'MERGED': {
        isNarrative: true,
        schema: [
            { fieldName: 'organization1', label: 'Organization 1', fieldType: EntityType.ORGANIZATION, role: 'Merged Party', primaryEntityRoleFields: ['organization1', 'organization2'] },
            { fieldName: 'organization2', label: 'Organization 2', fieldType: EntityType.ORGANIZATION, role: 'Merged Party' },
            { fieldName: 'newName', label: 'New Name', fieldType: 'text', placeholder: '(Optional)' },
        ],
        generateSummary: (_p: Entity, details: Record<string, unknown>, getEntityName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const org1 = getRef(details, 'organization1', getEntityName);
            const org2 = getRef(details, 'organization2', getEntityName);
            const newName = details.newName;
            if (!org1 || !org2) return 'A merger occurred.';
            if (newName) return t('eventSummaries.merged.newName', { org1, org2, newName: String(newName) });
            return t('eventSummaries.merged.base', { org1, org2 });
        }
    },
    'RELOCATED': {
        isNarrative: true,
        schema: [
            { fieldName: 'organization', label: 'Organization', fieldType: EntityType.ORGANIZATION, role: 'Organization', primaryEntityRoleFields: ['organization'] },
            { fieldName: 'newLocation', label: 'New Headquarters', fieldType: EntityType.LOCATION, role: 'New Headquarters' },
            { fieldName: 'oldLocation', label: 'Old Headquarters', fieldType: EntityType.LOCATION, role: 'Old Headquarters' },
        ],
        generateSummary: (_p: Entity, details: Record<string, unknown>, getEntityName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const organization = getRef(details, 'organization', getEntityName);
            const newLocation = getRef(details, 'newLocation', getEntityName);
            if (newLocation) return t('eventSummaries.relocated.to', { organization, newLocation });
            return t('eventSummaries.relocated.simple', { organization });
        }
    },
    'ACHIEVEMENT': {
        schema: [
            { fieldName: 'organization', label: 'Organization', fieldType: EntityType.ORGANIZATION, role: 'Organization', primaryEntityRoleFields: ['organization'] },
            { fieldName: 'achievement', label: 'Achievement', fieldType: 'text', placeholder: 'e.g., Cured a disease, won a war' },
        ],
        generateSummary: (_p: Entity, details: Record<string, unknown>, getEntityName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const organization = getRef(details, 'organization', getEntityName);
            const achievement = details.achievement;
            if (achievement) return t('eventSummaries.achievement.full', { organization, achievement: String(achievement) });
            return t('eventSummaries.achievement.simple', { organization });
        }
    },
};