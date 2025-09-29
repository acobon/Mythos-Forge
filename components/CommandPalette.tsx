import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal } from './common/ui/Modal';
import { useDebounce } from '../hooks/useDebounce';
import { Entity, EntityType, Work, NarrativeScene, ResearchNote, WorldEvent, CommandAction, EntityId } from '../types';
import { useEntityActions } from '../hooks/useEntityActions';
import { selectEntityMap } from '../state/selectors';
import { 
    SearchIcon, 
    UserIcon, 
    MapPinIcon, 
    DiamondIcon, 
    UsersIcon, 
    BookOpenIcon, 
    FileTextIcon,
    NotebookIcon, 
    ClockIcon 
} from './common/Icons';
import { htmlToPlainText, getTypedObjectValues } from '../utils';
import { getCommandPaletteActions } from '../data/command-palette-config';
import { useI18n } from '../hooks/useI18n';
import { useNavigation } from '../hooks/useNavigation';
import { useSearchWorker } from '../hooks/useSearchWorker';
import { useAppSelector, useAppDispatch } from '../state/hooks';
import { Input } from './common/ui';
import { pushModal } from '../state/uiSlice';

type SearchResult = 
  | { type: 'entity', item: Entity }
  | { type: 'work', item: Work }
  | { type: 'scene', item: NarrativeScene, plot: Work }
  | { type: 'action', item: CommandAction }
  | { type: 'note', item: ResearchNote }
  | { type: 'worldEvent', item: WorldEvent };

