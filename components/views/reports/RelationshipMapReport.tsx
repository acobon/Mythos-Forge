import React from 'react';
import RelationshipGraph from '../../RelationshipGraph';
import { GraphNode } from '../../../types';
import { RelationshipGraphData } from '../../../services/reportingService';
import { useI18n } from '../../../hooks/useI18n';
import { LinkIcon } from '../../common/Icons';
import EmptyState from '../../common/EmptyState';

interface RelationshipMapReportProps {
    data: RelationshipGraphData;
    onNodeClick: (node: GraphNode) => void;
}

const RelationshipMapReport: React.FC<RelationshipMapReportProps> = ({ data, onNodeClick }) => {
    const { t } = useI18n();
    const { nodes, edges } = data;

    return (
        <div>
            <h4 className="text-lg font-bold mb-2">{t('reports.relationshipMap.title')}</h4>
            <p className="text-sm text-text-secondary mb-4">{t('reports.relationshipMap.subtitle')}</p>
            <div className="w-full h-[60vh] mt-4 bg-primary rounded-lg border border-border-color">
                {nodes.length > 0 ? (
                    <RelationshipGraph nodes={nodes} edges={edges} onNodeClick={onNodeClick} />
                ) : (
                    <EmptyState
                        icon={<LinkIcon className="w-16 h-16" />}
                        title={t('reports.relationshipMap.none')}
                        description={t('reports.relationshipMap.none.description')}
                    />
                )}
            </div>
        </div>
    );
};

export default RelationshipMapReport;
