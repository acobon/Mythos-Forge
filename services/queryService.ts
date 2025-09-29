import { StoryBible, HistoricalEvent, Entity, EntityTemplate, EntityType, FilterRule, MatchType, NarrativeScene, ResearchNote } from '../types';
import { getEventDefinition } from '../data/event-definitions';
import { getTypedObjectValues, htmlToPlainText } from '../utils';

const checkEntityCondition = (entity: Entity, rule: FilterRule): boolean => {
    switch (rule.entityProperty) {
        case 'type':
            return rule.operator === 'is' ? entity.type === rule.value : entity.type !== rule.value;
        case 'name': {
            const name = entity.name.toLowerCase();
            const value = String(rule.value).toLowerCase();
            if (rule.operator === 'contains') return name.includes(value);
            if (rule.operator === 'does_not_contain') return !name.includes(value);
            if (rule.operator === 'is') return name === value;
            if (rule.operator === 'is_not') return name !== value;
            break;
        }
        case 'template':
            if (rule.operator === 'is') return entity.templateId === rule.value;
            if (rule.operator === 'is_not') return entity.templateId !== rule.value;
            if (rule.operator === 'is_empty') return !entity.templateId;
            if (rule.operator === 'is_not_empty') return !!entity.templateId;
            break;
        case 'templateAttribute': {
            if (!rule.templateId || !rule.attributeName) return false;
            if (entity.templateId !== rule.templateId) return false;

            const attributeValue = entity.details?.[rule.attributeName];

            if (rule.operator === 'is_empty') {
                return attributeValue === undefined || attributeValue === null || attributeValue === '';
            }
            if (rule.operator === 'is_not_empty') {
                return attributeValue !== undefined && attributeValue !== null && attributeValue !== '';
            }

            if (attributeValue === undefined || attributeValue === null) return false;

            const valueStr = String(attributeValue).toLowerCase();
            const ruleValueStr = String(rule.value).toLowerCase();

            switch (rule.operator) {
                case 'contains': return valueStr.includes(ruleValueStr);
                case 'does_not_contain': return !valueStr.includes(ruleValueStr);
                case 'is': return valueStr === ruleValueStr;
                case 'is_not': return valueStr !== ruleValueStr;
                default: return false;
            }
        }
    }
    return false;
}

const passesContentRule = (item: NarrativeScene | ResearchNote, rule: FilterRule): boolean => {
    const content = htmlToPlainText(item.content).toLowerCase();
    const value = String(rule.value).toLowerCase();
    if (rule.operator === 'contains') return content.includes(value);
    if (rule.operator === 'does_not_contain') return !content.includes(value);
    return false;
};


export const executeQuery = (storyBible: StoryBible, rules: FilterRule[], matchType: MatchType): { filteredEvents: HistoricalEvent[] } => {
    if (rules.length === 0) {
        return { filteredEvents: [...getTypedObjectValues(storyBible.events)].sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()) };
    }

    const entityMap = new Map(getTypedObjectValues(storyBible.entities).map(e => [e.id, e]));
    
    // Pre-filter events based on content rules if they exist
    const contentRules = rules.filter(r => r.subject === 'sceneContent' || r.subject === 'noteContent');
    const nonContentRules = rules.filter(r => r.subject !== 'sceneContent' && r.subject !== 'noteContent');
    
    let contentFilteredEventIds: Set<string> | null = null;
    
    if (contentRules.length > 0) {
        contentFilteredEventIds = new Set();
        const scenes = getTypedObjectValues(storyBible.scenes) as NarrativeScene[];
        
        scenes.forEach(scene => {
            const sceneMatches = contentRules
                .filter(r => r.subject === 'sceneContent')
                .every(rule => passesContentRule(scene, rule));

            if (sceneMatches && scene.linkedEventIds) {
                scene.linkedEventIds.forEach(id => contentFilteredEventIds!.add(id));
            }
        });
        
        // Note: research notes cannot be directly linked to events, so we can't filter events this way.
        // This functionality could be expanded if notes are linked to entities involved in events.
    }
    

    const eventPassesRule = (event: HistoricalEvent, rule: FilterRule): boolean => {
        switch (rule.subject) {
            case 'eventType':
                return rule.operator === 'is' ? event.type === rule.value : event.type !== rule.value;
            case 'eventDate': {
                const eventTime = new Date(event.startDateTime).getTime();
                const ruleTime = new Date(rule.value).getTime();
                if (isNaN(eventTime) || isNaN(ruleTime)) return false;
                return rule.operator === 'is_before' ? eventTime < ruleTime : eventTime > ruleTime;
            }
            case 'involvedEntity': {
                const check = (e: Entity) => checkEntityCondition(e, rule);
                if (rule.operator === 'has') { // "has an entity where..."
                    return event.involvedEntities.some(inv => {
                        const entity = entityMap.get(inv.entityId);
                        return entity ? check(entity) : false;
                    });
                }
                if (rule.operator === 'has_not') { // "has no entity where..."
                     return !event.involvedEntities.some(inv => {
                        const entity = entityMap.get(inv.entityId);
                        return entity ? check(entity) : false;
                    });
                }
                break;
            }
        }
        return false;
    };

    let filteredEvents: HistoricalEvent[];
    const allEvents = getTypedObjectValues(storyBible.events);
    
    const eventsToQuery = contentFilteredEventIds
        ? allEvents.filter(e => contentFilteredEventIds!.has(e.id))
        : allEvents;

    if (matchType === 'AND') {
        filteredEvents = eventsToQuery.filter(event => {
            return nonContentRules.every(rule => eventPassesRule(event, rule));
        });
    } else { // OR
        if (contentRules.length > 0 && nonContentRules.length === 0) {
             filteredEvents = eventsToQuery;
        } else {
            const matchingEventIds = new Set<string>();
            allEvents.forEach(event => {
                if (rules.some(rule => {
                    if (rule.subject === 'sceneContent' || rule.subject === 'noteContent') {
                        // This logic is tricky for OR. A simple approach is to get all events linked to matching content
                        // and add them to the set.
                        let matches = false;
                        if (rule.subject === 'sceneContent') {
                             const scenes = getTypedObjectValues(storyBible.scenes).filter(s => passesContentRule(s, rule));
                             const linkedEventIds = new Set(scenes.flatMap(s => s.linkedEventIds || []));
                             if (linkedEventIds.has(event.id)) {
                                 matches = true;
                             }
                        }
                        return matches;
                    }
                    return eventPassesRule(event, rule);
                })) {
                    matchingEventIds.add(event.id);
                }
            });
            const eventMap = new Map(allEvents.map(e => [e.id, e]));
            filteredEvents = Array.from(matchingEventIds).map(id => eventMap.get(id)!).filter(Boolean);
        }
    }
    
    // sort final results
    filteredEvents.sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
    
    return { filteredEvents };
};