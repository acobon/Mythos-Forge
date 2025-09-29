// hooks/useQueryActions.ts
import { useCallback } from 'react';
import { SavedQuery } from '../types';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { saveQuery as saveQueryAction } from '../state/slices/metadataSlice';
import { removeItem } from '../state/actions';

export const useQueryActions = () => {
    const dispatch = useAppDispatch();
    const { savedQueries } = useAppSelector(state => state.bible.present.metadata);

    const saveQuery = useCallback((query: SavedQuery) => {
        dispatch(saveQueryAction(query));
    }, [dispatch]);

    const deleteQuery = useCallback((queryId: string) => {
        const query = savedQueries[queryId];
        if (query) {
            dispatch(removeItem({ item: query, itemType: 'SavedQuery', deletedAt: new Date().toISOString() }));
        }
    }, [dispatch, savedQueries]);

    return { saveQuery, deleteQuery };
};
