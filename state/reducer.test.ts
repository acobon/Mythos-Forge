

/**
 * This file contains comprehensive unit tests for the storyBibleReducer using Vitest.
 * It covers entities, events, works, series, collections, themes, conflicts, and mind map state changes.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { bibleReducer as rootBibleReducer } from './bibleReducer';
import { addWork, reorderWorksInSeries, saveNarrativeScene, saveSeries, updateWork, updateNarrativeScene as updateNarrativeSceneAction } from './slices/narrativeSlice';
import { updateMindMapNode, updateMindMapEdge, deleteMindMapNode, saveComment } from './slices/knowledgeSlice';
import { saveConflict, saveTheme } from './slices/metadataSlice';
import { updateEntity as updateEntityAction } from './slices/entitiesSlice';
import { HistoryState, withHistory } from './history';
import { AnyAction } from '@reduxjs/toolkit';
import { StoryBible, EntityType, CharacterEntity, Work, NarrativeScene, Series, Collection, Theme, Conflict, MindMapNode, MindMapEdge, Comment, TrashedItem, HistoricalEvent } from '../types/index';
import { defaultStoryBible } from '../data/defaults';
import { deepClone, calculateWordCount } from '../utils';
import { removeItem } from './actions';

const storyBibleReducer = withHistory(rootBibleReducer);

const getInitialState = (): HistoryState<ReturnType<typeof rootBibleReducer>> => ({
    past: [],
    present: rootBibleReducer(undefined, { type: '@@INIT' }),
    future: [],
});

describe('storyBibleReducer', () => {
    let initialState: HistoryState<ReturnType<typeof rootBibleReducer>>;
    let char1: CharacterEntity;
    let char2: CharacterEntity;
    let work1: Work;

    beforeEach(() => {
        initialState = getInitialState();
        char1 = { id: 'char-1', name: 'Hero', type: 'character', description: '', lastModified: new Date().toISOString(), prompts: {} };
        char2 = { id: 'char-2', name: 'Villain', type: 'character', description: '', lastModified: new Date().toISOString(), prompts: {} };
        work1 = { id: 'work-1', title: 'The Great Tale', description: '', sceneIds: [], chapters: [], workType: 'Novel', status: 'Planning', lastModified: new Date().toISOString() };

        initialState.present.entities.entities[char1.id] = char1;
        initialState.present.entities.entities[char2.id] = char2;
        initialState.present.narrative.works[work1.id] = work1;
    });

    describe('narrativeSlice: Works', () => {
        it('should add a new scene to a work', () => {
            const scene: NarrativeScene = { id: 'scene-1', title: 'The Beginning', content: 'Once upon a time', wordCount: 4, involvedEntityIds: [], linkedEventIds: [], lastModified: '' };
            const action = saveNarrativeScene({ workId: 'work-1', scene });
            const newState = storyBibleReducer(initialState, action);

            expect(newState.present.narrative.scenes['scene-1']).toEqual(scene);
            expect(newState.present.narrative.works['work-1'].sceneIds).toContain('scene-1');
        });

        it('should update a scene content and word count', () => {
            const scene: NarrativeScene = { id: 'scene-1', title: 'The Beginning', content: 'Once upon a time', wordCount: 4, involvedEntityIds: [], linkedEventIds: [], lastModified: '' };
            let state = storyBibleReducer(initialState, saveNarrativeScene({ workId: 'work-1', scene }));

            const updates = { content: 'Once upon a time in a land far away.' };
            const action = updateNarrativeSceneAction({ sceneId: 'scene-1', updates });
            const newState = storyBibleReducer(state, action);

            expect(newState.present.narrative.scenes['scene-1'].content).toBe(updates.content);
            expect(newState.present.narrative.scenes['scene-1'].wordCount).toBe(8);
        });

        it('should remove a scene from a work and add it to trash', () => {
            const scene: NarrativeScene = { id: 'scene-1', title: 'The Beginning', content: 'Once upon a time', wordCount: 4, involvedEntityIds: [], linkedEventIds: [], lastModified: '' };
            let state = storyBibleReducer(initialState, saveNarrativeScene({ workId: 'work-1', scene }));
            
            expect(state.present.narrative.scenes['scene-1']).toBeDefined();
            expect(state.present.narrative.works['work-1'].sceneIds).toContain('scene-1');

            const trashedItem: TrashedItem = { item: scene, itemType: 'Scene', deletedAt: new Date().toISOString(), metadata: { workId: 'work-1' } };
            const action = removeItem(trashedItem);
            const newState = storyBibleReducer(state, action);

            expect(newState.present.narrative.scenes['scene-1']).toBeUndefined();
            expect(newState.present.narrative.works['work-1'].sceneIds).not.toContain('scene-1');
            expect(newState.present.project.trash.find(t => t.item.id === 'scene-1')).toBeDefined();
        });
    });

    describe('narrativeSlice: Series & Collections', () => {
        it('should add a new series', () => {
            const series: Series = { id: 'series-1', title: 'The Epic Saga', description: '', workIds: [], lastModified: '' };
            const action = saveSeries(series);
            const newState = storyBibleReducer(initialState, action);
            expect(newState.present.narrative.series['series-1']).toEqual(expect.objectContaining(series));
        });

        it('should add a work to a series', () => {
            const series: Series = { id: 'series-1', title: 'The Epic Saga', description: '', workIds: [], lastModified: '' };
            let state = storyBibleReducer(initialState, saveSeries(series));
            
            state = storyBibleReducer(state, updateWork({ workId: work1.id, updates: { seriesId: 'series-1' } }));
            
            const updatedSeries: Series = { ...series, workIds: [work1.id] };
            const finalState = storyBibleReducer(state, saveSeries(updatedSeries));
            
            expect(finalState.present.narrative.works['work-1'].seriesId).toBe('series-1');
            expect(finalState.present.narrative.series['series-1'].workIds).toContain('work-1');
        });
        
        it('should reorder works in a series', () => {
            const work2: Work = { ...work1, id: 'work-2', title: 'Book 2', seriesId: 'series-1' };
            const series: Series = { id: 'series-1', title: 'Saga', description: '', workIds: ['work-1', 'work-2'], lastModified: '' };
            let state = storyBibleReducer(initialState, addWork(work2));
            state = storyBibleReducer(state, saveSeries(series));

            const action = reorderWorksInSeries({ seriesId: 'series-1', workIds: ['work-2', 'work-1'] });
            const newState = storyBibleReducer(state, action);
            
            expect(newState.present.narrative.series['series-1'].workIds).toEqual(['work-2', 'work-1']);
        });
    });

    describe('metadataSlice: Themes & Conflicts', () => {
        it('should add a new theme', () => {
            const theme: Theme = { id: 'theme-1', name: 'Redemption', description: 'The act of being saved from sin, error, or evil.' };
            const action = saveTheme(theme);
            const newState = storyBibleReducer(initialState, action);
            expect(newState.present.metadata.themes['theme-1']).toEqual(theme);
        });

        it('should add a new conflict and associate it with a character', () => {
            const conflict: Conflict = { id: 'conflict-1', name: 'Man vs. Self', description: 'Internal struggle.', type: 'Internal', status: 'Active' };
            let state = storyBibleReducer(initialState, saveConflict(conflict));
            
            const updatedChar: Partial<CharacterEntity> = { conflictIds: ['conflict-1'] };
            state = storyBibleReducer(state, updateEntityAction({ entityId: 'char-1', updates: updatedChar }));

            expect(state.present.metadata.conflicts['conflict-1']).toBeDefined();
            expect((state.present.entities.entities['char-1'] as CharacterEntity).conflictIds).toContain('conflict-1');
        });
        
        it('should remove a conflict via removeItem and update references', () => {
            const conflict: Conflict = { id: 'conflict-1', name: 'Man vs. Self', description: '', type: 'Internal', status: 'Active' };
            const scene: NarrativeScene = { id: 'scene-1', title: 'A Scene', content: '', wordCount: 0, conflictIds: ['conflict-1'], involvedEntityIds: [], linkedEventIds: [], lastModified: '' };
            let state = storyBibleReducer(initialState, saveConflict(conflict));
            state = storyBibleReducer(state, saveNarrativeScene({ workId: 'work-1', scene }));
            
            expect(state.present.narrative.scenes['scene-1'].conflictIds).toContain('conflict-1');
            expect(state.present.metadata.conflicts['conflict-1']).toBeDefined();
            
            const trashedItem: TrashedItem = { item: conflict, itemType: 'Conflict', deletedAt: new Date().toISOString() };
            const finalState = storyBibleReducer(state, removeItem(trashedItem));

            expect(finalState.present.metadata.conflicts['conflict-1']).toBeUndefined();
            expect(finalState.present.narrative.scenes['scene-1'].conflictIds).not.toContain('conflict-1');
            expect(finalState.present.project.trash).toContainEqual(trashedItem);
        });
    });

    describe('knowledgeSlice: MindMap & Comments', () => {
        it('should add a new mind map node', () => {
            const node: MindMapNode = { id: 'node-1', label: 'Idea 1', x: 10, y: 20 };
            const action = updateMindMapNode(node);
            const newState = storyBibleReducer(initialState, action);
            expect(newState.present.knowledge.mindMap.nodes['node-1']).toEqual(node);
        });

        it('should add a mind map edge', () => {
            const node1: MindMapNode = { id: 'node-1', label: 'Idea 1', x: 10, y: 20 };
            const node2: MindMapNode = { id: 'node-2', label: 'Idea 2', x: 30, y: 40 };
            let state = storyBibleReducer(initialState, updateMindMapNode(node1));
            state = storyBibleReducer(state, updateMindMapNode(node2));
            
            const edge: MindMapEdge = { id: 'edge-1', source: 'node-1', target: 'node-2' };
            const action = updateMindMapEdge(edge);
            const newState = storyBibleReducer(state, action);
            
            expect(newState.present.knowledge.mindMap.edges).toContainEqual(edge);
        });

        it('should delete a mind map node and its connected edges', () => {
            const node1: MindMapNode = { id: 'node-1', label: 'Idea 1', x: 10, y: 20 };
            const node2: MindMapNode = { id: 'node-2', label: 'Idea 2', x: 30, y: 40 };
            const edge: MindMapEdge = { id: 'edge-1', source: 'node-1', target: 'node-2' };
            let state = storyBibleReducer(initialState, updateMindMapNode(node1));
            state = storyBibleReducer(state, updateMindMapNode(node2));
            state = storyBibleReducer(state, updateMindMapEdge(edge));

            const action = deleteMindMapNode('node-1');
            const newState = storyBibleReducer(state, action);

            expect(newState.present.knowledge.mindMap.nodes['node-1']).toBeUndefined();
            expect(newState.present.knowledge.mindMap.edges).toHaveLength(0);
        });

        it('should save a comment', () => {
            const comment: Comment = { id: 'comment-1', sceneId: 'scene-1', text: 'Great scene!', createdAt: new Date().toISOString(), resolved: false };
            const action = saveComment(comment);
            const newState = storyBibleReducer(initialState, action);
            expect(newState.present.knowledge.comments['comment-1']).toEqual(comment);
        });

        it('should remove a comment via removeItem and add it to trash', () => {
            const comment: Comment = { id: 'comment-1', sceneId: 'scene-1', text: 'Great scene!', createdAt: new Date().toISOString(), resolved: false };
            let state = storyBibleReducer(initialState, saveComment(comment));

            const trashedItem: TrashedItem = { item: comment, itemType: 'Comment', deletedAt: new Date().toISOString() };
            const newState = storyBibleReducer(state, removeItem(trashedItem));

            expect(newState.present.knowledge.comments['comment-1']).toBeUndefined();
            expect(newState.present.project.trash).toContainEqual(trashedItem);
        });
    });
    
    describe('removeItem action', () => {
        it('should move an entity to trash and remove it from the entities state', () => {
            const trashedItem: TrashedItem = { item: char1, itemType: 'Entity', deletedAt: new Date().toISOString() };
            const action = removeItem(trashedItem);
            const newState = storyBibleReducer(initialState, action);

            expect(newState.present.entities.entities['char-1']).toBeUndefined();
            expect(newState.present.project.trash).toHaveLength(1);
            expect(newState.present.project.trash[0].item.id).toBe('char-1');
        });

        it('should clean up entity references in events when an entity is removed', () => {
            const event: HistoricalEvent = {
                id: 'event-1', type: 'QUEST', description: 'A quest', startDateTime: new Date().toISOString(),
                involvedEntities: [
                    { entityId: 'char-1', role: 'Leader' },
                    { entityId: 'char-2', role: 'Follower' }
                ],
                details: {}
            };
            let state = initialState;
            state.present.events.events[event.id] = event;

            const trashedItem: TrashedItem = { item: char2, itemType: 'Entity', deletedAt: new Date().toISOString() };
            const action = removeItem(trashedItem);
            const newState = storyBibleReducer(state, action);

            expect(newState.present.events.events['event-1']).toBeDefined();
            expect(newState.present.events.events['event-1'].involvedEntities).toHaveLength(1);
            expect(newState.present.events.events['event-1'].involvedEntities[0].entityId).toBe('char-1');
        });

        it('should delete an event entirely if the last involved entity is removed', () => {
            const event: HistoricalEvent = {
                id: 'event-1', type: 'SOLO_QUEST', description: 'A solo quest', startDateTime: new Date().toISOString(),
                involvedEntities: [{ entityId: 'char-1', role: 'Leader' }],
                details: {}
            };
            let state = initialState;
            state.present.events.events[event.id] = event;

            const trashedItem: TrashedItem = { item: char1, itemType: 'Entity', deletedAt: new Date().toISOString() };
            const action = removeItem(trashedItem);
            const newState = storyBibleReducer(state, action);

            expect(newState.present.events.events['event-1']).toBeUndefined();
        });
    });
});