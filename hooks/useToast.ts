import { useCallback } from 'react';
import { ToastMessage } from '../types';
import { useAppDispatch } from '../state/hooks';
import { addToast } from '../state/uiSlice';

export const useToast = () => {
    const dispatch = useAppDispatch();

    const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
        dispatch(addToast(toast));
    }, [dispatch]);

    return { showToast };
};
