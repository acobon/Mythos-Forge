

import React, { useMemo, useState } from 'react';
import { Work, ModalType } from '../../types';
import { htmlToPlainText } from '../../utils';
import { BookOpenIcon, EditIcon, KanbanSquareIcon, UsersIcon, BarChartIcon } from '../common/Icons';
import { selectTotalWordCount, selectWordCountByScene } from '../../state/selectors';
import { useProjectSettingsActions } from '../../hooks/useProjectSettingsActions';
import { StoryBible } from '../../types';
import { useAppSelector } from '../../state/hooks';
import { getTypedObjectValues } from '../../utils';

const StatCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <div className="bg-primary p-4 rounded-lg border border-border-color">
        <p className="text-sm text-text-secondary">{title}</p>
        <p className="text-2xl font-bold text-text-main">{value.toLocaleString()}</p>
    </div>
);

const ProgressBar: React.FC<{ label: string; value: number; max: number; unit: string; }> = ({ label, value, max, unit }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-text-main">{label}</span>
                <span className="text-text-secondary">{value.toLocaleString()} / {max.toLocaleString()} {unit}</span>
            </div>
            <div className="w-full bg-primary rounded-full h-4 border border-border-color">
                <div className="bg-accent h-full rounded-full" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
            </div>
        </div>
    );
};

