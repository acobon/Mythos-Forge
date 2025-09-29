import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { WorldEvent, EntityId, Entity, ModalType, Timeline, Tag } from '../../types/index';
import TimelineChart from '../common/TimelineChart';
import { sortScenes, getTypedObjectValues, generateTagColor } from '../../utils';
import { useEventHighlighter } from '../../hooks/useEventHighlighter';
import { useEventActions } from '../../hooks/useEventActions';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';
import { useI18n } from '../../hooks/useI18n';
import { useDebounce } from '../../hooks/useDebounce';
import { useNavigation } from '../../hooks/useNavigation';
import { useSearchWorker } from '../../hooks/useSearchWorker';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { pushModal, popModal, setHighlightEvent } from '../../state/uiSlice';
import { useTagActions } from '../../hooks/useTagActions';
import TimelineFilters from './timeline/TimelineFilters';
import WorldEventList from './timeline/WorldEventList';

const WorldTimelineView: React.FC = () => {
    const dispatch = useAppDispatch();
    const worldEvents = useAppSelector(state => state.bible.present.events.worldEvents);
    const timelines = useAppSelector(state => state.bible.present.events.timelines);
    const allEntities = useAppSelector(state => state.bible.present.entities.entities);
    const tags = useAppSelector(state => state.bible.present.metadata.tags);
    const modalStack = useAppSelector(state => state.ui.modalStack);
    const { t } = useI18n();
    const { deleteWorldEvent, updateWorldEvent, saveWorldEvent, saveTimeline, deleteTimeline } = useEventActions();
    const { createTag } = useTagActions();
    const showConfirm = useConfirmationDialog();
    const { navigateToEntity } = useNavigation();
    
    const timelinesArray = useMemo(() => getTypedObjectValues(timelines) as Timeline[], [timelines]);
    const allTagsArray = useMemo(() => getTypedObjectValues(tags) as Tag[], [tags]);
    const tagMap = useMemo(() => new Map(allTagsArray.map(t => [t.id, t])), [allTagsArray]);

    const [activeTimelineId, setActiveTimelineId] = useState<string>(timelinesArray[0]?.id || 'default-timeline');
    const [selectedTimelineLayers, setSelectedTimelineLayers] = useState<Set<string>>(new Set([activeTimelineId]));
    const [selectedEntityFilters, setSelectedEntityFilters] = useState<Set<EntityId>>(new Set());
    const [selectedTagFilters, setSelectedTagFilters] = useState<Set<string>>(new Set());
    const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
    const [tempMarkerIso, setTempMarkerIso] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const { highlightedEventId, setEventRef } = useEventHighlighter();

    useEffect(() => {
        if (selectedTimelineLayers.size === 0 && timelinesArray.length > 0) {
            setSelectedTimelineLayers(new Set([timelinesArray[0].id]));
        }
        if (!timelines[activeTimelineId] && timelinesArray.length > 0) {
            setActiveTimelineId(timelinesArray[0].id);
        }
    }, [timelines, timelinesArray, selectedTimelineLayers, activeTimelineId]);

    useEffect(() => {
        const isModalOpen = modalStack.some(m => m.type === ModalType.WORLD_EVENT);
        if (!isModalOpen && tempMarkerIso) {
            setTempMarkerIso(null);
        }
    }, [modalStack, tempMarkerIso]);


    const eventsFromLayers = useMemo(() => {
        const eventIdsFromLayers = new Set<string>();
        selectedTimelineLayers.forEach(timelineId => {
            timelines[timelineId]?.eventIds.forEach(eventId => eventIdsFromLayers.add(eventId));
        });
        return Array.from(eventIdsFromLayers).map(id => worldEvents[id]).filter(Boolean);
    }, [worldEvents, timelines, selectedTimelineLayers]);

    const eventsToDisplay = useMemo(() => {
        let filtered = eventsFromLayers;

        if (selectedEntityFilters.size > 0) {
            filtered = filtered.filter(event => event.entities.some(id => selectedEntityFilters.has(id)));
        }
        if (selectedTagFilters.size > 0) {
            filtered = filtered.filter(event => (event.tagIds || []).some(id => selectedTagFilters.has(id)));
        }
        if (dateFilter.start) {
            const startTime = new Date(dateFilter.start).getTime();
            if (!isNaN(startTime)) {
                filtered = filtered.filter(e => new Date(e.dateTime).getTime() >= startTime);
            }
        }
        if (dateFilter.end) {
            const endTime = new Date(dateFilter.end).getTime() + (24 * 60 * 60 * 1000 - 1); // include the whole end day
            if (!isNaN(endTime)) {
                filtered = filtered.filter(e => new Date(e.dateTime).getTime() <= endTime);
            }
        }

        return filtered;
    }, [eventsFromLayers, selectedEntityFilters, selectedTagFilters, dateFilter]);
    
    const { results: searchResults, search } = useSearchWorker<WorldEvent>(eventsToDisplay, ['title', 'content']);
    useEffect(() => { search(debouncedSearchTerm); }, [debouncedSearchTerm, search]);

    const sortedEvents = useMemo(() => [...searchResults].sort(sortScenes), [searchResults]);
    const entityMap = useMemo(() => new Map((getTypedObjectValues(allEntities) as Entity[]).map(e => [e.id, e])), [allEntities]);

    const handleSaveTimeline = (data: Partial<Timeline> & { name: string }) => {
        const saved = saveTimeline(data);
        if (!data.id) { // If it was a new timeline
            setActiveTimelineId(saved.id);
            setSelectedTimelineLayers(prev => new Set([...prev, saved.id]));
        }
        dispatch(popModal());
    };

    const handleDeleteTimeline = useCallback(() => {
        showConfirm({
            title: t('worldTimeline.dialog.deleteTimeline.title'),
            message: t('worldTimeline.dialog.deleteTimeline.message'),
            onConfirm: () => {
                deleteTimeline(activeTimelineId);
                setSelectedTimelineLayers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(activeTimelineId);
                    return newSet;
                });
            }
        });
    }, [activeTimelineId, deleteTimeline, showConfirm, t]);
    
    const handleSaveWorldEvent = useCallback((data: {id?: string; title: string; content: string; dateTime: string; entities: EntityId[]; category?: string;}, timelineId: string) => {
        saveWorldEvent(data, timelineId);
        dispatch(popModal());
    }, [saveWorldEvent, dispatch]);

    const handleAddClick = useCallback(() => dispatch(pushModal({ type: ModalType.WORLD_EVENT, props: { onSave: (data) => handleSaveWorldEvent(data, activeTimelineId), timelineId: activeTimelineId } })), [dispatch, handleSaveWorldEvent, activeTimelineId]);
    const handleEditClick = useCallback((eventId: string) => dispatch(pushModal({ type: ModalType.WORLD_EVENT, props: { eventId, onSave: (data) => handleSaveWorldEvent(data, activeTimelineId), timelineId: activeTimelineId } })), [dispatch, handleSaveWorldEvent, activeTimelineId]);
    const handleDeleteClick = useCallback((eventId: string) => showConfirm({ title: t('worldTimeline.dialog.delete.title'), message: t('worldTimeline.dialog.delete.message'), onConfirm: () => deleteWorldEvent(eventId) }), [showConfirm, t, deleteWorldEvent]);

    const handleCreateTag = useCallback((name: string): Tag | undefined => {
        const newColor = generateTagColor(allTagsArray.length);
        return createTag(name, newColor);
    }, [createTag, allTagsArray.length]);

    const availableEntitiesForFilter = useMemo(() => {
        const entityIds = new Set<EntityId>();
        eventsFromLayers.forEach(event => {
            event.entities.forEach(id => entityIds.add(id));
        });
        return Array.from(entityIds).map(id => allEntities[id]).filter(Boolean).sort((a,b) => a.name.localeCompare(b.name));
    }, [eventsFromLayers, allEntities]);

    const availableTagsForFilter = useMemo(() => {
        const tagIds = new Set<string>();
        eventsFromLayers.forEach(event => {
            (event.tagIds || []).forEach(id => tagIds.add(id));
        });
        return Array.from(tagIds).map(id => tags[id]).filter(Boolean).sort((a,b) => a.label.localeCompare(b.label));
    }, [eventsFromLayers, tags]);

  return (
    <div className="p-4 md:p-8 space-y-6 h-full flex flex-col">
      <header className="flex-shrink-0">
        <h2 className="text-3xl font-bold text-text-main">{t('worldTimeline.title')}</h2>
      </header>
      
      <TimelineFilters
        timelines={timelinesArray}
        activeTimelineId={activeTimelineId}
        onActiveTimelineChange={setActiveTimelineId}
        onAddEvent={handleAddClick}
        onNewTimeline={() => dispatch(pushModal({ type: ModalType.TIMELINE, props: { onSave: handleSaveTimeline } }))}
        onEditTimeline={() => dispatch(pushModal({ type: ModalType.TIMELINE, props: { onSave: handleSaveTimeline, timelineId: activeTimelineId } }))}
        onDeleteTimeline={handleDeleteTimeline}
        selectedLayers={selectedTimelineLayers}
        onToggleLayer={(id) => setSelectedTimelineLayers(prev => { const newSet = new Set(prev); if (newSet.has(id)) newSet.delete(id); else newSet.add(id); return newSet; })}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        availableEntities={availableEntitiesForFilter}
        selectedEntityFilters={selectedEntityFilters}
        onToggleEntityFilter={(id) => setSelectedEntityFilters(prev => { const newSet = new Set(prev); if (newSet.has(id)) newSet.delete(id); else newSet.add(id); return newSet; })}
        availableTags={availableTagsForFilter}
        selectedTagFilters={selectedTagFilters}
        onToggleTagFilter={(id) => setSelectedTagFilters(prev => { const newSet = new Set(prev); if (newSet.has(id)) newSet.delete(id); else newSet.add(id); return newSet; })}
      />
      
      <div className="flex-shrink-0">
        <TimelineChart 
            events={sortedEvents} 
            title={t('worldTimeline.chartTitle')} 
            onEventClick={(id) => dispatch(setHighlightEvent(id))} 
            onCanvasDoubleClick={(iso) => {
                setTempMarkerIso(iso);
                dispatch(pushModal({ type: ModalType.WORLD_EVENT, props: { onSave: (data) => handleSaveWorldEvent(data, activeTimelineId), timelineId: activeTimelineId, prefilledDateTime: iso } }));
            }}
            tempMarkerIso={tempMarkerIso}
        />
      </div>

      <WorldEventList
        events={sortedEvents}
        entityMap={entityMap}
        tagMap={tagMap}
        allTags={allTagsArray}
        highlightedEventId={highlightedEventId}
        setEventRef={setEventRef}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onUpdateTags={(eventId, newTagIds) => updateWorldEvent(eventId, { tagIds: newTagIds })}
        onCreateTag={handleCreateTag}
        onNavigate={navigateToEntity}
        emptyStateTitle={debouncedSearchTerm || dateFilter.start || dateFilter.end ? t('worldTimeline.empty.noResultsTitle') : t('worldTimeline.empty.title')}
        emptyStateDescription={debouncedSearchTerm || dateFilter.start || dateFilter.end ? t('worldTimeline.empty.noResults') : t('worldTimeline.empty.subtitle')}
      />
    </div>
  );
};

export default WorldTimelineView;