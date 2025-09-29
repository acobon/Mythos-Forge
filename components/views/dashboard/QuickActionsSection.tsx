import React from 'react';
import { useI18n } from '../../../hooks/useI18n';
import { useAppDispatch } from '../../../state/hooks';
import { setView } from '../../../state/uiSlice';
import { useEntityActions } from '../../../hooks/useEntityActions';
import { EntityType } from '../../../types';
import { PlusCircleIcon, FileTextIcon } from '../../common/Icons';

const ActionButton: React.FC<{ icon: React.ReactNode; title: string; subtitle: string; onClick: () => void; }> = ({ icon, title, subtitle, onClick }) => (
    <button onClick={onClick} className="w-full text-left bg-secondary p-4 rounded-lg border border-border-color hover:border-accent hover:bg-border-color transition-all duration-200 flex items-center space-x-4">
        <div className="text-accent p-2 bg-primary rounded-lg">{icon}</div>
        <div>
            <h4 className="font-semibold text-text-main">{title}</h4>
            <p className="text-sm text-text-secondary">{subtitle}</p>
        </div>
    </button>
);

const QuickActionsSection: React.FC = () => {
    const { t } = useI18n();
    const dispatch = useAppDispatch();
    const { addNewEntity } = useEntityActions();

    return (
        <section>
            <h3 className="text-xl font-semibold text-text-secondary mb-3">{t('dashboard.actions.title')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ActionButton icon={<PlusCircleIcon className="w-6 h-6" />} title={t('dashboard.actions.newCharacter.title')} subtitle={t('dashboard.actions.newCharacter.subtitle')} onClick={() => addNewEntity(EntityType.CHARACTER)} />
                <ActionButton icon={<FileTextIcon className="w-6 h-6" />} title={t('dashboard.actions.goToManuscript.title')} subtitle={t('dashboard.actions.goToManuscript.subtitle')} onClick={() => dispatch(setView('manuscript'))} />
            </div>
        </section>
    );
};

export default QuickActionsSection;