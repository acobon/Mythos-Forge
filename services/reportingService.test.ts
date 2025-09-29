import { describe, it, expect } from 'vitest';
import {
    findOrphanedEntities,
    calculatePovDistribution,
    calculateEntityInteractionMatrix,
    getExplicitRelationshipGraph,
    getWordCountHistory,
    getScenePacing,
    getTagAndThemeFrequency,
} from './reportingService';
import { StoryBible, EntityType, CharacterEntity, Work, NarrativeScene, Relationship, HistoricalEvent, LocationEntity, Tag, Theme, Conflict } from '../types';
import { defaultStoryBible } from '../data/defaults';

describe('reportingService', () => {
    describe('findOrphanedEntities', () => {
        it('should return an empty array when all entities are referenced', () => {
            const bible: StoryBible = {
                ...defaultStoryBible,
                entities: {
                    'char-1': { id: 'char-1', name: 'Hero', type: EntityType.CHARACTER, description: '', lastModified: '', prompts: {} } as CharacterEntity,
                },
                events: {
                    'event-1': { id: 'event-1', type: 'BIRTH', description: '', startDateTime: '', involvedEntities: [{ entityId: 'char-1', role: 'Child' }], details: {} },
                },
            };
            expect(findOrphanedEntities(bible)).toEqual([]);
        });

        it('should find entities not referenced in events, scenes, or relationships', () => {
            const bible: StoryBible = {
                ...defaultStoryBible,
                entities: {
                    'char-1': { id: 'char-1', name: 'Hero', type: EntityType.CHARACTER, description: '', lastModified: '', prompts: {} } as CharacterEntity,
                    'char-2': { id: 'char-2', name: 'Orphan', type: EntityType.CHARACTER, description: '', lastModified: '', prompts: {} } as CharacterEntity,
                },
                events: {
                    'event-1': { id: 'event-1', type: 'BIRTH', description: '', startDateTime: '', involvedEntities: [{ entityId: 'char-1', role: 'Child' }], details: {} },
                },
            };
            const orphans = findOrphanedEntities(bible);
            expect(orphans).toHaveLength(1);
            expect(orphans[0].id).toBe('char-2');
        });
        
         it('should check references within entity details and descriptions', () => {
            const bible: StoryBible = {
                ...defaultStoryBible,
                entities: {
                    'char-1': { id: 'char-1', name: 'Hero', type: EntityType.CHARACTER, description: 'Friends with @[Sidekick](char-2)', lastModified: '', prompts: {} } as CharacterEntity,
                    'char-2': { id: 'char-2', name: 'Sidekick', type: EntityType.CHARACTER, description: '', lastModified: '', prompts: {} } as CharacterEntity,
                    'char-3': { id: 'char-3', name: 'Orphan', type: EntityType.CHARACTER, description: '', lastModified: '', prompts: {} } as CharacterEntity,
                },
            };
            const orphans = findOrphanedEntities(bible);
            expect(orphans).toHaveLength(1);
            expect(orphans[0].id).toBe('char-3');
        });
    });

    describe('calculatePovDistribution', () => {
        it('should correctly count scenes for each POV character and Narrator', () => {
            const work: Work = { id: 'work-1', title: 'Test', sceneIds: ['s1', 's2', 's3', 's4'], description: '', chapters: [], workType: 'Novel', status: 'Planning', lastModified: '' };
            const bible = {
                entities: {
                    'char-1': { id: 'char-1', name: 'Hero', type: EntityType.CHARACTER, description: '', lastModified: '' } as CharacterEntity,
                    'char-2': { id: 'char-2', name: 'Villain', type: EntityType.CHARACTER, description: '', lastModified: '' } as CharacterEntity,
                },
                scenes: {
                    's1': { id: 's1', title: '', content: '', povEntityId: 'char-1', involvedEntityIds: [], linkedEventIds: [], lastModified: '' } as NarrativeScene,
                    's2': { id: 's2', title: '', content: '', povEntityId: 'char-2', involvedEntityIds: [], linkedEventIds: [], lastModified: '' } as NarrativeScene,
                    's3': { id: 's3', title: '', content: '', povEntityId: 'char-1', involvedEntityIds: [], linkedEventIds: [], lastModified: '' } as NarrativeScene,
                    's4': { id: 's4', title: '', content: '', involvedEntityIds: [], linkedEventIds: [], lastModified: '' } as NarrativeScene, // No POV
                },
            };

            const distribution = calculatePovDistribution(work, bible as any);

            expect(distribution['Hero']).toBe(2);
            expect(distribution['Villain']).toBe(1);
            expect(distribution['Narrator/None']).toBe(1);
        });
    });

    describe('calculateEntityInteractionMatrix', () => {
        it('should correctly count interactions in scenes and events', () => {
            const bible: Partial<StoryBible> = {
                ...defaultStoryBible,
                entities: {
                    'char-1': { id: 'char-1', name: 'A', type: EntityType.CHARACTER, description: '', lastModified: '', prompts: {} } as CharacterEntity,
                    'char-2': { id: 'char-2', name: 'B', type: EntityType.CHARACTER, description: '', lastModified: '', prompts: {} } as CharacterEntity,
                    'char-3': { id: 'char-3', name: 'C', type: EntityType.CHARACTER, description: '', lastModified: '', prompts: {} } as CharacterEntity,
                },
                scenes: {
                    's1': { id: 's1', title: '', content: '', involvedEntityIds: ['char-1', 'char-2'], linkedEventIds: [], lastModified: '' } as NarrativeScene,
                    's2': { id: 's2', title: '', content: '', povEntityId: 'char-1', involvedEntityIds: ['char-3'], linkedEventIds: [], lastModified: '' } as NarrativeScene,
                },
                events: {
                    'e1': { id: 'e1', type: '', description: '', startDateTime: '', involvedEntities: [{ entityId: 'char-2', role: '' }, { entityId: 'char-3', role: '' }], details: {} } as HistoricalEvent,
                },
            };

            const { matrix } = calculateEntityInteractionMatrix(bible as StoryBible);

            expect(matrix['char-1']['char-2']).toBe(1); // from scene 1
            expect(matrix['char-1']['char-3']).toBe(1); // from scene 2
            expect(matrix['char-2']['char-3']).toBe(1); // from event 1
            expect(matrix['char-2']['char-1']).toBe(1); // matrix should be symmetrical
        });
    });

    describe('getExplicitRelationshipGraph', () => {
        it('should return nodes and edges for explicitly defined relationships', () => {
            const bible: StoryBible = {
                ...defaultStoryBible,
                entities: {
                    'char-1': { id: 'char-1', name: 'A', type: EntityType.CHARACTER, description: '', lastModified: '', prompts: {} } as CharacterEntity,
                    'char-2': { id: 'char-2', name: 'B', type: EntityType.CHARACTER, description: '', lastModified: '', prompts: {} } as CharacterEntity,
                    'loc-1': { id: 'loc-1', name: 'C', type: EntityType.LOCATION, description: '', lastModified: '' } as LocationEntity,
                },
                relationships: {
                    'rel-1': { id: 'rel-1', entityIds: ['char-1', 'char-2'], statuses: [{ id: 's1', type: 'Allies', startDate: '' }] } as Relationship
                }
            };
            const { nodes, edges } = getExplicitRelationshipGraph(bible);
            expect(nodes).toHaveLength(2);
            expect(nodes.map(n => n.id).sort()).toEqual(['char-1', 'char-2']);
            expect(edges).toHaveLength(1);
            expect(edges[0].label).toBe('Allies');
        });
    });
    
    describe('getWordCountHistory', () => {
        it('should return the writing history from the story bible', () => {
             const bible: StoryBible = {
                ...defaultStoryBible,
                writingHistory: [{ date: '2023-01-01', wordCount: 100 }]
            };
            expect(getWordCountHistory(bible)).toEqual([{ date: '2023-01-01', wordCount: 100 }]);
        });
    });
    
    describe('getScenePacing', () => {
        it('should calculate word counts for scenes in a work, respecting chapter and unassigned order', () => {
            const bible: StoryBible = {
                ...defaultStoryBible,
                works: {
                    'work-1': { 
                        id: 'work-1', title: 'My Novel', description: '', workType: 'Novel', status: 'Drafting',
                        sceneIds: ['s3'], 
                        chapters: [
                            { id: 'ch1', title: 'Chapter 1', sceneIds: ['s1', 's2'] }
                        ],
                        lastModified: ''
                    }
                },
                scenes: {
                    's1': { id: 's1', title: 'Scene A', content: '<p>one two three</p>', involvedEntityIds: [], linkedEventIds: [], lastModified: '' } as NarrativeScene,
                    's2': { id: 's2', title: 'Scene B', content: '<p>four five</p>', involvedEntityIds: [], linkedEventIds: [], lastModified: '' } as NarrativeScene,
                    's3': { id: 's3', title: 'Scene C', content: '<p>six</p>', involvedEntityIds: [], linkedEventIds: [], lastModified: '' } as NarrativeScene,
                }
            };
            const pacing = getScenePacing(bible, 'work-1');
            expect(pacing).toEqual([
                { id: 's1', title: 'Scene A', wordCount: 3, chapterTitle: 'Chapter 1' },
                { id: 's2', title: 'Scene B', wordCount: 2, chapterTitle: 'Chapter 1' },
                { id: 's3', title: 'Scene C', wordCount: 1, chapterTitle: 'Unassigned' }
            ]);
        });
    });

    describe('getTagAndThemeFrequency', () => {
        it('should correctly count tags, themes, and conflicts across various items', () => {
            const bible: StoryBible = {
                ...defaultStoryBible,
                tags: { 'tag-1': { id: 'tag-1', label: 'Magic', color: '' } as Tag, 'tag-2': { id: 'tag-2', label: 'Politics', color: '' } as Tag },
                themes: { 'theme-1': { id: 'theme-1', name: 'Redemption', description: '' } as Theme },
                conflicts: { 'conflict-1': { id: 'conflict-1', name: 'War', description: '', type: 'External', status: 'Active' } as Conflict },
                entities: {
                    'char-1': { id: 'char-1', name: 'A', type: EntityType.CHARACTER, description: '', tagIds: ['tag-1'], themeIds: ['theme-1'], conflictIds: ['conflict-1'], lastModified: '', prompts: {} } as CharacterEntity,
                },
                scenes: {
                    's1': { id: 's1', title: '', content: '', tagIds: ['tag-1', 'tag-2'], themeIds: ['theme-1'], involvedEntityIds: [], linkedEventIds: [], lastModified: '' } as NarrativeScene,
                }
            };
            
            const { tags, themes, conflicts } = getTagAndThemeFrequency(bible);
            
            expect(tags[0]).toEqual(expect.objectContaining({ name: 'Magic', count: 2 }));
            expect(tags[1]).toEqual(expect.objectContaining({ name: 'Politics', count: 1 }));
            expect(themes[0]).toEqual(expect.objectContaining({ name: 'Redemption', count: 2 }));
            expect(conflicts[0]).toEqual(expect.objectContaining({ name: 'War', count: 1 }));
        });
    });
});