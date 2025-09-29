

import { useMemo } from 'react';
import { HistoricalEvent, EntityId, TranslationKey } from '../types/index';
import { calculateAge } from '../utils';
import { selectEventsByEntityId } from '../state/selectors';
import { useI18n } from './useI18n';
import { VITAL_EVENTS } from '../constants';
import { useAppSelector } from '../state/hooks';

export interface LifeEventsInfo {
    birthEvent: HistoricalEvent | undefined;
    deathEvent: HistoricalEvent | undefined;
    status: 'entityDetail.vitals.status.alive' | 'entityDetail.vitals.status.deceased' | 'entityDetail.vitals.status.unknown';
    ageString: string;
}

export const useLifeEvents = (entityId: EntityId): LifeEventsInfo => {
    const { t } = useI18n();
    const calendar = useAppSelector(state => state.bible.present.project.calendar);
    const eventsByEntityId = useAppSelector(selectEventsByEntityId) as Map<EntityId, HistoricalEvent[]>;

    const lifeEvents = useMemo(() => {
        const relevantEvents = eventsByEntityId.get(entityId) || [];
        
        const birthEvent = relevantEvents.find(e => e.type === VITAL_EVENTS.BIRTH);
        const deathEvent = relevantEvents.find(e => e.type === VITAL_EVENTS.DEATH);

        let status: LifeEventsInfo['status'] = 'entityDetail.vitals.status.unknown';
        let ageString = t('common.notApplicable');

        if (birthEvent) {
            status = deathEvent ? 'entityDetail.vitals.status.deceased' : 'entityDetail.vitals.status.alive';
            const birthISO = birthEvent.startDateTime;
            const deathISO = deathEvent ? deathEvent.startDateTime : null;
            
            if (birthISO) {
                const ageResult = calculateAge(birthISO, deathISO, calendar);
                if ('status' in ageResult) {
                    switch (ageResult.status) {
                        case 'Not yet born': ageString = t('age.notYetBorn'); break;
                        case 'Error': ageString = t('common.error'); break;
                        default: ageString = t('common.notApplicable');
                    }
                } else {
                    const unit = ageResult.unit;
                    const count = ageResult.value;
                    const pluralKey = count === 1 ? 'one' : 'other';
                    const translationKey = `age.unit.${unit}_${pluralKey}` as TranslationKey;
                    ageString = t(translationKey, { count });
                }
            }
        }

        return { birthEvent, deathEvent, status, ageString };

    }, [entityId, eventsByEntityId, calendar, t]);

    return lifeEvents;
};
