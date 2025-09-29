import { useState, useEffect, useRef, useCallback } from 'react';
import { Entity } from '../types/index';
import { deepEqual } from '../utils';
import { useErrorHandler } from './useErrorHandler';
import { useAppSelector, useAppDispatch } from '../state/hooks';
import { addUnsavedChange, removeUnsavedChange } from '../state/uiSlice';

interface UseDebouncedSaveProps<T> {
    entity: T;
    onUpdate: (id: string, updates: Partial<Entity>) => Promise<void>;
    delay?: number;
}

export type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved';

export const useDebouncedEntitySave = <T extends Entity>({ entity, onUpdate, delay }: UseDebouncedSaveProps<T>) => {
    const dispatch = useAppDispatch();
    const autosaveDelay = useAppSelector(state => state.ui.autosaveDelay);
    const { handleError } = useErrorHandler();
    const effectiveDelay = delay ?? autosaveDelay;
    
    const [draft, setDraft] = useState<T>(entity);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    
    const saveTimeoutRef = useRef<number | null>(null);
    const statusTimeoutRef = useRef<number | null>(null);

    const baseEntityRef = useRef<T>(entity);

    // Effect for handling unsaved changes tracking
    useEffect(() => {
        const id = entity.id;
        if (saveStatus === 'unsaved') {
            dispatch(addUnsavedChange(id));
        } else {
            dispatch(removeUnsavedChange(id));
        }
        
        // Cleanup on unmount
        return () => {
            dispatch(removeUnsavedChange(id));
        };
    }, [saveStatus, entity.id, dispatch]);


    useEffect(() => {
        if (entity.id !== baseEntityRef.current.id) {
            setDraft(entity);
            baseEntityRef.current = entity;
            setSaveStatus('idle');
            return;
        }

        if (!deepEqual(entity, baseEntityRef.current)) {
            setDraft(entity);
            baseEntityRef.current = entity;
            setSaveStatus('idle');
        }
    }, [entity]);

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
        };
    }, []);

    const saveDraft = useCallback(async () => {
        const changesToSave: Partial<T> = {};
        let hasChanges = false;
        
        for (const key in draft) {
            if (key !== 'id' && !deepEqual(draft[key], baseEntityRef.current[key])) {
                (changesToSave as any)[key] = draft[key];
                hasChanges = true;
            }
        }
        
        if (hasChanges) {
            setSaveStatus('saving');
            try {
                await onUpdate(entity.id, changesToSave);
                baseEntityRef.current = draft; 
                setSaveStatus('saved');
                statusTimeoutRef.current = window.setTimeout(() => {
                    setSaveStatus('idle');
                }, 2000);
            } catch (error) {
                handleError(error, 'Autosave failed. Your latest changes were not saved.');
                setSaveStatus('unsaved');
            }
        } else {
            setSaveStatus('idle');
        }
    }, [draft, entity.id, onUpdate, handleError]);

    useEffect(() => {
        if (saveStatus !== 'unsaved') {
            return;
        }

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = window.setTimeout(saveDraft, effectiveDelay);

        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [draft, saveStatus, effectiveDelay, saveDraft]);
    
    const updateDraft = useCallback((field: string, value: any) => {
        setDraft(prevDraft => ({ ...prevDraft, [field]: value }));
        setSaveStatus('unsaved');
    }, []);
    
    const flush = useCallback(async () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        if (saveStatus === 'unsaved') {
           await saveDraft();
        }
    }, [saveStatus, saveDraft]);

    return { draft, updateDraft, saveStatus, flush };
};