import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { Work } from '../../types';
import { KanbanSquareIcon, LayoutGridIcon } from '../common/Icons';
import { useI18n } from '../../hooks/useI18n';
import EmptyState from '../common/EmptyState';
import { useNavigation } from '../../hooks/useNavigation';
import { getTypedObjectValues } from '../../utils';
import { onboardingRefService } from '../../services/onboardingRefService';
import KanbanView from './plotting/KanbanView';
import CorkboardView from './plotting/CorkboardView';
import { ViewType } from '../../types/enums';
import { Button } from '../common/ui';
import { setSelectedWorkId } from '../../state/slices/narrativeSlice';

const PlottingView: React.FC = () => {
    const { t } = useI18n();
    const dispatch = useAppDispatch();
    const { works, selectedWorkId } = useAppSelector(state => state.bible.present.narrative);
    const { navigateToView } = useNavigation();
    const headerRef = useRef<HTMLElement>(null);

    const worksArray = useMemo(() => getTypedObjectValues(works) as Work[], [works]);
    const [viewMode, setViewMode] = useState<'kanban' | 'corkboard'>('kanban');
    
    useEffect(() => {
        if (!selectedWorkId && worksArray.length > 0) {
            dispatch(setSelectedWorkId(worksArray[0].id));
        }
    }, [selectedWorkId, worksArray, dispatch]);

    useEffect(() => {
        const planningBoardHeader = headerRef.current;
        if (planningBoardHeader) {
            onboardingRefService.register('planning-board-header', planningBoardHeader);
            return () => onboardingRefService.register('planning-board-header', null);
        }
    }, []);

    const selectedWork = useMemo(() => works[selectedWorkId || ''], [works, selectedWorkId]);

    if (worksArray.length === 0) {
        return (
             <EmptyState icon={<KanbanSquareIcon className="w-16 h-16" />} title={t('plotting.noWorks.title')} description={t('plotting.noWorks.description')}>
                 <Button onClick={() => navigateToView(ViewType.WORKS_ORGANIZER)}>{t('plotting.noWorks.action')}</Button>
            </EmptyState>
        );
    }
    
    if (!selectedWork) {
         return (
            <div className="p-4 md:p-8 h-full flex flex-col">
                <header className="flex-shrink-0 mb-6 space-y-3">
                     <h2 className="text-3xl font-bold text-text-main">{t('plotting.title')}</h2>
                     <div className="flex items-center gap-4">
                        <label htmlFor="plot-select" className="font-semibold text-text-secondary">{t('plotting.selectedWork')}</label>
                        <select id="plot-select" value={selectedWorkId || ''} onChange={e => dispatch(setSelectedWorkId(e.target.value))} className="bg-secondary border border-border-color rounded-md p-2 text-sm max-w-xs">
                            <option value="">Select a work...</option>
                            {worksArray.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </select>
                    </div>
                </header>
                <EmptyState icon={<KanbanSquareIcon className="w-16 h-16" />} title={t('plotting.empty.title')} description={t('plotting.empty.subtitle')} />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 h-full flex flex-col">
            <header ref={headerRef} className="flex-shrink-0 mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-text-main">{t('plotting.title')}</h2>
                    <div className="flex items-center gap-4 mt-3">
                        <label htmlFor="plot-select" className="font-semibold text-text-secondary">{t('plotting.selectedWork')}</label>
                        <select id="plot-select" value={selectedWorkId || ''} onChange={e => dispatch(setSelectedWorkId(e.target.value))} className="bg-secondary border border-border-color rounded-md p-2 text-sm max-w-xs">
                            {worksArray.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </select>
                    </div>
                </div>
                <div className="bg-primary p-1 rounded-md border border-border-color flex items-center">
                    <Button onClick={() => setViewMode('kanban')} variant={viewMode === 'kanban' ? 'primary' : 'ghost'} size="sm" className="flex items-center gap-1"><KanbanSquareIcon className="w-4 h-4"/> {t('plotting.kanban')}</Button>
                    <Button onClick={() => setViewMode('corkboard')} variant={viewMode === 'corkboard' ? 'primary' : 'ghost'} size="sm" className="flex items-center gap-1"><LayoutGridIcon className="w-4 h-4"/> {t('plotting.corkboard')}</Button>
                </div>
            </header>
            
            <div className="flex-grow overflow-auto border border-border-color rounded-lg bg-secondary relative">
                {viewMode === 'kanban' ? (
                    <KanbanView work={selectedWork} />
                ) : (
                    <CorkboardView work={selectedWork} />
                )}
            </div>
        </div>
    );
};

export default PlottingView;
