

import React, { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../state/hooks';
import { useI18n } from '../../../hooks/useI18n';
import { selectTotalWordCount } from '../../../state/selectors';
import { SettingsIcon } from '../../common/Icons';
import { useProjectSettingsActions } from '../../../hooks/useProjectSettingsActions';
import { StoryBible, ModalType } from '../../../types';
import { popModal, pushModal } from '../../../state/uiSlice';

const WritingGoalsWidget: React.FC = () => {
    const { t } = useI18n();
    const dispatch = useAppDispatch();
    const { writingGoals, writingHistory } = useAppSelector(state => state.bible.present.project);
    // FIX: Explicitly cast the return value to resolve a type inference issue.
    const totalWordCount = useAppSelector(selectTotalWordCount) as number;
    const { updateWritingGoals } = useProjectSettingsActions();
    
    const wordsToday = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);
        return writingHistory?.find(h => h.date === today)?.wordCount || 0;
    }, [writingHistory]);
    
    const projectProgress = writingGoals.projectWordGoal > 0 ? (totalWordCount / writingGoals.projectWordGoal) * 100 : 0;
    const dailyProgress = writingGoals.dailyWordGoal > 0 ? (wordsToday / writingGoals.dailyWordGoal) * 100 : 0;

    const handleOpenModal = () => {
        const handleSave = (goals: StoryBible['writingGoals']) => {
            updateWritingGoals(goals);
            dispatch(popModal());
        };
        dispatch(pushModal({ type: ModalType.WRITING_GOALS, props: { onSave: handleSave } }));
    };

    return (
        <section>
             <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-semibold text-text-secondary">{t('dashboard.writingGoals.title')}</h3>
                <button onClick={handleOpenModal} className="p-1 text-text-secondary hover:text-accent rounded-full"><SettingsIcon className="w-5 h-5"/></button>
            </div>
            <div className="bg-secondary p-4 rounded-lg border border-border-color space-y-4">
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-text-main">{t('dashboard.writingGoals.today')}</span>
                        <span className="text-text-secondary">{wordsToday.toLocaleString()} / {writingGoals.dailyWordGoal.toLocaleString()} {t('dashboard.writingGoals.words')}</span>
                    </div>
                    <div className="w-full bg-primary rounded-full h-2.5">
                        <div className="bg-accent h-2.5 rounded-full" style={{ width: `${Math.min(dailyProgress, 100)}%` }}></div>
                    </div>
                </div>
                 <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-text-main">{t('dashboard.writingGoals.project')}</span>
                        <span className="text-text-secondary">{totalWordCount.toLocaleString()} / {writingGoals.projectWordGoal.toLocaleString()} {t('dashboard.writingGoals.words')}</span>
                    </div>
                    <div className="w-full bg-primary rounded-full h-2.5">
                        <div className="bg-highlight h-2.5 rounded-full" style={{ width: `${Math.min(projectProgress, 100)}%` }}></div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default WritingGoalsWidget;