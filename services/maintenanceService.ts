import { StoryBible, EntityType, CharacterEntity, Tag, Theme, Conflict, NarrativeScene } from '../types';

export interface BrokenReference {
  location: string;
  text: string;
  entityName: string;
  entityId: string;
}

export type OrphanedItem = (Tag | Theme | Conflict) & { itemType: 'Tag' | 'Theme' | 'Conflict' };

const findRefsInText = (text: string | undefined, validEntityIds: Set<string>): { text: string; entityName: string; entityId: string }[] => {
    if (!text) return [];
    const broken = [];
    const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        const [, name, id] = match;
        if (!validEntityIds.has(id)) {
            broken.push({ text: match[0], entityName: name, entityId: id });
        }
    }
    return broken;
};

const findRefsInObject = (obj: any, validEntityIds: Set<string>, path: string, results: BrokenReference[]): void => {
    if (!obj) return;
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            const newPath = `${path} > ${key}`;
            if (typeof value === 'string') {
                findRefsInText(value, validEntityIds).forEach(ref => {
                    results.push({ ...ref, location: newPath });
                });
            } else if (typeof value === 'object' && value !== null) {
                findRefsInObject(value, validEntityIds, newPath, results);
            }
        }
    }
};


export const findBrokenReferences = (storyBible: StoryBible): BrokenReference[] => {
    const results: BrokenReference[] = [];
    const validEntityIds = new Set(Object.keys(storyBible.entities));

    Object.values(storyBible.entities).forEach(entity => {
        const baseLocation = `${entity.type} "${entity.name}"`;
        findRefsInText(entity.description, validEntityIds).forEach(ref => results.push({ ...ref, location: `${baseLocation}: Description` }));
        if (entity.details) {
            findRefsInObject(entity.details, validEntityIds, `${baseLocation}: Attributes`, results);
        }
         if (entity.type === EntityType.CHARACTER) {
            const char = entity as CharacterEntity;
            findRefsInText(char.internalGoal, validEntityIds).forEach(ref => results.push({ ...ref, location: `${baseLocation}: Internal Goal` }));
            findRefsInText(char.externalGoal, validEntityIds).forEach(ref => results.push({ ...ref, location: `${baseLocation}: External Goal` }));
            if (char.prompts) findRefsInObject(char.prompts, validEntityIds, `${baseLocation}: Prompts`, results);
            if (char.characterArc) {
                 Object.entries(char.characterArc).forEach(([stageKey, stage]) => {
                     findRefsInText(stage.description, validEntityIds).forEach(ref => results.push({ ...ref, location: `${baseLocation}: Arc > ${stageKey}`}));
                 });
            }
        }
    });

    Object.values(storyBible.events).forEach(event => {
        const location = `Event "${event.description.substring(0, 20)}..."`;
        findRefsInText(event.description, validEntityIds).forEach(ref => results.push({ ...ref, location: `${location}: Description` }));
        findRefsInText(event.notes, validEntityIds).forEach(ref => results.push({ ...ref, location: `${location}: Notes` }));
        if (event.details) {
            findRefsInObject(event.details, validEntityIds, `${location}: Details`, results);
        }
    });

    Object.values(storyBible.worldEvents).forEach(event => {
        const location = `World Event "${event.title}"`;
        findRefsInText(event.content, validEntityIds).forEach(ref => results.push({ ...ref, location: `${location}: Content` }));
    });
    
    const workMap = new Map(Object.values(storyBible.works).map(w => [w.id, w.title]));
    Object.values(storyBible.scenes).forEach(scene => {
        const workTitle = Object.values(storyBible.works).find(w => w.sceneIds.includes(scene.id))?.title || 'Unknown Work';
        const location = `Scene "${scene.title}" in "${workTitle}"`;
        findRefsInText(scene.content, validEntityIds).forEach(ref => results.push({ ...ref, location: `${location}: Content` }));
        findRefsInText(scene.summary, validEntityIds).forEach(ref => results.push({ ...ref, location: `${location}: Summary` }));
    });
    
     Object.values(storyBible.researchNotes).forEach(note => {
        const location = `Research Note "${note.title}"`;
        findRefsInText(note.content, validEntityIds).forEach(ref => results.push({ ...ref, location: `${location}: Content` }));
    });

    findRefsInText(storyBible.scratchpad, validEntityIds).forEach(ref => results.push({ ...ref, location: 'Project Scratchpad' }));
    
    return results;
};

export const findOrphanedItems = (storyBible: StoryBible): OrphanedItem[] => {
    const orphaned: OrphanedItem[] = [];
    const usedTagIds = new Set<string>();
    const usedThemeIds = new Set<string>();
    const usedConflictIds = new Set<string>();

    // Gather all used IDs
    Object.values(storyBible.entities).forEach(e => {
        e.tagIds?.forEach(id => usedTagIds.add(id));
        if (e.type === EntityType.CHARACTER) {
            (e as CharacterEntity).themeIds?.forEach(id => usedThemeIds.add(id));
            (e as CharacterEntity).conflictIds?.forEach(id => usedConflictIds.add(id));
        }
    });
    Object.values(storyBible.events).forEach(e => e.tagIds?.forEach(id => usedTagIds.add(id)));
    Object.values(storyBible.worldEvents).forEach(e => e.tagIds?.forEach(id => usedTagIds.add(id)));
    Object.values(storyBible.scenes).forEach(s => {
        s.tagIds?.forEach(id => usedTagIds.add(id));
        s.themeIds?.forEach(id => usedThemeIds.add(id));
        s.conflictIds?.forEach(id => usedConflictIds.add(id));
    });
    Object.values(storyBible.series).forEach(s => s.tagIds?.forEach(id => usedTagIds.add(id)));
    Object.values(storyBible.collections).forEach(c => c.tagIds?.forEach(id => usedTagIds.add(id)));
    Object.values(storyBible.works).forEach(w => w.tagIds?.forEach(id => usedTagIds.add(id)));
    Object.values(storyBible.researchNotes).forEach(n => n.tagIds?.forEach(id => usedTagIds.add(id)));

    // Find unused items
    Object.values(storyBible.tags).forEach(tag => {
        if (!usedTagIds.has(tag.id)) orphaned.push({ ...tag, itemType: 'Tag' });
    });
    Object.values(storyBible.themes).forEach(theme => {
        if (!usedThemeIds.has(theme.id)) orphaned.push({ ...theme, itemType: 'Theme' });
    });
    Object.values(storyBible.conflicts).forEach(conflict => {
        if (!usedConflictIds.has(conflict.id)) orphaned.push({ ...conflict, itemType: 'Conflict' });
    });

    return orphaned;
};

export const findOrphanedScenes = (storyBible: StoryBible): NarrativeScene[] => {
    const allSceneIds = new Set(Object.keys(storyBible.scenes));
    const usedSceneIds = new Set<string>();

    Object.values(storyBible.works).forEach(work => {
        work.sceneIds.forEach(id => usedSceneIds.add(id));
        work.chapters.forEach(chapter => {
            chapter.sceneIds.forEach(id => usedSceneIds.add(id));
        });
    });

    const orphanedIds = [...allSceneIds].filter(id => !usedSceneIds.has(id));
    return orphanedIds.map(id => storyBible.scenes[id]);
};