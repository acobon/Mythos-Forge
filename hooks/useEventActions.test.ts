

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useEventActions } from './useEventActions';
import * as eventDefs from '../data/event-definitions';
import { renderHookWithProviders } from '../tests/test-utils';
import { EntityType, HistoricalEvent, WorldEvent, EventSchema, ModalType, CharacterEntity, TrashedItem, UIState } from '../types/index';
import { saveEvent, saveWorldEvent } from '../state/slices/eventsSlice';
import { removeItem } from '../state/actions';
import { initialState as uiInitialState } from '../state/uiSlice';

// Mock event definition to control summary generation
vi.mock('../data/event-definitions');

describe('useEventActions', () => {
    const initialBible = {
        entities: {
            entities: {
                'char-1': { id: 'char-1', name: 'Hero', type: EntityType.CHARACTER, description: '', lastModified: '', prompts: {} } as CharacterEntity,
            }
        },
        events: {
             events: {
                'event-to-edit': { id: 'event-to-edit', type: 'BATTLE', description: 'Old Battle', startDateTime: new Date().toISOString(), involvedEntities: [], details: {} }
             },
             customEventSchemas: {}
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(eventDefs.getEventDefinition).mockReturnValue({
            schema: [],
            generateSummary: () => 'Generated Summary'
        });
    });

    it('saveEvent should dispatch saveEvent for a new event', async () => {
        const { result, store } = renderHookWithProviders(() => useEventActions(), { initialStoryBible: initialBible as any });
        const eventData = {
            type: 'JOURNEY',
            startDateTime: new Date().toISOString(),
            notes: 'notes',
            details: { destination: 'Mordor' },
            involvedEntities: [{ entityId: 'char-1', role: 'Traveler' }],
        };

        await act(async () => {
            await result.current.saveEvent('char-1', eventData);
        });

        const actions = store.getActions();
        expect(actions[0].type).toBe(saveEvent.type);
        expect(actions[0].payload.event).toEqual(expect.objectContaining({
            ...eventData,
            description: 'Generated Summary',
        }));
    });
    
     it('saveEvent should use editingEventId for an existing event', async () => {
        const preloadedState = {
            // FIX: Correctly structured the preloaded state for the UI slice to simulate an open modal for editing.
            ui: { ...uiInitialState, modalStack: [{ type: ModalType.EVENT, props: { eventId: 'event-to-edit', onSave: async () => {} } }] } as UIState,
        };
        const { result, store } = renderHookWithProviders(() => useEventActions(), { initialStoryBible: initialBible as any, preloadedState });
        const eventData = {
            type: 'BATTLE',
            startDateTime: new Date().toISOString(),
            notes: 'updated notes',
            details: { location: 'Helm\'s Deep' },
            involvedEntities: [{ entityId: 'char-1', role: 'Warrior' }],
        };

        await act(async () => {
            await result.current.saveEvent('char-1', eventData);
        });
        
        const actions = store.getActions();
        expect(actions[0].type).toBe(saveEvent.type);
        expect(actions[0].payload.event.id).toBe('event-to-edit');
        expect(actions[0].payload.event.notes).toBe('updated notes');
    });

    it('deleteEvent should dispatch removeItem', () => {
        const { result, store } = renderHookWithProviders(() => useEventActions(), { initialStoryBible: initialBible as any });
        act(() => {
            result.current.deleteEvent('event-to-edit');
        });
        const action = store.getActions()[0];
        expect(action.type).toBe(removeItem.type);
        expect(action.payload.itemType).toBe('Event');
        expect(action.payload.item.id).toBe('event-to-edit');
    });

    it('saveWorldEvent should dispatch saveWorldEvent', () => {
        const { result, store } = renderHookWithProviders(() => useEventActions());
        const worldEventData: Partial<WorldEvent> = { id: 'we-1', title: 'The Great War', content: 'It was long', dateTime: new Date().toISOString(), entities: [], category: 'War' };
        act(() => {
            result.current.saveWorldEvent(worldEventData as WorldEvent, 'default-timeline', true);
        });
        expect(store.getActions()[0].type).toBe(saveWorldEvent.type);
    });

    it('deleteCustomEventSchema should dispatch removeItem', () => {
        const customSchema: EventSchema = { key: 'custom:key', entityType: EntityType.CHARACTER, label: 'Custom Event', schema: [] };
        const bibleWithSchema: any = {
            ...initialBible,
            events: {
                ...initialBible.events,
                customEventSchemas: {
                    [EntityType.CHARACTER]: [customSchema]
                }
            }
        };
        const { result, store } = renderHookWithProviders(() => useEventActions(), { initialStoryBible: bibleWithSchema });
        act(() => {
            result.current.deleteCustomEventSchema({ key: 'custom:key', entityType: EntityType.CHARACTER });
        });
        const action = store.getActions()[0];
        expect(action.type).toBe(removeItem.type);
        expect(action.payload.itemType).toBe('EventSchema');
    });
});