const WritingHistoryChart: React.FC = () => {
    const { writingHistory = [] } = useAppSelector(state => state.bible.present.project);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const chartData = useMemo(() => {
        const historyMap = new Map(writingHistory.map(h => [h.date, h.wordCount]));
        const data = [];
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i)); // Iterate from 29 days ago to today
            const dateString = date.toISOString().slice(0, 10);
            data.push({
                date: dateString,
                wordCount: historyMap.get(dateString) || 0,
            });
        }
        return data;
    }, [writingHistory]);

    if (chartData.every(d => d.wordCount === 0)) {
        return (
            <div className="text-center text-text-secondary p-8 h-64 flex flex-col items-center justify-center">
                <BarChartIcon className="w-12 h-12 mb-3 text-text-secondary/50" />
                <p>No writing activity recorded in the last 30 days.</p>
                <p className="text-xs mt-1">Changes to scene content will appear here.</p>
            </div>
        );
    }

    const maxWords = Math.max(0, ...chartData.map(d => d.wordCount));
    const minWords = Math.min(0, ...chartData.map(d => d.wordCount));
    const range = Math.max(1, maxWords - minWords);

    const width = 500;
    const height = 200;
    const padding = { top: 10, right: 10, bottom: 20, left: 10 };

    const xScale = (index: number) => padding.left + (index / (chartData.length - 1)) * (width - padding.left - padding.right);
    const yScale = (count: number) => height - padding.bottom - ((count - minWords) / range) * (height - padding.top - padding.bottom);

    const linePath = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.wordCount)}`).join(' ');
    const areaPath = `${linePath} V ${yScale(0)} H ${xScale(0)} Z`;

    const hoveredData = hoveredIndex !== null ? chartData[hoveredIndex] : null;

    return (
        <div className="relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64">
                <line x1={padding.left} y1={yScale(0)} x2={width - padding.right} y2={yScale(0)} stroke="var(--color-border-color)" strokeDasharray="2 2" />
                
                <path d={areaPath} fill="url(#gradient)" />
                <path d={linePath} fill="none" stroke="var(--color-accent)" strokeWidth="2" />

                <defs>
                    <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.4}/>
                        <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0}/>
                    </linearGradient>
                </defs>

                {chartData.map((d, i) => (
                    <circle
                        key={d.date}
                        cx={xScale(i)}
                        cy={yScale(d.wordCount)}
                        r="4"
                        fill="var(--color-accent)"
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className="cursor-pointer"
                    />
                ))}

                 {hoveredData && hoveredIndex !== null && (
                    <g transform={`translate(${xScale(hoveredIndex)}, ${yScale(hoveredData.wordCount)})`}>
                        <circle r="6" fill="var(--color-highlight)" />
                    </g>
                )}
            </svg>
            {hoveredData && hoveredIndex !== null && (
                <div
                    className="absolute bg-secondary p-2 rounded-md shadow-lg text-xs pointer-events-none border border-border-color"
                    style={{
                        left: `${(xScale(hoveredIndex) / width) * 100}%`,
                        top: `${(yScale(hoveredData.wordCount) / height) * 100}%`,
                        transform: 'translate(-50%, -120%)'
                    }}
                >
                    <p className="font-bold">{new Date(hoveredData.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                    <p>{hoveredData.wordCount.toLocaleString()} words</p>
                </div>
            )}
        </div>
    );
};

const WritingAnalyticsView: React.FC = () => {
    const { works } = useAppSelector(state => state.bible.present.narrative);
    const { writingGoals } = useAppSelector(state => state.bible.present.project);
    // FIX: Explicitly cast the return value to resolve a type inference issue.
    const totalWordCount = useAppSelector(selectTotalWordCount) as number;
    // FIX: Explicitly cast the return value to resolve type inference issues.
    const wordCountByScene = useAppSelector(selectWordCountByScene) as Map<string, number>;
    const worksArray = useMemo(() => getTypedObjectValues(works) as Work[], [works]);
    const [selectedWorkId, setSelectedWorkId] = useState<string>(worksArray[0]?.id || '');

    const workWordCounts = useMemo(() => {
        return worksArray.map(work => {
            const allWorkSceneIds = [...work.sceneIds, ...work.chapters.flatMap(c => c.sceneIds)];
            const wordCount = allWorkSceneIds.reduce((sum, sceneId) => sum + (wordCountByScene.get(sceneId) || 0), 0);
            return { ...work, wordCount, sceneCount: allWorkSceneIds.length };
        });
    }, [worksArray, wordCountByScene]);
    
    const chapterWordCounts = useMemo(() => {
        const work = works[selectedWorkId];
        if (!work) return [];

        return work.chapters.map(chapter => {
            const wordCount = chapter.sceneIds.reduce((sum, sceneId) => sum + (wordCountByScene.get(sceneId) || 0), 0);
            return { ...chapter, wordCount };
        });
    }, [selectedWorkId, works, wordCountByScene]);
    
    const maxWorkWords = Math.max(1, ...workWordCounts.map(p => p.wordCount));
    const maxChapterWords = Math.max(1, ...chapterWordCounts.map(c => c.wordCount));

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            <h2 className="text-3xl font-bold text-text-main mb-6">Writing Analytics</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <section className="bg-secondary p-4 rounded-lg border border-border-color">
                        <h3 className="text-xl font-semibold mb-3">Project Goals</h3>
                        <ProgressBar label="Total Word Count" value={totalWordCount} max={writingGoals.projectWordGoal} unit="words" />
                    </section>
                     <section className="bg-secondary p-4 rounded-lg border border-border-color">
                        <h3 className="text-xl font-semibold mb-3">Manuscript Overview</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <StatCard title="Total Works" value={worksArray.length} />
                            <StatCard title="Total Scenes" value={Object.keys(useAppSelector(state => state.bible.present.narrative.scenes)).length} />
                            <StatCard title="Total Chapters" value={worksArray.reduce((sum, p) => sum + p.chapters.length, 0)} />
                            <StatCard title="Total Words" value={totalWordCount} />
                        </div>
                    </section>
                </div>
                <div className="space-y-6">
                    <section className="bg-secondary p-4 rounded-lg border border-border-color">
                        <h3 className="text-xl font-semibold mb-3">Words per Work</h3>
                        <div className="space-y-2">
                            {workWordCounts.map(work => (
                                <div key={work.id}>
                                    <p className="text-sm font-semibold">{work.title} <span className="text-text-secondary font-normal">({work.wordCount.toLocaleString()} words)</span></p>
                                    <div className="w-full bg-primary rounded-full h-4 mt-1 border border-border-color">
                                        <div className="bg-highlight h-full rounded-full" style={{ width: `${(work.wordCount / maxWorkWords) * 100}%`}}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-secondary p-4 rounded-lg border border-border-color">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xl font-semibold">Words per Chapter</h3>
                             {worksArray.length > 0 && <select value={selectedWorkId} onChange={e => setSelectedWorkId(e.target.value)} className="bg-primary border border-border-color rounded-md p-1 text-sm">
                                {worksArray.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                            </select>}
                        </div>
                        <div className="space-y-2">
                            {chapterWordCounts.length > 0 ? chapterWordCounts.map(chapter => (
                                <div key={chapter.id}>
                                    <p className="text-sm font-semibold">{chapter.title} <span className="text-text-secondary font-normal">({chapter.wordCount.toLocaleString()} words)</span></p>
                                    <div className="w-full bg-primary rounded-full h-4 mt-1 border border-border-color">
                                        <div className="bg-accent h-full rounded-full" style={{ width: `${(chapter.wordCount / maxChapterWords) * 100}%`}}></div>
                                    </div>
                                </div>
                            )) : <p className="text-sm text-text-secondary text-center p-4">Select a work to see chapter details.</p>}
                        </div>
                    </section>
                </div>
            </div>
             <section className="bg-secondary p-4 rounded-lg border border-border-color mt-6">
                <h3 className="text-xl font-semibold mb-3">Daily Writing History (Last 30 Days)</h3>
                <WritingHistoryChart />
            </section>
        </div>
    );
};

export default WritingAnalyticsView;