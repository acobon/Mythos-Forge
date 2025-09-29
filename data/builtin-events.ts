
// data/builtin-events.ts
import { EntityType, EventGroup } from '../types/index';
import * as characterEvents from './events/character/index';
import * as locationEvents from './events/location/index';
import * as objectEvents from './events/object/index';
import * as organizationEvents from './events/organization/index';

/**
 * This structure maps each EntityType to an array of EventGroup objects.
 * It serves as the definitive source for all built-in event types available
 * for selection in the UI, categorized for user-friendliness.
 */
export const builtinEventGroups: Record<EntityType, EventGroup[]> = {
    [EntityType.CHARACTER]: [
        { groupName: 'eventGroups.achievements', events: characterEvents.characterAchievementsEvents },
        { groupName: 'eventGroups.career', events: characterEvents.characterCareerEvents },
        { groupName: 'eventGroups.criminal', events: characterEvents.characterCriminalEvents },
        { groupName: 'eventGroups.education', events: characterEvents.characterEducationEvents },
        { groupName: 'eventGroups.financial', events: characterEvents.characterFinancialEvents },
        { groupName: 'eventGroups.legal', events: characterEvents.characterLegalEvents },
        { groupName: 'eventGroups.military', events: characterEvents.characterMilitaryEvents },
        { groupName: 'eventGroups.relationships', events: characterEvents.characterFamilyEvents },
        { groupName: 'eventGroups.residence', events: characterEvents.characterResidenceEvents },
        { groupName: 'eventGroups.social', events: characterEvents.characterSocialEvents },
        { groupName: 'eventGroups.supernatural', events: characterEvents.characterSupernaturalEvents },
        { groupName: 'eventGroups.vitals', events: characterEvents.characterHealthEvents },
        { groupName: 'eventGroups.other', events: characterEvents.characterOtherEvents },
    ],
    [EntityType.LOCATION]: [
        { groupName: 'eventGroups.location', events: locationEvents.locationEvents },
    ],
    [EntityType.OBJECT]: [
        { groupName: 'eventGroups.object', events: objectEvents.objectEvents },
    ],
    [EntityType.ORGANIZATION]: [
        { groupName: 'eventGroups.organization', events: organizationEvents.organizationEvents },
    ],
};