import React from 'react';
import { useI18n } from '../../hooks/useI18n';
import { SaveStatus } from '../../hooks/useDebouncedEntitySave';
import { CheckIcon, RefreshCwIcon, CircleIcon } from './Icons';

interface SaveStatusIndicatorProps {
    status: SaveStatus;
    className?: string;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({ status, className }) => {
    const { t } = useI18n();

    switch (status) {
        case 'unsaved':
            return (
                <span className={`text-xs font-semibold text-text-secondary flex items-center justify-end ${className}`} title="Unsaved changes">
                    <CircleIcon className="w-2.5 h-2.5 mr-1.5" /> {t('common.unsaved')}
                </span>
            );
        case 'saving':
            return (
                <span className={`text-xs font-semibold text-text-secondary flex items-center justify-end ${className}`}>
                    <RefreshCwIcon className="w-3 h-3 mr-1 animate-spin" />
                    {t('common.saving')}
                </span>
            );
        case 'saved':
            return (
                <span className={`text-xs font-semibold text-green-400 flex items-center justify-end ${className}`}>
                    <CheckIcon className="w-3 h-3 mr-1" />
                    {t('common.saved')}
                </span>
            );
        case 'idle':
        default:
            return null;
    }
};
