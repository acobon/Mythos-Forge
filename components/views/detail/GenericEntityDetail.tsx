






import React, { useMemo, useEffect } from 'react';
import { Entity, WorldEvent, Tag, ModalType, RelationshipListItem, HistoricalEvent, EntityId } from '../../../types';
import TimelineChart from '../../common/TimelineChart';
import { stripReferences, generateTagColor, getTypedObjectValues } from '../../../utils';
import { useEventHighlighter } from '../../../hooks/useEventHighlighter';
import { useEntityEvents } from '../../../hooks/useEntityEvents';
import { selectEventsByEntityId, selectAllRelationships } from '../../../state/selectors';
import { useI18n } from '../../../hooks/useI18n';
import { useDebouncedEntitySave } from '../../../hooks/useDebouncedEntitySave';
import { useTagActions } from '../../../hooks/useTagActions';
import { useEntityActions } from '../../../hooks/useEntityActions';
import { BookOpenIcon } from '../../common/Icons';
import { useNavigation } from '../../../hooks/useNavigation';
import { useAppSelector, useAppDispatch } from '../../../state/hooks';
import { openValidationModal, pushModal } from '../../../state/uiSlice';

import EntityHeaderAndDescription from './EntityHeaderAndDescription';
import EntityEventsSection from './EntityEventsSection';
import EntityRelationships from './EntityRelationships';
import DangerZone from './DangerZone';
import EntityAttributes from './EntityAttributes';
import EntityAssociations from './EntityAssociations';
import EntityAppearances from './EntityAppearances';
import EntityResearchSection from './EntityResearchSection';

interface GenericEntityDetailRenderProps<T extends Entity> {
  draft: T;
  updateDraft: (field: string, value: any) => void;
  highlightElement: (id: string) => void;
}

interface GenericEntityDetailProps<T extends Entity> {
  entity: T;
  children?: (renderProps: GenericEntityDetailRenderProps<T>) => React.ReactNode;
}

