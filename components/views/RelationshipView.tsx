






import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useRelationshipActions } from '../../hooks/useRelationshipActions';
import { Entity, EntityId, GraphEdge, GraphNode, Relationship, EntityType, RelationshipListItem, RelationshipStatus } from '../../types/index';
import RelationshipGraph from '../RelationshipGraph';
import { Modal } from '../common/ui';
import RelationshipForm from '../forms/RelationshipForm';
import { PlusCircleIcon, SearchIcon, EditIcon, TrashIcon, LinkIcon, FilterIcon } from '../common/Icons';
import { useDebounce } from '../../hooks/useDebounce';
import { selectAllRelationships } from '../../state/selectors';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';
import { useNavigation } from '../../hooks/useNavigation';
import EmptyState from '../common/EmptyState';
import { useI18n } from '../../hooks/useI18n';
import { FixedSizeList } from 'react-window';
import { useAppSelector } from '../../state/hooks';
import { Input, Button } from '../common/ui';

const RELATIONSHIP_ITEM_HEIGHT = 56;

const GraphToolbar: React.FC<{
    relationshipTypes: string[];
    activeTypes: Set<string>;
    onToggleType: (type: string) => void;
    onSelectAllTypes: () => void;
    t: (key: string) => string;
}> = ({ relationshipTypes, activeTypes, onToggleType, onSelectAllTypes, t }) => (
    <div className="absolute top-4 left-4 z-10 bg-secondary/80 backdrop-blur-sm p-2 rounded-lg border border-border-color shadow-lg max-w-sm">
        <details>
            <summary className="font-semibold text-sm cursor-pointer flex items-center gap-2">
                <FilterIcon className="w-4 h-4" /> {t('relationship.filterByType')}
            </summary>
            <div className="flex flex-wrap gap-1 pt-2">
                <Button onClick={onSelectAllTypes} variant={activeTypes.size === 0 ? 'primary' : 'secondary'} size="sm">All</Button>
                {relationshipTypes.map(type => (
                    <Button key={type} onClick={() => onToggleType(type)} variant={activeTypes.has(type) ? 'primary' : 'secondary'} size="sm">{type}</Button>
                ))}
            </div>
        </details>
    </div>
);


