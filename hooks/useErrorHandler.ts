// hooks/useErrorHandler.ts
import { useCallback } from 'react';
import { useAppDispatch } from '../state/hooks';
import { showDialog } from '../state/uiSlice';
import { useI18n } from './useI18n';

export const useErrorHandler = () => {
    const dispatch = useAppDispatch();
    const { t } = useI18n();

    const handleError = useCallback((error: unknown, userMessage?: string) => {
        const displayMessage = userMessage || 'An unexpected error occurred.';
        const errorDetails = error instanceof Error ? `\n\nDetails: ${error.message}` : '';
        console.error("An error was handled:", error);
        dispatch(showDialog({ title: t('common.error'), message: `${displayMessage}${errorDetails}` }));
    }, [dispatch, t]);

    return { handleError };
};
