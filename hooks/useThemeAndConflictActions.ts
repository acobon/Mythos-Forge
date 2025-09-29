// hooks/useThemeAndConflictActions.ts
import { useCallback } from 'react';
import { Theme, Conflict } from '../types';
import { generateId } from '../utils';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { saveTheme as saveThemeAction, saveConflict as saveConflictAction } from '../state/slices/metadataSlice';
import { useToast } from './useToast';
import { removeItem } from '../state/actions';

export const useThemeAndConflictActions = () => {
    const dispatch = useAppDispatch();
    const { themes, conflicts } = useAppSelector(state => state.bible.present.metadata);
    const { showToast } = useToast();

    const saveTheme = useCallback((theme: Partial<Theme> & {name: string}) => {
        const payload: Theme = {
            id: theme.id || generateId('theme'),
            name: theme.name,
            description: theme.description || '',
        };
        dispatch(saveThemeAction(payload));
    }, [dispatch]);
    
    const deleteTheme = useCallback((id: string) => {
        const theme = themes[id];
        if (theme) {
            dispatch(removeItem({ item: theme, itemType: 'Theme', deletedAt: new Date().toISOString() }));
            showToast({ type: 'info', message: `Theme "${theme.name}" moved to trash.` });
        }
    }, [dispatch, themes, showToast]);

    const saveConflict = useCallback((conflict: Partial<Conflict> & {name: string}) => {
        const payload: Conflict = {
            id: conflict.id || generateId('conflict'),
            name: conflict.name,
            description: conflict.description || '',
            type: conflict.type || 'External',
            status: conflict.status || 'Active',
        };
        dispatch(saveConflictAction(payload));
    }, [dispatch]);
    
    const deleteConflict = useCallback((id: string) => {
        const conflict = conflicts[id];
        if (conflict) {
            dispatch(removeItem({ item: conflict, itemType: 'Conflict', deletedAt: new Date().toISOString() }));
            showToast({ type: 'info', message: `Conflict "${conflict.name}" moved to trash.` });
        }
    }, [dispatch, conflicts, showToast]);
    
    return { saveTheme, deleteTheme, saveConflict, deleteConflict };
};
