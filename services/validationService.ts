// services/validationService.ts
import { StoryBible, EntityId, EntityType, HistoricalEvent, Entity, Inconsistency, MapLayer, Work, Timeline } from '../types/index';
import { sortHistoricalEvents, getTypedObjectValues, labelToFieldName } from '../utils';
import { defaultStoryBible } from '../data/defaults';
import { VITAL_EVENTS } from '../constants';

// Type guard helpers for validation
const isObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const validateAndCleanStoryBible = (loadedData: unknown): { storyBible: StoryBible, warnings: string[] } => {
    const warnings: string[] = [];

    if (!isObject(loadedData)) {
        warnings.push("Imported file is not a valid project object. A new project has been created.");
        return { storyBible: defaultStoryBible, warnings };
    }
    
    // Start with a default bible and safely merge properties from the loaded data.
    const bible: StoryBible = { ...defaultStoryBible };

    // Safely merge top-level properties
    if (typeof loadedData.title === 'string') bible.title = loadedData.title;

    // Process entity types first, so we can validate against them.
    if (Array.isArray(loadedData.entityTypes)) {
        bible.entityTypes = (loadedData.entityTypes as any[]).filter(et => et.key && et.name && et.icon);
    }
    const validEntityTypeKeys = new Set(bible.entityTypes.map(et => et.key));
    
    const isValidEntity = (entity: unknown): entity is Entity => {
        if (!isObject(entity)) return false;
        return typeof entity.id === 'string' &&
               typeof entity.name === 'string' &&
               typeof entity.type === 'string' &&
               validEntityTypeKeys.has(entity.type);
    };
    
    // Normalize entities, validating each one
    const processEntities = (entities: unknown[] | Record<string, unknown>) => {
        const entityCollection = Array.isArray(entities) ? entities : getTypedObjectValues(entities);
        entityCollection.forEach((e: unknown) => {
            if (isValidEntity(e)) {
                bible.entities[e.id] = { ...e, description: e.description || '' };
            } else {
                warnings.push(`Removed an invalid entity from the imported data.`);
            }
        });
    };

    if (Array.isArray(loadedData.entities)) {
        processEntities(loadedData.entities);
    } else if (isObject(loadedData.entities)) {
        processEntities(loadedData.entities as Record<string, Entity>);
    }
    
    // Normalize other arrays
    const toRecord = <T extends {id: string}>(arr: unknown): Record<string, T> => {
        if (!Array.isArray(arr)) return {};
        return arr.reduce((acc, item) => {
            if (item && item.id) acc[item.id] = item;
            return acc;
        }, {} as Record<string, T>);
    };

    if (Array.isArray(loadedData.events)) bible.events = toRecord(loadedData.events); else if(isObject(loadedData.events)) bible.events = loadedData.events as any;
    if (Array.isArray(loadedData.relationships)) bible.relationships = toRecord(loadedData.relationships); else if(isObject(loadedData.relationships)) bible.relationships = loadedData.relationships as any;
    
    if (Array.isArray(loadedData.works)) bible.works = toRecord(loadedData.works); else if(isObject(loadedData.works)) bible.works = loadedData.works as any;
    else if (Array.isArray((loadedData as any).plots)) {
        warnings.push("Old 'plots' data format detected and converted to 'works'.");
        bible.works = toRecord((loadedData as any).plots.map((p: any) => ({ ...p, workType: 'Novel', status: 'Drafting' })));
    }
    if (Array.isArray(loadedData.series)) bible.series = toRecord(loadedData.series); else if(isObject(loadedData.series)) bible.series = loadedData.series as any;
    if (Array.isArray(loadedData.collections)) bible.collections = toRecord(loadedData.collections); else if(isObject(loadedData.collections)) bible.collections = loadedData.collections as any;

    if (Array.isArray(loadedData.tags)) bible.tags = toRecord(loadedData.tags); else if(isObject(loadedData.tags)) bible.tags = loadedData.tags as any;
    if (Array.isArray(loadedData.commonRoles)) bible.commonRoles = loadedData.commonRoles;
    if (Array.isArray(loadedData.researchNotes)) bible.researchNotes = toRecord(loadedData.researchNotes); else if(isObject(loadedData.researchNotes)) bible.researchNotes = loadedData.researchNotes as any;

    // Safely merge nested objects
    if (isObject(loadedData.customEventSchemas)) bible.customEventSchemas = { ...defaultStoryBible.customEventSchemas, ...loadedData.customEventSchemas as any };
    if (isObject(loadedData.entityTemplates)) {
        bible.entityTemplates = { ...defaultStoryBible.entityTemplates, ...loadedData.entityTemplates as any };
        // Data migration: ensure all schema fields have a fieldName
        Object.values(bible.entityTemplates).forEach(templateArray => {
            templateArray.forEach(template => {
                template.schema.forEach(field => {
                    if (!field.fieldName && field.label) {
                        field.fieldName = labelToFieldName(field.label);
                    }
                });
            });
        });
    }
    if (isObject(loadedData.calendar)) bible.calendar = { ...defaultStoryBible.calendar, ...loadedData.calendar as any };
    if (isObject(loadedData.scenes)) bible.scenes = loadedData.scenes as any;
    if (isObject(loadedData.writingGoals)) bible.writingGoals = { ...defaultStoryBible.writingGoals, ...loadedData.writingGoals as any };
    if (typeof loadedData.scratchpad === 'string') bible.scratchpad = loadedData.scratchpad;
    
    // Backward compatibility for old map format
    if (isObject(loadedData.map) && typeof (loadedData.map as any).image === 'string') {
        warnings.push("Old map format detected and converted to the new layer system.");
        const oldMap = loadedData.map as { image: string, width: number, height: number };
        const newLayer: MapLayer = {
            id: 'default-map-layer',
            name: 'Main Map',
            image: oldMap.image,
            width: oldMap.width || 1024,
            height: oldMap.height || 1024,
            isVisible: true,
        };
        bible.map = { layers: [newLayer], baseLayerId: newLayer.id };
    } else if (isObject(loadedData.map)) {
        const loadedMap = loadedData.map as any;
        bible.map = { ...defaultStoryBible.map };
        if (Array.isArray(loadedMap.layers)) {
            bible.map.layers = loadedMap.layers;
        }
        if (typeof loadedMap.baseLayerId === 'string' || loadedMap.baseLayerId === null) {
            bible.map.baseLayerId = loadedMap.baseLayerId;
        }
    }
    
    // Backward compatibility for old worldTimeline format and migration to new Timelines structure
    if (Array.isArray((loadedData as any).worldTimeline)) {
        warnings.push("Old 'worldTimeline' array format detected and converted.");
        bible.worldEvents = toRecord((loadedData as any).worldTimeline);
    } else if (isObject(loadedData.worldEvents)) {
        bible.worldEvents = loadedData.worldEvents as any;
    }

    if ((!loadedData.timelines || Object.keys(loadedData.timelines as object).length === 0) && Object.keys(bible.worldEvents).length > 0) {
        warnings.push("Project updated to support multiple timelines. Existing world events have been moved to a 'Main Timeline'.");
        const mainTimeline: Timeline = {
            id: 'default-timeline',
            name: 'Main Timeline',
            description: 'The primary timeline of significant world events.',
            eventIds: Object.keys(bible.worldEvents),
        };
        bible.timelines = { [mainTimeline.id]: mainTimeline };
    } else if (isObject(loadedData.timelines)) {
        bible.timelines = loadedData.timelines as any;
    }


    if (Array.isArray(loadedData.themes)) bible.themes = toRecord(loadedData.themes); else if (isObject(loadedData.themes)) bible.themes = loadedData.themes as any;
    if (Array.isArray(loadedData.conflicts)) bible.conflicts = toRecord(loadedData.conflicts); else if (isObject(loadedData.conflicts)) bible.conflicts = loadedData.conflicts as any;
    if (Array.isArray(loadedData.savedQueries)) bible.savedQueries = toRecord(loadedData.savedQueries); else if (isObject(loadedData.savedQueries)) bible.savedQueries = loadedData.savedQueries as any;


    return { storyBible: bible, warnings };
};

