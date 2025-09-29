import React, { useMemo } from 'react';
import { useI18n } from '../../../hooks/useI18n';
import { BarChartIcon } from '../../common/Icons';

interface WordCountTrendReportProps {
    data: Array<{ date: string; wordCount: number; }>;
}

const WordCountTrendReport: React.FC<WordCountTrendReportProps> = ({ data }) => {
    const { t } = useI18n();

    const chartData = useMemo(() => {
        const historyMap = new Map(data.map(h => [h.date, h.wordCount]));
        const points = [];
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().slice(0, 10);
            points.push({
                date: dateString,
                wordCount: historyMap.get(dateString) || 0,
            });
        }
        return points.reverse();
    }, [data]);

    if (chartData.every(d => d.wordCount === 0)) {
        return (
            <div className="text-center text-text-secondary p-8 h-64 flex flex-col items-center justify-center">
                <BarChartIcon className="w-12 h-12 mb-3 text-text-secondary/50" />
                <p>No writing activity recorded in the last 30 days.</p>
                <p className="text-xs mt-1">Changes to scene content will appear here.</p>
            </div>
        );
    }

    const maxAbsWords = Math.max(1, ...chartData.map(d => Math.abs(d.wordCount)));

    return (
        <div>
            <h4 className="text-lg font-bold mb-2">Word Count Trends (Last 30 Days)</h4>
            <p className="text-sm text-text-secondary mb-4">Daily net change in word count across all manuscripts.</p>
            <div className="w-full h-64 bg-primary p-4 rounded-md border border-border-color flex items-center gap-1 relative">
                <div className="absolute left-4 right-4 top-1/2 h-px bg-border-color/50" title="Zero words changed"></div>
                {chartData.map(({ date, wordCount }) => {
                    const heightPercent = (Math.abs(wordCount) / maxAbsWords) * 50;
                    const isPositive = wordCount >= 0;

                    return (
                        <div
                            key={date}
                            className="flex-1 h-full flex flex-col justify-center items-center group relative"
                            title={`${new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: ${wordCount >= 0 ? '+' : ''}${wordCount.toLocaleString()} words`}
                        >
                            <div
                                className={`w-full ${isPositive ? 'bg-accent' : 'bg-red-500'} hover:opacity-80 transition-opacity`}
                                style={{
                                    height: `${heightPercent}%`,
                                    transform: isPositive ? 'translateY(-100%)' : 'translateY(0)',
                                    position: 'absolute',
                                    top: '50%',
                                    minHeight: wordCount !== 0 ? '2px' : '0',
                                }}
                            />
                            <span className="text-xs text-text-secondary absolute -bottom-5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {new Date(date).toLocaleDateString(undefined, { day: 'numeric' })}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WordCountTrendReport;
