



import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { WorldEvent, SceneWithPosition, EventWithLayout, WorldDate, SwimlaneEvent, Entity, TimelineViewMode } from '../../types/index';
import { sortScenes, formatWorldDate, getISOFromWorldDate, getTypedObjectValues } from '../../utils';
import { useDebounce } from '../../hooks/useDebounce';
import { UsersIcon, ChevronsRightIcon, ZoomInIcon, ZoomOutIcon } from './Icons';
import { 
    TIMELINE_POPUP_WIDTH_REM,
    TIMELINE_POPUP_VERTICAL_SPACING_REM,
    TIMELINE_SWIMLANE_HEIGHT_REM,
    Z_INDEX
} from '../../constants';
import EventPopup from './timeline/EventPopup';
import { useI18n } from '../../hooks/useI18n';
import { select, Selection } from 'd3-selection';
import { zoom, zoomIdentity, ZoomTransform, ZoomBehavior } from 'd3-zoom';
import { useAppSelector } from '../../state/hooks';
import { Button } from './ui';

interface SwimlaneEventLayout {
  id: string;
  originalId: string;
  yOffset: number;
}

// --- MAIN COMPONENT ---
interface TimelineChartProps {
  events: WorldEvent[];
  title: string;
  onEventClick?: (eventId: string) => void;
  onCanvasDoubleClick?: (isoDate: string) => void;
  tempMarkerIso?: string | null;
}