export const validateStoryBible = (storyBible: StoryBible): Inconsistency[] => {
    const inconsistencies: Inconsistency[] = [];
    const entities = getTypedObjectValues(storyBible.entities);
    const events = getTypedObjectValues(storyBible.events);

    const entityMap = storyBible.entities;
    const characterLifeSpans = new Map<EntityId, { birth: number | null, death: number | null }>();
    const characters = entities.filter(e => e.type === EntityType.CHARACTER);

    for (const character of characters) {
        const charEvents = events.filter(e => e.involvedEntities.some(inv => inv.entityId === character.id));
        const birthEvent = charEvents.find(e => e.type === VITAL_EVENTS.BIRTH);
        const deathEvent = charEvents.find(e => e.type === VITAL_EVENTS.DEATH);

        characterLifeSpans.set(character.id, {
            birth: birthEvent ? new Date(birthEvent.startDateTime).getTime() : null,
            death: deathEvent ? new Date(deathEvent.startDateTime).getTime() : null,
        });
    }

    const getEventName = (e: HistoricalEvent) => (e.description || e.type).substring(0, 40) + ((e.description || e.type).length > 40 ? '...' : '');

    for (const event of events) {
        const eventStart = new Date(event.startDateTime).getTime();
        const eventEnd = event.endDateTime ? new Date(event.endDateTime).getTime() : eventStart;

        if (!isNaN(eventStart) && !isNaN(eventEnd) && eventEnd < eventStart) {
            const firstEntityInvolvement = event.involvedEntities[0];
            const firstEntity: Entity | undefined = firstEntityInvolvement ? entityMap[firstEntityInvolvement.entityId] : undefined;
            
            inconsistencies.push({
                type: 'Invalid Event Dates',
                messageKey: 'validation.error.invalidDates',
                eventId: event.id,
                eventName: getEventName(event),
                entityId: firstEntity?.id,
                entityName: firstEntity?.name
            });
        }

        for (const involvement of event.involvedEntities) {
            const lifeSpan = characterLifeSpans.get(involvement.entityId);
            if (!lifeSpan) continue;

            const entity: Entity = entityMap[involvement.entityId];
            if (!entity) continue;
            
            if (lifeSpan.death && !isNaN(lifeSpan.death) && !isNaN(eventStart) && eventStart > lifeSpan.death) {
                inconsistencies.push({
                    type: 'Post-Mortem Event',
                    messageKey: 'validation.error.postMortem',
                    entityId: entity.id,
                    eventId: event.id,
                    entityName: entity.name,
                    eventName: getEventName(event),
                });
            }

            if (lifeSpan.birth && event.type !== VITAL_EVENTS.BIRTH && !isNaN(lifeSpan.birth) && !isNaN(eventStart) && eventStart < lifeSpan.birth) {
                 inconsistencies.push({
                    type: 'Pre-Birth Event',
                    messageKey: 'validation.error.preBirth',
                    entityId: entity.id,
                    eventId: event.id,
                    entityName: entity.name,
                    eventName: getEventName(event),
                });
            }
        }
    }
    
    // Optimized overlapping events check
    for (const character of characters) {
        const charEvents = events
            .filter(e => e.involvedEntities.some(inv => inv.entityId === character.id))
            .sort(sortHistoricalEvents);

        if (charEvents.length < 2) continue;

        let maxEnd = -Infinity;
        let overlappingEvent: HistoricalEvent | null = null;

        for (const currentEvent of charEvents) {
            const start = new Date(currentEvent.startDateTime).getTime();
            if (isNaN(start)) continue;

            if (start < maxEnd) {
                const eventAName = getEventName(overlappingEvent!);
                const eventBName = getEventName(currentEvent);
                 inconsistencies.push({
                    type: 'Overlapping Events',
                    messageKey: 'validation.error.overlapping',
                    messageParams: { eventA: eventAName, eventB: eventBName },
                    entityId: character.id,
                    eventId: overlappingEvent!.id,
                    entityName: character.name,
                    eventName: eventAName,
                });
            }

            const end = currentEvent.endDateTime ? new Date(currentEvent.endDateTime).getTime() : start;
            if (!isNaN(end) && end > maxEnd) {
                maxEnd = end;
                overlappingEvent = currentEvent;
            }
        }
    }

    return inconsistencies;
};