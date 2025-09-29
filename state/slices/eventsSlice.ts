// state/slices/eventsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HistoricalEvent, WorldEvent, Timeline, EventSchema, TrashedItem, Entity, Tag } from '../../types/index';
import { defaultStoryBible } from '../../data/defaults';
import { restoreFromTrash } from './projectSlice';
import { removeItem, mergeTags } from '../actions';
import { getTypedObjectValues } from '../../utils';

interface EventsState {
    events: Record<string, HistoricalEvent>;
    worldEvents: Record<string, WorldEvent>;
    timelines: Record<string, Timeline>;
    customEventSchemas: Record<string, EventSchema[]>;
}

const initialState: EventsState = {
    events: defaultStoryBible.events,
    worldEvents: defaultStoryBible.worldEvents,
    timelines: defaultStoryBible.timelines,
    customEventSchemas: defaultStoryBible.customEventSchemas,
};

const eventsSlice = createSlice({
    name: 'events',
    initialState,
    reducers: {
        saveEvent: (state, action: PayloadAction<{ event: HistoricalEvent; primaryEntityId: string }>) => {
            const { event, primaryEntityId } = action.payload;
            state.events[event.id] = event;
            if (!event.involvedEntities.some(inv => inv.entityId === primaryEntityId)) {
                state.events[event.id].involvedEntities.push({ entityId: primaryEntityId, role: 'Participant' });
            }
        },
        updateEvent: (state, action: PayloadAction<{ eventId: string; updates: Partial<HistoricalEvent> }>) => {
            const { eventId, updates } = action.payload;
            const event = state.events[eventId];
            if (event) {
                Object.assign(event, updates);
            }
        },
        saveWorldEvent: (state, action: PayloadAction<{ event: WorldEvent, timelineId: string, isNew: boolean }>) => {
            const { event, timelineId, isNew } = action.payload;
            state.worldEvents[event.id] = event;
            if (isNew) {
                const timeline = state.timelines[timelineId];
                if (timeline && !timeline.eventIds.includes(event.id)) {
                    timeline.eventIds.push(event.id);
                }
            }
        },
        updateWorldEvent: (state, action: PayloadAction<{ eventId: string, updates: Partial<WorldEvent>}>) => {
            const { eventId, updates } = action.payload;
            const event = state.worldEvents[eventId];
            if (event) Object.assign(event, updates);
        },
        saveTimeline: (state, action: PayloadAction<Timeline>) => {
            state.timelines[action.payload.id] = action.payload;
        },
        addCustomEventSchema: (state, action: PayloadAction<EventSchema>) => {
            const { entityType } = action.payload;
            if (!state.customEventSchemas[entityType]) {
                state.customEventSchemas[entityType] = [];
            }
            state.customEventSchemas[entityType].push(action.payload);
        },
        updateCustomEventSchema: (state, action: PayloadAction<EventSchema>) => {
            const { entityType, key } = action.payload;
            const schemas = state.customEventSchemas[entityType];
            if (schemas) {
                const index = schemas.findIndex(s => s.key === key);
                if (index > -1) schemas[index] = action.payload;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(restoreFromTrash, (state, action: PayloadAction<{ item: TrashedItem }>) => {
                const { item, itemType } = action.payload.item;
                if (itemType === 'Event') state.events[(item as HistoricalEvent).id] = item as HistoricalEvent;
                if (itemType === 'WorldEvent') state.worldEvents[(item as WorldEvent).id] = item as WorldEvent;
                if (itemType === 'Timeline') state.timelines[(item as Timeline).id] = item as Timeline;
                if (itemType === 'EventSchema') {
                    const schema = item as EventSchema;
                    if (!state.customEventSchemas[schema.entityType]) state.customEventSchemas[schema.entityType] = [];
                    state.customEventSchemas[schema.entityType].push(schema);
                }
            })
            .addCase(removeItem, (state, action: PayloadAction<TrashedItem>) => {
                const { item, itemType } = action.payload;
                // Direct deletion
                if (itemType === 'Event') delete state.events[(item as HistoricalEvent).id];
                if (itemType === 'WorldEvent') {
                    delete state.worldEvents[(item as WorldEvent).id];
                    Object.values(state.timelines).forEach((timeline: Timeline) => {
                        timeline.eventIds = timeline.eventIds.filter(id => id !== (item as WorldEvent).id);
                    });
                }
                if (itemType === 'Timeline') delete state.timelines[(item as Timeline).id];
                if (itemType === 'EventSchema') {
                    const schema = item as EventSchema;
                    if (state.customEventSchemas[schema.entityType]) {
                        state.customEventSchemas[schema.entityType] = state.customEventSchemas[schema.entityType].filter(s => s.key !== schema.key);
                    }
                }

                if (itemType === 'Tag') {
                    const tagId = (item as Tag).id;
                    (getTypedObjectValues(state.events) as HistoricalEvent[]).forEach(e => {
                        if (e.tagIds?.includes(tagId)) e.tagIds = e.tagIds.filter(id => id !== tagId);
                    });
                    (getTypedObjectValues(state.worldEvents) as WorldEvent[]).forEach(e => {
                        if (e.tagIds?.includes(tagId)) e.tagIds = e.tagIds.filter(id => id !== tagId);
                    });
                }

                // Cascading cleanup for Entity deletion
                if (itemType === 'Entity') {
                    const entityId = (item as Entity).id;
                    Object.keys(state.events).forEach(eventId => {
                        const event = state.events[eventId];
                        event.involvedEntities = event.involvedEntities.filter(inv => inv.entityId !== entityId);
                        // If the entity was the last one involved, delete the whole event
                        if (event.involvedEntities.length === 0) {
                            delete state.events[eventId];
                        }
                    });
                    Object.values(state.worldEvents).forEach((event: WorldEvent) => {
                        event.entities = event.entities.filter(id => id !== entityId);
                    });
                }
            })
            .addCase(mergeTags, (state, action) => {
                 const { sourceTagId, targetTagId } = action.payload;
                const updateIds = (ids?: string[]) => {
                    if (!ids) return ids;
                    const idSet = new Set(ids);
                    if (idSet.has(sourceTagId)) {
                        idSet.delete(sourceTagId);
                        idSet.add(targetTagId);
                        return Array.from(idSet);
                    }
                    return ids;
                };
                (getTypedObjectValues(state.events) as HistoricalEvent[]).forEach(e => { e.tagIds = updateIds(e.tagIds); });
                (getTypedObjectValues(state.worldEvents) as WorldEvent[]).forEach(e => { e.tagIds = updateIds(e.tagIds); });
            });
    },
});

export const {
    saveEvent,
    updateEvent,
    saveWorldEvent,
    updateWorldEvent,
    saveTimeline,
    addCustomEventSchema,
    updateCustomEventSchema,
} = eventsSlice.actions;

export default eventsSlice.reducer;