const RelationshipView: React.FC = () => {
    const { present: storyBible } = useAppSelector(state => state.bible);
    const { navigateToEntity } = useNavigation();
    const { t } = useI18n();
    const allRelationships = useAppSelector(selectAllRelationships) as RelationshipListItem[];
    const { relationshipTypes } = storyBible.knowledge;
    const { events } = storyBible.events;
    const { saveRelationship, deleteRelationship } = useRelationshipActions();
    const showConfirm = useConfirmationDialog();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRelationship, setEditingRelationship] = useState<Relationship | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 250);
    const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set());
    const [highlightedRelId, setHighlightedRelId] = useState<string | null>(null);

    const listContainerRef = useRef<HTMLDivElement>(null);
    const [listDimensions, setListDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const container = listContainerRef.current;
        if (!container) return;
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                setListDimensions({ width, height });
            }
        });
        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, []);

    const filteredRelationships = useMemo(() => {
        const baseList = allRelationships.filter(rel => {
            const query = debouncedSearchTerm.trim().toLowerCase();
            if (!query) return true;
            return rel.entity1.name.toLowerCase().includes(query) ||
                   rel.entity2.name.toLowerCase().includes(query) ||
                   rel.label.toLowerCase().includes(query);
        });

        if (activeTypes.size === 0) {
            return baseList;
        }

        return baseList.filter(rel => {
            if (!rel.isExplicit) return false;
            const latestStatus = rel.relationship.statuses[rel.relationship.statuses.length - 1];
            return latestStatus && activeTypes.has(latestStatus.type);
        });
    }, [allRelationships, debouncedSearchTerm, activeTypes]);

    const { nodes, edges } = useMemo(() => {
        const nodeMap = new Map<EntityId, GraphNode>();
        filteredRelationships.forEach(rel => {
            [rel.entity1, rel.entity2].forEach(entity => {
                if (!nodeMap.has(entity.id)) {
                    nodeMap.set(entity.id, {
                        id: entity.id,
                        label: entity.name,
                        type: entity.type,
                        // Let the simulation handle initial positions
                        x: 0, 
                        y: 0,
                    });
                }
            });
        });

        const edges: GraphEdge[] = filteredRelationships.map(rel => ({
            source: rel.entity1.id,
            target: rel.entity2.id,
            label: rel.label,
            isExplicit: rel.isExplicit,
        }));

        return { nodes: Array.from(nodeMap.values()), edges };
    }, [filteredRelationships]);

    const highlightedConnection = useMemo(() => {
        if (!highlightedRelId) return null;
        const rel = filteredRelationships.find(r => r.id === highlightedRelId);
        return rel ? { source: rel.entity1.id, target: rel.entity2.id } : null;
    }, [highlightedRelId, filteredRelationships]);


    const handleOpenModal = (rel: Relationship | null = null) => {
        setEditingRelationship(rel);
        setIsModalOpen(true);
    };

    const handleSave = (data: { id?: string; entityIds: [EntityId, EntityId]; statuses: RelationshipStatus[] }) => {
        saveRelationship(data);
        setIsModalOpen(false);
    };

    const handleDelete = useCallback((id: string) => {
        showConfirm({ 
            title: t('relationship.delete.title'),
            message: t('relationship.delete.message'),
            onConfirm: () => deleteRelationship(id),
        });
    }, [showConfirm, t, deleteRelationship]);

    const handleNodeClick = (node: GraphNode) => {
        navigateToEntity(node.id);
    };

    const handleToggleType = (type: string) => {
        setActiveTypes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(type)) {
                newSet.delete(type);
            } else {
                newSet.add(type);
            }
            return newSet;
        });
    };

    const handleSelectAllTypes = () => {
        setActiveTypes(new Set());
    };
    
    const Row = React.memo(({ index, style }: { index: number; style: React.CSSProperties }) => {
        const rel = filteredRelationships[index];
        if (!rel) return null;
        const latestStatus = rel.isExplicit ? rel.relationship.statuses[rel.relationship.statuses.length - 1] : null;
        const eventLink = latestStatus?.startEventId ? events[latestStatus.startEventId] : null;

        const relationshipLabel = `${rel.entity1.name} & ${rel.entity2.name}`;
        const editLabel = t('relationship.edit', { name1: rel.entity1.name, name2: rel.entity2.name });
        const deleteLabel = t('relationship.delete', { name1: rel.entity1.name, name2: rel.entity2.name });

        return (
             <div style={style} onMouseEnter={() => setHighlightedRelId(rel.id)} onMouseLeave={() => setHighlightedRelId(null)}>
                 <div key={rel.id} className="p-2 rounded-md hover:bg-secondary group h-full flex items-center">
                    <div className="flex justify-between items-center w-full">
                        <div>
                            <p className="font-semibold">{relationshipLabel}</p>
                            <p className="text-sm text-text-secondary capitalize">{rel.label}</p>
                        </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {eventLink && (
                                <Button variant="ghost" size="icon" onClick={() => navigateToEntity(eventLink.involvedEntities[0].entityId, { highlightEventId: eventLink.id })} title={`Linked to event: ${eventLink.description}`}>
                                    <LinkIcon className="w-4 h-4" />
                                </Button>
                            )}
                            {rel.isExplicit && (
                                <>
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(rel.relationship)} aria-label={editLabel} title={editLabel}><EditIcon className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(rel.id)} aria-label={deleteLabel} title={deleteLabel}><TrashIcon className="w-4 h-4 text-red-500" /></Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
             </div>
        );
    });
    Row.displayName = 'RelationshipRow';


    return (
        <div className="h-full flex flex-col md:flex-row">
            <aside className="w-full md:w-1/3 p-4 border-r border-border-color flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-2xl font-bold">{t('sidebar.relationships')}</h2>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal()} aria-label={t('relationship.add')} title={t('relationship.add')}><PlusCircleIcon className="w-6 h-6"/></Button>
                </div>
                 <div className="relative mb-2 flex-shrink-0">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <Input 
                        type="search" 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search relationships..." 
                        className="pl-10"
                    />
                </div>
                
                <div className="flex-grow min-h-0" ref={listContainerRef}>
                   {filteredRelationships.length > 0 ? (
                        <FixedSizeList
                            height={listDimensions.height}
                            itemCount={filteredRelationships.length}
                            itemSize={RELATIONSHIP_ITEM_HEIGHT}
                            width={listDimensions.width}
                        >
                            {Row}
                        </FixedSizeList>
                   ) : (
                        <div className="h-full flex items-center justify-center text-center">
                            <div>
                                <LinkIcon className="w-12 h-12 mx-auto text-text-secondary/50 mb-2"/>
                                <h4 className="font-semibold">{debouncedSearchTerm ? t('relationship.empty.noMatch') : t('relationship.empty.title')}</h4>
                                <p className="text-sm text-text-secondary">{debouncedSearchTerm ? t('relationship.empty.noMatch.subtitle') : t('relationship.empty.subtitle')}</p>
                            </div>
                        </div>
                   )}
                </div>

                 <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRelationship ? t('relationship.edit.title') : t('relationship.create.title')} size="md">
                    <RelationshipForm 
                        onSave={handleSave} 
                        onClose={() => setIsModalOpen(false)} 
                        relationshipToEdit={editingRelationship} 
                    />
                </Modal>
            </aside>
            <main className="w-full md:w-2/3 relative">
                 <GraphToolbar 
                    relationshipTypes={relationshipTypes}
                    activeTypes={activeTypes}
                    onToggleType={handleToggleType}
                    onSelectAllTypes={handleSelectAllTypes}
                    t={t}
                 />
                 <RelationshipGraph nodes={nodes} edges={edges} onNodeClick={handleNodeClick} highlightedConnection={highlightedConnection} />
            </main>
        </div>
    );
};

export default RelationshipView;
