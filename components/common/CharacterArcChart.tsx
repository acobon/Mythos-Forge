
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { CharacterEntity, HistoricalEvent, NarrativeScene, Work, TranslationKey } from '../../types';
import { formatWorldDate, getTypedObjectValues } from '../../utils';
import { HelpCircleIcon } from './Icons';
import { useI18n } from '../../hooks/useI18n';
import { useAppSelector } from '../../state/hooks';

const ARCS: { key: string; label: TranslationKey }[] = [
  { key: 'incitingIncident', label: 'entityDetail.arc.incitingIncident' },
  { key: 'risingAction', label: 'entityDetail.arc.risingAction' },
  { key: 'midpoint', label: 'entityDetail.arc.midpoint' },
  { key: 'darkMoment', label: 'entityDetail.arc.darkMoment' },
  { key: 'climax', label: 'entityDetail.arc.climax' },
  { key: 'fallingAction', label: 'entityDetail.arc.fallingAction' },
  { key: 'resolution', label: 'entityDetail.arc.resolution' },
];

const STAGE_COLORS = [
  'var(--color-viz-1)',
  'var(--color-viz-2)',
  'var(--color-viz-3)',
  'var(--color-viz-4)',
  'var(--color-viz-5)',
  'var(--color-viz-6)',
  'var(--color-viz-7)',
];

interface CharacterArcChartProps {
  entity: CharacterEntity;
  highlightElement?: (id: string) => void;
}

