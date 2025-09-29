import React, { useMemo } from 'react';
import { PovDistribution } from '../../../types';
import { useI18n } from '../../../hooks/useI18n';

interface PovDistributionReportProps {
    data: PovDistribution;
}

const PovDistributionReport: React.FC<PovDistributionReportProps> = ({ data }) => {
    const { t } = useI18n();
    const totalScenes = useMemo(() => Object.values(data).reduce((sum: number, count: number) => sum + count, 0), [data]);
    const sortedPovs = useMemo(() => Object.entries(data).sort((a: [string, number], b: [string, number]) => b[1] - a[1]), [data]);

    return (
        <div>
            <h4 className="text-lg font-bold mb-2">{t('reports.pov.title')}</h4>
            <p className="text-sm text-text-secondary mb-4">{t('reports.pov.subtitle')}</p>
            {totalScenes > 0 ? (
                <div className="space-y-3">
                    {sortedPovs.map(([name, count]) => {
                        const percentage = totalScenes > 0 ? (count / totalScenes) * 100 : 0;
                        return (
                            <div key={name} className="flex items-center gap-4">
                                <span className="w-40 truncate text-right text-sm font-semibold">{name}</span>
                                <div className="flex-grow bg-primary rounded-full h-6 border border-border-color">
                                    <div className="bg-accent h-full rounded-full text-white text-xs flex items-center justify-end pr-2" style={{ width: `${percentage}%` }}>
                                        {count}
                                    </div>
                                </div>
                                <span className="text-xs text-text-secondary w-12 text-left">{percentage.toFixed(1)}%</span>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-text-secondary p-4 bg-primary rounded-md">{t('reports.pov.noScenes')}</p>
            )}
        </div>
    );
};

export default PovDistributionReport;