const getResultIcon = (result: SearchResult) => {
    const props = { className: "w-5 h-5 mr-3 text-text-secondary" };
    switch (result.type) {
        case 'action':
            return result.item.icon;
        case 'entity':
            switch (result.item.type) {
                case EntityType.CHARACTER: return <UserIcon {...props} />;
                case EntityType.LOCATION: return <MapPinIcon {...props} />;
                case EntityType.OBJECT: return <DiamondIcon {...props} />;
                case EntityType.ORGANIZATION: return <UsersIcon {...props} />;
            }
            break;
        case 'work': return <BookOpenIcon {...props} />;
        case 'scene': return <FileTextIcon {...props} />;
        case 'note': return <NotebookIcon {...props} />;
        case 'worldEvent': return <ClockIcon {...props} />;
    }
    return null;
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
    const dispatch = useAppDispatch();
    const { addNewEntity } = useEntityActions();
    const { navigateToView, navigateToEntity, navigateToWork, navigateToScene, navigateToNote, navigateToWorldEvent } = useNavigation();
    const { entities } = useAppSelector(state => state.bible.present.entities);
    const { works, scenes, selectedWorkId } = useAppSelector(state => state.bible.present.narrative);
    const { researchNotes } = useAppSelector(state => state.bible.present.knowledge);
    const { worldEvents } = useAppSelector(state => state.bible.present.events);
    const uiState = useAppSelector(state => state.ui);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const debouncedSearchTerm = useDebounce(searchTerm, 150);
    const inputRef = useRef<HTMLInputElement>(null);
    const listboxRef = useRef<HTMLUListElement>(null);
    const listboxId = useMemo(() => `cp-listbox-${Math.random().toString(36).substr(2, 9)}`, []);
    const { t } = useI18n();
    
    const { selectedId } = uiState;
    const entityMap = useAppSelector(selectEntityMap) as Map<EntityId, Entity>;
    
    const selectedEntity = useMemo(() => selectedId ? entityMap.get(selectedId) : undefined, [selectedId, entityMap]);
    const selectedWork = useMemo(() => (getTypedObjectValues(works) as Work[]).find(w => w.id === selectedWorkId), [works, selectedWorkId]);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        } else {
            setSearchTerm('');
            setActiveIndex(0);
        }
    }, [isOpen]);
    
    const actions = useMemo((): CommandAction[] => getCommandPaletteActions({
        uiState,
        uiDispatch: dispatch,
        addNewEntity,
        selectedEntity,
        selectedWork,
        t,
        navigateToView,
    }), [uiState, dispatch, addNewEntity, selectedEntity, selectedWork, t, navigateToView]);

    const searchableDataForWorker = useMemo(() => {
        const data: any[] = [];
        
        actions.forEach(item => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { icon, execute, condition, ...serializableItem } = item;
            data.push({
                ...serializableItem,
                _type: 'action'
            });
        });
        
        (getTypedObjectValues(entities) as Entity[]).forEach(item => data.push({ ...item, _type: 'entity' }));

        (getTypedObjectValues(works) as Work[]).forEach(item => {
            data.push({ id: item.id, title: item.title, description: item.description, _type: 'work' });
            const allSceneIds = [...item.sceneIds, ...item.chapters.flatMap(c => c.sceneIds)];
            allSceneIds.forEach(sceneId => {
                const scene = scenes[sceneId];
                if (scene) {
                    data.push({ ...scene, _type: 'scene', _workId: item.id });
                }
            });
        });
        
        (getTypedObjectValues(researchNotes) as ResearchNote[]).forEach(item => data.push({ ...item, _type: 'note' }));
        (getTypedObjectValues(worldEvents) as WorldEvent[]).forEach(item => data.push({ ...item, _type: 'worldEvent' }));
        
        return data;
    }, [actions, entities, works, scenes, researchNotes, worldEvents]);
    
    const { results: workerResults, search } = useSearchWorker(
        searchableDataForWorker,
        ['label', 'keywords', 'name', 'description', 'details', 'title', 'content']
    );
    
    useEffect(() => {
        search(debouncedSearchTerm);
    }, [debouncedSearchTerm, search]);
    
    const actionMap = useMemo(() => new Map(actions.map(a => [a.id, a])), [actions]);

    const searchResults = useMemo((): SearchResult[] => {
        if (!debouncedSearchTerm) {
            return actions
                .sort((a, b) => a.category.localeCompare(b.category) || a.label.localeCompare(b.label))
                .map(action => ({ type: 'action', item: action }));
        }

        return (workerResults as any[]).map((item: any) => {
            switch (item._type) {
                case 'action': {
                    const fullAction = actionMap.get(item.id);
                    return fullAction ? { type: 'action', item: fullAction } : null;
                }
                case 'entity':
                    return { type: 'entity', item: entities[item.id]! };
                case 'work':
                    return { type: 'work', item: works[item.id]! };
                case 'scene': {
                    const plot = (getTypedObjectValues(works) as Work[]).find(w => w.sceneIds.includes(item.id) || w.chapters.some(c => c.sceneIds.includes(item.id)));
                    if (!plot) return null;
                    return { type: 'scene', item: scenes[item.id]!, plot };
                }
                case 'note':
                    return { type: 'note', item: researchNotes[item.id]! };
                case 'worldEvent':
                    return { type: 'worldEvent', item: worldEvents[item.id]! };
                default:
                    return null;
            }
        }).filter((item): item is SearchResult => !!item);

    }, [debouncedSearchTerm, actions, workerResults, actionMap, entities, works, scenes, researchNotes, worldEvents]);

    useEffect(() => {
        setActiveIndex(0);
    }, [searchResults]);

    useEffect(() => {
        if (isOpen && listboxRef.current && activeIndex >= 0) {
            const activeElement = listboxRef.current.children[activeIndex] as HTMLLIElement;
            if (activeElement) {
                activeElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [activeIndex, isOpen]);

    const handleSelect = (index: number) => {
        const result = searchResults[index];
        if (!result) return;
        
        switch (result.type) {
            case 'action':
                result.item.execute();
                break;
            case 'entity':
                navigateToEntity(result.item.id);
                break;
            case 'work':
                 navigateToWork(result.item.id);
                break;
            case 'scene':
                 navigateToScene(result.plot.id, result.item.id);
                break;
            case 'note':
                navigateToNote(result.item.id);
                break;
            case 'worldEvent':
                navigateToWorldEvent(result.item.id);
                break;
        }
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (searchResults.length === 0) return;
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev + 1) % searchResults.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            handleSelect(activeIndex);
        }
    };

    const result = searchResults[activeIndex];
    const activeDescendantId = result?.item ? `${result.type}-${(result.item as { id: string }).id}` : undefined;


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('commandPalette.title')} size="md">
            <div className="flex flex-col h-[60vh]">
                <div className="relative mb-2">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <Input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t('commandPalette.searchPlaceholder')}
                        className="pl-10"
                        role="combobox"
                        aria-expanded={searchResults.length > 0}
                        aria-controls={listboxId}
                        aria-autocomplete="list"
                        aria-activedescendant={activeDescendantId}
                        aria-label={t('commandPalette.searchPlaceholder')}
                    />
                </div>
                <div className="flex-grow overflow-y-auto mt-2 pr-1">
                    {searchResults.length > 0 ? (
                        <ul id={listboxId} role="listbox" ref={listboxRef}>
                            {searchResults.map((result, index) => (
                                <li 
                                    key={`${result.type}-${(result.item as { id: string }).id}`}
                                    id={`${result.type}-${(result.item as { id: string }).id}`}
                                    role="option"
                                    aria-selected={activeIndex === index}
                                    onClick={() => handleSelect(index)}
                                    className={`w-full text-left p-3 flex items-center rounded-md transition-colors cursor-pointer ${activeIndex === index ? 'bg-accent text-white' : 'hover:bg-secondary'}`}
                                >
                                    {getResultIcon(result)}
                                    <div>
                                        <p className="font-semibold">
                                            {result.type === 'action' ? result.item.label : ('name' in result.item ? result.item.name : ('title' in result.item ? result.item.title : ''))}
                                        </p>
                                        <p className={`text-xs capitalize ${activeIndex === index ? 'text-white/80' : 'text-text-secondary'}`}>
                                            {result.type === 'scene' ? `${result.plot.title} / Scene` : (result.type === 'action' ? result.item.category : result.type)}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : debouncedSearchTerm ? (
                        <p className="text-center text-text-secondary p-8">{t('commandPalette.noResults', { searchTerm: debouncedSearchTerm })}</p>
                    ) : (
                        <p className="text-center text-text-secondary p-8">{t('commandPalette.searchHint')}</p>
                    )}
                </div>
                 <div className="text-xs text-text-secondary mt-2 pt-2 border-t border-border-color">
                    {t('commandPalette.keyboardHint')}
                </div>
            </div>
        </Modal>
    );
};

export default CommandPalette;
