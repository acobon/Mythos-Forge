// types/validation.ts
import { EntityId } from "./entities";
import { TranslationKey } from "./i18n";

export interface Inconsistency {
    type: 'Post-Mortem Event' | 'Pre-Birth Event' | 'Invalid Event Dates' | 'Overlapping Events';
    messageKey: TranslationKey;
    messageParams?: Record<string, string>;
    entityId?: EntityId;
    eventId: string;
    entityName?: string;
    eventName?: string;
}
