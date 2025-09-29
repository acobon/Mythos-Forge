// hooks/useTagActions.ts
import { useCallback } from 'react';
import { Tag } from '../types';
import { generateId } from '../utils';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { createTag as createTagAction, updateTag as updateTagAction } from '../state/slices/metadataSlice';
import { useToast } from './useToast';
import { removeItem } from '../state/actions';

export const useTagActions = () => {
    const dispatch = useAppDispatch();
    const { tags } = useAppSelector(state => state.bible.present.metadata);
    const { showToast } = useToast();

    const createTag = useCallback((label: string, color: string): Tag => {
        const newTag: Tag = { id: generateId('tag'), label, color, lastModified: new Date().toISOString() };
        dispatch(createTagAction(newTag));
        return newTag;
    }, [dispatch]);

    const updateTag = useCallback((tag: Tag) => {
        dispatch(updateTagAction(tag));
    }, [dispatch]);

    const deleteTag = useCallback((tagId: string) => {
        const tag = tags[tagId];
        if(tag) {
            dispatch(removeItem({ item: tag, itemType: 'Tag', deletedAt: new Date().toISOString() }));
        }
    }, [dispatch, tags]);

    return { createTag, updateTag, deleteTag };
};
