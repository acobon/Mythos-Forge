import { useCallback } from 'react';
import { EntityId, ViewType } from '../types';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { setView, setSelectedId, navigateToNote as navigateToNoteAction, navigateToWorldEvent as navigateToWorldEventAction } from '../state/uiSlice';
import { setSelectedWorkId, setSelectedSceneId } from '../state/slices/narrativeSlice';


export const useNavigation = () => {
    const dispatch = useAppDispatch();
    const storyBibleState = useAppSelector(state => state.bible.present);

    const navigateToEntity = useCallback((entityId: EntityId, options?: { source?: 'validation', highlightEventId?: string }) => {
        dispatch(setView(ViewType.ENTITIES));
        dispatch(setSelectedId(entityId));
        // TODO: Handle navigation state and highlight event if needed in a more robust way
    }, [dispatch]);

    const navigateToScene = useCallback((workId: string, sceneId: string) => {
        dispatch(setView(ViewType.MANUSCRIPT));
        dispatch(setSelectedWorkId(workId));
        dispatch(setSelectedSceneId(sceneId));
    }, [dispatch]);

    const navigateToNote = useCallback((noteId: string) => {
        dispatch(navigateToNoteAction({ noteId }));
    }, [dispatch]);

    const navigateToWorldEvent = useCallback((eventId: string) => {
        dispatch(navigateToWorldEventAction({ eventId }));
    }, [dispatch]);
    
    const navigateToView = useCallback((view: ViewType) => {
        dispatch(setView(view));
    }, [dispatch]);

    const navigateToWork = useCallback((workId: string) => {
        const { works } = storyBibleState.narrative;
        const work = works[workId];
        if (!work) return;

        const firstChapterSceneId = work.chapters[0]?.sceneIds[0];
        
        const assignedSceneIds = new Set(work.chapters.flatMap(c => c.sceneIds));
        const unassignedSceneIds = work.sceneIds.filter(id => !assignedSceneIds.has(id));
        
        const firstSceneId = firstChapterSceneId || unassignedSceneIds[0];

        dispatch(setView(ViewType.MANUSCRIPT));
        dispatch(setSelectedWorkId(workId));
        dispatch(setSelectedSceneId(firstSceneId || null));
    }, [storyBibleState, dispatch]);

    const selectEntity = useCallback((id: EntityId | null) => {
        dispatch(setSelectedId(id));
    }, [dispatch]);
    
    const selectWork = useCallback((id: string | null) => {
        dispatch(setSelectedWorkId(id));
    }, [dispatch]);
    
    const selectScene = useCallback((id: string | null) => {
        dispatch(setSelectedSceneId(id));
    }, [dispatch]);

    return {
        navigateToEntity,
        navigateToScene,
        navigateToNote,
        navigateToWorldEvent,
        navigateToView,
        navigateToWork,
        selectEntity,
        selectWork,
        selectScene,
    };
};
