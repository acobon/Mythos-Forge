
import { useCallback } from 'react';
import { useAppDispatch } from '../state/hooks';
import { showDialog } from '../state/uiSlice';
import { DialogState } from '../types';

export const useConfirmationDialog = () => {
    const dispatch = useAppDispatch();

    return useCallback((options: Omit<DialogState, 'isOpen'>) => {
        dispatch(showDialog(options as any));
    }, [dispatch]);
};
