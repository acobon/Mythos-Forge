// timeline.worker.ts
import { SceneWithPosition, EventWithLayout } from './types';

// --- TYPE DEFINITIONS for Worker Communication ---

interface CalculateLayoutPayload {
    eventsWithPos: SceneWithPosition[];
    timelineWidth: number;
    entityOrder: string[];
    popupWidthRem: number;
    popupVerticalSpacingRem: number;
    swimlaneHeightRem: number;
    remInPx: number;
}

interface WorkerEventData {
    type: 'CALCULATE_LAYOUT';
    payload: CalculateLayoutPayload;
}

// --- LAYOUT CALCULATION LOGIC ---

const calculateCombinedLayout = (sortedEvents: SceneWithPosition[], timelineWidth: number, popupWidthRem: number, popupVerticalSpacingRem: number, remInPx: number): { events: EventWithLayout[]; maxLevel: number } => {
    if (timelineWidth === 0 || sortedEvents.length === 0) return { events: [], maxLevel: 0 };
    
    const popupWidthPx = popupWidthRem * remInPx;
    const popupHalfWidthPx = popupWidthPx / 2;
    const bufferPx = 10;
    const minPixelSeparation = popupWidthPx * 0.1; // Prevent popups from being too dense horizontally

    const lanes: { right: number; position: number }[] = [];
    let currentMaxLevel = 0;

    const eventsWithLayout: EventWithLayout[] = sortedEvents.map((event) => {
        const rawPositionPx = event.position;
        const clampedPosition = Math.max(popupHalfWidthPx + bufferPx, Math.min(rawPositionPx, timelineWidth - popupHalfWidthPx - bufferPx));
        
        const eventLeft = clampedPosition - popupHalfWidthPx - bufferPx;
        const eventRight = clampedPosition + popupHalfWidthPx + bufferPx;
        
        let assignedLane = -1;
        for (let i = 0; i < lanes.length; i++) {
            if (eventLeft > lanes[i].right) {
                // Improved clustering logic: if the new event is very close to the last one in this lane,
                // skip this lane to force more vertical separation.
                if (Math.abs(rawPositionPx - lanes[i].position) < minPixelSeparation) {
                    continue;
                }
                assignedLane = i;
                break;
            }
        }

        if (assignedLane === -1) {
            assignedLane = lanes.length;
        }
        
        lanes[assignedLane] = { right: eventRight, position: rawPositionPx };
        
        const isUp = assignedLane % 2 === 0;
        const verticalLevel = Math.floor(assignedLane / 2);
        if (verticalLevel > currentMaxLevel) currentMaxLevel = verticalLevel;
        
        const layoutEvent: EventWithLayout = { 
            ...event,
            isUp, 
            verticalOffset: verticalLevel * popupVerticalSpacingRem,
        };
        return layoutEvent;
    });

    return { events: eventsWithLayout, maxLevel: currentMaxLevel };
};

const calculateSwimlaneLayout = (sortedEvents: SceneWithPosition[], entityOrder: string[], swimlaneHeightRem: number) => {
    const lanes = entityOrder.map((entityId, index) => ({
        entityId,
        yOffset: index * swimlaneHeightRem + (swimlaneHeightRem / 2),
    }));
    const laneMap = new Map(lanes.map(l => [l.entityId, l.yOffset]));

    const eventsWithLayout = sortedEvents.flatMap(event => {
        return (event.entities || []).map(entityId => {
            const yOffset = laneMap.get(entityId);
            if (yOffset !== undefined) {
                 return { 
                     id: `${event.id}-${entityId}`, 
                     originalId: event.id,
                     yOffset 
                 };
            }
            return null;
        }).filter((item): item is NonNullable<typeof item> => item !== null);
    });

    return { events: eventsWithLayout, lanes: lanes.map(l => ({...l, yOffset: l.yOffset - swimlaneHeightRem/2})) };
};

self.onmessage = (event: MessageEvent<WorkerEventData>) => {
    const { type, payload } = event.data;

    if (type === 'CALCULATE_LAYOUT') {
        const { eventsWithPos, timelineWidth, entityOrder, popupWidthRem, popupVerticalSpacingRem, swimlaneHeightRem, remInPx } = payload;
        
        const combinedLayout = calculateCombinedLayout(eventsWithPos, timelineWidth, popupWidthRem, popupVerticalSpacingRem, remInPx);
        self.postMessage({ type: 'COMBINED_LAYOUT_RESULT', payload: combinedLayout });

        const swimlaneLayout = calculateSwimlaneLayout(eventsWithPos, entityOrder, swimlaneHeightRem);
        self.postMessage({ type: 'SWIMLANE_LAYOUT_RESULT', payload: swimlaneLayout });
    }
};
