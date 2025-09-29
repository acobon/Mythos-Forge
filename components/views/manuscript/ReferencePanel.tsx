// components/views/manuscript/ReferencePanel.tsx
import React, { useState, useMemo } from 'react';
import { EntityId, Entity } from '../../../types';
import { useAppDispatch, useAppSelector } from '../../../state/hooks';
import { setReferencePanelId } from '../../../state/uiSlice';
import { useDebounce } from '../../../hooks/useDebounce';
import { EntityDetailDispatcher } from '../detail/EntityDetailDispatcher';
import { SearchIcon } from '../../common/Icons';
import { selectEntityMap } from '../../../state/selectors';
import { getTypedObjectValues } from '../../../utils';

const ReferencePanel: React.FC = () => {
    const dispatch = useAppDispatch();
    const { referencePanelEntityId } = useAppSelector(state => state.ui);
    const { entities } = useAppSelector(state => state.bible.present.entities);
    const entityMap = useAppSelector(selectEntityMap) as Map<EntityId, Entity>;
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 250);

    const entitiesArray = useMemo(() => getTypedObjectValues(entities) as Entity[], [entities]);

    const filteredEntities = useMemo<Entity[]>(() => {
        if (!debouncedSearchTerm) return [];
        const lowerQuery = debouncedSearchTerm.toLowerCase();
        return entitiesArray.filter(e => e.name.toLowerCase().includes(lowerQuery));
    }, [debouncedSearchTerm, entitiesArray]);

    const selectedEntity = useMemo(() => {
        return referencePanelEntityId ? entityMap.get(referencePanelEntityId) : undefined;
    }, [referencePanelEntityId, entityMap]);

    const selectEntity = (id: EntityId) => {
        dispatch(setReferencePanelId(id));
        setSearchTerm('');
    };

    return (
        <div className="h-full flex flex-col p-4 border-l border-border-color bg-secondary">
            <div className="relative mb-4 flex-shrink-0">
                 <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon className="h-4 w-4 text-text-secondary" />
                </div>
                <input 
                    type="search"
                    placeholder="Search entities..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-primary border border-border-color rounded-md py-1.5 pl-9 pr-4 text-sm focus:ring-accent"
                />
            </div>
            
            {debouncedSearchTerm && (
                <div className="mb-4 flex-shrink-0 bg-primary rounded-md max-h-48 overflow-y-auto">
                    {filteredEntities.map((e: Entity) => (
                        <button key={e.id} onClick={() => selectEntity(e.id)} className="w-full text-left p-2 text-sm hover:bg-border-color rounded-md">
                            {e.name} <span className="text-xs text-text-secondary">({e.type})</span>
                        </button>
                    ))}
                </div>
            )}

            <div className="flex-grow overflow-y-auto pr-2">
                {selectedEntity ? (
                    <EntityDetailDispatcher entity={selectedEntity} />
                ) : (
                    <div className="text-center text-text-secondary pt-10">
                        <p>Search for an entity to view its details here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReferencePanel;