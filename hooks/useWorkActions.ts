
// hooks/useWorkActions.ts
import { useCallback } from 'react';
import { Work, NarrativeScene, Chapter, Series, Collection, TranslatedStoryStructure, SceneVersion, CorkboardLabel, CorkboardConnection, StoryBible, TrashedItem, StoryStructureTemplate } from '../types/index';
import { generateId, arrayMove, calculateWordCount } from '../utils';
import { exportWork, ExportOptions } from '../services/exportService';
import { useI18n } from './useI18n';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { 
    addWork as addWorkAction,
    updateWork as updateWorkAction,
    saveNarrativeScene as saveNarrativeSceneAction,
    updateNarrativeScene as updateNarrativeSceneAction,
    saveSceneVersion as saveSceneVersionAction,
    restoreSceneVersion as restoreSceneVersionAction,
    addChapter as addChapterAction,
    updateChapter as updateChapterAction,
    deleteChapter as deleteChapterAction,
    reorderChapters as reorderChaptersAction,
    reorderScenes as reorderScenesAction,
    applyStoryStructure as applyStoryStructureAction,
    saveSeries as saveSeriesAction,
    saveCollection as saveCollectionAction,
    reorderWorksInSeries as reorderWorksInSeriesAction,
    saveStoryStructure as saveStoryStructureAction,
    splitScene as splitSceneAction,
    mergeWithNextScene as mergeWithNextSceneAction,
    restoreSceneToChapter,
    saveCorkboardLabel as saveCorkboardLabelAction,
    deleteCorkboardLabel as deleteCorkboardLabelAction,
    saveCorkboardConnection as saveCorkboardConnectionAction,
    deleteCorkboardConnection as deleteCorkboardConnectionAction
} from '../state/slices/narrativeSlice';
import { useToast } from './useToast';
import { RootState } from '../state/store';
import { removeItem } from '../state/actions';
import { selectFullStoryBible } from '../state/selectors';

