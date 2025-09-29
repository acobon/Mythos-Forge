
import React, { useState, useMemo, useCallback } from 'react';
import { Work, EntityId, OrphanedEntity, PovDistribution, InteractionMatrix, ScenePacingInfo, TagThemeFrequencyData, StoryBible } from '../../types';
import { findOrphanedEntities, calculatePovDistribution, calculateEntityInteractionMatrix, getExplicitRelationshipGraph, getWordCountHistory, getScenePacing, getTagAndThemeFrequency, RelationshipGraphData } from '../../services/reportingService';
import { UsersIcon, BookOpenIcon, LinkIcon, PieChartIcon, BarChartIcon, TagIcon } from '../common/Icons';
import { useI18n } from '../../hooks/useI18n';
import OrphanedEntitiesReport from './reports/OrphanedEntitiesReport';
import PovDistributionReport from './reports/PovDistributionReport';
import { InteractionMatrixReport } from './reports/InteractionMatrixReport';
import RelationshipMapReport from './reports/RelationshipMapReport';
import WordCountTrendReport from './reports/WordCountTrendReport';
import ScenePacingReport from './reports/ScenePacingReport';
import TagThemeFrequencyReport from './reports/TagThemeFrequencyReport';
import { useNavigation } from '../../hooks/useNavigation';
import { Spinner } from '../common/Spinner';
import { useAppSelector } from '../../state/hooks';
import { getTypedObjectValues } from '../../utils';
import EmptyState from '../common/EmptyState';
import { REPORT_TYPE } from '../../constants';
import { selectFullStoryBible } from '../../state/selectors';

type ReportType = typeof REPORT_TYPE[keyof typeof REPORT_TYPE];
type ReportData = OrphanedEntity[] | PovDistribution | InteractionMatrix | RelationshipGraphData | ScenePacingInfo[] | TagThemeFrequencyData | Array<{ date: string; wordCount: number; }>;

