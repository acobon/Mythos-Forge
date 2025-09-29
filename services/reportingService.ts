// services/reportingService.ts
import { StoryBible, HistoricalEvent, Entity, EntityTemplate, EntityType, CharacterEntity, GraphNode, GraphEdge, Work, Relationship, NarrativeScene, OrganizationEntity, Theme, Conflict, Tag, OrphanedEntity, PovDistribution, ScenePacingInfo, TagThemeFrequencyData, InteractionMatrix, CharacterMentions, ItemUsage, FrequencyInfo } from '../types';
import { getEventDefinition } from '../data/event-definitions';
import { getTypedObjectValues, calculateWordCount } from '../utils';

export const getItemUsageDetails = (storyBible: StoryBible, itemId: string, itemType: 'Tag' | 'Theme' | 'Conflict'): ItemUsage[] => {
    const usage: ItemUsage[] = [];
    const idField = `${itemType.toLowerCase()}Ids` as 'tagIds' | 'themeIds' | 'conflictIds';

    Object.values(storyBible.entities).forEach(entity => {
        if ((entity as any)[idField]?.includes(itemId)) {
            usage.push({ id: entity.id, name: entity.name, type: entity.type, location: 'Entity' });
        }
    });

    const workMap = new Map<string, string>();
    Object.values(storyBible.works).forEach(work => {
        const allSceneIds = new Set([...work.sceneIds, ...work.chapters.flatMap(c => c.sceneIds)]);
        allSceneIds.forEach(sceneId => workMap.set(sceneId, work.id));
    });

    Object.values(storyBible.scenes).forEach(scene => {
        if (scene[idField]?.includes(itemId)) {
            const work = workMap.get(scene.id);
            usage.push({ id: scene.id, name: scene.title, type: 'Scene', location: work ? storyBible.works[work]?.title : 'Unassigned', workId: work });
        }
    });

    return usage;
};

export const getCharacterMentions = (storyBible: StoryBible, workId: string): CharacterMentions[] => {
    const work = storyBible.works[workId];
    if (!work) return [];

    const characterMap = new Map<string, string>();
    getTypedObjectValues(storyBible.entities).forEach(e => {
        if (e.type === EntityType.CHARACTER) {
            characterMap.set(e.id, e.name);
        }
    });

    const mentionCounts = new Map<string, number>();
    const allWorkSceneIds = [...work.sceneIds, ...work.chapters.flatMap(c => c.sceneIds)];

    allWorkSceneIds.forEach(sceneId => {
        const scene = storyBible.scenes[sceneId];
        if (!scene || !scene.content) return;

        const regex = /@\[[^\]]+\]\(([^)]+)\)/g;
        let match;
        while ((match = regex.exec(scene.content)) !== null) {
            const entityId = match[2]; // group 2 is the id
            if (characterMap.has(entityId)) {
                mentionCounts.set(entityId, (mentionCounts.get(entityId) || 0) + 1);
            }
        }
    });

    return Array.from(mentionCounts.entries())
        .map(([id, count]) => ({
            id,
            name: characterMap.get(id) || 'Unknown Character',
            count,
        }))
        .sort((a, b) => b.count - a.count);
};

export const getWordCountHistory = (storyBible: StoryBible): Array<{ date: string; wordCount: number; }> => {
    return storyBible.writingHistory || [];
};

export const getScenePacing = (storyBible: StoryBible, workId: string): ScenePacingInfo[] | null => {
    const work = storyBible.works[workId];
    if (!work) return null;

    const pacingData: ScenePacingInfo[] = [];
    const workScenes = new Map((work.sceneIds || []).map(id => storyBible.scenes[id]).filter(Boolean).map(s => [s.id, s]));

    work.chapters.forEach(chapter => {
        chapter.sceneIds.forEach(sceneId => {
            const scene = workScenes.get(sceneId);
            if (scene) {
                pacingData.push({
                    id: scene.id,
                    title: scene.title,
                    wordCount: calculateWordCount(scene.content),
                    chapterTitle: chapter.title,
                });
            }
        });
    });

    const assignedSceneIds = new Set(work.chapters.flatMap(c => c.sceneIds));
    const unassignedScenes = (work.sceneIds || []).filter(id => !assignedSceneIds.has(id));

    if (unassignedScenes.length > 0) {
        unassignedScenes.forEach(sceneId => {
            const scene = workScenes.get(sceneId);
            if (scene) {
                pacingData.push({
                    id: scene.id,
                    title: scene.title,
                    wordCount: calculateWordCount(scene.content),
                    chapterTitle: 'Unassigned',
                });
            }
        });
    }

    return pacingData;
};

