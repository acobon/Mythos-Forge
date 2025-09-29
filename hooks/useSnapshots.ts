

import { useState, useEffect, useCallback } from 'react';
import * as snapshotService from '../services/snapshotService';
import { SnapshotMetadata, StoryBible, Snapshot } from '../types/index';
import { useErrorHandler } from './useErrorHandler';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { setBible } from '../state/actions';
import { pushProcessing, popProcessing, setView } from '../state/uiSlice';
import { ViewType } from '../types/index';
import { selectFullStoryBible } from '../state/selectors';

export const useSnapshots = () => {
    const [snapshots, setSnapshots] = useState<SnapshotMetadata[]>([]);
    const [loading, setLoading] = useState(true);
    const bibleState = useAppSelector(selectFullStoryBible) as StoryBible;
    const dispatch = useAppDispatch();
    const { handleError } = useErrorHandler();

    const fetchSnapshots = useCallback(async () => {
        setLoading(true);
        const metadata = await snapshotService.getSnapshotsMetadata();
        setSnapshots(metadata);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchSnapshots();
    }, [fetchSnapshots]);

    const createSnapshot = async (message: string): Promise<{ success: boolean; error?: string }> => {
        if (!message || !message.trim()) {
            return { success: false, error: 'A message is required to create a snapshot.' };
        }
        
        const storyBibleForSnapshot: StoryBible = bibleState;

        const newSnapshot: Snapshot = {
            id: Date.now(),
            message: message.trim(),
            entityCount: Object.keys(storyBibleForSnapshot.entities).length,
            eventCount: Object.keys(storyBibleForSnapshot.events).length,
            data: storyBibleForSnapshot,
        };
        
        await snapshotService.saveSnapshot(newSnapshot);
        await fetchSnapshots();
        return { success: true };
    };

    const revertToSnapshot = async (id: number) => {
        dispatch(pushProcessing({ message: 'Reverting snapshot...' }));
        try {
            const data = await snapshotService.getSnapshotData(id);
            if (data) {
                dispatch(setBible(data));
                dispatch(setView(ViewType.ENTITIES));
            } else {
                throw new Error('Could not load snapshot data.');
            }
        } catch(e) {
            handleError(e, 'Failed to revert snapshot.');
        } finally {
            dispatch(popProcessing());
        }
    };

    const deleteSnapshot = async (id: number) => {
        await snapshotService.deleteSnapshot(id);
        fetchSnapshots();
    };

    return { snapshots, loading, createSnapshot, revertToSnapshot, deleteSnapshot };
};
