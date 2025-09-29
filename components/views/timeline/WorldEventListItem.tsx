import React, { memo, useCallback } from 'react';
import { WorldEvent, EntityId, CustomCalendar, Entity, Tag } from '../../../types';
import { EditIcon, TrashIcon, LinkIcon } from '../../common/Icons';
import TextWithReferences from '../../common/TextWithReferences';
import { formatWorldDate } from '../../../utils';
import EntityAssociations from '../detail/EntityAssociations';
import { useAppSelector } from '../../../state/hooks';

interface WorldEventListItemProps {
    event: WorldEvent;
    entityNameMap: Map<EntityId, string>;
    isHighlighted: boolean;
    onEdit: (eventId: string) => void;
    onDelete: (eventId: string) => void;
    onUpdateTags: (eventId: string, newTagIds: string[]) => void;
    setEventRef: (el: HTMLDivElement | null) => void;
    onNavigate: (id: EntityId) => void;
    allTags: Tag[];
    tagMap: Map<string, Tag>;
    onCreateTag: (name: string) => Tag | undefined;
}

const WorldEventListItem: React.FC<WorldEventListItemProps> = memo(({
    event,
    entityNameMap,
    isHighlighted,
    onEdit,
    onDelete,
    onUpdateTags,
    setEventRef,
    onNavigate,
    allTags,
    tagMap,
    onCreateTag
}) => {
  const { calendar } = useAppSelector(state => state.bible.present.project);
  
  const formatDate = (isoString: string) => {
    if (!isoString) return '';
    return formatWorldDate(isoString, calendar);
  };

  const onSelectEntity = useCallback((entityId: EntityId) => {
      onNavigate(entityId);
  }, [onNavigate]);

  const handleCreateAndAddTag = useCallback((name: string) => {
    const newTag = onCreateTag(name);
    if (newTag) {
        onUpdateTags(event.id, [...(event.tagIds || []), newTag.id]);
    }
  }, [onCreateTag, event.id, event.tagIds, onUpdateTags]);

  return (
    <div
      ref={setEventRef}
      className={`p-4 rounded-lg border border-border-color transition-all duration-500 ${isHighlighted ? 'animate-pulse-highlight bg-secondary' : 'bg-secondary'}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="font-bold text-lg text-text-main">{event.title}</h4>
            {event.category && (
              <span className="text-xs bg-primary text-text-secondary px-2 py-0.5 rounded-full font-mono">{event.category}</span>
            )}
          </div>
          <p className="text-sm text-text-secondary">{formatDate(event.dateTime)}</p>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
          <button onClick={() => onEdit(event.id)} className="p-2 text-text-secondary hover:text-accent rounded-full hover:bg-border-color transition-colors" aria-label="Edit world event" title="Edit world event">
            <EditIcon className="w-5 h-5" />
          </button>
          <button onClick={() => onDelete(event.id)} className="p-2 text-text-secondary hover:text-red-500 rounded-full hover:bg-border-color transition-colors" aria-label="Delete world event" title="Delete world event">
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      <TextWithReferences text={event.content} onNavigate={onNavigate} className="mt-3 text-text-secondary whitespace-pre-wrap" />
      {(event.entities && event.entities.length > 0) && (
        <div className="mt-3 pt-3 border-t border-border-color">
          <h5 className="text-sm font-semibold text-text-secondary mb-2">Related Entities:</h5>
          <div className="flex flex-wrap gap-2">
            {event.entities.map(entityId => (
              <button
                key={entityId}
                onClick={() => onSelectEntity(entityId)}
                className="flex items-center text-xs bg-primary text-text-secondary px-2 py-1 rounded-full hover:bg-highlight hover:text-white transition-colors"
              >
                <LinkIcon className="w-4 h-4 mr-1.5" />
                <span className="font-semibold text-text-main">{entityNameMap.get(entityId) ?? 'Unknown Entity'}</span>
              </button>
            ))}
          </div>
        </div>
      )}
       <div className="mt-3 pt-3 border-t border-border-color">
          <EntityAssociations
                label="Tags"
                itemTypeName="Tag"
                allItems={allTags.map(tag => ({ id: tag.id, name: tag.label }))}
                selectedIds={event.tagIds}
                onUpdate={(newTagIds) => onUpdateTags(event.id, newTagIds)}
                chipColorClass="bg-gray-500/20 text-gray-300"
                onCreateNew={handleCreateAndAddTag}
                tagMap={tagMap}
            />
      </div>
    </div>
  );
});
WorldEventListItem.displayName = 'WorldEventListItem';
export default WorldEventListItem;
