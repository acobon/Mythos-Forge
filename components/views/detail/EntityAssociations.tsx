import React, { useState, useMemo, useEffect } from 'react';
import { PlusCircleIcon, XIcon } from '../../common/Icons';
import { Tag } from '../../../types';
import { useI18n } from '../../../hooks/useI18n';

interface Item {
    id: string;
    name: string;
}

interface AssociationChipProps {
    item: Item;
    onRemove: () => void;
    colorClass: string;
    isTag?: boolean;
    tagColor?: string;
    itemTypeName: string;
}

const AssociationChip: React.FC<AssociationChipProps> = ({ item, onRemove, colorClass, isTag, tagColor, itemTypeName }) => {
    const { t } = useI18n();
    const style = isTag ? { backgroundColor: tagColor } : {};
    const textClass = isTag ? 'text-white' : '';

    return (
        <div className={`flex items-center gap-1.5 text-sm font-medium px-2 py-1 rounded-full ${colorClass}`} style={style}>
            <span className={textClass}>{item.name}</span>
            <button onClick={onRemove} className="rounded-full hover:bg-black/20 p-0.5" aria-label={t('associations.removeWithType', { name: item.name, itemTypeName: itemTypeName })}>
               <XIcon className="w-3 h-3" />
            </button>
        </div>
    );
};


interface EntityAssociationsProps {
    label: string;
    itemTypeName: string;
    allItems: Item[];
    selectedIds: string[] | undefined;
    onUpdate: (newIds: string[]) => void;
    chipColorClass: string;
    onCreateNew?: (name: string) => void;
    tagMap?: Map<string, Tag>;
}

const EntityAssociations: React.FC<EntityAssociationsProps> = ({ label, itemTypeName, allItems, selectedIds, onUpdate, chipColorClass, onCreateNew, tagMap }) => {
    const { t } = useI18n();
    
    const [isAdding, setIsAdding] = useState(false);
    const [filter, setFilter] = useState('');

    const currentItems = useMemo(() => {
        const itemMap = new Map(allItems.map(t => [t.id, t]));
        return (selectedIds || []).map(id => itemMap.get(id)).filter(Boolean) as Item[];
    }, [selectedIds, allItems]);

    const availableItems = useMemo(() => {
        const currentIds = new Set(selectedIds || []);
        const lowerFilter = filter.toLowerCase();
        return allItems
            .filter(t => !currentIds.has(t.id))
            .filter(t => t.name.toLowerCase().includes(lowerFilter));
    }, [allItems, selectedIds, filter]);
    
    const canCreateNew = useMemo(() => {
        if (!onCreateNew) return false;
        const lowerFilter = filter.trim().toLowerCase();
        if (!lowerFilter) return false;
        return !allItems.some(item => item.name.toLowerCase() === lowerFilter);
    }, [filter, allItems, onCreateNew]);

    const handleAddItem = (itemId: string) => {
        const newIds = [...(selectedIds || []), itemId];
        onUpdate(newIds);
    };

    const handleRemoveItem = (itemId: string) => {
        const newIds = (selectedIds || []).filter(id => id !== itemId);
        onUpdate(newIds);
    };
    
    const handleCreateAndAdd = () => {
        if (!canCreateNew || !onCreateNew) return;
        onCreateNew(filter.trim());
        setFilter('');
        setIsAdding(false);
    };

    return (
        <section>
            <h3 className="text-xl font-semibold mb-2">{label}</h3>
            <div className="bg-secondary p-3 rounded-md border border-border-color min-h-[44px]">
                <div className="flex flex-wrap items-center gap-2">
                    {currentItems.map(item => (
                        <AssociationChip 
                            key={item.id} 
                            item={item} 
                            onRemove={() => handleRemoveItem(item.id)} 
                            colorClass={chipColorClass}
                            isTag={itemTypeName === 'Tag'}
                            tagColor={itemTypeName === 'Tag' ? tagMap?.get(item.id)?.color : undefined}
                            itemTypeName={itemTypeName}
                        />
                    ))}

                    <div className="relative">
                        <button onClick={() => setIsAdding(prev => !prev)} className="p-1 rounded-full text-text-secondary hover:bg-border-color hover:text-text-main transition-colors" aria-label={t('associations.add', { itemTypeName })}>
                            <PlusCircleIcon className="w-5 h-5" />
                        </button>
                        {isAdding && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-primary border border-border-color rounded-md shadow-lg z-10 p-2">
                               <input
                                    type="text"
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    placeholder={`Find or create a ${itemTypeName.toLowerCase()}...`}
                                    autoFocus
                                    className="w-full bg-secondary border border-border-color rounded-md px-2 py-1 text-sm mb-2"
                               />
                               <div className="max-h-40 overflow-y-auto">
                                    {canCreateNew && (
                                        <button onClick={handleCreateAndAdd} className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent hover:text-white">
                                            Create <span className="font-bold">"{filter.trim()}"</span>
                                        </button>
                                    )}
                                    {availableItems.map(item => (
                                        <button key={item.id} onClick={() => handleAddItem(item.id)} className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-secondary flex items-center gap-2">
                                            {itemTypeName === 'Tag' && <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: tagMap?.get(item.id)?.color }} />}
                                            <span>{item.name}</span>
                                        </button>
                                    ))}
                               </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default EntityAssociations;
