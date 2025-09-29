
// state/slices/narrativeSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Work, NarrativeScene, Chapter, Series, Collection, StoryStructureTemplate, TranslatedStoryStructure, SceneVersion, CorkboardLabel, CorkboardConnection, TrashedItem, Entity, Tag, Theme, Conflict, Comment } from '../../types/index';
import { defaultStoryBible } from '../../data/defaults';
import { calculateWordCount, arrayMove, getTypedObjectValues } from '../../utils';
import { restoreFromTrash } from './projectSlice';
import { cleanOrphanedScenes, removeItem, mergeTags } from '../actions';

interface NarrativeState {
    works: Record<string, Work>;
    series: Record<string, Series>;
    collections: Record<string, Collection>;
    scenes: Record<string, NarrativeScene>;
    storyStructures: Record<string, StoryStructureTemplate>;
    selectedWorkId: string | null;
    selectedSceneId: string | null;
}

const initialState: NarrativeState = {
    works: defaultStoryBible.works,
    series: defaultStoryBible.series,
    collections: defaultStoryBible.collections,
    scenes: defaultStoryBible.scenes,
    storyStructures: defaultStoryBible.storyStructures,
    selectedWorkId: null,
    selectedSceneId: null,
};

const narrativeSlice = createSlice({
    name: 'narrative',
    initialState,
    reducers: {
        setSelectedWorkId: (state, action: PayloadAction<string | null>) => {
            state.selectedWorkId = action.payload;
        },
        setSelectedSceneId: (state, action: PayloadAction<string | null>) => {
            state.selectedSceneId = action.payload;
        },
        addWork: (state, action: PayloadAction<Work>) => {
            state.works[action.payload.id] = action.payload;
        },
        updateWork: (state, action: PayloadAction<{ workId: string; updates: Partial<Work> }>) => {
            const { workId, updates } = action.payload;
            const work = state.works[workId];
            if (work) Object.assign(work, updates, { lastModified: new Date().toISOString() });
        },
        saveNarrativeScene: (state, action: PayloadAction<{ workId: string, scene: NarrativeScene, chapterId?: string }>) => {
            const { workId, scene, chapterId } = action.payload;
            const work = state.works[workId];
            if (work) {
                state.scenes[scene.id] = scene;
                if (!work.sceneIds.includes(scene.id)) {
                    work.sceneIds.push(scene.id);
                }
                if (chapterId) {
                    const chapter = work.chapters.find(c => c.id === chapterId);
                    if (chapter && !chapter.sceneIds.includes(scene.id)) {
                        chapter.sceneIds.push(scene.id);
                    }
                }
            }
        },
        updateNarrativeScene: (state, action: PayloadAction<{ sceneId: string, updates: Partial<NarrativeScene> }>) => {
             const { sceneId, updates } = action.payload;
            const scene = state.scenes[sceneId];
            if (scene) {
                Object.assign(scene, updates, { lastModified: new Date().toISOString() });
            }
        },
        saveSceneVersion: (state, action: PayloadAction<{ sceneId: string }>) => {
            const scene = state.scenes[action.payload.sceneId];
            if (scene) {
                if (!scene.history) scene.history = [];
                const newVersion: SceneVersion = {
                    timestamp: new Date(scene.lastModified).toISOString(),
                    content: scene.content,
                    jsonContent: scene.jsonContent
                };
                const latestVersion = scene.history[scene.history.length - 1];
                if (!latestVersion || latestVersion.content !== newVersion.content) {
                    scene.history.push(newVersion);
                }
            }
        },
        restoreSceneVersion: (state, action: PayloadAction<{ sceneId: string, version: SceneVersion }>) => {
            const { sceneId, version } = action.payload;
            const scene = state.scenes[sceneId];
            if (scene && scene.history) {
                const versionToRestore = scene.history.find(v => v.timestamp === version.timestamp);
                if (versionToRestore) {
                    scene.content = versionToRestore.content;
                    scene.jsonContent = versionToRestore.jsonContent;
                    scene.lastModified = new Date().toISOString();
                }
            }
        },
        addChapter: (state, action: PayloadAction<{ workId: string; chapter: Chapter }>) => {
            const work = state.works[action.payload.workId];
            if (work) work.chapters.push(action.payload.chapter);
        },
        updateChapter: (state, action: PayloadAction<{ workId: string; chapterId: string; updates: Partial<Chapter> }>) => {
            const { workId, chapterId, updates } = action.payload;
            const work = state.works[workId];
            if (work) {
                const chapter = work.chapters.find(c => c.id === chapterId);
                if (chapter) Object.assign(chapter, updates);
            }
        },
        deleteChapter: (state, action: PayloadAction<{ workId: string; chapterId: string }>) => {
            const { workId, chapterId } = action.payload;
            const work = state.works[workId];
            if (work) work.chapters = work.chapters.filter(c => c.id !== chapterId);
        },
        reorderChapters: (state, action: PayloadAction<{ workId: string; oldIndex: number, newIndex: number }>) => {
            const { workId, oldIndex, newIndex } = action.payload;
            const work = state.works[workId];
            if (work) {
                 work.chapters = arrayMove(work.chapters, oldIndex, newIndex);
            }
        },
        reorderScenes: (state, action: PayloadAction<{ workId: string; sourceChapterId: string; sourceIndex: number; destChapterId: string; destIndex: number }>) => {
            const { workId, sourceChapterId, sourceIndex, destChapterId, destIndex } = action.payload;
            const work = state.works[workId];
            if (!work) return;
            
            let sceneId: string | undefined;

            if (sourceChapterId === 'unassigned') {
                const assignedSceneIds = new Set(work.chapters.flatMap(c => c.sceneIds));
                const unassignedSceneIds = work.sceneIds.filter(id => !assignedSceneIds.has(id));
                sceneId = unassignedSceneIds[sourceIndex];
            } else {
                const sourceChapter = work.chapters.find(c => c.id === sourceChapterId);
                if (sourceChapter && sourceChapter.sceneIds[sourceIndex]) {
                    [sceneId] = sourceChapter.sceneIds.splice(sourceIndex, 1);
                }
            }

            if (sceneId) {
                if (destChapterId === 'unassigned') {
                    // Moving to unassigned, no chapter modification needed.
                } else {
                    const destChapter = work.chapters.find(c => c.id === destChapterId);
                    if (destChapter) {
                        destChapter.sceneIds.splice(destIndex, 0, sceneId);
                    }
                }
            }
        },
        applyStoryStructure: (state, action: PayloadAction<{ workId: string; structure: TranslatedStoryStructure }>) => {
            const { workId, structure } = action.payload;
            const work = state.works[workId];
            if (work) {
                work.chapters = structure.chapters.map(ch => ({
                    id: `ch-${crypto.randomUUID()}`,
                    title: ch.title,
                    summary: ch.summary,
                    sceneIds: []
                }));
            }
        },
        saveSeries: (state, action: PayloadAction<Series>) => {
            state.series[action.payload.id] = action.payload;
        },
        saveCollection: (state, action: PayloadAction<Collection>) => {
            state.collections[action.payload.id] = action.payload;
        },
        reorderWorksInSeries: (state, action: PayloadAction<{ seriesId: string; workIds: string[] }>) => {
            const series = state.series[action.payload.seriesId];
            if (series) {
                series.workIds = action.payload.workIds;
            }
        },
        saveStoryStructure: (state, action: PayloadAction<StoryStructureTemplate>) => {
            state.storyStructures[action.payload.id] = action.payload;
        },
        deleteStoryStructure: (state, action: PayloadAction<string>) => {
            delete state.storyStructures[action.payload];
        },
        saveCorkboardLabel: (state, action: PayloadAction<{ workId: string; label: CorkboardLabel }>) => {
            const work = state.works[action.payload.workId];
            if (work) {
                if (!work.corkboardLabels) work.corkboardLabels = [];
                const index = work.corkboardLabels.findIndex(l => l.id === action.payload.label.id);
                if (index > -1) work.corkboardLabels[index] = action.payload.label;
                else work.corkboardLabels.push(action.payload.label);
            }
        },
        deleteCorkboardLabel: (state, action: PayloadAction<{ workId: string; labelId: string }>) => {
            const work = state.works[action.payload.workId];
            if (work && work.corkboardLabels) {
                work.corkboardLabels = work.corkboardLabels.filter(l => l.id !== action.payload.labelId);
            }
        },
        saveCorkboardConnection: (state, action: PayloadAction<{ workId: string; connection: CorkboardConnection }>) => {
            const work = state.works[action.payload.workId];
            if (work) {
                if (!work.corkboardConnections) work.corkboardConnections = [];
                const index = work.corkboardConnections.findIndex(c => c.id === action.payload.connection.id);
                if (index > -1) work.corkboardConnections[index] = action.payload.connection;
                else work.corkboardConnections.push(action.payload.connection);
            }
        },
        deleteCorkboardConnection: (state, action: PayloadAction<{ workId: string; connectionId: string }>) => {
            const work = state.works[action.payload.workId];
            if (work && work.corkboardConnections) {
                work.corkboardConnections = work.corkboardConnections.filter(c => c.id !== action.payload.connectionId);
            }
        },
        splitScene: (state, action: PayloadAction<{ workId: string; sourceSceneId: string; newScene: NarrativeScene }>) => {
            const { workId, sourceSceneId, newScene } = action.payload;
            const work = state.works[workId];
            if (!work) return;

            state.scenes[newScene.id] = newScene;
            if (!work.sceneIds.includes(newScene.id)) {
                work.sceneIds.push(newScene.id);
            }

            for (const chapter of work.chapters) {
                const index = chapter.sceneIds.indexOf(sourceSceneId);
                if (index > -1) {
                    chapter.sceneIds.splice(index + 1, 0, newScene.id);
                    return;
                }
            }
        },
        mergeWithNextScene: (state, action: PayloadAction<{ workId: string; sceneId: string }>) => {
             const { workId, sceneId } = action.payload;
            const work = state.works[workId];
            if (!work) return;

            let sourceSceneIndex = -1;
            let nextSceneId: string | undefined;
            let chapterOfScenes: Chapter | undefined;

            for (const chapter of work.chapters) {
                const index = chapter.sceneIds.indexOf(sceneId);
                if (index > -1 && index < chapter.sceneIds.length - 1) {
                    sourceSceneIndex = index;
                    nextSceneId = chapter.sceneIds[index + 1];
                    chapterOfScenes = chapter;
                    break;
                }
            }
            
            if (sourceSceneIndex === -1 || !nextSceneId || !chapterOfScenes) return;

            const sourceScene = state.scenes[sceneId];
            const nextScene = state.scenes[nextSceneId];
            if (!sourceScene || !nextScene) return;
            
            sourceScene.content += nextScene.content;
            sourceScene.wordCount = calculateWordCount(sourceScene.content);
            sourceScene.lastModified = new Date().toISOString();

            delete state.scenes[nextSceneId];
            work.sceneIds = work.sceneIds.filter(id => id !== nextSceneId);
            chapterOfScenes.sceneIds.splice(sourceSceneIndex + 1, 1);
        },
        restoreSceneToChapter: (state, action: PayloadAction<{ scene: NarrativeScene, workId: string, chapterId: string | null }>) => {
            const { scene, workId, chapterId } = action.payload;
            const work = state.works[workId];
            if (!work) return;

            state.scenes[scene.id] = scene;
            if (!work.sceneIds.includes(scene.id)) {
                work.sceneIds.push(scene.id);
            }
            if (chapterId) {
                const chapter = work.chapters.find(c => c.id === chapterId);
                if (chapter && !chapter.sceneIds.includes(scene.id)) {
                    chapter.sceneIds.push(scene.id);
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(restoreFromTrash, (state, action: PayloadAction<{ item: TrashedItem, index: number }>) => {
                const { item, itemType, metadata } = action.payload.item;
                switch (itemType) {
                    case 'Work':
                        state.works[(item as Work).id] = item as Work;
                        break;
                    case 'Scene': {
                        const scene = item as NarrativeScene;
                        state.scenes[scene.id] = scene;
                        if (metadata?.workId && state.works[metadata.workId]) {
                            const work = state.works[metadata.workId];
                            if (!work.sceneIds.includes(scene.id)) {
                                work.sceneIds.push(scene.id);
                            }
                            // Note: Scene is restored as unassigned by default.
                            // The UI can offer to place it back in its original chapter if it exists.
                        }
                        break;
                    }
                    case 'Series':
                        state.series[(item as Series).id] = item as Series;
                        break;
                    case 'Collection':
                        state.collections[(item as Collection).id] = item as Collection;
                        break;
                    case 'StoryStructure':
                        state.storyStructures[(item as StoryStructureTemplate).id] = item as StoryStructureTemplate;
                        break;
                }
            })
            .addCase(removeItem, (state, action: PayloadAction<TrashedItem>) => {
                const { item, itemType, metadata } = action.payload;
                if (itemType === 'Work') {
                    const work = item as Work;
                    delete state.works[work.id];
                    work.sceneIds.forEach(sceneId => delete state.scenes[sceneId]);
                    Object.values(state.series).forEach((s: Series) => { s.workIds = s.workIds.filter(id => id !== work.id) });
                    Object.values(state.collections).forEach((c: Collection) => { c.workIds = c.workIds.filter(id => id !== work.id) });
                }
                if (itemType === 'Scene') {
                    const scene = item as NarrativeScene;
                    delete state.scenes[scene.id];
                    Object.values(state.works).forEach((work: Work) => {
                        work.sceneIds = work.sceneIds.filter(id => id !== scene.id);
                        work.chapters.forEach(ch => { ch.sceneIds = ch.sceneIds.filter(id => id !== scene.id) });
                    });
                }
                if (itemType === 'Series') {
                    const series = item as Series;
                    delete state.series[series.id];
                    Object.values(state.works).forEach((w: Work) => { if (w.seriesId === series.id) w.seriesId = undefined; });
                }
                if (itemType === 'Collection') {
                    const collection = item as Collection;
                    delete state.collections[collection.id];
                     Object.values(state.works).forEach((w: Work) => { if (w.collectionId === collection.id) w.collectionId = undefined; });
                }
                if (itemType === 'StoryStructure') {
                    delete state.storyStructures[(item as StoryStructureTemplate).id];
                }
                 if (itemType === 'Tag') {
                    const tagId = (item as Tag).id;
                    (getTypedObjectValues(state.scenes) as NarrativeScene[]).forEach(s => { if (s && s.tagIds?.includes(tagId)) s.tagIds = s.tagIds.filter(id => id !== tagId) });
                    (getTypedObjectValues(state.works) as Work[]).forEach(w => { if (w && w.tagIds?.includes(tagId)) w.tagIds = w.tagIds.filter(id => id !== tagId) });
                    (getTypedObjectValues(state.series) as Series[]).forEach(s => { if (s && s.tagIds?.includes(tagId)) s.tagIds = s.tagIds.filter(id => id !== tagId) });
                    (getTypedObjectValues(state.collections) as Collection[]).forEach(c => { if (c && c.tagIds?.includes(tagId)) c.tagIds = c.tagIds.filter(id => id !== tagId) });
                }
                if (itemType === 'Theme') {
                    const themeId = (item as Theme).id;
                    (getTypedObjectValues(state.scenes) as NarrativeScene[]).forEach(s => { if (s && s.themeIds?.includes(themeId)) s.themeIds = s.themeIds.filter(id => id !== themeId) });
                }
                if (itemType === 'Conflict') {
                    const conflictId = (item as Conflict).id;
                    (getTypedObjectValues(state.scenes) as NarrativeScene[]).forEach(s => { if (s && s.conflictIds?.includes(conflictId)) s.conflictIds = s.conflictIds.filter(id => id !== conflictId) });
                }
                if (itemType === 'Comment') {
                    const sceneId = (metadata as any)?.sceneId || (item as Comment).sceneId;
                    const scene = state.scenes[sceneId];
                    if (scene?.content) {
                        const regex = new RegExp(`<span data-comment-id="${(item as Comment).id}"[^>]*>(.*?)</span>`, 'g');
                        scene.content = scene.content.replace(regex, '$1');
                        scene.wordCount = calculateWordCount(scene.content);
                        scene.jsonContent = null; // Force re-parse on next editor load
                    }
                }

                if (itemType === 'Entity') {
                    const entityId = (item as Entity).id;
                    Object.values(state.scenes).forEach((scene: NarrativeScene) => {
                        if (scene.povEntityId === entityId) scene.povEntityId = undefined;
                        scene.involvedEntityIds = scene.involvedEntityIds.filter(id => id !== entityId);
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
                (getTypedObjectValues(state.scenes) as NarrativeScene[]).forEach(s => { s.tagIds = updateIds(s.tagIds); });
                (getTypedObjectValues(state.works) as Work[]).forEach(w => { w.tagIds = updateIds(w.tagIds); });
                (getTypedObjectValues(state.series) as Series[]).forEach(s => { s.tagIds = updateIds(s.tagIds); });
                (getTypedObjectValues(state.collections) as Collection[]).forEach(c => { c.tagIds = updateIds(c.tagIds); });
            })
            .addCase(cleanOrphanedScenes, (state, action: PayloadAction<{ idsToDelete: string[] }>) => {
                action.payload.idsToDelete.forEach(id => {
                    delete state.scenes[id];
                });
            });
    }
});

export const { 
    setSelectedWorkId, setSelectedSceneId,
    addWork, updateWork,
    saveNarrativeScene, updateNarrativeScene, saveSceneVersion, restoreSceneVersion,
    addChapter, updateChapter, deleteChapter, reorderChapters, reorderScenes,
    applyStoryStructure,
    saveSeries, saveCollection, reorderWorksInSeries,
    saveStoryStructure, deleteStoryStructure,
    saveCorkboardLabel, deleteCorkboardLabel, saveCorkboardConnection, deleteCorkboardConnection,
    splitScene, mergeWithNextScene,
    restoreSceneToChapter,
} = narrativeSlice.actions;

export default narrativeSlice.reducer;
