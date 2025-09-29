

import React, { useState, useMemo, useEffect } from 'react';
import { useAppSelector } from '../../state/hooks';
import { useI18n } from '../../hooks/useI18n';
import { useNavigation } from '../../hooks/useNavigation';
import { Entity, EntityType, NarrativeScene, HistoricalEvent, CharacterEntity, Work, Theme, Conflict } from '../../types';
import { getTypedObjectValues, formatWorldDate, stripReferences } from '../../utils';
import { BrainCircuitIcon, BookOpenIcon, UsersIcon, FileTextIcon, ClockIcon } from '../common/Icons';
import EmptyState from '../common/EmptyState';
import { Button } from '../common/ui';

type AnalysisItem = {
    type: 'scene';
    item: NarrativeScene;
    date: Date | null;
} | {
    type: 'event';
    item: HistoricalEvent;
    date: Date | null;
};

const AnalysisItemCard: React.FC<{
    item: AnalysisItem;
    onSelect: (item: AnalysisItem) => void;
    workMap: Map<string, Work>;
}> = ({ item, onSelect, workMap }) => {
    const { t } = useI18n();
    const { calendar } = useAppSelector(state => state.bible.present.project);

    const isScene = item.type === 'scene';
    const title = isScene ? item.item.title : item.item.description;
    const work = isScene ? workMap.get(item.item.id) : null;
    const contentSnippet = isScene ? stripReferences(item.item.summary || item.item.content) : stripReferences(item.item.description);

    return (
        <div className="bg-primary p-4 rounded-lg border border-border-color">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        {isScene ? <FileTextIcon className="w-5 h-5 text-accent" /> : <ClockIcon className="w-5 h-5 text-accent" />}
                        <h4 className="font-bold text-lg text-text-main">{isScene ? title : t('analysis.itemType.event')}</h4>
                    </div>
                    <p className="text-sm text-text-secondary">
                        {item.date ? formatWorldDate(item.date.toISOString(), calendar) : 'No date'}
                    </p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => onSelect(item)}>{t('analysis.viewDetails')}</Button>
            </div>
            <p className="text-sm text-text-secondary mt-2 line-clamp-2" title={contentSnippet}>
                {isScene && work && <span className="font-semibold">{work.title} / </span>}
                {contentSnippet}
            </p>
        </div>
    );
};


