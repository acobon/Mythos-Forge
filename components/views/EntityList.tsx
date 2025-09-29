
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Entity, EntityId, EntityTypeDefinition } from '../../types/index';
import { SearchIcon } from '../common/Icons';
import { ENTITY_LIST_ITEM_HEIGHT } from '../../constants';
import { useDebounce } from '../../hooks/useDebounce';
import EntityListItem from './entity/EntityListItem';
import { useI18n } from '../../hooks/useI18n';
import { VariableSizeList } from 'react-window';
import { useSearchWorker } from '../../hooks/useSearchWorker';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { getTypedObjectValues } from '../../utils';
import { setSelectedId } from '../../state/uiSlice';

const EntityList: React.FC<{
    onAdd: (type: string) => void;
}> = ({ onAdd }) => {
    const dispatch = useAppDispatch();
    const { entities, entityTypes } = useAppSelector(state => state.bible.present.entities);
    const selectedId = useAppSelector(state => state.ui.selectedId);
    const { t } = useI18n();
    
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 250);
    const listRef = useRef<VariableSizeList | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [listSize, setListSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                setListSize({ width, height });
            }
        });
        const container = containerRef.current;
        if (container) {
            resizeObserver.observe(container);
        }
        return () => {
            if (container) {
                resizeObserver.unobserve(container);
            }
        };
    }, []);

    const entitiesForWorker = useMemo(() => {
        return getTypedObjectValues(entities) as Entity[];
    }, [entities]);

    const { results: searchResults, search } = useSearchWorker<Entity>(entitiesForWorker, ['name', 'description', 'details']);
    useEffect(() => {
        search(debouncedSearchTerm);
    }, [debouncedSearchTerm, search]);
    
    useEffect(() => {
        listRef.current?.scrollTo(0);
    }, [debouncedSearchTerm]);

    const entitiesByType = useMemo(() => {
        const map = new Map<string, Entity[]>();
        entityTypes.forEach(type => map.set(type.key, []));
        for (const entity of searchResults as Entity[]) {
            map.get(entity.type)?.push(entity);
        }
        map.forEach(list => list.sort((a, b) => a.name.localeCompare(b.name)));
        return map;
    }, [searchResults, entityTypes]);

    const listItems = useMemo(() => {
        const items: any[] = [];
        for (const entityType of entityTypes) {
            items.push({ type: 'header', entityType });
            const entities = entitiesByType.get(entityType.key) || [];
            if (entities.length > 0) {
                entities.forEach(entity => items.push({ type: 'entity', entity }));
            } else {
                items.push({ type: 'placeholder', entityType, placeholderText: debouncedSearchTerm ? t('entityList.noMatch', { entityType: entityType.name }) : t('entityList.noEntitiesYet', { entityType: entityType.name }) });
            }
        }
        return items;
    }, [entitiesByType, entityTypes, debouncedSearchTerm, t]);

    useEffect(() => {
        if (selectedId && listRef.current) {
            const index = listItems.findIndex(item => item.type === 'entity' && item.entity.id === selectedId);
            if (index !== -1) {
                listRef.current.scrollToItem(index, 'smart');
            }
        }
    }, [selectedId, listItems]);

    const Row = useCallback(({ index, style }: { index: number, style: React.CSSProperties }) => {
        const item = listItems[index];
        return (
            <div style={style}>
                <EntityListItem
                    item={item}
                    isSelected={item.type === 'entity' && item.entity.id === selectedId}
                    onSelect={(id: EntityId) => dispatch(setSelectedId(id))}
                    onAdd={onAdd}
                />
            </div>
        );
    }, [listItems, selectedId, onAdd, dispatch]);

    const getItemSize = (index: number) => {
        const item = listItems[index];
        return item.type === 'header' ? 48 : ENTITY_LIST_ITEM_HEIGHT;
    };

    return (
        <div className="flex flex-col h-full">
            <div className="relative mb-4 flex-shrink-0">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon className="h-5 w-5 text-text-secondary" />
                </div>
                <input
                    type="search"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder={t('entityList.searchPlaceholder')}
                    aria-label={t('entityList.searchPlaceholder')}
                    className="w-full bg-secondary border border-border-color rounded-md py-2 pl-10 pr-4"
                />
            </div>
            <div className="flex-grow" ref={containerRef}>
                {listSize.height > 0 && (
                    <VariableSizeList
                        ref={listRef}
                        height={listSize.height}
                        itemCount={listItems.length}
                        itemSize={getItemSize}
                        width={listSize.width}
                    >
                        {Row}
                    </VariableSizeList>
                )}
            </div>
        </div>
    );
};
export default EntityList;