export const getTagAndThemeFrequency = (storyBible: StoryBible): TagThemeFrequencyData => {
    const tagCounts: Record<string, number> = {};
    const themeCounts: Record<string, number> = {};
    const conflictCounts: Record<string, number> = {};

    const increment = (map: Record<string, number>, ids?: string[]) => {
        if (!ids) return;
        ids.forEach(id => {
            map[id] = (map[id] || 0) + 1;
        });
    };

    getTypedObjectValues(storyBible.entities).forEach(entity => {
        increment(tagCounts, entity.tagIds);
        if (entity.type === EntityType.CHARACTER) {
            increment(themeCounts, (entity as CharacterEntity).themeIds);
            increment(conflictCounts, (entity as CharacterEntity).conflictIds);
        }
    });

    getTypedObjectValues(storyBible.events).forEach(event => increment(tagCounts, event.tagIds));
    getTypedObjectValues(storyBible.worldEvents).forEach(event => increment(tagCounts, event.tagIds));
    getTypedObjectValues(storyBible.scenes).forEach(scene => {
        if(scene) {
            increment(tagCounts, scene.tagIds);
            increment(themeCounts, scene.themeIds);
            increment(conflictCounts, scene.conflictIds);
        }
    });
    getTypedObjectValues(storyBible.works).forEach(work => increment(tagCounts, work.tagIds));
    getTypedObjectValues(storyBible.series).forEach(series => increment(tagCounts, series.tagIds));
    getTypedObjectValues(storyBible.collections).forEach(collection => increment(tagCounts, collection.tagIds));
    getTypedObjectValues(storyBible.researchNotes).forEach(note => increment(tagCounts, note.tagIds));

    const tags: FrequencyInfo[] = Object.entries(tagCounts)
        .map(([id, count]) => ({
            id,
            name: storyBible.tags[id]?.label || 'Unknown Tag',
            count,
            color: storyBible.tags[id]?.color,
            type: 'tag' as const,
        }))
        .sort((a, b) => b.count - a.count);

    const themes: FrequencyInfo[] = Object.entries(themeCounts)
        .map(([id, count]) => ({
            id,
            name: storyBible.themes[id]?.name || 'Unknown Theme',
            count,
            type: 'theme' as const,
        }))
        .sort((a, b) => b.count - a.count);
        
    const conflicts: FrequencyInfo[] = Object.entries(conflictCounts)
        .map(([id, count]) => ({
            id,
            name: storyBible.conflicts[id]?.name || 'Unknown Conflict',
            count,
            type: 'conflict' as const,
        }))
        .sort((a, b) => b.count - a.count);

    return { tags, themes, conflicts };
};


export const findOrphanedEntities = (storyBible: StoryBible): OrphanedEntity[] => {
    const referencedIds = new Set<string>();
    const { entities, events, relationships, works, scenes, worldEvents } = storyBible;

    // Helper to add entity IDs from details objects
    const addDetailsRefs = (details: Record<string, any> | undefined) => {
        if (!details) return;
        for (const value of Object.values(details)) {
            // A simple check to see if the value could be an entity ID
            if (typeof value === 'string' && value.includes('-')) {
                referencedIds.add(value);
            }
        }
    };

    // 1. Single pass to collect all referenced IDs
    getTypedObjectValues(events).forEach(event => {
        event.involvedEntities.forEach(inv => referencedIds.add(inv.entityId));
        addDetailsRefs(event.details);
    });

    getTypedObjectValues(relationships).forEach(rel => {
        referencedIds.add(rel.entityIds[0]);
        referencedIds.add(rel.entityIds[1]);
    });

    getTypedObjectValues(scenes).forEach(scene => {
        if (scene.povEntityId) referencedIds.add(scene.povEntityId);
        (scene.involvedEntityIds || []).forEach(id => referencedIds.add(id));
    });
    
    getTypedObjectValues(worldEvents).forEach(event => {
        (event.entities || []).forEach(id => referencedIds.add(id));
    });

    getTypedObjectValues(entities).forEach(entity => {
        addDetailsRefs(entity.details);
        if (entity.type === EntityType.ORGANIZATION) {
            (entity as OrganizationEntity).members?.forEach(member => referencedIds.add(member.entityId));
        }
    });

    // 2. Single pass to find entities that are not in the referenced set
    return getTypedObjectValues(entities)
        .filter(entity => !referencedIds.has(entity.id))
        .map(e => ({ id: e.id, name: e.name, type: e.type }));
};

