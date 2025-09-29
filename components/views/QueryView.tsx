
import React, { useState, useMemo, useCallback } from 'react';
import { HistoricalEvent, Entity, WorldEvent, EntityId, SavedQuery, FilterRule, MatchType, ModalType, EventSchema, EntityType, StoryBible } from '../../types/index';
import { executeQuery } from '../../services/queryService';
import QueryBuilder from '../forms/QueryBuilder';
import TimelineChart from '../common/TimelineChart';
import TextWithReferences from '../common/TextWithReferences';
import { formatWorldDate, generateId, getTypedObjectValues } from '../../utils';
import { FilterIcon, UsersIcon, CalendarIcon, ClockIcon, TrashIcon } from '../common/Icons';
import { builtinEventGroups } from '../../data/builtin-events';
import { useQueryActions } from '../../hooks/useQueryActions';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';
import EmptyState from '../common/EmptyState';
import { useI18n } from '../../hooks/useI18n';
import { useNavigation } from '../../hooks/useNavigation';
import { Spinner } from '../common/Spinner';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { popModal, pushModal } from '../../state/uiSlice';
import { selectFullStoryBible } from '../../state/selectors';

const EventResultList: React.FC<{ events: HistoricalEvent[], onNavigate: (id: EntityId) => void }> = ({ events, onNavigate }) => {
  const { calendar } = useAppSelector(state => state.bible.present.project);
  const { customEventSchemas } = useAppSelector(state => state.bible.present.events);

  const allEventsMap = useMemo(() => {
    const map = new Map<string, string>();

    Object.values(builtinEventGroups).forEach(groups => {
      groups.forEach(group => {
        group.events.forEach(event => {
          map.set(event.key, event.label);
        });
      });
    });

    (getTypedObjectValues(customEventSchemas) as EventSchema[][]).forEach(schemas => {
      schemas.forEach(schema => {
        map.set(schema.key, schema.label);
      });
    });

    return map;
  }, [customEventSchemas]);

  const getEventLabel = useCallback((key: string): string => {
    return allEventsMap.get(key) || key.replace(/_/g, ' ');
  }, [allEventsMap]);

  return (
    <div className="space-y-4">
      {events.map(event => (
        <div key={event.id} className="bg-secondary p-4 rounded-lg border border-border-color">
          <h4 className="font-bold text-text-main">{getEventLabel(event.type)}</h4>
          <p className="text-sm text-text-secondary mt-1">{formatWorldDate(event.startDateTime, calendar)}</p>
          <div className="mt-2 text-text-main whitespace-pre-wrap">
            <TextWithReferences text={event.description} onNavigate={onNavigate} />
          </div>
        </div>
      ))}
    </div>
  );
};

const EntityResultList: React.FC<{ entities: Entity[], onSelectEntity: (id: EntityId) => void }> = ({ entities, onSelectEntity }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {entities.map(entity => (
        <button
          key={entity.id}
          onClick={() => onSelectEntity(entity.id)}
          className="w-full text-left p-4 bg-secondary rounded-lg border border-border-color hover:border-accent hover:bg-border-color transition-colors"
        >
          <h4 className="font-bold text-text-main">{entity.name}</h4>
          <p className="text-sm text-text-secondary">{entity.type}</p>
        </button>
      ))}
    </div>
  );
}

