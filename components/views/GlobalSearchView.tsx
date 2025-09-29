
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchWorker } from '../../hooks/useSearchWorker';
import { useDebounce } from '../../hooks/useDebounce';
import { useI18n } from '../../hooks/useI18n';
import { useNavigation } from '../../hooks/useNavigation';
import { Entity, NarrativeScene, ResearchNote, WorldEvent, Work } from '../../types';
import { useAppSelector } from '../../state/hooks';
import { getTypedObjectValues, htmlToPlainText } from '../../utils';
import { Input } from '../common/ui';
import { SearchIcon } from '../common/Icons';

type SearchResult = 
  | { type: 'entity', item: Entity }
  | { type: 'work', item: Work }
  | { type: 'scene', item: NarrativeScene, work: Work }
  | { type: 'note', item: ResearchNote }
  | { type: 'worldEvent', item: WorldEvent };


const GlobalSearchView: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const { t } = useI18n();
    const { navigateToEntity, navigateToScene, navigateToNote, navigateToWorldEvent, navigateToWork } = useNavigation();
    const { entities } = useAppSelector(state => state.bible.present.entities);
    const { works, scenes } = useAppSelector(state => state.bible.present.narrative);
    const { researchNotes } = useAppSelector(state => state.bible.present.knowledge);
    const { worldEvents } = useAppSelector(state => state.bible.present.events);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 250);

    const searchableData = useMemo(() => {
        const data: any[] = [];
        (getTypedObjectValues(entities) as Entity[]).forEach(item => data.push({ ...item, _type: 'entity' }));
        (getTypedObjectValues(works) as Work[]).forEach(item => data.push({ ...item, _type: 'work' }));
        (getTypedObjectValues(scenes) as NarrativeScene[]).forEach(item => data.push({ ...item, _type: 'scene' }));
        (getTypedObjectValues(researchNotes) as ResearchNote[]).forEach(item => data.push({ ...item, _type: 'note' }));
        (getTypedObjectValues(worldEvents) as WorldEvent[]).forEach(item => data.push({ ...item, _type: 'worldEvent' }));
        return data;
    }, [entities, works, scenes, researchNotes, worldEvents]);
    
    const { results, search } = useSearchWorker(searchableData, ['name', 'title', 'description', 'content']);

    useEffect(() => {
        search(debouncedSearchTerm);
    }, [debouncedSearchTerm, search]);

    const handleSelect = (result: any) => {
        switch (result._type) {
            case 'entity': navigateToEntity(result.id); break;
            case 'work': navigateToWork(result.id); break;
            case 'scene': {
                const work = (getTypedObjectValues(works) as Work[]).find(w => w.sceneIds.includes(result.id) || w.chapters.some(c => c.sceneIds.includes(result.id)));
                if(work) navigateToScene(work.id, result.id);
                break;
            }
            case 'note': navigateToNote(result.id); break;
            case 'worldEvent': navigateToWorldEvent(result.id); break;
        }
        onClose?.();
    };

    return (
        <div className="h-[60vh] flex flex-col">
            <div className="relative mb-2 flex-shrink-0">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <Input
                    type="search"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder={t('search.placeholder')}
                    className="pl-10"
                    autoFocus
                />
            </div>
            <div className="flex-grow overflow-y-auto mt-2 pr-1 space-y-1">
                {results.map((item: any) => (
                    <button key={`${item._type}-${item.id}`} onClick={() => handleSelect(item)} className="w-full text-left p-2 rounded-md hover:bg-secondary">
                        <p className="font-semibold">{item.name || item.title}</p>
                        <p className="text-xs text-text-secondary capitalize">{item._type}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default GlobalSearchView;