export const calculatePovDistribution = (work: Work, storyBible: { entities: Record<string, Entity>, scenes: Record<string, NarrativeScene>} ): PovDistribution => {
    const distribution: PovDistribution = {};
    const entityMap = new Map(getTypedObjectValues(storyBible.entities).map(e => [e.id, e.name]));

    (work.sceneIds || []).forEach(sceneId => {
        const scene = storyBible.scenes[sceneId];
        if (scene) {
            const povName = scene.povEntityId ? entityMap.get(scene.povEntityId) || 'Unknown Character' : 'Narrator/None';
            distribution[povName] = (distribution[povName] || 0) + 1;
        }
    });

    return distribution;
};

export const calculateEntityInteractionMatrix = (storyBible: { entities: Record<string, Entity>, scenes: Record<string, NarrativeScene>, events: Record<string, HistoricalEvent> }): InteractionMatrix => {
    const characters = getTypedObjectValues(storyBible.entities).filter(e => e.type === EntityType.CHARACTER) as CharacterEntity[];
    const entityMap = new Map(characters.map(c => [c.id, c]));
    const entityIds = Array.from(entityMap.keys());
    const matrix: Record<string, Record<string, number>> = {};

    entityIds.forEach(c1 => {
        matrix[c1] = {};
        entityIds.forEach(c2 => {
            matrix[c1][c2] = 0;
        });
    });

    const incrementInteraction = (id1: string, id2: string) => {
        if (matrix[id1] && matrix[id2]) {
            matrix[id1][id2]++;
            matrix[id2][id1]++;
        }
    };

    // Count interactions in scenes
    getTypedObjectValues(storyBible.scenes).forEach((scene: NarrativeScene | undefined) => {
        if (scene) {
            const sceneEntities: string[] = [];
            (scene.involvedEntityIds || []).forEach(id => {
                if (entityMap.has(id)) sceneEntities.push(id);
            });
            if (scene.povEntityId && entityMap.has(scene.povEntityId)) {
                sceneEntities.push(scene.povEntityId);
            }
            
            const uniqueSceneEntities = [...new Set(sceneEntities)];

            for (let i = 0; i < uniqueSceneEntities.length; i++) {
                for (let j = i + 1; j < uniqueSceneEntities.length; j++) {
                    incrementInteraction(uniqueSceneEntities[i], uniqueSceneEntities[j]);
                }
            }
        }
    });
    
    // Count interactions in historical events
    getTypedObjectValues(storyBible.events).forEach(event => {
        const eventEntities = event.involvedEntities
            .map(inv => inv.entityId)
            .filter(id => entityMap.has(id));
            
        const uniqueEventEntities = [...new Set(eventEntities)];
        
        if (uniqueEventEntities.length > 1) {
            for (let i = 0; i < uniqueEventEntities.length; i++) {
                for (let j = i + 1; j < uniqueEventEntities.length; j++) {
                    incrementInteraction(uniqueEventEntities[i], uniqueEventEntities[j]);
                }
            }
        }
    });

    return { entities: characters, matrix };
};


export interface RelationshipGraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

export const getExplicitRelationshipGraph = (storyBible: { entities: Record<string, Entity>, relationships: Record<string, Relationship> }): RelationshipGraphData => {
    const explicitRelationships = getTypedObjectValues(storyBible.relationships);
    const nodeIds = new Set<string>();
    explicitRelationships.forEach(rel => {
        nodeIds.add(rel.entityIds[0]);
        nodeIds.add(rel.entityIds[1]);
    });

    const entityMap = new Map(getTypedObjectValues(storyBible.entities).map(e => [e.id, e]));

    const nodes = Array.from(nodeIds).map(id => {
        const entity = entityMap.get(id);
        return {
            id: id,
            label: entity?.name || 'Unknown',
            type: (entity?.type || EntityType.CHARACTER) as string,
            x: 0,
            y: 0,
        };
    }).filter(node => node.label !== 'Unknown');

    const edges = explicitRelationships.map(rel => ({
        source: rel.entityIds[0],
        target: rel.entityIds[1],
        label: rel.statuses[rel.statuses.length - 1]?.type || 'Related',
        isExplicit: true,
    }));

    return { nodes, edges };
};