
// components/views/timeline/WorldEventList.tsx
import React, { useCallback } from 'react';
import { WorldEvent, Entity, Tag, EntityId } from '../../../types/index';
import WorldEventListItem from './WorldEventListItem';
import EmptyState from '../../common/EmptyState';
import { ClockIcon } from '../../common/Icons';

interface WorldEventListProps {
    events: WorldEvent[];
    entityMap: Map<EntityId, Entity>;
    tagMap: Map<string, Tag>;
    allTags: Tag[];
    highlightedEventId: string | null;
    setEventRef: (id: string, element: HTMLElement | null) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdateTags: (eventId: string, newTagIds: string[]) => void;
    onCreateTag: (name: string) => Tag | undefined;
    onNavigate: (id: EntityId) => void;
    emptyStateTitle: string;
    emptyStateDescription: string;
}

const WorldEventList: React.FC<WorldEventListProps> = (props) => {
    const {
        events, entityMap, tagMap, allTags, highlightedEventId, setEventRef,
        onEdit, onDelete, onUpdateTags, onCreateTag, onNavigate,
        emptyStateTitle, emptyStateDescription
    } = props;
    
    const entityNameMap = new Map<string, string>(Array.from(entityMap.values()).map((e: Entity) => [e.id, e.name]));

    const handleEdit = useCallback((id: string) => onEdit(id), [onEdit]);
    const handleDelete = useCallback((id: string) => onDelete(id), [onDelete]);

    return (
        <div className="mt-8 flex-grow overflow-y-auto pr-2">
            <h3 className="text-2xl font-bold text-text-main mb-4">Event Details</h3>
            {events.length > 0 ? (
                <div className="space-y-4">
                    {events.map(event => (
                        <WorldEventListItem
                            key={event.id}
                            event={event}
                            entityNameMap={entityNameMap}
                            isHighlighted={highlightedEventId === event.id}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            onUpdateTags={onUpdateTags}
                            setEventRef={(el) => setEventRef(event.id, el)}
                            onNavigate={onNavigate}
                            allTags={allTags}
                            tagMap={tagMap}
                            onCreateTag={onCreateTag}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={<ClockIcon className="w-16 h-16" />}
                    title={emptyStateTitle}
                    description={emptyStateDescription}
                />
            )}
        </div>
    );
};

export default WorldEventList;
