

import React, { useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { useI18n } from '../../hooks/useI18n';
import StatsSection from './dashboard/StatsSection';
import QuickActionsSection from './dashboard/QuickActionsSection';
import ProjectScratchpad from './dashboard/ProjectScratchpad';
import RecentlyEdited from './dashboard/RecentlyEdited';
import WritingGoalsWidget from './dashboard/WritingGoalsWidget';
import GettingStartedWidget from './dashboard/GettingStartedWidget';
import { SettingsIcon } from '../common/Icons';
import { selectTotalWordCount } from '../../state/selectors';
import { ModalType } from '../../types';
import { pushModal, setDashboardLayout } from '../../state/uiSlice';

const DashboardView: React.FC = () => {
    const dispatch = useAppDispatch();
    const { present: storyBible } = useAppSelector(state => state.bible);
    const { dashboardLayout, dashboardWidgets } = useAppSelector(state => state.ui);
    const { t } = useI18n();
    const { entities } = storyBible.entities;
    const { events } = storyBible.events;
    // FIX: Explicitly cast the return value to resolve a type inference issue.
    const totalWordCount = useAppSelector(selectTotalWordCount) as number;

    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const isNewProject = useMemo(() => Object.keys(entities).length === 0, [entities]);

    const widgetMap: Record<string, React.ReactNode> = {
        stats: <StatsSection entityCount={Object.keys(entities).length} eventCount={Object.keys(events).length} wordCount={totalWordCount} />,
        actions: <QuickActionsSection />,
        writingGoals: <WritingGoalsWidget />,
        recentlyEdited: <RecentlyEdited />,
        scratchpad: <ProjectScratchpad />,
        gettingStarted: <GettingStartedWidget />,
    };

    const orderedVisibleWidgets = useMemo(() => {
        if (isNewProject) {
            return [{ id: 'gettingStarted', component: widgetMap.gettingStarted }];
        }
        return dashboardLayout
            .filter(id => widgetMap[id] && dashboardWidgets[id])
            .map(id => ({ id, component: widgetMap[id] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dashboardLayout, dashboardWidgets, entities, events, totalWordCount, isNewProject]);

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDrop = (dropIndex: number) => {
        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            return;
        }
    
        const visibleIds = dashboardLayout.filter(id => dashboardWidgets[id]);
        const hiddenIds = dashboardLayout.filter(id => !dashboardWidgets[id]);
    
        const reorderedVisibleIds = [...visibleIds];
        const [draggedItem] = reorderedVisibleIds.splice(draggedIndex, 1);
        reorderedVisibleIds.splice(dropIndex, 0, draggedItem);
        
        const newLayout = [...reorderedVisibleIds, ...hiddenIds];
    
        dispatch(setDashboardLayout(newLayout));
        setDraggedIndex(null);
    };

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto animate-fade-in">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h2 className="text-4xl font-bold text-text-main">{t('dashboard.title')}</h2>
                    <p className="text-text-secondary mt-1">{t('dashboard.subtitle', { title: storyBible.project.title })}</p>
                </div>
                {!isNewProject && (
                    <button 
                        onClick={() => dispatch(pushModal({ type: ModalType.CUSTOMIZE_DASHBOARD, props: {} }))}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary text-text-secondary border border-border-color hover:bg-border-color"
                    >
                        <SettingsIcon className="w-5 h-5"/>
                        <span>Customize</span>
                    </button>
                )}
            </header>

            <div className={`grid grid-cols-1 gap-8 ${isNewProject ? 'lg:grid-cols-1' : 'lg:grid-cols-2'}`}>
                {orderedVisibleWidgets.map(({ id, component }, index) => (
                    <div
                        key={id}
                        draggable={!isNewProject}
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(index)}
                        className={`transition-opacity ${draggedIndex === index ? 'opacity-50' : 'opacity-100'}`}
                    >
                        {component}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DashboardView;