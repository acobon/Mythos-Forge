import React, { useState, useMemo } from 'react';
import { FilterRule, MatchType, EntityType, EventOption, SavedQuery, EntityTemplate, StoryBible, EventSchema, EventGroup, ResearchNote } from '../../types/index';
import { generateUUID, getTypedObjectValues } from '../../utils';
import { builtinEventGroups } from '../../data/builtin-events';
import { PlusCircleIcon, TrashIcon, DownloadIcon } from '../common/Icons';
import { useAppSelector } from '../../state/hooks';
import { Select, Button, Input } from '../common/ui/index';

interface QueryBuilderProps {
    rules: FilterRule[];
    matchType: MatchType;
    onRulesChange: (rules: FilterRule[]) => void;
    onMatchTypeChange: (matchType: MatchType) => void;
    onRunQuery: () => void;
    onSaveQuery: () => void;
}

const QueryBuilder: React.FC<QueryBuilderProps> = ({ rules, matchType, onRulesChange, onMatchTypeChange, onRunQuery, onSaveQuery }) => {
    const { customEventSchemas } = useAppSelector(state => state.bible.present.events);
    const { entityTemplates } = useAppSelector(state => state.bible.present.entities);

    const allEventTypes = useMemo(() => {
        const all: EventOption[] = [];
    
        // Get built-in events
        (getTypedObjectValues(builtinEventGroups) as EventGroup[][]).flat().forEach(group => {
            all.push(...group.events);
        });
    
        // Get custom events
        (getTypedObjectValues(customEventSchemas) as EventSchema[][]).flat().forEach(schema => {
            all.push({ key: schema.key, label: schema.label });
        });
    
        // Deduplicate and sort
        const uniqueEvents = new Map<string, EventOption>();
        all.forEach(event => {
            if (!uniqueEvents.has(event.key)) {
                uniqueEvents.set(event.key, event);
            }
        });
        
        return Array.from(uniqueEvents.values()).sort((a, b) => a.label.localeCompare(b.label));
    }, [customEventSchemas]);
    
    const allTemplates = useMemo(() => ((getTypedObjectValues(entityTemplates) as EntityTemplate[][]).flat()).sort((a,b) => a.name.localeCompare(b.name)), [entityTemplates]);

    const addRule = () => {
        const newRule: FilterRule = {
            id: generateUUID(),
            subject: 'eventType',
            operator: 'is',
            value: allEventTypes[0]?.key || '',
        };
        onRulesChange([...rules, newRule]);
    };

    const updateRule = (id: string, updates: Partial<FilterRule>) => {
        onRulesChange(rules.map(rule => (rule.id === id ? { ...rule, ...updates } : rule)));
    };
    
    const removeRule = (id: string) => {
        onRulesChange(rules.filter(rule => rule.id !== id));
    };

    return (
        <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-secondary">Match</span>
                    <Select value={matchType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onMatchTypeChange(e.target.value as MatchType)} className="!p-1 !text-sm">
                        <option value="AND">all</option>
                        <option value="OR">any</option>
                    </Select>
                    <span className="text-sm font-semibold text-text-secondary">of the following rules:</span>
                </div>
                 <Button onClick={addRule} variant="secondary" size="sm" className="flex items-center">
                    <PlusCircleIcon className="w-4 h-4 mr-1" /> Add Rule
                </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {rules.map((rule) => (
                    <QueryRule
                        key={rule.id}
                        rule={rule}
                        onUpdate={updateRule}
                        onRemove={removeRule}
                        allEventTypes={allEventTypes}
                        allTemplates={allTemplates}
                    />
                ))}
            </div>
            <div className="pt-2 flex justify-end items-center gap-2">
                 <Button onClick={onSaveQuery} disabled={rules.length === 0} variant="ghost" size="sm" className="flex items-center gap-2">
                    <DownloadIcon className="w-4 h-4" /> Save Query
                </Button>
                <Button onClick={onRunQuery} disabled={rules.length === 0} size="sm">
                    Run Query
                </Button>
            </div>
        </div>
    );
};

