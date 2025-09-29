// hooks/useEventActions.ts
import { useCallback } from 'react';
import { HistoricalEvent, InvolvedEntity, EntityId, WorldEvent, EventSchema, EntityType, Timeline, TrashedItem } from '../types/index';
import { generateId } from '../utils';
import { getEventDefinition } from '../data/event-definitions';
import { useI18n } from './useI18n';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { 
    saveEvent as saveEventAction, 
    updateEvent as updateEventAction, 
    saveWorldEvent as saveWorldEventAction, 
    updateWorldEvent as updateWorldEventAction, 
    saveTimeline as saveTimelineAction, 
    addCustomEventSchema, 
    updateCustomEventSchema, 
} from '../state/slices/eventsSlice';
import { ModalType } from '../types/enums';
import { removeItem } from '../state/actions';

export const useEventActions = () => {
    const dispatch = useAppDispatch();
    const storyBible = useAppSelector(state => state.bible.present);
    const modalStack = useAppSelector(state => state.ui.modalStack);
    
    const topModal = modalStack[modalStack.length - 1];
    const editingEventId = topModal?.type === ModalType.EVENT ? (topModal.props as any)?.eventId : null;
    const { t } = useI18n();

    const saveEvent = useCallback(async (
        primaryEntityId: EntityId,
        eventData: {
            type: string;
            startDateTime: string;
            endDateTime?: string;
            notes: string;
            details: Record<string, any>;
            involvedEntities: InvolvedEntity[];
        }
    ) => {
        const primaryEntity = storyBible.entities.entities[primaryEntityId];
        if (!primaryEntity) {
            console.error("Primary entity not found for event save.");
            return;
        }
        const getEntityName = (id: EntityId) => storyBible.entities.entities[id]?.name || 'Unknown';
        const eventDef = getEventDefinition(storyBible.events.customEventSchemas, eventData.type, t);
        const description = eventDef.generateSummary(primaryEntity, eventData.details, getEntityName, t);

        const eventPayload: HistoricalEvent = {
            id: editingEventId || generateId('he'),
            ...eventData,
            description,
        };
        
        dispatch(saveEventAction({ event: eventPayload, primaryEntityId }));
    }, [editingEventId, storyBible, dispatch, t]);

    const updateEvent = useCallback((eventId: string, updates: Partial<HistoricalEvent>) => {
        dispatch(updateEventAction({ eventId, updates }));
    }, [dispatch]);

    const deleteEvent = useCallback((eventId: string) => {
        const event = storyBible.events.events[eventId];
        if (event) {
            dispatch(removeItem({ item: event, itemType: 'Event', deletedAt: new Date().toISOString() }));
        }
    }, [dispatch, storyBible.events.events]);
     
    const saveWorldEvent = useCallback((eventData: { id?: string; title: string; content: string; dateTime: string; entities: EntityId[]; category?: string; }, timelineId: string) => {
        const isNew = !eventData.id;
        const existingEvent = eventData.id ? storyBible.events.worldEvents[eventData.id] : undefined;
        const newEvent: WorldEvent = {
            id: eventData.id || generateId('w-event'),
            entities: eventData.entities,
            title: eventData.title,
            content: eventData.content,
            dateTime: eventData.dateTime,
            category: eventData.category,
            tagIds: existingEvent?.tagIds || [],
        };
        dispatch(saveWorldEventAction({ event: newEvent, timelineId, isNew }));
    }, [dispatch, storyBible.events.worldEvents]);
    
    const updateWorldEvent = useCallback((eventId: string, updates: Partial<WorldEvent>) => {
        dispatch(updateWorldEventAction({ eventId, updates }));
    }, [dispatch]);

    const deleteWorldEvent = useCallback((eventId: string) => {
        const event = storyBible.events.worldEvents[eventId];
        if (event) {
            const trashed: TrashedItem = { item: event, itemType: 'WorldEvent', deletedAt: new Date().toISOString() };
            dispatch(removeItem(trashed));
        }
    }, [dispatch, storyBible.events.worldEvents]);

    const saveCustomEventSchema = useCallback((schema: EventSchema, isEditing: boolean) => {
        dispatch(isEditing ? updateCustomEventSchema(schema) : addCustomEventSchema(schema));
    }, [dispatch]);

    const deleteCustomEventSchema = useCallback((payload: { key: string; entityType: string }) => {
        const schemaToDelete = storyBible.events.customEventSchemas[payload.entityType]?.find(s => s.key === payload.key);
        if (schemaToDelete) {
            dispatch(removeItem({ item: schemaToDelete, itemType: 'EventSchema', deletedAt: new Date().toISOString() }));
        }
    }, [dispatch, storyBible.events.customEventSchemas]);

    const saveTimeline = useCallback((data: Partial<Timeline> & { name: string }): Timeline => {
        const existing = data.id ? storyBible.events.timelines[data.id] : null;
        const payload: Timeline = {
            id: data.id || generateId('timeline'),
            name: data.name,
            description: data.description || existing?.description,
            eventIds: existing?.eventIds || [],
        };
        dispatch(saveTimelineAction(payload));
        return payload;
    }, [dispatch, storyBible.events.timelines]);

    const deleteTimeline = useCallback((timelineId: string) => {
        const timeline = storyBible.events.timelines[timelineId];
        if (timeline) {
            dispatch(removeItem({ item: timeline, itemType: 'Timeline', deletedAt: new Date().toISOString() }));
        }
    }, [dispatch, storyBible.events.timelines]);


    return {
        saveEvent,
        updateEvent,
        deleteEvent,
        saveWorldEvent,
        updateWorldEvent,
        deleteWorldEvent,
        saveCustomEventSchema,
        deleteCustomEventSchema,
        saveTimeline,
        deleteTimeline,
    };
};