const CharacterArcChart: React.FC<CharacterArcChartProps> = ({ entity, highlightElement }) => {
  const { works, scenes: allScenesMap } = useAppSelector(state => state.bible.present.narrative);
  const { events: allHistoricalEvents } = useAppSelector(state => state.bible.present.events);
  const { calendar } = useAppSelector(state => state.bible.present.project);
  const [hoveredStageKey, setHoveredStageKey] = useState<string | null>(null);
  const { t } = useI18n();
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    const chartElement = chartRef.current;
    if (!chartElement) return;

    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        setChartWidth(entries[0].contentRect.width);
      }
    });

    resizeObserver.observe(chartElement);
    return () => resizeObserver.disconnect();
  }, []);


  const arcData = useMemo(() => {
    if (!entity.characterArc) return null;

    const allScenes = new Map<string, NarrativeScene & { workTitle: string }>();
    (getTypedObjectValues(works) as Work[]).forEach(work => {
        const allWorkSceneIds = new Set([...work.sceneIds, ...work.chapters.flatMap(c => c.sceneIds)]);
        allWorkSceneIds.forEach(sceneId => {
             const scene = allScenesMap[sceneId];
            if (scene) {
                allScenes.set(sceneId, { ...scene, workTitle: work.title });
            }
        });
    });
    
    const allEventsMap = new Map<string, HistoricalEvent>((getTypedObjectValues(allHistoricalEvents) as HistoricalEvent[]).map(e => [e.id, e]));

    const stages = ARCS.map(({ key, label }, index) => {
      const stageData = entity.characterArc?.[key];
      if (!stageData) return null;

      const sceneTimestamps = (stageData.linkedSceneIds || [])
        .flatMap(sceneId => {
          const scene = allScenes.get(sceneId);
          if (!scene) return [];
          return (scene.linkedEventIds || [])
            .map(eventId => allEventsMap.get(eventId)?.startDateTime)
            .filter((d): d is string => !!d);
        })
        .map(dateStr => new Date(dateStr).getTime())
        .filter(ts => !isNaN(ts));

      const eventTimestamps = (stageData.linkedEventIds || [])
        .map(eventId => allEventsMap.get(eventId)?.startDateTime)
        .filter((d): d is string => !!d)
        .map(dateStr => new Date(dateStr).getTime())
        .filter(ts => !isNaN(ts));

      const allTimestamps = [...sceneTimestamps, ...eventTimestamps];
      if (allTimestamps.length === 0) return null;

      const earliestTimestamp = Math.min(...allTimestamps);

      const scenesForTooltip = (stageData.linkedSceneIds || []).map(id => allScenes.get(id)).filter((s): s is NarrativeScene & { workTitle: string } => !!s);
      const eventsForTooltip = (stageData.linkedEventIds || []).map(id => allEventsMap.get(id)).filter((e): e is HistoricalEvent => !!e);

      return {
        key,
        label: t(label),
        description: stageData.description,
        scenes: scenesForTooltip,
        events: eventsForTooltip,
        timestamp: earliestTimestamp,
        color: STAGE_COLORS[index % STAGE_COLORS.length],
        value: stageData.emotionalValue ?? 0,
      };
    }).filter((s): s is NonNullable<typeof s> => s !== null);

    if (stages.length < 2) return null;

    const sortedStages = stages.sort((a, b) => a.timestamp - b.timestamp);
    const minTimestamp = sortedStages[0].timestamp;
    const maxTimestamp = sortedStages[sortedStages.length - 1].timestamp;
    const timeSpan = maxTimestamp - minTimestamp || 1;

    return { minTimestamp, maxTimestamp, timeSpan, positionedStages: sortedStages };
  }, [entity.characterArc, works, allHistoricalEvents, allScenesMap, t]);
  
  const handleStageClick = (stage: (NonNullable<typeof arcData>)['positionedStages'][0]) => {
    if (!highlightElement) return;

    if (stage.events.length > 0) {
        highlightElement(stage.events[0].id);
        return;
    }
    
    if (stage.scenes.length > 0) {
        for (const scene of stage.scenes) {
            if (scene.linkedEventIds && scene.linkedEventIds.length > 0) {
                highlightElement(scene.linkedEventIds[0]);
                return;
            }
        }
    }
  };

  if (!arcData) {
    return (
      <section>
        <h3 className="text-xl font-semibold">{t('entityDetail.arc.visualization.title')}</h3>
        <div className="bg-secondary p-6 rounded-md border border-dashed border-border-color text-center text-text-secondary">
          <HelpCircleIcon className="w-12 h-12 mx-auto mb-3 text-text-secondary/50" />
          <h4 className="font-semibold text-text-main">{t('entityDetail.arc.visualization.empty.title')}</h4>
          <p className="text-sm mt-1">{t('entityDetail.arc.visualization.empty.subtitle')}</p>
        </div>
      </section>
    );
  }

  const hoveredStage = arcData.positionedStages.find(s => s.key === hoveredStageKey);
  const chartHeight = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const xScale = (timestamp: number) => {
      if (innerWidth <= 0) return padding.left;
      return padding.left + ((timestamp - arcData.minTimestamp) / arcData.timeSpan) * innerWidth;
  };

  const yScale = (value: number) => {
      const yRange = 20; // -10 to 10
      const yMin = -10;
      return padding.top + innerHeight * (1 - ((value - yMin) / yRange));
  };
  
  const pathData = arcData.positionedStages.map(p => `${xScale(p.timestamp)},${yScale(p.value)}`).join(' L ');

  return (
    <details open>
        <summary className="text-xl font-semibold mb-2 cursor-pointer">{t('entityDetail.arc.visualization.title')}</summary>
        <div ref={chartRef} className="bg-secondary p-4 mt-2 rounded-md border border-border-color relative">
        <svg width="100%" height={chartHeight} aria-label={`Character arc chart for ${entity.name}`}>
          {/* Y-axis lines and labels */}
          <line x1={padding.left} y1={yScale(10)} x2={chartWidth - padding.right} y2={yScale(10)} strokeDasharray="2,2" stroke="var(--color-border-color)" />
          <text x="5" y={yScale(10)} dy=".3em" fontSize="10" fill="var(--color-text-secondary)">High</text>
          <line x1={padding.left} y1={yScale(0)} x2={chartWidth - padding.right} y2={yScale(0)} stroke="var(--color-border-color)" />
          <text x="5" y={yScale(0)} dy=".3em" fontSize="10" fill="var(--color-text-secondary)">Neutral</text>
          <line x1={padding.left} y1={yScale(-10)} x2={chartWidth - padding.right} y2={yScale(-10)} strokeDasharray="2,2" stroke="var(--color-border-color)" />
          <text x="5" y={yScale(-10)} dy=".3em" fontSize="10" fill="var(--color-text-secondary)">Low</text>
          {/* X-axis line */}
          <line x1={padding.left} y1={chartHeight - padding.bottom} x2={chartWidth - padding.right} y2={chartHeight - padding.bottom} stroke="var(--color-border-color)" />

          {/* Path for the arc */}
          {pathData && <path d={`M ${pathData}`} fill="none" stroke="var(--color-accent)" strokeWidth="2" />}

          {/* Circles for each stage */}
          {arcData.positionedStages.map(stage => (
            <circle
              key={stage.key}
              cx={xScale(stage.timestamp)}
              cy={yScale(stage.value)}
              r="6"
              fill={stage.color}
              stroke="var(--color-secondary)"
              strokeWidth="2"
              onMouseEnter={() => setHoveredStageKey(stage.key)}
              onMouseLeave={() => setHoveredStageKey(null)}
              onClick={() => handleStageClick(stage)}
              className="cursor-pointer transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-highlight"
              tabIndex={0}
              aria-label={`Arc stage: ${stage.label}, Emotional value: ${stage.value}`}
            />
          ))}
        </svg>

        <div className="flex justify-between mt-2 text-xs text-text-secondary" style={{ paddingLeft: padding.left, paddingRight: padding.right }}>
          <span>{formatWorldDate(new Date(arcData.minTimestamp).toISOString(), calendar, { year: true })}</span>
          <span>{formatWorldDate(new Date(arcData.maxTimestamp).toISOString(), calendar, { year: true })}</span>
        </div>
        
        {hoveredStage && (
          <div
            className="absolute z-10 w-80 bg-primary border border-border-color rounded-lg shadow-2xl p-3 animate-fade-in pointer-events-none"
            style={{
              top: `${yScale(hoveredStage.value)}px`,
              left: `${xScale(hoveredStage.timestamp)}px`,
              transform: 'translate(-50%, -110%)',
            }}
          >
            <h4 className="font-bold text-text-main flex items-center">
              <div className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: hoveredStage.color }}></div>
              {hoveredStage.label} (Value: {hoveredStage.value})
            </h4>
            <p className="text-xs text-text-secondary mt-1 italic line-clamp-2">{hoveredStage.description || "No description."}</p>
            {hoveredStage.events.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border-color">
                <h5 className="text-xs font-semibold text-text-secondary mb-1">{t('entityDetail.arc.events')}:</h5>
                <ul className="text-xs text-text-main list-disc list-inside">
                    {hoveredStage.events.map(event => <li key={event.id} className="truncate" title={event.description}>{event.description}</li>)}
                </ul>
                </div>
            )}
            {hoveredStage.scenes.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border-color">
                <h5 className="text-xs font-semibold text-text-secondary mb-1">{t('entityDetail.arc.scenes')}:</h5>
                <ul className="text-xs text-text-main list-disc list-inside">
                    {hoveredStage.scenes.map(scene => <li key={scene.id} className="truncate">{scene.workTitle} - {scene.title}</li>)}
                </ul>
                </div>
            )}
          </div>
        )}
      </div>
    </details>
  );
};

export default CharacterArcChart;