const NarrativeAnalysisView: React.FC = () => {
    const { t } = useI18n();
    const { themes, conflicts } = useAppSelector(state => state.bible.present.metadata);
    const { scenes, works } = useAppSelector(state => state.bible.present.narrative);
    const { events } = useAppSelector(state => state.bible.present.events);
    const { entities } = useAppSelector(state => state.bible.present.entities);
    const { calendar } = useAppSelector(state => state.bible.present.project);
    const { navigateToScene, navigateToEntity } = useNavigation();

    const [analysisType, setAnalysisType] = useState<'theme' | 'conflict'>('theme');
    const [selectedId, setSelectedId] = useState<string>('');

    const itemsToSelect = useMemo(() => {
        return analysisType === 'theme' 
            ? (getTypedObjectValues(themes) as Theme[]).sort((a, b) => a.name.localeCompare(b.name))
            : (getTypedObjectValues(conflicts) as Conflict[]).sort((a, b) => a.name.localeCompare(b.name));
    }, [analysisType, themes, conflicts]);

    useEffect(() => {
        setSelectedId(itemsToSelect[0]?.id || '');
    }, [itemsToSelect]);
    
    const sceneIdToWorkMap = useMemo(() => {
        const map = new Map<string, Work>();
        (getTypedObjectValues(works) as Work[]).forEach(work => {
            const allWorkSceneIds = new Set([...work.sceneIds, ...work.chapters.flatMap(c => c.sceneIds)]);
            allWorkSceneIds.forEach(sceneId => map.set(sceneId, work));
        });
        return map;
    }, [works]);

    const chronologicalItems = useMemo((): { dated: AnalysisItem[], undated: AnalysisItem[] } => {
        if (!selectedId) return { dated: [], undated: [] };

        const taggedCharacterIds = new Set<string>();
        (getTypedObjectValues(entities) as Entity[]).forEach(e => {
            if (e.type === EntityType.CHARACTER) {
                const char = e as CharacterEntity;
                const ids = analysisType === 'theme' ? char.themeIds : char.conflictIds;
                if (ids?.includes(selectedId)) {
                    taggedCharacterIds.add(e.id);
                }
            }
        });
        
        const taggedEvents = (getTypedObjectValues(events) as HistoricalEvent[]).filter(e =>
            e.involvedEntities.some(inv => taggedCharacterIds.has(inv.entityId))
        );
        
        const taggedScenes = (getTypedObjectValues(scenes) as NarrativeScene[]).filter(s => {
            const ids = analysisType === 'theme' ? s.themeIds : s.conflictIds;
            return ids?.includes(selectedId);
        });
        
        const getSceneDate = (scene: NarrativeScene): Date | null => {
            if (!scene.linkedEventIds || scene.linkedEventIds.length === 0) return null;
            const eventDates = scene.linkedEventIds
                .map(id => events[id]?.startDateTime)
                .filter((d): d is string => !!d)
                .map(iso => new Date(iso));
            return eventDates.length > 0 ? new Date(Math.min(...eventDates.map(d => d.getTime()))) : null;
        };

        const unifiedList: AnalysisItem[] = [
            ...taggedEvents.map(item => ({ type: 'event' as const, item, date: new Date(item.startDateTime) })),
            ...taggedScenes.map(item => ({ type: 'scene' as const, item, date: getSceneDate(item) }))
        ];
        
        const dated = unifiedList.filter(item => item.date).sort((a, b) => (a.date!.getTime() - b.date!.getTime()));
        const undated = unifiedList.filter(item => !item.date);

        return { dated, undated };

    }, [selectedId, analysisType, entities, events, scenes]);

    const handleSelect = (item: AnalysisItem) => {
        if (item.type === 'scene') {
            const work = sceneIdToWorkMap.get(item.item.id);
            if (work) navigateToScene(work.id, item.item.id);
        } else {
            const primaryEntityId = item.item.involvedEntities[0]?.entityId;
            if (primaryEntityId) navigateToEntity(primaryEntityId, { highlightEventId: item.item.id });
        }
    };
    
    return (
        <div className="p-4 md:p-8 h-full flex flex-col">
            <header className="flex-shrink-0 mb-6">
                <h2 className="text-3xl font-bold text-text-main">{t('analysis.title')}</h2>
                <p className="text-text-secondary mt-1 max-w-2xl">{t('analysis.description')}</p>
            </header>

            <div className="bg-secondary p-4 rounded-lg border border-border-color flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex p-1 bg-primary rounded-md border border-border-color">
                        <button onClick={() => setAnalysisType('theme')} className={`px-3 py-1 text-sm font-semibold rounded-md flex items-center gap-2 ${analysisType === 'theme' ? 'bg-accent text-white' : 'hover:bg-border-color'}`}>
                            <BookOpenIcon className="w-5 h-5"/> {t('analysis.themeAnalysis')}
                        </button>
                        <button onClick={() => setAnalysisType('conflict')} className={`px-3 py-1 text-sm font-semibold rounded-md flex items-center gap-2 ${analysisType === 'conflict' ? 'bg-accent text-white' : 'hover:bg-border-color'}`}>
                            <UsersIcon className="w-5 h-5"/> {t('analysis.conflictAnalysis')}
                        </button>
                    </div>
                    <div className="flex-grow">
                        {itemsToSelect.length > 0 ? (
                            <select value={selectedId} onChange={e => setSelectedId(e.target.value)} className="w-full bg-primary border border-border-color rounded-md p-2 text-sm">
                                <option value="">{analysisType === 'theme' ? t('analysis.selectTheme') : t('analysis.selectConflict')}</option>
                                {itemsToSelect.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </select>
                        ) : (
                            <div className="p-2 text-sm text-text-secondary bg-primary rounded-md border border-border-color">
                                {t('analysis.noItems', { type: analysisType === 'theme' ? 'Themes' : 'Conflicts' })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <main className="flex-grow mt-6 overflow-y-auto pr-2">
                {selectedId && (chronologicalItems.dated.length > 0 || chronologicalItems.undated.length > 0) ? (
                    <div className="space-y-4">
                        {chronologicalItems.dated.map((item, index) => (
                            <AnalysisItemCard key={`${item.type}-${item.item.id}-${index}`} item={item} onSelect={handleSelect} workMap={sceneIdToWorkMap} />
                        ))}
                        {chronologicalItems.undated.length > 0 && (
                            <>
                                <h3 className="text-lg font-semibold text-text-secondary pt-4 border-t border-border-color mt-6">{t('analysis.itemsWithoutDate')}</h3>
                                {chronologicalItems.undated.map((item, index) => (
                                    <AnalysisItemCard key={`${item.type}-${item.item.id}-${index}`} item={item} onSelect={handleSelect} workMap={sceneIdToWorkMap} />
                                ))}
                            </>
                        )}
                    </div>
                ) : (
                    <EmptyState 
                        icon={<BrainCircuitIcon className="w-16 h-16" />} 
                        title={itemsToSelect.length === 0 ? t('analysis.noItems', { type: analysisType }) : t('analysis.noResults', { type: analysisType })} 
                        description={itemsToSelect.length === 0 ? '' : `Tag scenes or characters with the selected ${analysisType} to see them appear here.`}
                    />
                )}
            </main>
        </div>
    );
};

export default NarrativeAnalysisView;
