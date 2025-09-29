
// components/views/timeline/TimelineFilters.tsx
import React from 'react';
import { Timeline, Entity, Tag, EntityId } from '../../../types';
import { SearchIcon, FilterIcon, PlusCircleIcon, EditIcon, TrashIcon } from '../../common/Icons';
import { Button, Input, Select } from '../../common/ui';

interface FilterChecklistProps {
    title: string;
    items: {id: string, name: string}[];
    selected: Set<string>;
    onToggle: (id: string) => void;
}

const FilterChecklist: React.FC<FilterChecklistProps> = ({ title, items, selected, onToggle }) => (
    <div>
        <h4 className="text-sm font-semibold text-text-secondary mb-1">{title}</h4>
        <div className="max-h-32 overflow-y-auto bg-primary border border-border-color rounded-md p-1 space-y-1">
            {items.length > 0 ? items.map(item => (
                <label key={item.id} className="flex items-center space-x-2 p-1 text-sm hover:bg-secondary rounded cursor-pointer">
                    <input type="checkbox" checked={selected.has(item.id)} onChange={() => onToggle(item.id)} className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent" />
                    <span>{item.name}</span>
                </label>
            )) : <p className="text-xs text-text-secondary p-2">No items to filter by.</p>}
        </div>
    </div>
);

interface TimelineFiltersProps {
    timelines: Timeline[];
    activeTimelineId: string;
    onActiveTimelineChange: (id: string) => void;
    onAddEvent: () => void;
    onNewTimeline: () => void;
    onEditTimeline: () => void;
    onDeleteTimeline: () => void;
    selectedLayers: Set<string>;
    onToggleLayer: (id: string) => void;
    searchTerm: string;
    onSearchTermChange: (term: string) => void;
    dateFilter: { start: string; end: string };
    onDateFilterChange: (filter: { start: string; end: string }) => void;
    availableEntities: Entity[];
    selectedEntityFilters: Set<EntityId>;
    onToggleEntityFilter: (id: string) => void;
    availableTags: Tag[];
    selectedTagFilters: Set<string>;
    onToggleTagFilter: (id: string) => void;
}

const TimelineFilters: React.FC<TimelineFiltersProps> = (props) => {
    const {
        timelines, activeTimelineId, onActiveTimelineChange, onAddEvent, onNewTimeline, onEditTimeline, onDeleteTimeline,
        selectedLayers, onToggleLayer, searchTerm, onSearchTermChange, dateFilter, onDateFilterChange,
        availableEntities, selectedEntityFilters, onToggleEntityFilter, availableTags, selectedTagFilters, onToggleTagFilter
    } = props;
    
    return (
        <div className="flex-shrink-0 p-3 bg-secondary rounded-md border border-border-color grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label className="text-sm font-semibold text-text-secondary">Add Events to Timeline</label>
                <div className="flex items-center gap-2 mt-1">
                    <Select value={activeTimelineId} onChange={e => onActiveTimelineChange(e.target.value)} className="flex-grow">
                        {timelines.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </Select>
                    <Button onClick={onAddEvent} size="sm"><PlusCircleIcon className="w-4 h-4 mr-1"/> Add Event</Button>
                </div>
                 <div className="flex items-center gap-2 mt-2">
                    <Button onClick={onNewTimeline} variant="ghost" size="sm">New Timeline</Button>
                    <Button onClick={onEditTimeline} variant="ghost" size="sm" disabled={!activeTimelineId}>Edit</Button>
                    <Button onClick={onDeleteTimeline} variant="ghost" size="sm" disabled={!activeTimelineId || timelines.length <= 1}>Delete</Button>
                 </div>
            </div>
            <div className="md:col-span-2">
                <label className="text-sm font-semibold text-text-secondary">Filter View</label>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                     {timelines.map(timeline => (
                      <Button
                        key={timeline.id}
                        onClick={() => onToggleLayer(timeline.id)}
                        variant={selectedLayers.has(timeline.id) ? 'primary' : 'secondary'} size="sm"
                      >
                        {timeline.name}
                      </Button>
                    ))}
                </div>
            </div>
             <div className="relative md:col-span-3">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
                <Input 
                    type="search" value={searchTerm} onChange={e => onSearchTermChange(e.target.value)}
                    placeholder="Search events..." className="pl-10"
                    aria-label="Search events"
                />
            </div>
            <details className="md:col-span-3">
                <summary className="cursor-pointer text-sm font-semibold text-text-secondary flex items-center gap-2"><FilterIcon className="w-4 h-4" /> Advanced Filters</summary>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2 pt-3 border-t border-border-color">
                    <FilterChecklist title="By Involved Entities" items={availableEntities} selected={selectedEntityFilters} onToggle={onToggleEntityFilter} />
                    <FilterChecklist title="By Tags" items={availableTags.map(t => ({id: t.id, name: t.label}))} selected={selectedTagFilters} onToggle={onToggleTagFilter} />
                    <div className="lg:col-span-2 space-y-2">
                        <label className="text-sm font-semibold text-text-secondary">By Date Range</label>
                        <div className="flex items-center gap-2">
                            <Input type="date" value={dateFilter.start} onChange={e => onDateFilterChange({ ...dateFilter, start: e.target.value })} className="text-sm" />
                            <span className="text-text-secondary">-</span>
                            <Input type="date" value={dateFilter.end} onChange={e => onDateFilterChange({ ...dateFilter, end: e.target.value })} className="text-sm" />
                            <Button variant="ghost" size="sm" onClick={() => onDateFilterChange({ start: '', end: '' })}>Clear</Button>
                        </div>
                    </div>
                </div>
            </details>
        </div>
    );
};

export default TimelineFilters;