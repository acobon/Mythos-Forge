// components/modals/LinkEntityModal.tsx
import React, { useState, useMemo } from 'react';
import { useAppSelector } from '../../state/hooks';
import { Entity, EntityId } from '../../types';
import { getTypedObjectValues } from '../../utils';
import { useDebounce } from '../../hooks/useDebounce';
import { Input, Button } from '../common/ui';
import { SearchIcon } from '../common/Icons';

interface LinkEntityModalProps {
    onSelect: (entityId: EntityId) => void;
    onClose: () => void;
}

const LinkEntityModal: React.FC<LinkEntityModalProps> = ({ onSelect, onClose }) => {
    const { entities } = useAppSelector(state => state.bible.present.entities);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 250);

    const filteredEntities = useMemo(() => {
        const allEntities = getTypedObjectValues(entities) as Entity[];
        if (!debouncedSearchTerm) return allEntities.slice(0, 100); // Limit initial display
        const lowerQuery = debouncedSearchTerm.toLowerCase();
        return allEntities.filter(e => e.name.toLowerCase().includes(lowerQuery));
    }, [entities, debouncedSearchTerm]);

    const handleSelect = (entityId: EntityId) => {
        onSelect(entityId);
        onClose();
    };

    return (
        <div className="h-[60vh] flex flex-col">
            <div className="relative mb-2 flex-shrink-0">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <Input
                    type="search"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search for an entity to link..."
                    className="pl-10"
                    autoFocus
                />
            </div>
            <div className="flex-grow overflow-y-auto mt-2 pr-1 space-y-1">
                {filteredEntities.map(entity => (
                    <button
                        key={entity.id}
                        onClick={() => handleSelect(entity.id)}
                        className="w-full text-left p-2 rounded-md hover:bg-secondary"
                    >
                        <p className="font-semibold">{entity.name}</p>
                        <p className="text-xs text-text-secondary capitalize">{entity.type}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default LinkEntityModal;