const QueryView: React.FC = () => {
    const dispatch = useAppDispatch();
    const { saveQuery, deleteQuery } = useQueryActions();
    const showConfirm = useConfirmationDialog();
    const { t } = useI18n();
    const storyBible = useAppSelector(selectFullStoryBible) as StoryBible;
    const { savedQueries } = storyBible;
    const { navigateToEntity } = useNavigation();
    
    const [rules, setRules] = useState<FilterRule[]>([]);
    const [matchType, setMatchType] = useState<MatchType>('AND');
    const [results, setResults] = useState<{ events: HistoricalEvent[]; entities: Entity[] } | null>(null);
    const [activeTab, setActiveTab] = useState<'events' | 'entities' | 'timeline'>('events');
    const [isQuerying, setIsQuerying] = useState(false);

    const handleRunQuery = useCallback(() => {
        setIsQuerying(true);
        setResults(null);
        setTimeout(() => {
            const { filteredEvents } = executeQuery(storyBible, rules, matchType);
            const entityIds = new Set<EntityId>();
            filteredEvents.forEach(event => {
                event.involvedEntities.forEach(inv => entityIds.add(inv.entityId));
            });
            const filteredEntities = (getTypedObjectValues(storyBible.entities) as Entity[]).filter(e => entityIds.has(e.id));

            setResults({ events: filteredEvents, entities: filteredEntities });
            if (filteredEvents.length >= filteredEntities.length) {
                setActiveTab('events');
            } else {
                setActiveTab('entities');
            }
            setIsQuerying(false);
        }, 50);
    }, [storyBible, rules, matchType]);

    const handleSaveQuery = useCallback(() => {
        const onSave = (name: string) => {
            saveQuery({
                id: generateId('query'),
                name: name.trim(),
                rules,
                matchType,
            });
            dispatch(popModal());
        };
        dispatch(pushModal({ type: ModalType.SAVE_QUERY, props: { onSave } }));
    }, [rules, matchType, saveQuery, dispatch]);
    
    const handleLoadQuery = (query: SavedQuery) => {
        setRules(query.rules);
        setMatchType(query.matchType);
    };

    const handleDeleteQuery = (query: SavedQuery) => {
        showConfirm({
            title: "Delete Query?",
            message: `Are you sure you want to delete the query "${query.name}"?`,
            onConfirm: () => deleteQuery(query.id),
        });
    };

    const timelineScenes = useMemo<WorldEvent[]>(() => {
        if (!results) return [];
        return results.events.map(event => ({
            id: event.id,
            title: (event.description || event.type).substring(0, 50) + ((event.description || event.type).length > 50 ? '...' : ''),
            content: event.description,
            dateTime: event.startDateTime,
            entities: event.involvedEntities.map(inv => inv.entityId)
        }));
    }, [results]);

    const renderTabContent = () => {
        if (!results) return null;
        switch (activeTab) {
            case 'events':
                return <EventResultList events={results.events} onNavigate={navigateToEntity} />;
            case 'entities':
                return <EntityResultList entities={results.entities} onSelectEntity={navigateToEntity} />;
            case 'timeline':
                return <TimelineChart events={timelineScenes} title="Filtered Timeline" />;
            default:
                return null;
        }
    };

    const savedQueriesArray = getTypedObjectValues(savedQueries) as SavedQuery[];

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 md:p-6 border-b border-border-color flex-shrink-0">
                <h2 className="text-3xl font-bold text-text-main">Query & Filter</h2>
                <p className="text-text-secondary mt-1">Build complex queries to analyze your story data.</p>
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="w-full lg:w-3/4">
                        <QueryBuilder
                            rules={rules}
                            matchType={matchType}
                            onRulesChange={setRules}
                            onMatchTypeChange={setMatchType}
                            onRunQuery={handleRunQuery}
                            onSaveQuery={handleSaveQuery}
                        />
                    </div>
                    {savedQueriesArray.length > 0 && (
                        <div className="w-full lg:w-1/4 lg:pl-4 lg:border-l border-border-color">
                             <h3 className="text-lg font-semibold text-text-secondary mb-3">Saved Queries</h3>
                             <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {savedQueriesArray.map(q => (
                                    <div key={q.id} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary group">
                                        <button onClick={() => handleLoadQuery(q)} className="font-semibold text-accent hover:underline text-left">
                                            {q.name}
                                        </button>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleDeleteQuery(q)} className="p-1 text-text-secondary hover:text-red-500">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex-grow overflow-y-auto">
                {isQuerying ? (
                     <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary p-8">
                        <Spinner size="lg" />
                        <p className="mt-4">Running query...</p>
                    </div>
                ) : results ? (
                    <div className="p-4 md:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-2xl font-bold">Query Results</h3>
                            <div className="flex space-x-1 bg-secondary p-1 rounded-md border border-border-color">
                                <button onClick={() => setActiveTab('events')} className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center ${activeTab === 'events' ? 'bg-accent text-white' : 'hover:bg-border-color'}`}>
                                    <CalendarIcon className="w-4 h-4 mr-2" /> Events ({results.events.length})
                                </button>
                                <button onClick={() => setActiveTab('entities')} className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center ${activeTab === 'entities' ? 'bg-accent text-white' : 'hover:bg-border-color'}`}>
                                    <UsersIcon className="w-4 h-4 mr-2" /> Entities ({results.entities.length})
                                </button>
                                <button onClick={() => setActiveTab('timeline')} className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center ${activeTab === 'timeline' ? 'bg-accent text-white' : 'hover:bg-border-color'}`}>
                                    <ClockIcon className="w-4 h-4 mr-2" /> Timeline
                                </button>
                            </div>
                        </div>
                        <div className="animate-fade-in">
                            {renderTabContent()}
                        </div>
                    </div>
                ) : (
                    <EmptyState
                        icon={<FilterIcon className="w-16 h-16" />}
                        title={t('query.buildQuery')}
                        description={t('query.buildQuery.subtitle')}
                    />
                )}
            </div>
        </div>
    );
};

export default QueryView;
