
// data/builtin-event-definitions.ts
import type { EventDefinition } from '../types/index';
import { characterEventDefinitions } from './event-definitions/character';
import { locationEventDefinitions } from './event-definitions/location';
import { objectEventDefinitions } from './event-definitions/object';
import { organizationEventDefinitions } from './event-definitions/organization';

export const builtinEventDefinitions: Record<string, EventDefinition> = {
    ...characterEventDefinitions,
    ...locationEventDefinitions,
    ...objectEventDefinitions,
    ...organizationEventDefinitions,
};