const GenericEntityDetail = <T extends Entity>({ entity, children }: GenericEntityDetailProps<T>) => {
  const storyBible = useAppSelector(state => state.bible.present);
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const { createTag } = useTagActions();
  const { deleteEntity, updateEntity } = useEntityActions();
  const { navigateToEntity } = useNavigation();
  const eventsByEntityId = useAppSelector(selectEventsByEntityId) as Map<EntityId, HistoricalEvent[]>;
  const allRelationships = useAppSelector(selectAllRelationships) as RelationshipListItem[];
  const { validationIssues, navigationState } = useAppSelector(state => state.ui);
  const { worldEvents } = storyBible.events;
  const { tags } = storyBible.metadata;
  const tagMap = new Map((getTypedObjectValues(tags) as Tag[]).map((t: Tag) => [t.id, t]));

  const { draft, updateDraft, saveStatus, flush } = useDebouncedEntitySave({
    entity,
    onUpdate: updateEntity,
  });

  // Effect to flush any pending changes when the component unmounts or the selected entity changes.
  useEffect(() => {
    return () => {
      flush();
    };
  }, [flush, entity.id]);


  const { highlightedEventId, setEventRef, highlightElement } = useEventHighlighter();
  const { getEventLabel } = useEntityEvents(entity.type);

  const entityEvents = useMemo(() =>
    eventsByEntityId.get(entity.id) || []
    , [eventsByEntityId, entity.id]);

  const timelineEvents = useMemo<WorldEvent[]>(() => {
    return entityEvents.map(event => {
      const description = event.description || '';
      const shortDesc = description.substring(0, 30);
      const title = `${getEventLabel(event.type)}: ${shortDesc}${description.length > 30 ? '...' : ''}`;

      return {
        id: event.id,
        title,
        content: stripReferences(description),
        dateTime: event.startDateTime,
        entities: event.involvedEntities.map(l => l.entityId),
      };
    });
  }, [entityEvents, getEventLabel]);


  const handleBackToReport = () => {
    dispatch(openValidationModal(validationIssues));
  };

  const handleCreateTag = (name: string) => {
    const newColor = generateTagColor((getTypedObjectValues(tags) as Tag[]).length);
    const newTag = createTag(name, newColor);
    if (newTag) {
        updateDraft('tagIds', [...(draft.tagIds || []), newTag.id]);
    }
  };
  
  const handleDelete = () => {
    dispatch(pushModal({
            type: ModalType.DELETE_ENTITY,
            props: {
                itemName: entity.name,
                onConfirm: () => deleteEntity(entity.id),
                title: t('entityDetail.dangerZone.dialog.title'),
                message: t('entityDetail.dangerZone.dialog.message'),
            }
        }
    ));
};

  return (
    <div className="animate-fade-in space-y-6 printable-content">
      {navigationState?.source === 'validation' && (
        <div className="bg-blue-900/50 border border-blue-500 text-sm p-3 rounded-md mb-2 flex items-center justify-between animate-fade-in no-print">
          <p>{t('validationModal.viewingToResolve')}</p>
          <button onClick={handleBackToReport} className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-semibold text-xs">
            {t('validationModal.backToReport')}
          </button>
        </div>
      )}
      
        <div className="flex justify-between items-start">
            <EntityHeaderAndDescription<T> 
              entity={entity} 
              draft={draft} 
              updateDraft={updateDraft} 
              saveStatus={saveStatus} 
            />
            <button onClick={() => window.print()} className="p-2 text-text-secondary hover:text-accent no-print" title={t('genericDetail.print')} aria-label={t('genericDetail.print')}>
                <BookOpenIcon className="w-5 h-5"/>
            </button>
        </div>
        
        <details open>
            <summary className="text-xl font-semibold mb-2 cursor-pointer">{t('entityDetail.tags.title')}</summary>
            <EntityAssociations
                label=""
                itemTypeName={t('common.tag')}
                allItems={(getTypedObjectValues(tags) as Tag[]).map((tag: Tag) => ({ id: tag.id, name: tag.label }))}
                selectedIds={draft.tagIds}
                onUpdate={(newTagIds) => updateDraft('tagIds', newTagIds)}
                chipColorClass="bg-gray-500/20 text-gray-300"
                onCreateNew={handleCreateTag}
                tagMap={tagMap}
            />
        </details>
        
        <details open>
            <summary className="text-xl font-semibold mb-2 cursor-pointer">{t('entityDetail.attributes.title')}</summary>
            <EntityAttributes<T> entity={entity} draft={draft} updateDraft={updateDraft} />
        </details>
        
        {children && children({ draft, updateDraft, highlightElement })}
        
        <details open>
            <EntityEventsSection
                entity={entity}
                entityEvents={entityEvents}
                highlightedEventId={highlightedEventId}
                setEventRef={setEventRef}
                onNavigate={navigateToEntity}
            />
        </details>

        <details open>
            <summary className="text-xl font-semibold mb-2 cursor-pointer">{t('entityDetail.relationships.title')}</summary>
            <EntityRelationships entity={entity} relationships={allRelationships} onSelectEntity={navigateToEntity} />
        </details>
        
        <EntityAppearances entity={entity} />
        
        <EntityResearchSection entity={entity} />
        
        <details open>
            <summary className="text-xl font-semibold mb-2 cursor-pointer">{t('genericDetail.timeline.entity', { entityName: entity.name })}</summary>
            <TimelineChart onEventClick={highlightElement} events={timelineEvents} title="" />
        </details>
        
        {worldEvents && Object.keys(worldEvents).length > 0 ? (
          <details open className="mt-8">
            <summary className="text-xl font-semibold mb-2 cursor-pointer">{t('genericDetail.timeline.world')}</summary>
            <TimelineChart events={Object.values(worldEvents)} title="" />
          </details>
        ) : null}

        <details open>
            <summary className="text-xl font-semibold mb-2 cursor-pointer text-red-400">{t('entityDetail.dangerZone.title')}</summary>
            <DangerZone
                title=""
                description={t('entityDetail.dangerZone.delete.subtitle', { entityType: entity.type })}
                actionButtonText={t('entityDetail.dangerZone.delete', { entityType: entity.type })}
                onAction={handleDelete}
            />
        </details>
    </div>
  );
};

export default GenericEntityDetail;
