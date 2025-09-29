// hooks/useRelationshipActions.ts
import { useCallback } from 'react';
import { Relationship, EntityId, RelationshipStatus } from '../types';
import { generateId } from '../utils';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { addRelationship, updateRelationship } from '../state/slices/knowledgeSlice';
import { useToast } from './useToast';
import { removeItem } from '../state/actions';

export const useRelationshipActions = () => {
    const dispatch = useAppDispatch();
    const { relationships } = useAppSelector(state => state.bible.present.knowledge);
    const { showToast } = useToast();

    const saveRelationship = useCallback((data: { id?: string; entityIds: [EntityId, EntityId]; statuses: RelationshipStatus[] }) => {
        const sortedStatuses = [...data.statuses].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        
        if (data.id) { // Editing existing relationship
            const payload: Relationship = {
                id: data.id,
                entityIds: data.entityIds,
                statuses: sortedStatuses,
            };
            dispatch(updateRelationship(payload));
        } else { // Creating new relationship
            const payload: Relationship = {
                id: generateId('rel'),
                entityIds: data.entityIds,
                statuses: sortedStatuses,
            };
            dispatch(addRelationship(payload));
        }
    }, [dispatch]);

    const deleteRelationship = useCallback((id: string) => {
        const rel = relationships[id];
        if (rel) {
            dispatch(removeItem({ item: rel, itemType: 'Relationship', deletedAt: new Date().toISOString() }));
            showToast({ type: 'info', message: `Relationship deleted.` });
        }
    }, [dispatch, relationships, showToast]);

    return { saveRelationship, deleteRelationship };
};
