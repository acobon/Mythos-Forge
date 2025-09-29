import { useEffect, useCallback } from 'react';
import { ViewType } from '../types';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { setView, setSelectedId, setSelectedNoteId } from '../state/uiSlice';
import { setSelectedWorkId, setSelectedSceneId } from '../state/slices/narrativeSlice';


/**
 * A custom hook to manage application routing using the URL hash.
 * This provides a simple, library-free way to handle views and selected items,
 * making the app's state bookmarkable and navigable via browser history.
 */
export const useRouting = () => {
    const dispatch = useAppDispatch();
    const uiState = useAppSelector(state => state.ui);
    const narrativeState = useAppSelector(state => state.bible.present.narrative);

    const parseHash = useCallback(() => {
        const hash = window.location.hash.slice(1); // remove '#'
        
        const [newView, ...params] = hash.split('/');

        // If hash is empty, do nothing. The app will use its initial state.
        if (!newView) {
            return;
        }
        
        // Apply parsed view
        if (Object.values(ViewType).includes(newView as ViewType)) {
             if (newView !== uiState.activeView) {
                dispatch(setView(newView as ViewType));
            }

            if (newView === ViewType.ENTITIES && params[0]) {
                 if (params[0] !== uiState.selectedId) {
                    dispatch(setSelectedId(params[0]));
                }
            } else if (newView === ViewType.MANUSCRIPT && params[0]) {
                if (params[0] !== narrativeState.selectedWorkId) {
                    dispatch(setSelectedWorkId(params[0]));
                }
                const sceneId = params[1] || null;
                if (sceneId !== narrativeState.selectedSceneId) {
                    dispatch(setSelectedSceneId(sceneId));
                }
            } else if (newView === ViewType.RESEARCH && params[0]) {
                if (params[0] !== uiState.selectedNoteId) {
                    dispatch(setSelectedNoteId(params[0]));
                }
            }
        }

    }, [dispatch, uiState.activeView, uiState.selectedId, uiState.selectedNoteId, narrativeState.selectedWorkId, narrativeState.selectedSceneId]);

    // Update URL hash when state changes
    useEffect(() => {
        const { activeView, selectedId, selectedNoteId } = uiState;
        const { selectedWorkId, selectedSceneId } = narrativeState;
        let newHash = `#${activeView}`;

        if (activeView === ViewType.ENTITIES && selectedId) {
            newHash += `/${selectedId}`;
        } else if (activeView === ViewType.MANUSCRIPT && selectedWorkId) {
            newHash += `/${selectedWorkId}`;
            if (selectedSceneId) {
                newHash += `/${selectedSceneId}`;
            }
        } else if (activeView === ViewType.RESEARCH && selectedNoteId) {
            newHash += `/${selectedNoteId}`;
        }
        
        // Only update the hash if it has changed, preventing history spam
        if (window.location.hash !== newHash) {
             // Use replaceState to avoid adding to browser history for state changes
             history.replaceState(null, '', newHash);
        }
    }, [uiState.activeView, uiState.selectedId, uiState.selectedNoteId, narrativeState.selectedWorkId, narrativeState.selectedSceneId]);

    // Set up listeners for hash changes (e.g., back/forward buttons)
    useEffect(() => {
        // Initial parse on mount
        parseHash();

        window.addEventListener('hashchange', parseHash);
        return () => {
            window.removeEventListener('hashchange', parseHash);
        };
    }, [parseHash]);
};
