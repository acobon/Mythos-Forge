// components/layout/GlobalSaveStatusIndicator.tsx
import React from 'react';
import { useI18n } from '../../hooks/useI18n';
import { CircleIcon } from '../common/Icons';
import { useAppSelector } from '../../state/hooks';
import { selectHasUnsavedChanges } from '../../state/selectors';

const GlobalSaveStatusIndicator: React.FC = () => {
    const { t } = useI18n();
    const hasUnsaved = useAppSelector(selectHasUnsavedChanges);

    if (!hasUnsaved) {
        return null;
    }

    return (
        <div
            className="fixed bottom-4 right-4 z-50 bg-secondary text-text-secondary px-3 py-1.5 rounded-full text-xs font-semibold flex items-center shadow-lg border border-border-color animate-fade-in"
            aria-live="polite"
            role="status"
        >
            <CircleIcon className="w-2.5 h-2.5 mr-2 text-highlight" />
            <span>{t('common.unsaved')}</span>
        </div>
    );
};

export default GlobalSaveStatusIndicator;