const TimelineChart: React.FC<TimelineChartProps> = ({ events, title, onEventClick, onCanvasDoubleClick, tempMarkerIso }) => {
  const { t } = useI18n();
  const calendar = useAppSelector(state => state.bible.present.project.calendar);
  const entities = useAppSelector(state => state.bible.present.entities.entities);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const [timelineWidth, setTimelineWidth] = useState(0);
  const debouncedTimelineWidth = useDebounce(timelineWidth, 200);
  const [openPopupId, setOpenPopupId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<TimelineViewMode>('combined');
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);

  const [combinedLayout, setCombinedLayout] = useState<{ events: EventWithLayout[], maxLevel: number }>({ events: [], maxLevel: 0 });
  const [swimlaneLayout, setSwimlaneLayout] = useState<{ events: SwimlaneEventLayout[], lanes: { entityId: string, yOffset: number }[] }>({ events: [], lanes: [] });
  
  const popupContainerRef = useRef<HTMLDivElement>(null);
  const activeTriggerRef = useRef<HTMLButtonElement | null>(null);

  const remInPx = useMemo(() => {
    if (typeof window === 'undefined') return 16; // Fallback for SSR or non-browser env
    return parseFloat(getComputedStyle(document.documentElement).fontSize);
  }, []);

  useEffect(() => {
      if (openPopupId && popupContainerRef.current) {
          popupContainerRef.current.focus();
      } else if (!openPopupId && activeTriggerRef.current) {
          activeTriggerRef.current.focus();
          activeTriggerRef.current = null;
      }
  }, [openPopupId]);


  const sortedEvents = useMemo(() => [...events].sort(sortScenes), [events]);
  const eventMap = useMemo(() => new Map(sortedEvents.map(e => [e.id, e])), [sortedEvents]);
  
  const { minTimestamp, maxTimestamp, timeSpan, timeScale } = useMemo(() => {
    if (sortedEvents.length === 0 && !tempMarkerIso) {
        // If no events, create a default timespan of one year for context
        const now = tempMarkerIso ? new Date(tempMarkerIso).getTime() : Date.now();
        const yearInMillis = 365 * 24 * 60 * 60 * 1000;
        const min = now - yearInMillis / 2;
        const max = now + yearInMillis / 2;
        const span = max - min;
        const scale = (timestamp: number) => ((timestamp - min) / span) * debouncedTimelineWidth;
        return { minTimestamp: min, maxTimestamp: max, timeSpan: span, timeScale: scale };
    }

    const eventTimestamps = sortedEvents.map(e => new Date(e.dateTime).getTime()).filter(t => !isNaN(t));
    const allTimestamps = tempMarkerIso ? [...eventTimestamps, new Date(tempMarkerIso).getTime()] : eventTimestamps;
    if (allTimestamps.length === 0 || debouncedTimelineWidth === 0) return { minTimestamp: 0, maxTimestamp: 0, timeSpan: 1, timeScale: (t: number) => 0 };
    
    const min = Math.min(...allTimestamps);
    const max = Math.max(...allTimestamps);
    const span = max - min > 0 ? max - min : 1;
    const scale = (timestamp: number) => ((timestamp - min) / span) * debouncedTimelineWidth;
    return { minTimestamp: min, maxTimestamp: max, timeSpan: span, timeScale: scale };
  }, [sortedEvents, debouncedTimelineWidth, tempMarkerIso]);
  
  const timeScaleInvert = useCallback((x: number) => {
    if (timeSpan === 0 || debouncedTimelineWidth === 0) return minTimestamp;
    return (x / debouncedTimelineWidth) * timeSpan + minTimestamp;
  }, [debouncedTimelineWidth, timeSpan, minTimestamp]);

  useEffect(() => {
    const element = svgRef.current;
    if (!element) return;
    const observer = new ResizeObserver(entries => entries[0] && setTimelineWidth(entries[0].contentRect.width));
    observer.observe(element);
    setTimelineWidth(element.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = select(svgRef.current);
    
    const zoomBehavior = zoom<SVGSVGElement, unknown>()
        .scaleExtent([1, 20])
        .filter((event) => {
            // Allow panning via left-click drag, and all wheel events for zooming.
            return !event.button || event.type === 'wheel';
        })
        .on('zoom', (event) => {
            setTransform(event.transform);
        });

    zoomRef.current = zoomBehavior;
    svg.call(zoomBehavior);
    
    return () => {
        svg.on('.zoom', null);
    };
  }, []);

  useEffect(() => {
    if (zoomRef.current && debouncedTimelineWidth > 0) {
        zoomRef.current
            .extent([[0, 0], [debouncedTimelineWidth, 200]])
            .translateExtent([[0, -Infinity], [debouncedTimelineWidth, Infinity]]);
    }
  }, [debouncedTimelineWidth]);


    const swimlaneEntityOrder = useMemo(() => {
        const involvedEntityIds = new Set(events.flatMap(e => e.entities));
        return (getTypedObjectValues(entities) as Entity[]).filter(e => involvedEntityIds.has(e.id));
    }, [events, entities]);

    // Correctly initialize and terminate the worker once per component lifecycle
    useEffect(() => {
        const worker = new Worker(new URL('../../timeline.worker.ts', import.meta.url), { type: 'module' });
        workerRef.current = worker;

        worker.onmessage = (event) => {
            const { type, payload } = event.data;
            if (type === 'COMBINED_LAYOUT_RESULT') {
                setCombinedLayout(payload as { events: EventWithLayout[]; maxLevel: number });
            } else if (type === 'SWIMLANE_LAYOUT_RESULT') {
                setSwimlaneLayout(payload as { events: SwimlaneEventLayout[]; lanes: { entityId: string; yOffset: number }[] });
            }
        };
        
        return () => {
            workerRef.current?.terminate();
            workerRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!workerRef.current || debouncedTimelineWidth === 0 || sortedEvents.length === 0) {
            if (sortedEvents.length === 0) { // Clear layout if no events
                setCombinedLayout({ events: [], maxLevel: 0 });
                setSwimlaneLayout({ events: [], lanes: [] });
            }
            return;
        };
        
        const eventsWithPos: SceneWithPosition[] = sortedEvents.map(e => ({
            ...e, 
            position: timeScale(new Date(e.dateTime).getTime())
        })).filter(e => !isNaN(e.position));
        
        const entityOrder = swimlaneEntityOrder.map((e: Entity) => e.id);

        workerRef.current.postMessage({
            type: 'CALCULATE_LAYOUT',
            payload: {
                eventsWithPos: eventsWithPos,
                timelineWidth: debouncedTimelineWidth,
                entityOrder,
                popupWidthRem: TIMELINE_POPUP_WIDTH_REM,
                popupVerticalSpacingRem: TIMELINE_POPUP_VERTICAL_SPACING_REM,
                swimlaneHeightRem: TIMELINE_SWIMLANE_HEIGHT_REM,
                remInPx: remInPx,
            }
        });

    }, [sortedEvents, debouncedTimelineWidth, swimlaneEntityOrder, timeScale, remInPx]);
    
    const handleZoomButtons = (factor: number) => {
        if (!svgRef.current || !zoomRef.current) return;
        const svg = select(svgRef.current);
        zoomRef.current.scaleBy(svg, factor);
    }

     const handleDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!onCanvasDoubleClick || !svgRef.current) return;

        // Prevent double click on an existing event marker
        const target = e.target as SVGElement;
        if (target.closest('button')) {
            return;
        }

        const rect = svgRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        
        const invertedX = transform.invertX(x);
        const timestamp = timeScaleInvert(invertedX);
        const isoDate = new Date(timestamp).toISOString();
        onCanvasDoubleClick(isoDate);
    };

    const eraMarkers = useMemo(() => {
        if (!calendar?.eras || timeSpan <= 1) return [];
        const sortedEras = [...calendar.eras].sort((a,b) => a.startYear - b.startYear);
        return sortedEras.map((era, index) => {
            try {
                const worldDate: WorldDate = { year: era.startYear, monthIndex: 0, day: 1, hour: 0, minute: 0, offset: '+00:00', month: calendar.months[0], dayOfWeek: calendar.daysOfWeek[0] };
                const iso = getISOFromWorldDate(worldDate, calendar);
                const timestamp = new Date(iso).getTime();
                const x = timeScale(timestamp);

                const nextEra = sortedEras[index + 1];
                const endTimestamp = nextEra 
                    ? new Date(getISOFromWorldDate({ ...worldDate, year: nextEra.startYear }, calendar)).getTime()
                    : maxTimestamp;
                const endX = timeScale(endTimestamp);
                
                return { name: era.name, x, width: endX - x };
            } catch {
                return null;
            }
        }).filter((item): item is { name: string; x: number; width: number; } => !!item);
    }, [calendar, timeScale, timeSpan, maxTimestamp]);


  if (events.length === 0 && !tempMarkerIso) {
    return <div className="p-4 bg-secondary rounded-lg border border-border-color"><h3 className="text-xl font-semibold mb-2">{title}</h3><p className="text-text-secondary">{t('timelineChart.noEvents')}</p></div>;
  }

  const containerMinHeight = viewMode === 'combined'
    ? `${12 + (combinedLayout.maxLevel * TIMELINE_POPUP_VERTICAL_SPACING_REM * 2)}rem`
    : `${(swimlaneEntityOrder.length * TIMELINE_SWIMLANE_HEIGHT_REM) + 4}rem`;
    
  const visibleRange = { start: transform.invertX(0), end: transform.invertX(debouncedTimelineWidth) };
  const visibleStartTime = (visibleRange.start / debouncedTimelineWidth) * timeSpan + minTimestamp;
  const visibleEndTime = (visibleRange.end / debouncedTimelineWidth) * timeSpan + minTimestamp;

  const tempMarkerX = tempMarkerIso ? timeScale(new Date(tempMarkerIso).getTime()) : null;


  return (
    <div className="p-6 bg-secondary rounded-lg border border-border-color relative">
      <div className="flex justify-between items-start mb-8">
        <h3 className="text-xl font-semibold text-text-main">{title}</h3>
        <div className="flex items-center space-x-2">
            <div className="bg-primary p-1 rounded-md border border-border-color flex items-center">
                 <Button onClick={() => setViewMode('combined')} variant={viewMode === 'combined' ? 'primary' : 'ghost'} size="sm" className="flex items-center gap-1"><ChevronsRightIcon className="w-4 h-4 -rotate-90"/> {t('timelineChart.combined')}</Button>
                 <Button onClick={() => setViewMode('swimlane')} variant={viewMode === 'swimlane' ? 'primary' : 'ghost'} size="sm" className="flex items-center gap-1"><UsersIcon className="w-4 h-4"/> {t('timelineChart.swimlanes')}</Button>
            </div>
            <div className="bg-primary p-1 rounded-md border border-border-color flex items-center">
                <Button onClick={() => handleZoomButtons(0.8)} variant="ghost" size="icon" title={t('timelineChart.zoomOut')} aria-label={t('timelineChart.zoomOut')}>
                    <ZoomOutIcon className="w-4 h-4 text-text-secondary"/>
                </Button>
                <Button onClick={() => handleZoomButtons(1.2)} variant="ghost" size="icon" title={t('timelineChart.zoomIn')} aria-label={t('timelineChart.zoomIn')}>
                    <ZoomInIcon className="w-4 h-4 text-text-secondary"/>
                </Button>
            </div>
        </div>
      </div>
      <div className="relative w-full py-4 overflow-hidden" style={{ minHeight: containerMinHeight }}>
        <svg ref={svgRef} onDoubleClick={handleDoubleClick} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing focus:outline-none" role="application" aria-label={`Interactive timeline of ${title}`}>
            <g transform={transform.toString()}>
              {eraMarkers.map((era, index) => (
                    <g key={era.name}>
                        <rect 
                            x={era.x} 
                            y={-1000} 
                            width={era.width} 
                            height={2000} 
                            fill={`var(--color-viz-${(index % 7) + 1})`}
                            opacity={0.08}
                        />
                        <line x1={era.x} x2={era.x} y1={-1000} y2={1000} stroke={`var(--color-viz-${(index % 7) + 1})`} strokeOpacity={0.3} strokeDasharray="4 2" />
                        <text x={era.x + 5} y={-4} fill="var(--color-text-secondary)" fontSize="10" style={{ transform: `scaleY(${1 / transform.k})`}}>
                            {t('timelineChart.era')}: {era.name}
                        </text>
                    </g>
                ))}
             {viewMode === 'combined' ? (
              <g style={{ transform: `translateY(50%)`}}>
                <line x1={0} x2={debouncedTimelineWidth} y1={0} y2={0} stroke="var(--color-border-color)" />
              </g>
            ) : (
                swimlaneLayout.lanes.map(({ entityId, yOffset }) => (
                    <g key={entityId} transform={`translate(0, ${yOffset * remInPx})`}>
                         <line x1={0} x2={debouncedTimelineWidth} y1={0} y2={0} stroke="var(--color-border-color)" strokeOpacity={0.5}/>
                    </g>
                ))
            )}
            </g>
        </svg>

        <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ transform: `translate(${transform.x}px, ${transform.y}px) scaleX(${transform.k})`}}>
            {tempMarkerX !== null && (
                <div className="absolute top-0 bottom-0 w-px bg-highlight animate-pulse" style={{ left: `${tempMarkerX}px`, transform: `scaleX(${1 / transform.k})`, zIndex: 100 }} />
            )}
            {viewMode === 'combined' ? (
            <div className="absolute top-1/2 w-full h-full" style={{ left: `0px`, width: `${debouncedTimelineWidth}px`, transform: `scaleY(${transform.k})` }}>
                {combinedLayout.events.map((event) => {
                    const { id, isUp, verticalOffset, position } = event;
                    
                    const isSticky = openPopupId === id;
                    const isHovered = hoveredId === id;
                    const isVisible = isSticky || isHovered;

                    return (
                    <div key={id} className="absolute top-0" style={{ transform: `translateX(${position}px)` }}>
                        <button
                            onMouseEnter={() => setHoveredId(id)}
                            onMouseLeave={() => setHoveredId(null)}
                            className={`absolute w-3 h-3 bg-accent rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-200 pointer-events-auto focus:outline-none focus:ring-2 focus:ring-highlight ${isSticky ? 'scale-150 ring-2 ring-highlight bg-highlight' : (isHovered ? 'scale-125' : 'hover:scale-125')}`}
                            onClick={(e) => {
                                activeTriggerRef.current = e.currentTarget;
                                setOpenPopupId(openPopupId === id ? null : id);
                                setHoveredId(null);
                            }}
                            aria-label={`View details for event: ${event.title}`}
                        />
                        <div 
                            className="absolute -translate-x-1/2 bg-border-color/50 transition-opacity w-px pointer-events-auto"
                            style={{
                                height: `${verticalOffset + 1.25}rem`,
                                bottom: isUp ? '0.375rem' : 'auto',
                                top: isUp ? 'auto' : '0.375rem',
                                opacity: isVisible ? 1 : 0,
                                transform: `scaleY(${1 / transform.k})` // Counter-scale the line
                            }}
                        />
                        {isVisible && (
                            <div
                                ref={popupContainerRef}
                                role="dialog"
                                aria-label={`Details for ${event.title}`}
                                tabIndex={-1}
                                className="absolute transition-opacity pointer-events-auto focus:outline-none"
                                style={{
                                    width: `${TIMELINE_POPUP_WIDTH_REM}rem`,
                                    left: '0', transform: `translateX(-50%) scale(${1 / transform.k})`,
                                    bottom: isUp ? `${verticalOffset + 1.25}rem` : 'auto',
                                    top: isUp ? 'auto' : `${verticalOffset + 1.25}rem`,
                                    zIndex: isSticky ? Z_INDEX.MODAL : Z_INDEX.MODAL - 1,
                                }}
                            >
                                <EventPopup event={event} onEventClick={onEventClick} onClose={() => setOpenPopupId(null)} isSticky={isSticky} />
                            </div>
                        )}
                   </div>
                )})}
            </div>
            ) : (
             <div className="absolute top-0 w-full h-full" style={{ left: `0px`, width: `${debouncedTimelineWidth}px` }}>
                {swimlaneLayout.lanes.map(({ entityId, yOffset }) => (
                     <div key={entityId} className="absolute left-0 w-32 bg-secondary/80 backdrop-blur-sm z-20 py-1 pointer-events-auto" style={{ top: `${yOffset}rem`, transform: `translateX(${-transform.x / transform.k}px) scaleX(${1 / transform.k})` }}>
                        <span className="text-sm font-semibold text-text-main">{entities[entityId]?.name}</span>
                    </div>
                ))}
                 {swimlaneLayout.events.map((eventLayout) => {
                     const { id, yOffset, originalId } = eventLayout;
                     const event = eventMap.get(originalId);
                     if (!event) return null;
                     const position = timeScale(new Date(event.dateTime).getTime());
                     
                     const uniquePopupId = `${originalId}-${id}`;
                     const isSticky = openPopupId === uniquePopupId;
                     const isHovered = hoveredId === uniquePopupId;
                     const isVisible = isSticky || isHovered;

                     return (
                     <div key={id} className="absolute" style={{ top: `${yOffset}rem`, transform: `translateX(${position}px)` }}>
                         <button
                            onMouseEnter={() => setHoveredId(uniquePopupId)}
                            onMouseLeave={() => setHoveredId(null)}
                            className={`absolute w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 pointer-events-auto focus:outline-none focus:ring-2 focus:ring-highlight ${isSticky ? 'scale-150 ring-2 ring-highlight bg-highlight' : (isHovered ? 'bg-accent scale-125' : 'bg-accent hover:scale-125')}`}
                            onClick={(e) => {
                                activeTriggerRef.current = e.currentTarget;
                                setOpenPopupId(openPopupId === uniquePopupId ? null : uniquePopupId);
                                setHoveredId(null);
                            }}
                            aria-label={`View details for event: ${event.title}`}
                         />
                          {isVisible && (
                             <div ref={popupContainerRef} role="dialog" aria-label={`Details for ${event.title}`} tabIndex={-1} className="absolute top-full left-0 mt-2 pointer-events-auto focus:outline-none" style={{ zIndex: isSticky ? Z_INDEX.MODAL : Z_INDEX.MODAL - 1, width: `${TIMELINE_POPUP_WIDTH_REM}rem`, transform: `translateX(-50%) scale(${1 / transform.k})` }} >
                                <EventPopup event={event} onEventClick={onEventClick} onClose={() => setOpenPopupId(null)} isSticky={isSticky}/>
                             </div>
                          )}
                     </div>
                )})}
             </div>
            )}
        </div>
        <div className="absolute top-full left-0 w-full flex justify-between mt-4">
          <span className="text-xs text-text-secondary">{formatWorldDate(new Date(visibleStartTime).toISOString(), calendar, {year: true})}</span>
          {sortedEvents.length > 1 && (<span className="text-xs text-text-secondary">{formatWorldDate(new Date(visibleEndTime).toISOString(), calendar, {year: true})}</span>)}
        </div>
        <p className="text-center text-xs text-text-secondary/70 mt-3">Drag to pan. Scroll to zoom. Double-click axis to create event.</p>
      </div>
    </div>
  );
};

export default TimelineChart;