



// components/views/detail/ObjectHistory.tsx
import React, { useMemo } from 'react';
import { ObjectEntity, HistoricalEvent, EntityId } from '../../../types';
import { useAppSelector } from '../../../state/hooks';
import { selectEventsByEntityId } from '../../../state/selectors';
import { useI18n } from '../../../hooks/useI18n';
import TextWithReferences from '../../common/TextWithReferences';
import { useNavigation } from '../../../hooks/useNavigation';
import { formatWorldDate } from '../../../utils';

const CUSTODY_EVENTS = ['CREATED', 'DESTROYED', 'STOLEN', 'TRANSFERRED', 'FOUND'];

interface ObjectHistoryProps {
    entity: ObjectEntity;
}

const ObjectHistory: React.FC<ObjectHistoryProps> = ({ entity }) => {
    const { t } = useI18n();
    const { calendar } = useAppSelector(state => state.bible.present.project);
    const eventsByEntityId = useAppSelector(selectEventsByEntityId) as Map<EntityId, HistoricalEvent[]>;
    const { navigateToEntity } = useNavigation();

    const historyEvents = useMemo(() => {
        return (eventsByEntityId.get(entity.id) || []).filter(e => CUSTODY_EVENTS.includes(e.type));
    }, [eventsByEntityId, entity.id]);
    
    return (
        <section>
            <h3 className="text-xl font-semibold mb-2">{t('objectDetail.history.title')}</h3>
             <div className="bg-secondary p-4 mt-2 rounded-md border border-border-color space-y-4">
                {historyEvents.length > 0 ? (
                    historyEvents.map(event => (
                        <div key={event.id} className="p-3 bg-primary rounded-md border border-border-color">
                            <h4 className="font-bold text-text-main">{event.type}</h4>
                            <p className="text-sm text-text-secondary mt-1">{formatWorldDate(event.startDateTime, calendar)}</p>
                            <TextWithReferences text={event.description} onNavigate={navigateToEntity} className="text-text-main mt-2"/>
                        </div>
                    ))
                ) : (
                    <p className="text-text-secondary italic">{t('objectDetail.history.empty')}</p>
                )}
             </div>
        </section>
    );
};

export default ObjectHistory;
