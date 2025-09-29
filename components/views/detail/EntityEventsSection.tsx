import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Entity, EntityId, HistoricalEvent, InvolvedEntity, ModalType, Tag } from '../../../types/index';
import { CalendarIcon, EditIcon, PlusCircleIcon, TrashIcon } from '../../common/Icons';
import TextWithReferences from '../../common/TextWithReferences';
import { useEntityEvents } from '../../../hooks/useEntityEvents';
import { useEventActions } from '../../../hooks/useEventActions';
import { formatWorldDate, generateTagColor, getTypedObjectValues } from '../../../utils';
import EntityAssociations from './EntityAssociations';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import { useI18n } from '../../../hooks/useI18n';
import EmptyState from '../../common/EmptyState';
import { useTagActions } from '../../../hooks/useTagActions';
import { useOnboarding } from '../../../contexts/OnboardingContext';
import { useAppDispatch, useAppSelector } from '../../../state/hooks';
import { popModal, pushModal } from '../../../state/uiSlice';

interface EntityEventsSectionProps {
    entity: Entity;
    entityEvents: HistoricalEvent[];
    highlightedEventId: string | null;
    setEventRef: (id: string, element: HTMLElement | null) => void;
    onNavigate: (id: EntityId) => void;
}

type EventFormData = {
    type: string;
    startDateTime: string;
    endDateTime?: string;
    notes: string;
    details: Record<string, any>;
    involvedEntities: InvolvedEntity[];
};

const EntityEventsSection: React.FC<EntityEventsSectionProps> = ({ entity, entityEvents, highlightedEventId, setEventRef, onNavigate }) => {
    const dispatch = useAppDispatch();
    const storyBible = useAppSelector(state => state.bible.present);
    const { deleteEvent, updateEvent, saveEvent } = useEventActions();
    const { createTag } = useTagActions();
    const showConfirm = useConfirmationDialog();
    const { t } = useI18n();
    const { project: { calendar }, metadata: { tags } } = storyBible;
    const { getEventLabel } = useEntityEvents(entity.type as any);
    const addEventButtonRef = useRef<HTMLButtonElement>(null);
    const addFirstEventButtonRef = useRef<HTMLButtonElement>(null);
    const { register } = useOnboarding();
    const allTagsArray = getTypedObjectValues(tags) as Tag[];
    const tagMap = useMemo(() => new Map(allTagsArray.map(t => [t.id, t])), [allTagsArray]);

    useEffect(() => {
        const ref = addEventButtonRef.current || addFirstEventButtonRef.current;
        if (ref) {
            register('add-event', ref);
            return () => {
                register('add-event', null);
            };
        }
    }, [entityEvents.length, register]);

    const handleSaveEvent = async (data: EventFormData) => {
        await saveEvent(entity.id, data);
        dispatch(popModal());
    };

    const handleAddEventClick = () => {
        dispatch(pushModal({ type: ModalType.EVENT, props: { onSave: handleSaveEvent } }));
    };

    const handleEditEventClick = (eventId: string) => {
        dispatch(pushModal({ type: ModalType.EVENT, props: { eventId, onSave: handleSaveEvent } }));
    };

    const handleDeleteClick = (eventId: string) => {
        showConfirm({ 
            title: t('entityDetail.events.delete.title'),
            message: t('entityDetail.events.delete.message'),
            onConfirm: () => deleteEvent(eventId)
        });
    };
    
    const handleCreateTag = (name: string): Tag | undefined => {
        const newColor = generateTagColor(allTagsArray.length);
        return createTag(name, newColor);
    };

    const formatDateRange = (start: string, end?: string) => {
        const startDate = formatWorldDate(start, calendar);
        if (end) {
            const endDate = formatWorldDate(end, calendar);
            return `${startDate} to ${endDate}`;
        }
        return startDate;
    };

    return (
        <section>
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold">{t('entityDetail.events.title')}</h3>
                <button
                    ref={addEventButtonRef}
                    onClick={handleAddEventClick}
                    className="px-3 py-1 text-sm font-semibold text-white bg-accent hover:bg-highlight rounded-md transition-colors flex items-center"
                >
                    <PlusCircleIcon className="w-4 h-4 mr-1" /> {t('entityDetail.events.add')}
                </button>
            </div>
            <div className="space-y-4">
                {entityEvents.length > 0 ? (
                    entityEvents.map(event => (
                        <div
                            key={event.id}
                            ref={el => setEventRef(event.id, el)}
                            className={`p-4 rounded-md border border-border-color transition-all duration-500 ${highlightedEventId === event.id ? 'animate-pulse-highlight bg-secondary' : 'bg-secondary'}`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-text-main flex items-center"><CalendarIcon className="w-4 h-4 mr-2 text-accent" />{getEventLabel(event.type)}</h4>
                                    <p className="text-sm text-text-secondary mt-1">{formatDateRange(event.startDateTime, event.endDateTime)}</p>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                                    <button onClick={() => handleEditEventClick(event.id)} className="p-2 text-text-secondary hover:text-accent rounded-full hover:bg-border-color transition-colors" aria-label={t('entityDetail.events.edit')} title={t('entityDetail.events.edit')}>
                                        <EditIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDeleteClick(event.id)} className="p-2 text-text-secondary hover:text-red-500 rounded-full hover:bg-border-color transition-colors" aria-label={t('entityDetail.events.delete')} title={t('entityDetail.events.delete')}>
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <TextWithReferences text={event.description} onNavigate={onNavigate} className="text-text-main mt-2 whitespace-pre-wrap" />
                             <div className="mt-3 pt-3 border-t border-border-color">
                                <EntityAssociations
                                    label="Tags"
                                    itemTypeName="Tag"
                                    allItems={allTagsArray.map(tag => ({ id: tag.id, name: tag.label }))}
                                    selectedIds={event.tagIds}
                                    onUpdate={(newTagIds) => updateEvent(event.id, { tagIds: newTagIds })}
                                    chipColorClass="bg-gray-500/20 text-gray-300"
                                    onCreateNew={(name) => {
                                        const newTag = handleCreateTag(name);
                                        if (newTag) updateEvent(event.id, { tagIds: [...(event.tagIds || []), newTag.id] });
                                    }}
                                    tagMap={tagMap}
                                />
                            </div>
                        </div>
                    ))
                ) : (
                    <EmptyState
                        icon={<CalendarIcon className="w-16 h-16" />}
                        title={t('entityDetail.events.empty.title')}
                        description={t('entityDetail.events.empty.subtitle', { entityName: entity.name })}
                    >
                        <button
                            ref={addFirstEventButtonRef}
                            onClick={handleAddEventClick}
                            className="px-4 py-2 font-semibold text-white bg-accent hover:bg-highlight rounded-md transition-colors flex items-center"
                        >
                            <PlusCircleIcon className="w-5 h-5 mr-2" />
                            {t('entityDetail.events.addFirst')}
                        </button>
                    </EmptyState>
                )}
            </div>
        </section>
    );
};

export default EntityEventsSection;