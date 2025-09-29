import React, { useState } from 'react';
import { ScenePacingInfo } from '../../../types';
import { useNavigation } from '../../../hooks/useNavigation';
import { Work } from '../../../types';

interface ScenePacingReportProps {
    data: ScenePacingInfo[];
    work: Work;
}

const ScenePacingReport: React.FC<ScenePacingReportProps> = ({ data, work }) => {
    const { navigateToScene } = useNavigation();
    const [hoveredScene, setHoveredScene] = useState<ScenePacingInfo | null>(null);

    const maxWordCount = React.useMemo(() => Math.max(1, ...data.map(d => d.wordCount)), [data]);

    const scenesByChapter = React.useMemo(() => {
        const grouped: { [key: string]: ScenePacingInfo[] } = {};
        data.forEach(scene => {
            if (!grouped[scene.chapterTitle]) {
                grouped[scene.chapterTitle] = [];
            }
            grouped[scene.chapterTitle].push(scene);
        });
        // Ensure "Unassigned" comes last
        const sortedKeys = Object.keys(grouped).sort((a, b) => {
            if (a === 'Unassigned') return 1;
            if (b === 'Unassigned') return -1;
            // Find chapter order from work
            const indexA = work.chapters.findIndex(c => c.title === a);
            const indexB = work.chapters.findIndex(c => c.title === b);
            return indexA - indexB;
        });
        return sortedKeys.map(key => ({ title: key, scenes: grouped[key] }));
    }, [data, work.chapters]);

    if (!data || data.length === 0) {
        return <p className="text-text-secondary p-4 bg-primary rounded-md">This work has no scenes with content to analyze.</p>;
    }

    return (
        <div>
            <h4 className="text-lg font-bold mb-2">Scene Pacing: {work.title}</h4>
            <p className="text-sm text-text-secondary mb-4">Word count per scene, in narrative order. Click a bar to navigate to the scene.</p>
            <div className="w-full h-[60vh] bg-primary p-4 rounded-md border border-border-color flex flex-col">
                <div className="flex-grow flex items-end gap-1 relative">
                    {scenesByChapter.map((chapterGroup, groupIndex) => (
                        <div key={chapterGroup.title} className={`h-full flex items-end gap-1 p-2 ${groupIndex % 2 === 0 ? 'bg-secondary/30' : ''}`} style={{ flexGrow: chapterGroup.scenes.length }}>
                            {chapterGroup.scenes.map(scene => (
                                <div
                                    key={scene.id}
                                    className="flex-1 h-full flex flex-col justify-end items-center group relative"
                                    onMouseEnter={() => setHoveredScene(scene)}
                                    onMouseLeave={() => setHoveredScene(null)}
                                >
                                    <button
                                        onClick={() => navigateToScene(work.id, scene.id)}
                                        className="w-full bg-accent hover:bg-highlight transition-colors"
                                        style={{ height: `${(scene.wordCount / maxWordCount) * 100}%` }}
                                        aria-label={`Scene: ${scene.title}, Word Count: ${scene.wordCount}`}
                                    />
                                </div>
                            ))}
                        </div>
                    ))}
                    {hoveredScene && (
                        <div className="absolute top-0 left-0 bg-secondary p-2 rounded shadow-lg text-xs pointer-events-none border border-border-color animate-fade-in">
                            <p className="font-bold">{hoveredScene.title}</p>
                            <p className="text-text-secondary">{hoveredScene.wordCount.toLocaleString()} words</p>
                        </div>
                    )}
                </div>
                 <div className="flex-shrink-0 flex pt-2 border-t border-border-color mt-2">
                    {scenesByChapter.map(chapterGroup => (
                        <div key={chapterGroup.title} className="text-center text-xs text-text-secondary font-semibold" style={{ flexGrow: chapterGroup.scenes.length }}>
                            {chapterGroup.title}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ScenePacingReport;