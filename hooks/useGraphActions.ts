

import { useCallback } from 'react';
import { EntityId } from '../types';
import { useAppDispatch } from '../state/hooks';
import { updateGraphLayout as updateGraphLayoutAction } from '../state/slices/knowledgeSlice';

export const useGraphActions = () => {
    const dispatch = useAppDispatch();

    const updateGraphLayout = useCallback((payload: { id: EntityId; pos: { x: number; y: number; fx?: number | null; fy?: number | null } }) => {
        dispatch(updateGraphLayoutAction(payload));
    }, [dispatch]);

    return { updateGraphLayout };
};