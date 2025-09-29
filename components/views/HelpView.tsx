// components/views/HelpView.tsx
import React from 'react';
import { useI18n } from '../../hooks/useI18n';
import { UsersIcon, BookOpenIcon, KanbanSquareIcon, ArchiveIcon, ClockIcon, HelpCircleIcon } from '../common/Icons';

interface HelpSectionProps {
    title: string;
    content: string;
    icon: React.ReactNode;
}

const HelpSection: React.FC<HelpSectionProps> = ({ title, content, icon }) => (
    <div className="bg-secondary p-6 rounded-lg border border-border-color flex items-start gap-4">
        <div className="flex-shrink-0 text-accent mt-1">{icon}</div>
        <div>
            <h3 className="text-xl font-bold text-text-main">{title}</h3>
            <p className="text-text-secondary mt-2">{content}</p>
        </div>
    </div>
);

const HelpView: React.FC = () => {
    const { t } = useI18n();

    const sections = [
        {
            key: 'entities',
            icon: <UsersIcon className="w-8 h-8" />,
        },
        {
            key: 'works',
            icon: <BookOpenIcon className="w-8 h-8" />,
        },
        {
            key: 'planning',
            icon: <KanbanSquareIcon className="w-8 h-8" />,
        },
        {
            key: 'timeline',
            icon: <ClockIcon className="w-8 h-8" />,
        },
        {
            key: 'snapshots',
            icon: <ArchiveIcon className="w-8 h-8" />,
        },
    ];

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            <header className="mb-8 text-center">
                 <HelpCircleIcon className="w-16 h-16 mx-auto text-accent mb-4" />
                <h2 className="text-4xl font-bold text-text-main">{t('help.title')}</h2>
                <p className="text-text-secondary mt-2 max-w-2xl mx-auto">{t('help.subtitle')}</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {sections.map(section => (
                    <HelpSection
                        key={section.key}
                        icon={section.icon}
                        title={t(`help.${section.key}.title` as any)}
                        content={t(`help.${section.key}.content` as any)}
                    />
                ))}
            </div>
        </div>
    );
};

export default HelpView;