const ReportsView: React.FC = () => {
  const storyBible = useAppSelector(selectFullStoryBible) as StoryBible;
  const { navigateToEntity } = useNavigation();
  const { t } = useI18n();
  const worksArray = useMemo(() => getTypedObjectValues(storyBible.works) as Work[], [storyBible.works]);
  
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [selectedWorkId, setSelectedWorkId] = useState<string>(worksArray[0]?.id || '');
  const [isLoading, setIsLoading] = useState(false);

  const reportData = useMemo<ReportData | null>(() => {
      if (!selectedReport) return null;
      
      let data: ReportData | undefined;
      switch (selectedReport) {
        case REPORT_TYPE.ORPHANED:
          data = findOrphanedEntities(storyBible);
          break;
        case REPORT_TYPE.POV:
          if (selectedWorkId) {
            const work = storyBible.works[selectedWorkId];
            if (work) data = calculatePovDistribution(work, storyBible);
          }
          break;
        case REPORT_TYPE.INTERACTION_MATRIX:
          data = calculateEntityInteractionMatrix(storyBible);
          break;
        case REPORT_TYPE.RELATIONSHIP_MAP:
          data = getExplicitRelationshipGraph(storyBible);
          break;
        case REPORT_TYPE.WORD_COUNT_TREND:
          data = getWordCountHistory(storyBible);
          break;
        case REPORT_TYPE.SCENE_PACING:
          if (selectedWorkId) {
              const sceneData = getScenePacing(storyBible, selectedWorkId);
              if(sceneData) data = sceneData;
          }
          break;
        case REPORT_TYPE.TAG_THEME_FREQUENCY:
          data = getTagAndThemeFrequency(storyBible);
          break;
      }
      return data || null;
  }, [storyBible, selectedReport, selectedWorkId]);

  const handleRunReport = useCallback(async (reportType: ReportType) => {
    setIsLoading(true);
    setSelectedReport(reportType);
    // Use a timeout to allow the UI to update to a loading state
    setTimeout(() => {
        setIsLoading(false);
    }, 50); // Small delay to show loading state for heavy reports
  }, []);

  const ReportContent: React.FC = () => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary p-8">
                <Spinner size="lg" />
                <p className="mt-4">{t('reports.generating')}</p>
            </div>
        );
    }

    if (!selectedReport || reportData === null) {
      return (
        <EmptyState
            icon={<PieChartIcon className="w-16 h-16" />}
            title={t('reports.selectReport')}
            description={t('reports.selectReport.subtitle')}
        />
      );
    }

    switch (selectedReport) {
      case REPORT_TYPE.ORPHANED:
        return <OrphanedEntitiesReport data={reportData as OrphanedEntity[]} />;
      case REPORT_TYPE.POV:
        return <PovDistributionReport data={reportData as PovDistribution} />;
      case REPORT_TYPE.INTERACTION_MATRIX:
        return <InteractionMatrixReport data={reportData as InteractionMatrix} onSelectEntity={navigateToEntity} />;
      case REPORT_TYPE.RELATIONSHIP_MAP:
        return <RelationshipMapReport data={reportData as RelationshipGraphData} onNodeClick={(node) => navigateToEntity(node.id)} />;
      case REPORT_TYPE.WORD_COUNT_TREND:
        return <WordCountTrendReport data={reportData as Array<{ date: string; wordCount: number; }>} />;
      case REPORT_TYPE.SCENE_PACING: {
          const work = worksArray.find(w => w.id === selectedWorkId);
          return work ? <ScenePacingReport data={reportData as ScenePacingInfo[]} work={work} /> : null;
      }
      case REPORT_TYPE.TAG_THEME_FREQUENCY:
          return <TagThemeFrequencyReport data={reportData as TagThemeFrequencyData} />;
      default: return null;
    }
  };

  const reportButtons: { type: ReportType, label: string, icon: React.ReactNode }[] = [
      { type: REPORT_TYPE.ORPHANED, label: t('reports.orphaned.button'), icon: <UsersIcon className="w-5 h-5" /> },
      { type: REPORT_TYPE.POV, label: t('reports.pov.button'), icon: <BookOpenIcon className="w-5 h-5" /> },
      { type: REPORT_TYPE.INTERACTION_MATRIX, label: t('reports.interactionMatrix.button'), icon: <UsersIcon className="w-5 h-5" /> },
      { type: REPORT_TYPE.RELATIONSHIP_MAP, label: t('reports.relationshipMap.button'), icon: <LinkIcon className="w-5 h-5" /> },
      { type: REPORT_TYPE.WORD_COUNT_TREND, label: t('reports.wordCountTrend.button'), icon: <BarChartIcon className="w-5 h-5" /> },
      { type: REPORT_TYPE.SCENE_PACING, label: t('reports.scenePacing.button'), icon: <BarChartIcon className="w-5 h-5" /> },
      { type: REPORT_TYPE.TAG_THEME_FREQUENCY, label: t('reports.tagThemeFrequency.button'), icon: <TagIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="p-4 md:p-8 h-full flex flex-col md:flex-row">
      <aside className="w-full md:w-1/4 md:border-r border-border-color md:pr-6 mb-6 md:mb-0 flex-shrink-0">
        <h2 className="text-2xl font-bold mb-6">{t('reports.title')}</h2>
        <nav className="space-y-2">
            {reportButtons.map(button => (
                <div key={button.type}>
                    <button onClick={() => handleRunReport(button.type)} className={`w-full text-left p-2 rounded flex items-center gap-3 ${selectedReport === button.type ? 'bg-secondary text-accent' : 'hover:bg-secondary'}`}>
                       {button.icon} {button.label}
                    </button>
                    {(button.type === REPORT_TYPE.POV || button.type === REPORT_TYPE.SCENE_PACING) && selectedReport === button.type && (
                         <div className="pl-6 mt-2 animate-fade-in">
                            <label className="text-xs text-text-secondary block mb-1">{t('reports.selectWork')}</label>
                            <select
                            value={selectedWorkId}
                            onChange={e => {
                                setSelectedWorkId(e.target.value);
                                // No need to manually set data, useMemo will handle it.
                            }}
                            className="w-full bg-primary border border-border-color rounded-md p-1.5 text-sm"
                            >
                            {worksArray.length > 0 ?
                                worksArray.map(p => <option key={p.id} value={p.id}>{p.title}</option>) :
                                <option disabled>{t('reports.noWorks')}</option>
                            }
                            </select>
                        </div>
                    )}
                </div>
            ))}
        </nav>
      </aside>
      <main className="w-full md:w-3/4 md:pl-6 overflow-y-auto">
        <div className="bg-secondary p-6 rounded-lg border border-border-color min-h-full">
          <ReportContent />
        </div>
      </main>
    </div>
  );
};

export default ReportsView;
