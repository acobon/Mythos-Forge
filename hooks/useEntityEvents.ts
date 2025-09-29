import { useMemo, useCallback } from 'react';
import { EntityType, EventOption, EventGroup, TranslationKey } from '../types/index';
import { builtinEventGroups } from '../data/builtin-events';
import { useI18n } from './useI18n';
import { useAppSelector } from '../state/hooks';

export const useEntityEvents = (entityType: string) => {
    const { t } = useI18n();
    const customEventSchemas = useAppSelector(state => state.bible.present.events.customEventSchemas);

    const eventGroups = useMemo(() => {
        const baseGroups = builtinEventGroups[entityType as EntityType] || [];
        const customEvents = customEventSchemas[entityType] || [];
        
        if (customEvents.length > 0) {
            const customGroup: EventGroup = {
                groupName: t('eventGroups.custom'), // Translating group name is fine
                events: customEvents.map(schema => ({ key: schema.key, label: schema.label })),
            };
            return [...baseGroups, customGroup];
        }
        
        return baseGroups;
    }, [entityType, customEventSchemas, t]);

    const allEventsMap = useMemo(() => {
        const map = new Map<string, string>();
        eventGroups.forEach(group => {
            group.events.forEach(event => {
                map.set(event.key, event.label);
            });
        });
        return map;
    }, [eventGroups]);

    const getEventLabel = useCallback((key: string): string => {
        const labelOrKey = allEventsMap.get(key) || key.replace(/_/g, ' ');
        // For built-in events, the label is a key. For custom, it's the string itself.
        return key.startsWith('custom:') ? labelOrKey : t(labelOrKey as TranslationKey);
    }, [allEventsMap, t]);

    return { eventGroups, getEventLabel, loading: false, error: null };
};