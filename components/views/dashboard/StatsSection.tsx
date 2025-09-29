import React from 'react';
import { useI18n } from '../../../hooks/useI18n';
import { UsersIcon, BookOpenIcon, ClockIcon } from '../../common/Icons';
import { StatCard } from './StatCard';

interface StatsSectionProps {
    entityCount: number;
    eventCount: number;
    wordCount: number;
}

const StatsSection: React.FC<StatsSectionProps> = ({ entityCount, eventCount, wordCount }) => {
    const { t } = useI18n();
    return (
        <section>
            <h3 className="text-xl font-semibold text-text-secondary mb-3">{t('dashboard.stats.title')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard icon={<UsersIcon className="w-8 h-8"/>} title={t('dashboard.stats.entities')} value={entityCount} />
                <StatCard icon={<ClockIcon className="w-8 h-8"/>} title={t('dashboard.stats.events')} value={eventCount} />
                <StatCard icon={<BookOpenIcon className="w-8 h-8"/>} title={t('dashboard.stats.wordCount')} value={wordCount.toLocaleString()} />
            </div>
        </section>
    );
};

export default StatsSection;