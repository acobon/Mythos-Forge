
import React from 'react';
import { UsersIcon, PlusCircleIcon } from '../../common/Icons';
import { useI18n } from '../../../hooks/useI18n';
import EmptyState from '../../common/EmptyState';
import { useAppSelector } from '../../../state/hooks';
import { EntityTypeDefinition } from '../../../types';

interface EmptyViewProps {
  onAddEntity: (type: string) => void;
  hasEntities: boolean;
}

const EmptyView: React.FC<EmptyViewProps> = ({ onAddEntity, hasEntities }) => {
    const { t } = useI18n();
    const { entityTypes } = useAppSelector(state => state.bible.present.entities);
    
    if (hasEntities) {
        return (
            <EmptyState
                icon={<UsersIcon className="w-16 h-16" />}
                title={t('entityView.empty.select')}
                description={t('entityView.empty.select.subtitle')}
            />
        );
    }
    
    return (
        <EmptyState
            icon={<UsersIcon className="w-16 h-16" />}
            title={t('entityView.empty.welcome')}
            description={t('entityView.empty.welcome.subtitle')}
        >
            {entityTypes.map((typeDef: EntityTypeDefinition) => (
                 <button key={typeDef.key} onClick={() => onAddEntity(typeDef.key)} className="px-4 py-2 font-semibold text-white bg-accent hover:bg-highlight rounded-md transition-colors flex items-center">
                    <PlusCircleIcon className="w-5 h-5 mr-2" /> Add {typeDef.name}
                </button>
            ))}
        </EmptyState>
    );
};

export default EmptyView;