// ... QueryRule Component
interface QueryRuleProps {
    rule: FilterRule;
    onUpdate: (id: string, updates: Partial<FilterRule>) => void;
    onRemove: (id: string) => void;
    allEventTypes: EventOption[];
    allTemplates: EntityTemplate[];
}
const QueryRule: React.FC<QueryRuleProps> = ({ rule, onUpdate, onRemove, allEventTypes, allTemplates }) => {
    const selectedTemplate = useMemo(() => {
        if (rule.entityProperty === 'templateAttribute' && rule.templateId) {
            return allTemplates.find(t => t.id === rule.templateId);
        }
        return undefined;
    }, [rule.entityProperty, rule.templateId, allTemplates]);
    
    const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSubject = e.target.value as FilterRule['subject'];
        const baseUpdate: Partial<FilterRule> = { subject: newSubject };
        // Reset operator and value to sensible defaults
        if (newSubject === 'eventType') {
            baseUpdate.operator = 'is';
            baseUpdate.value = allEventTypes[0]?.key || '';
        } else if (newSubject === 'eventDate') {
            baseUpdate.operator = 'is_after';
            baseUpdate.value = new Date().toISOString().split('T')[0];
        } else if (newSubject === 'involvedEntity') {
            baseUpdate.operator = 'has';
            baseUpdate.entityProperty = 'type';
            baseUpdate.value = EntityType.CHARACTER;
            delete baseUpdate.templateId;
            delete baseUpdate.attributeName;
        } else if (newSubject === 'sceneContent' || newSubject === 'noteContent') {
            baseUpdate.operator = 'contains';
            baseUpdate.value = '';
        }
        onUpdate(rule.id, baseUpdate);
    };

    const handleEntityPropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newEntityProperty = e.target.value as FilterRule['entityProperty'];
        const updates: Partial<FilterRule> = { entityProperty: newEntityProperty };
        // Reset subsequent fields based on the new property
        if (newEntityProperty === 'type') {
            updates.operator = 'is';
            updates.value = EntityType.CHARACTER;
        } else if (newEntityProperty === 'name') {
            updates.operator = 'contains';
            updates.value = '';
        } else if (newEntityProperty === 'template') {
            updates.operator = 'is';
            updates.value = allTemplates[0]?.id || '';
        } else if (newEntityProperty === 'templateAttribute') {
            updates.operator = 'contains';
            updates.templateId = '';
            updates.attributeName = '';
            updates.value = '';
        }
        onUpdate(rule.id, updates);
    };

    const renderValueInput = () => {
        if (['is_empty', 'is_not_empty'].includes(rule.operator)) {
            return null;
        }

        if(rule.subject === 'eventType') {
             return <Select value={rule.value} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onUpdate(rule.id, {value: e.target.value})} className="!p-1.5 !text-sm flex-grow min-w-0">
                {allEventTypes.map(et => <option key={et.key} value={et.key}>{et.label}</option>)}
             </Select>;
        }
        if(rule.subject === 'eventDate') {
            return <Input type="date" value={rule.value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate(rule.id, {value: e.target.value})} className="!p-1.5 !text-sm flex-grow min-w-0"/>;
        }
         if (rule.subject === 'sceneContent' || rule.subject === 'noteContent') {
            return <Input type="text" value={rule.value || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate(rule.id, { value: e.target.value })} placeholder="Text content..." className="!p-1.5 !text-sm flex-grow min-w-0" />;
        }
        if(rule.subject === 'involvedEntity') {
            if (rule.entityProperty === 'type') {
                return <Select value={rule.value} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onUpdate(rule.id, {value: e.target.value})} className="!p-1.5 !text-sm flex-grow min-w-0">
                    {Object.values(EntityType).map(type => <option key={type} value={type}>{type}</option>)}
                </Select>;
            }
             if (rule.entityProperty === 'template') {
                return <Select value={rule.value} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onUpdate(rule.id, {value: e.target.value})} className="!p-1.5 !text-sm flex-grow min-w-0">
                    <option value="">Any</option>
                    {allTemplates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.entityType})</option>)}
                </Select>;
            }
            return <Input type="text" value={rule.value || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate(rule.id, {value: e.target.value})} placeholder="Value..." className="!p-1.5 !text-sm flex-grow min-w-0"/>;
        }
        return null;
    }

    return (
        <div className="flex items-center gap-2 p-2 bg-primary rounded-md border border-border-color animate-fade-in flex-wrap">
            <Select value={rule.subject} onChange={handleSubjectChange} className="!p-1.5 !text-sm bg-secondary">
                <option value="eventType">Event Type</option>
                <option value="eventDate">Event Date</option>
                <option value="involvedEntity">Involved Entity</option>
                <option value="sceneContent">Scene Content</option>
            </Select>

            {rule.subject === 'involvedEntity' && 
              <>
                <Select value={rule.operator} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onUpdate(rule.id, {operator: e.target.value as FilterRule['operator']})} className="!p-1.5 !text-sm bg-secondary">
                    <option value="has">has an entity where</option>
                    <option value="has_not">has no entity where</option>
                </Select>
                <Select value={rule.entityProperty} onChange={handleEntityPropertyChange} className="!p-1.5 !text-sm bg-secondary">
                    <option value="type">Type</option>
                    <option value="name">Name</option>
                    <option value="template">Template</option>
                    <option value="templateAttribute">Template Attribute</option>
                </Select>
                 {rule.entityProperty === 'templateAttribute' && (
                    <>
                        <Select
                            value={rule.templateId || ''}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onUpdate(rule.id, { templateId: e.target.value, attributeName: '', value: '' })}
                            className="!p-1.5 !text-sm bg-secondary flex-grow min-w-0"
                            style={{ maxWidth: '150px' }}
                        >
                            <option value="">Select Template...</option>
                            {allTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </Select>
                        {selectedTemplate && (
                            <Select
                                value={rule.attributeName || ''}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onUpdate(rule.id, { attributeName: e.target.value, value: '' })}
                                className="!p-1.5 !text-sm bg-secondary flex-grow min-w-0"
                                style={{ maxWidth: '150px' }}
                            >
                                <option value="">Select Attribute...</option>
                                {selectedTemplate.schema.map(field => <option key={field.fieldName} value={field.fieldName}>{field.label}</option>)}
                            </Select>
                        )}
                    </>
                )}
              </>
            }

            <Select value={rule.operator} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onUpdate(rule.id, {operator: e.target.value as FilterRule['operator']})} className="!p-1.5 !text-sm bg-secondary">
                {rule.subject === 'eventType' && <>
                    <option value="is">is</option>
                    <option value="is_not">is not</option>
                </>}
                {rule.subject === 'eventDate' && <>
                    <option value="is_after">is after</option>
                    <option value="is_before">is before</option>
                </>}
                {(rule.subject === 'sceneContent' || rule.subject === 'noteContent') && <>
                    <option value="contains">contains</option>
                    <option value="does_not_contain">does not contain</option>
                </>}
                {rule.subject === 'involvedEntity' && (() => {
                    switch (rule.entityProperty) {
                        case 'type':
                            return <>
                                <option value="is">is</option>
                                <option value="is_not">is not</option>
                            </>;
                        case 'name':
                            return <>
                                <option value="contains">contains</option>
                                <option value="does_not_contain">does not contain</option>
                                <option value="is">is exactly</option>
                                <option value="is_not">is not exactly</option>
                            </>;
                        case 'template':
                            return <>
                                <option value="is">is</option>
                                <option value="is_not">is not</option>
                                <option value="is_empty">is empty</option>
                                <option value="is_not_empty">is not empty</option>
                            </>;
                        case 'templateAttribute':
                            return <>
                                <option value="contains">contains</option>
                                <option value="does_not_contain">does not contain</option>
                                <option value="is">is exactly</option>
                                <option value="is_not">is not exactly</option>
                                <option value="is_empty">is empty</option>
                                <option value="is_not_empty">is not empty</option>
                            </>;
                        default: return null;
                    }
                })()}
            </Select>

            {renderValueInput()}

            <Button onClick={() => onRemove(rule.id)} variant="ghost" size="icon" className="!p-2 text-text-secondary hover:text-red-500"><TrashIcon className="w-4 h-4" /></Button>
        </div>
    );
};

export default QueryBuilder;