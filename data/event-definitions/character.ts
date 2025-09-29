import { getRef, summaryField } from './common';
import type { EventDefinition, TranslationKey, Entity, Attributes } from '../../types/index';
import { EntityType } from '../../types/index';

export const characterEventDefinitions: Record<string, EventDefinition> = {
    // Vitals & Health
    'BIRTH': {
        isNarrative: true,
        schema: [
            { fieldName: 'child', label: 'Child', fieldType: EntityType.CHARACTER, role: 'Child', primaryEntityRoleFields: ['child'] },
            { fieldName: 'birthLocation', label: 'Birth Location', fieldType: EntityType.LOCATION, role: 'Birthplace' },
            { fieldName: 'mother', label: 'Mother', fieldType: EntityType.CHARACTER, role: 'Mother' },
            { fieldName: 'father', label: 'Father', fieldType: EntityType.CHARACTER, role: 'Father' },
        ],
        generateSummary: (_primaryEntity: Entity, details: Attributes, getEntityName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            if (details.summary && String(details.summary).trim() !== '') return String(details.summary).trim();
            const child = getRef(details, 'child', getEntityName);
            const mother = getRef(details, 'mother', getEntityName);
            const father = getRef(details, 'father', getEntityName);
            const location = getRef(details, 'birthLocation', getEntityName);
            
            if (mother && father && location) return t('eventSummaries.birth.full', { child, mother, father, location });
            if (mother && father) return t('eventSummaries.birth.withParents', { child, mother, father });
            if (mother && location) return t('eventSummaries.birth.withMotherAndLocation', { child, mother, location });
            if (father && location) return t('eventSummaries.birth.withFatherAndLocation', { child, father, location });
            if (mother) return t('eventSummaries.birth.withMother', { child, mother });
            if (father) return t('eventSummaries.birth.withFather', { child, father });
            if (location) return t('eventSummaries.birth.withLocation', { child, location });
            return t('eventSummaries.birth.simple', { child });
        }
    },
    'DEATH': {
        isNarrative: true,
        schema: [
            { fieldName: 'deceased', label: 'Deceased', fieldType: EntityType.CHARACTER, role: 'Deceased', primaryEntityRoleFields: ['deceased'] },
            { fieldName: 'causeOfDeath', label: 'Cause of Death', fieldType: 'text', placeholder: 'e.g., Natural causes, accident' },
            { fieldName: 'location', label: 'Location of Death', fieldType: EntityType.LOCATION, role: 'Place of Death' },
        ],
        generateSummary: (_primaryEntity: Entity, details: Attributes, getEntityName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            if (details.summary && String(details.summary).trim() !== '') return String(details.summary).trim();
            const deceased = getRef(details, 'deceased', getEntityName);
            const location = getRef(details, 'location', getEntityName);
            const cause = typeof details.causeOfDeath === 'string' && details.causeOfDeath ? details.causeOfDeath : t('eventSummaries.death.unknownCause');

            if (location) return t('eventSummaries.death.withLocation', { deceased, cause, location: String(location) });
            return t('eventSummaries.death.simple', { deceased, cause });
        }
    },
    'DIAGNOSIS_ILLNESS': {
        schema: [ { fieldName: 'illness', label: 'Illness', fieldType: 'text', placeholder: 'e.g., Dragon Pox' } ],
        generateSummary: (p: Entity, d: Attributes, getName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => t('eventSummaries.diagnosis', { character: `@[${p.name}](${p.id})`, illness: typeof d.illness === 'string' && d.illness ? d.illness : t('eventSummaries.unspecifiedIllness') })
    },
     'SUFFERED_INJURY': {
        schema: [
            { fieldName: 'injury', label: 'Injury', fieldType: 'text', placeholder: 'e.g., Broken leg' },
            { fieldName: 'location', label: 'Location of Injury', fieldType: EntityType.LOCATION, role: 'Injured at' },
        ],
        generateSummary: (primaryEntity: Entity, details: Attributes, getEntityName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const location = getRef(details, 'location', getEntityName);
            const injury = typeof details.injury === 'string' && details.injury ? details.injury : t('eventSummaries.unspecifiedInjury');
            const character = `@[${primaryEntity.name}](${primaryEntity.id})`;
            if (location) return t('eventSummaries.injury.withLocation', { character, injury, location });
            return t('eventSummaries.injury.simple', { character, injury });
        }
    },
    'NEAR_DEATH_EXPERIENCE': {
        schema: [ { fieldName: 'cause', label: 'Cause', fieldType: 'text', placeholder: 'e.g., Drowning, accident' } ],
        generateSummary: (p: Entity, d: Attributes, getName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const character = `@[${p.name}](${p.id})`;
            if (d.cause && typeof d.cause === 'string') return t('eventSummaries.nearDeath.withCause', { character, cause: d.cause });
            return t('eventSummaries.nearDeath.simple', { character });
        }
    },
    'AWARD_RECEIVED': {
        schema: [
            { fieldName: 'recipient', label: 'Recipient', fieldType: EntityType.CHARACTER, role: 'Recipient', primaryEntityRoleFields: ['recipient'] },
            { fieldName: 'awardName', label: 'Award Name', fieldType: 'text', placeholder: 'e.g., Medal of Valor' },
            { fieldName: 'organization', label: 'Awarding Organization', fieldType: EntityType.ORGANIZATION, role: 'Awarding Body' },
        ],
        generateSummary: (p: Entity, d: Attributes, getName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const recipient = getRef(d, 'recipient', getName);
            const award = typeof d.awardName === 'string' && d.awardName ? d.awardName : t('eventSummaries.award.unnamed');
            const org = getRef(d, 'organization', getName);
            if (org) return t('eventSummaries.award.withOrg', { recipient, award, org });
            return t('eventSummaries.award.simple', { recipient, award });
        }
    },
    'TRAVEL': {
        schema: [
            { fieldName: 'traveler', label: 'Traveler', fieldType: EntityType.CHARACTER, role: 'Traveler', primaryEntityRoleFields: ['traveler'] },
            { fieldName: 'destination', label: 'Destination', fieldType: EntityType.LOCATION, role: 'Destination' },
            { fieldName: 'origin', label: 'Origin', fieldType: EntityType.LOCATION, role: 'Origin' },
        ],
        generateSummary: (p: Entity, d: Attributes, getName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const traveler = getRef(d, 'traveler', getName);
            const dest = getRef(d, 'destination', getName);
            const origin = getRef(d, 'origin', getName);
            if (origin && dest) return t('eventSummaries.travel.fromTo', { traveler, origin, dest });
            if (dest) return t('eventSummaries.travel.to', { traveler, dest });
            return t('eventSummaries.travel.simple', { traveler });
        }
    },
    'MILITARY_ENLISTMENT': {
        schema: [
            { fieldName: 'enlistee', label: 'Enlistee', fieldType: EntityType.CHARACTER, role: 'Enlistee', primaryEntityRoleFields: ['enlistee'] },
            { fieldName: 'branch', label: 'Branch', fieldType: 'text', placeholder: 'e.g., Royal Army, Starfleet' },
            { fieldName: 'organization', label: 'Military Organization', fieldType: EntityType.ORGANIZATION, role: 'Military' },
        ],
        generateSummary: (p: Entity, d: Attributes, getName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const enlistee = getRef(d, 'enlistee', getName);
            const branch = typeof d.branch === 'string' ? d.branch : null;
            const org = getRef(d, 'organization', getName);
            if (org && branch) return t('eventSummaries.military.enlistBranchOrg', { enlistee, branch, org });
            if (org) return t('eventSummaries.military.enlistOrg', { enlistee, org });
            if (branch) return t('eventSummaries.military.enlistBranch', { enlistee, branch });
            return t('eventSummaries.military.enlistSimple', { enlistee });
        }
    },
     'VICTIM_OF_CRIME': {
        schema: [
            { fieldName: 'victim', label: 'Victim', fieldType: EntityType.CHARACTER, role: 'Victim', primaryEntityRoleFields: ['victim'] },
            { fieldName: 'crimeType', label: 'Type of Crime', fieldType: 'text', placeholder: 'e.g., Robbery, Assault' },
            { fieldName: 'perpetrator', label: 'Perpetrator', fieldType: EntityType.CHARACTER, role: 'Perpetrator' },
        ],
        generateSummary: (p: Entity, d: Attributes, getName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const victim = getRef(d, 'victim', getName);
            const crime = typeof d.crimeType === 'string' && d.crimeType ? d.crimeType : t('eventSummaries.crime.unspecified');
            const perp = getRef(d, 'perpetrator', getName);
            if (perp) return t('eventSummaries.crime.withPerp', { victim, crime, perp });
            return t('eventSummaries.crime.simple', { victim, crime });
        }
    },

    // Relationships & Family
    'MARRIAGE': {
        isNarrative: true,
        schema: [
            { fieldName: 'spouse1', label: 'Spouse 1', fieldType: EntityType.CHARACTER, role: 'Spouse', primaryEntityRoleFields: ['spouse1', 'spouse2'] },
            { fieldName: 'spouse2', label: 'Spouse 2', fieldType: EntityType.CHARACTER, role: 'Spouse' },
            { fieldName: 'location', label: 'Location', fieldType: EntityType.LOCATION, role: 'Wedding Venue' },
        ],
        generateSummary: (_p: Entity, d: Attributes, getName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const s1 = getRef(d, 'spouse1', getName);
            const s2 = getRef(d, 'spouse2', getName);
            const loc = getRef(d, 'location', getName);
            if (!s1 || !s2) return t('eventSummaries.marriage.incomplete');
            
            if (loc) return t('eventSummaries.marriage.withLocation', { spouse1: s1, spouse2: s2, location: loc });
            return t('eventSummaries.marriage.base', { spouse1: s1, spouse2: s2 });
        }
    },
    'DIVORCE': {
        isNarrative: true,
         schema: [
            { fieldName: 'spouse1', label: 'Spouse 1', fieldType: EntityType.CHARACTER, role: 'Divorced Spouse', primaryEntityRoleFields: ['spouse1', 'spouse2'] },
            { fieldName: 'spouse2', label: 'Spouse 2', fieldType: EntityType.CHARACTER, role: 'Divorced Spouse' },
        ],
        generateSummary: (_p: Entity, d: Attributes, getName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const s1 = getRef(d, 'spouse1', getName);
            const s2 = getRef(d, 'spouse2', getName);
            if (!s1 || !s2) return t('eventSummaries.divorce.incomplete');
            return t('eventSummaries.divorce.full', { spouse1: s1, spouse2: s2 });
        }
    },
    'HAD_CHILD': {
        isNarrative: true,
        schema: [
            { fieldName: 'parent', label: 'Parent', fieldType: EntityType.CHARACTER, role: 'Parent', primaryEntityRoleFields: ['parent'] },
            { fieldName: 'child', label: 'Child', fieldType: EntityType.CHARACTER, role: 'Child' },
        ],
        generateSummary: (_p: Entity, d: Attributes, getName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const parent = getRef(d, 'parent', getName);
            const child = getRef(d, 'child', getName);
            if (!parent || !child) return t('eventSummaries.hadChild.incomplete');
            return t('eventSummaries.hadChild.full', { parent, child });
        }
    },

    // Residence
    'MOVED': {
        isNarrative: true,
        schema: [
            { fieldName: 'character', label: 'Character Who Moved', fieldType: EntityType.CHARACTER, role: 'Resident', primaryEntityRoleFields: ['character'] },
            { fieldName: 'newLocation', label: 'New Location', fieldType: EntityType.LOCATION, role: 'New Residence' },
            { fieldName: 'previousLocation', label: 'Previous Location', fieldType: EntityType.LOCATION, role: 'Old Residence' },
        ],
        generateSummary: (_p: Entity, d: Attributes, getName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const char = getRef(d, 'character', getName);
            const to = getRef(d, 'newLocation', getName);
            const from = getRef(d, 'previousLocation', getName);
            if (!char) return t('eventSummaries.moved.incomplete');
            if (from && to) return t('eventSummaries.moved.fromTo', { character: char, from, to });
            if (to) return t('eventSummaries.moved.to', { character: char, to });
            return t('eventSummaries.moved.simple', { character: char });
        }
    },

    // Career
    'GOT_JOB': {
        isNarrative: true,
        schema: [
            { fieldName: 'character', label: 'Character', fieldType: EntityType.CHARACTER, role: 'Employee', primaryEntityRoleFields: ['character']},
            { fieldName: 'employer', label: 'Employer', fieldType: EntityType.ORGANIZATION, role: 'Employer'},
            { fieldName: 'position', label: 'Position', fieldType: 'text', placeholder: 'e.g., Knight, Wizard'},
        ],
        generateSummary: (_p: Entity, d: Attributes, getName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const char = getRef(d, 'character', getName);
            const employer = getRef(d, 'employer', getName);
            const pos = typeof d.position === 'string' ? d.position : null;
            if(!char) return t('eventSummaries.gotJob.incomplete');
            if(employer && pos) return t('eventSummaries.gotJob.full', { character: char, employer, position: pos });
            if(employer) return t('eventSummaries.gotJob.withEmployer', { character: char, employer });
            if(pos) return t('eventSummaries.gotJob.withPosition', { character: char, position: pos });
            return t('eventSummaries.gotJob.simple', { character: char });
        }
    },
    'STARTED_BUSINESS': {
        isNarrative: true,
         schema: [
            { fieldName: 'founder', label: 'Founder', fieldType: EntityType.CHARACTER, role: 'Founder', primaryEntityRoleFields: ['founder']},
            { fieldName: 'business', label: 'Business', fieldType: EntityType.ORGANIZATION, role: 'Business'},
        ],
        generateSummary: (_p: Entity, d: Attributes, getName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const founder = getRef(d, 'founder', getName);
            const business = getRef(d, 'business', getName);
            if(founder && business) return t('eventSummaries.startedBusiness.full', { founder, business });
            return t('eventSummaries.startedBusiness.incomplete');
        }
    },

    // Education
    'GRADUATED': {
        isNarrative: true,
        schema: [
            { fieldName: 'graduate', label: 'Graduate', fieldType: EntityType.CHARACTER, role: 'Graduate', primaryEntityRoleFields: ['graduate']},
            { fieldName: 'institution', label: 'Institution', fieldType: EntityType.ORGANIZATION, role: 'Alma Mater'},
            { fieldName: 'degree', label: 'Degree/Certification', fieldType: 'text', placeholder: 'e.g., Master of Arcane Arts'}
        ],
        generateSummary: (_p: Entity, d: Attributes, getName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const grad = getRef(d, 'graduate', getName);
            const inst = getRef(d, 'institution', getName);
            const degree = d.degree;
            if(!grad || !inst) return t('eventSummaries.graduated.incomplete');
            
            if (degree && typeof degree === 'string') return t('eventSummaries.graduated.withDegree', { graduate: grad, institution: inst, degree });
            return t('eventSummaries.graduated.base', { graduate: grad, institution: inst });
        }
    },
    
    // Legal & Civic
    'ARRESTED': {
        schema: [
            { fieldName: 'person', label: 'Person Arrested', fieldType: EntityType.CHARACTER, role: 'Arrestee', primaryEntityRoleFields: ['person'] },
            { fieldName: 'charges', label: 'Charges', fieldType: 'text', placeholder: 'e.g., Treason, Theft' },
            { fieldName: 'arresting_officer', label: 'Arresting Officer', fieldType: EntityType.CHARACTER, role: 'Arresting Officer' },
            { fieldName: 'location', label: 'Location of Arrest', fieldType: EntityType.LOCATION, role: 'Location' },
        ],
        generateSummary: (_p: Entity, d: Attributes, getName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const person = getRef(d, 'person', getName);
            const officer = getRef(d, 'arresting_officer', getName);
            const charges = d.charges;
            if (!person) return t('eventSummaries.arrested.incomplete');

            if (officer && charges) return t('eventSummaries.arrested.full', { person, officer, charges: String(charges) });
            if (officer) return t('eventSummaries.arrested.by', { person, officer });
            if (charges) return t('eventSummaries.arrested.for', { person, charges: String(charges) });
            return t('eventSummaries.arrested.simple', { person });
        }
    },
    'CHANGED_NAME': {
        schema: [
            { fieldName: 'person', label: 'Person', fieldType: EntityType.CHARACTER, role: 'Person', primaryEntityRoleFields: ['person'] },
            { fieldName: 'previousName', label: 'Previous Name', fieldType: 'text' },
            { fieldName: 'newName', label: 'New Name', fieldType: 'text' },
        ],
        generateSummary: (_p: Entity, d: Attributes, getName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => {
            const person = getRef(d, 'person', getName);
            const prev = d.previousName;
            const newN = d.newName;
            if (!person) return t('eventSummaries.changedName.incomplete');
            if (prev && typeof prev === 'string' && newN && typeof newN === 'string') return t('eventSummaries.changedName.full', { person, previousName: prev, newName: newN });
            return t('eventSummaries.changedName.simple', { person });
        }
    },

    // Other - a generic fallback for any non-defined event
    'OTHER': {
        schema: [ summaryField ],
        generateSummary: (_p: Entity, details: Attributes, getName: (id: string) => string, t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string) => String(details.summary) || t('eventSummaries.other.default')
    }
};