export const useWorkActions = () => {
    const dispatch = useAppDispatch();
    const storyBible = useAppSelector(selectFullStoryBible) as StoryBible;
    const { t } = useI18n();
    const { showToast } = useToast();

    const saveWork = useCallback((workData: Partial<Work> & { title: string }, isEditing: boolean): string | undefined => {
        if (isEditing && workData.id) {
            dispatch(updateWorkAction({ workId: workData.id, updates: workData }));
            return workData.id;
        } else {
            const newWork: Work = {
                id: generateId('work'),
                title: workData.title,
                description: workData.description || '',
                sceneIds: [],
                chapters: [],
                workType: workData.workType || 'Novel',
                status: workData.status || 'Planning',
                themeIds: workData.themeIds || [],
                conflictIds: workData.conflictIds || [],
                tagIds: workData.tagIds || [],
                seriesId: workData.seriesId,
                collectionId: workData.collectionId,
                lastModified: new Date().toISOString(),
            };
            dispatch(addWorkAction(newWork));
            return newWork.id;
        }
    }, [dispatch]);

    const deleteWork = useCallback((workId: string) => {
        const work = storyBible.works[workId];
        if(work) {
            dispatch(removeItem({ item: work, itemType: 'Work', deletedAt: new Date().toISOString() }));
            showToast({ type: 'info', message: `Work "${work.title}" moved to trash.` });
        }
    }, [dispatch, storyBible.works, showToast]);

    const saveScene = useCallback((payload: { workId: string, sceneData: Partial<NarrativeScene> & { title: string, chapterId?: string } }) => {
        const { workId, sceneData } = payload;
        const existingScene = sceneData.id ? storyBible.scenes[sceneData.id] : undefined;
        const newContent = sceneData.content ?? existingScene?.content ?? '';
        const scene: NarrativeScene = {
            id: sceneData.id || generateId('scene'),
            title: sceneData.title,
            summary: sceneData.summary ?? existingScene?.summary ?? '',
            content: newContent,
            wordCount: calculateWordCount(newContent),
            jsonContent: sceneData.jsonContent ?? existingScene?.jsonContent,
            povEntityId: sceneData.povEntityId ?? existingScene?.povEntityId,
            involvedEntityIds: sceneData.involvedEntityIds ?? existingScene?.involvedEntityIds ?? [],
            linkedEventIds: sceneData.linkedEventIds ?? existingScene?.linkedEventIds ?? [],
            tagIds: sceneData.tagIds ?? existingScene?.tagIds,
            themeIds: sceneData.themeIds ?? existingScene?.themeIds,
            conflictIds: sceneData.conflictIds ?? existingScene?.conflictIds,
            corkboardPosition: sceneData.corkboardPosition ?? existingScene?.corkboardPosition,
            lastModified: new Date().toISOString(),
            history: existingScene?.history || [],
            color: sceneData.color ?? existingScene?.color,
        };
        dispatch(saveNarrativeSceneAction({ workId, scene, chapterId: sceneData.chapterId }));
    }, [dispatch, storyBible.scenes]);
    
    const updateNarrativeScene = useCallback((payload: { sceneId: string, updates: Partial<NarrativeScene> }) => {
        const updatesWithWordCount = { ...payload.updates };
        if (updatesWithWordCount.content !== undefined) {
            updatesWithWordCount.wordCount = calculateWordCount(updatesWithWordCount.content);
        }
        dispatch(updateNarrativeSceneAction({ sceneId: payload.sceneId, updates: updatesWithWordCount }));
    }, [dispatch]);

    const deleteScene = useCallback((payload: { workId: string; sceneId: string }) => {
        const scene = storyBible.scenes[payload.sceneId];
        if (scene) {
            const work = storyBible.works[payload.workId];
            const chapter = work?.chapters.find(c => c.sceneIds.includes(payload.sceneId));
            dispatch(removeItem({ item: scene, itemType: 'Scene', deletedAt: new Date().toISOString(), metadata: { workId: payload.workId, chapterId: chapter?.id } }));
            showToast({ type: 'info', message: `Scene "${scene.title}" moved to trash.` });
        }
    }, [dispatch, storyBible.scenes, storyBible.works, showToast]);

    const saveSceneVersion = useCallback((payload: { sceneId: string }) => {
        dispatch(saveSceneVersionAction(payload));
    }, [dispatch]);

    const restoreSceneVersion = useCallback((payload: { sceneId: string, version: SceneVersion }) => {
        dispatch(restoreSceneVersionAction(payload));
    }, [dispatch]);

    const addChapter = useCallback((payload: { workId: string, title: string }) => {
        const newChapter: Chapter = { id: generateId('ch'), title: payload.title, sceneIds: [] };
        dispatch(addChapterAction({ workId: payload.workId, chapter: newChapter }));
    }, [dispatch]);

    const updateChapter = useCallback((payload: { workId: string; chapterId: string; updates: Partial<Chapter> }) => {
        dispatch(updateChapterAction(payload));
    }, [dispatch]);

    const deleteChapter = useCallback((payload: { workId: string; chapterId: string }) => {
        dispatch(deleteChapterAction(payload));
    }, [dispatch]);

    const reorderChapters = useCallback((payload: { workId: string; oldIndex: number, newIndex: number }) => {
        dispatch(reorderChaptersAction(payload));
    }, [dispatch]);

    const reorderScenes = useCallback((payload: { workId: string; sourceChapterId: string; sourceIndex: number; destChapterId: string; destIndex: number }) => {
        dispatch(reorderScenesAction(payload));
    }, [dispatch]);

    const exportManuscript = useCallback((work: Work, format: 'md' | 'txt') => {
        const options: ExportOptions = {
            format,
            title: work.title,
            includeTitlePage: false,
            authorName: '',
            fontSize: '12',
            lineSpacing: '1.5',
            fontFamily: 'serif',
            includeSummaries: false,
            pageSize: 'Letter',
            margins: { top: 25, bottom: 25, left: 25, right: 25 },
            publisher: '',
            coverImage: null,
        };
        exportWork(work, storyBible, options);
    }, [storyBible]);

    const applyStoryStructure = useCallback((payload: { workId: string, structure: TranslatedStoryStructure }) => {
        dispatch(applyStoryStructureAction(payload));
    }, [dispatch]);
    
    const saveSeries = useCallback((seriesData: Partial<Series> & { title: string }) => {
        const payload: Series = {
            id: seriesData.id || generateId('series'),
            title: seriesData.title,
            description: seriesData.description || '',
            workIds: seriesData.workIds || [],
            tagIds: seriesData.tagIds || [],
            lastModified: new Date().toISOString(),
        };
        dispatch(saveSeriesAction(payload));
    }, [dispatch]);
    
    const deleteSeries = useCallback((seriesId: string) => {
        const series = storyBible.series[seriesId];
        if (series) {
            dispatch(removeItem({ item: series, itemType: 'Series', deletedAt: new Date().toISOString() }));
            showToast({ type: 'info', message: `Series "${series.title}" moved to trash.` });
        }
    }, [dispatch, storyBible.series, showToast]);

    const saveCollection = useCallback((collectionData: Partial<Collection> & { title: string }) => {
        const payload: Collection = {
            id: collectionData.id || generateId('collection'),
            title: collectionData.title,
            description: collectionData.description || '',
            workIds: collectionData.workIds || [],
            tagIds: collectionData.tagIds || [],
            lastModified: new Date().toISOString(),
        };
        dispatch(saveCollectionAction(payload));
    }, [dispatch]);
    
    const deleteCollection = useCallback((collectionId: string) => {
        const collection = storyBible.collections[collectionId];
        if(collection) {
            dispatch(removeItem({ item: collection, itemType: 'Collection', deletedAt: new Date().toISOString() }));
            showToast({ type: 'info', message: `Collection "${collection.title}" moved to trash.` });
        }
    }, [dispatch, storyBible.collections, showToast]);

    const reorderWorksInSeries = useCallback((payload: { seriesId: string, workIds: string[] }) => {
        dispatch(reorderWorksInSeriesAction(payload));
    }, [dispatch]);
    
    const saveStoryStructure = useCallback((structure: StoryStructureTemplate) => {
        dispatch(saveStoryStructureAction(structure));
    }, [dispatch]);
    
    const deleteStoryStructure = useCallback((id: string) => {
        const structure = storyBible.storyStructures[id];
        if (structure) {
            dispatch(removeItem({ item: structure, itemType: 'StoryStructure', deletedAt: new Date().toISOString() }));
        }
    }, [dispatch, storyBible.storyStructures]);

    const saveCorkboardLabel = useCallback((workId: string, label: Partial<CorkboardLabel>) => {
        const payload: CorkboardLabel = {
            id: label.id || generateId('cbl'),
            text: label.text || '',
            x: label.x || 0,
            y: label.y || 0,
            color: label.color || '#333'
        };
        dispatch(saveCorkboardLabelAction({ workId, label: payload }));
    }, [dispatch]);

    const deleteCorkboardLabel = useCallback((workId: string, labelId: string) => {
        dispatch(deleteCorkboardLabelAction({ workId, labelId }));
    }, [dispatch]);
    
    const saveCorkboardConnection = useCallback((workId: string, connection: CorkboardConnection) => {
        dispatch(saveCorkboardConnectionAction({ workId, connection }));
    }, [dispatch]);
    
    const deleteCorkboardConnection = useCallback((workId: string, connectionId: string) => {
        dispatch(deleteCorkboardConnectionAction({ workId, connectionId }));
    }, [dispatch]);

    const splitScene = useCallback((payload: { workId: string; sourceSceneId: string; newScene: NarrativeScene }) => {
        dispatch(splitSceneAction(payload));
    }, [dispatch]);

    const mergeWithNextScene = useCallback((payload: { workId: string; sceneId: string }) => {
        dispatch(mergeWithNextSceneAction(payload));
    }, [dispatch]);

    return {
        saveWork,
        deleteWork,
        saveScene,
        updateNarrativeScene,
        deleteScene,
        saveSceneVersion,
        restoreSceneVersion,
        addChapter,
        updateChapter,
        deleteChapter,
        reorderChapters,
        reorderScenes,
        exportManuscript,
        applyStoryStructure,
        saveSeries,
        deleteSeries,
        saveCollection,
        deleteCollection,
        reorderWorksInSeries,
        saveStoryStructure,
        deleteStoryStructure,
        saveCorkboardLabel,
        deleteCorkboardLabel,
        saveCorkboardConnection,
        deleteCorkboardConnection,
        splitScene,
        mergeWithNextScene,
    };
};
