import React from 'react';
import { EntityId, OrphanedEntity } from '../../../types';
import { useI18n } from '../../../hooks/useI18n';
import { UsersIcon } from '../../common/Icons';
import { useNavigation } from '../../../hooks/useNavigation';

interface OrphanedEntitiesReportProps {
    data: OrphanedEntity[];
}

const OrphanedEntitiesReport: React.FC<OrphanedEntitiesReportProps> = ({ data }) => {
    const { t } = useI18n();
    const { navigateToEntity } = useNavigation();

    const handleSelectEntity = (id: EntityId) => {
        navigateToEntity(id);
    };

    return (
        <div>
            <h4 className="text-lg font-bold mb-2">{t('reports.orphaned.title', { count: data.length })}</h4>
            <p className="text-sm text-text-secondary mb-4">{t('reports.orphaned.subtitle')}</p>
            {data.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {data.map(entity => (
                        <button onClick={() => handleSelectEntity(entity.id)} key={entity.id} className="p-3 bg-primary rounded-md border border-border-color text-left hover:border-accent">
                            <p className="font-semibold">{entity.name}</p>
                            <p className="text-xs text-text-secondary">{entity.type}</p>
                        </button>
                    ))}
                </div>
            ) : (
                 <div className="text-center text-green-400 p-4 bg-primary rounded-md flex items-center justify-center gap-2">
                    <UsersIcon className="w-5 h-5" />
                    <span>{t('reports.orphaned.none')}</span>
                </div>
            )}
        </div>
    );
};

export default OrphanedEntitiesReport;