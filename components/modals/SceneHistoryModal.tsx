// components/modals/SceneHistoryModal.tsx
import React, { useState, useMemo } from 'react';
import { useAppSelector } from '../../state/hooks';
import { useWorkActions } from '../../hooks/useWorkActions';
import { SceneVersion } from '../../types/index';
import { Button } from '../common/ui';
import { RotateCcwIcon } from '../common/Icons';
import DOMPurify from 'dompurify';

// A simple line-diffing utility (Longest Common Subsequence based) for side-by-side view
const diffLines = (oldText: string, newText: string): { left: { n: number, text: string, type: string }[], right: { n: number, text: string, type: string }[] } => {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const dp = Array(oldLines.length + 1).fill(0).map(() => Array(newLines.length + 1).fill(0));

    for (let i = 1; i <= oldLines.length; i++) {
        for (let j = 1; j <= newLines.length; j++) {
            if (oldLines[i - 1] === newLines[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    const left: { n: number, text: string, type: string }[] = [];
    const right: { n: number, text: string, type: string }[] = [];
    let i = oldLines.length, j = newLines.length;
    let lineNumLeft = i, lineNumRight = j;

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
            left.unshift({ n: lineNumLeft--, text: oldLines[i - 1], type: 'common' });
            right.unshift({ n: lineNumRight--, text: newLines[j - 1], type: 'common' });
            i--; j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            left.unshift({ n: 0, text: '', type: 'empty' });
            right.unshift({ n: lineNumRight--, text: newLines[j - 1], type: 'added' });
            j--;
        } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
            left.unshift({ n: lineNumLeft--, text: oldLines[i - 1], type: 'removed' });
            right.unshift({ n: 0, text: '', type: 'empty' });
            i--;
        }
    }
    return { left, right };
};

const SideBySideDiffViewer: React.FC<{ oldHtml: string; newHtml: string }> = ({ oldHtml, newHtml }) => {
    const { left, right } = useMemo(() => diffLines(oldHtml, newHtml), [oldHtml, newHtml]);
    
    const lineClasses: Record<string, string> = {
        common: 'opacity-70',
        added: 'bg-green-500/20',
        removed: 'bg-red-500/20',
        empty: 'bg-primary'
    };

    return (
        <div className="flex-grow flex gap-4 overflow-y-auto bg-primary border border-border-color rounded-md font-mono text-xs">
            {/* Left Pane (Old) */}
            <div className="w-1/2">
                {left.map((line, index) => (
                    <div key={index} className={`flex ${lineClasses[line.type]}`}>
                        <span className="w-10 text-right pr-2 text-text-secondary/50 flex-shrink-0">{line.n > 0 ? line.n : ''}</span>
                        <div className="flex-grow" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(line.text || ' ') }} />
                    </div>
                ))}
            </div>
            {/* Right Pane (New) */}
            <div className="w-1/2 border-l border-border-color">
                 {right.map((line, index) => (
                    <div key={index} className={`flex ${lineClasses[line.type]}`}>
                        <span className="w-10 text-right pr-2 text-text-secondary/50 flex-shrink-0">{line.n > 0 ? line.n : ''}</span>
                        <div className="flex-grow" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(line.text || ' ') }} />
                    </div>
                ))}
            </div>
        </div>
    );
};


interface SceneHistoryModalProps {
    sceneId: string;
    onClose: () => void;
}

const SceneHistoryModal: React.FC<SceneHistoryModalProps> = ({ sceneId, onClose }) => {
    const scene = useAppSelector(state => state.bible.present.narrative.scenes[sceneId]);
    const { restoreSceneVersion } = useWorkActions();
    const [previewVersion, setPreviewVersion] = useState<SceneVersion | null>(null);

    const history = useMemo(() => {
        if (!scene?.history) return [];
        return [...scene.history].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [scene]);

    const handleRestore = (version: SceneVersion) => {
        restoreSceneVersion({ sceneId, version });
        onClose();
    };

    const formatDate = (timestamp: string) => {
        return new Date(timestamp).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    };

    return (
        <div className="flex h-[70vh] gap-4">
            <div className="w-1/3 border-r border-border-color pr-4">
                <h3 className="text-lg font-semibold mb-2">Versions</h3>
                <div className="space-y-1 max-h-full overflow-y-auto">
                    {history.length > 0 ? (
                        history.map(version => (
                            <button
                                key={version.timestamp}
                                onClick={() => setPreviewVersion(version)}
                                className={`w-full text-left p-2 rounded-md text-sm ${previewVersion?.timestamp === version.timestamp ? 'bg-accent text-white' : 'hover:bg-secondary'}`}
                            >
                                {formatDate(version.timestamp)}
                            </button>
                        ))
                    ) : (
                        <p className="text-sm text-text-secondary italic">No saved versions for this scene.</p>
                    )}
                </div>
            </div>
            <div className="w-2/3 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-semibold">
                        {previewVersion ? 'Comparing selected version to current' : 'Preview'}
                    </div>
                    {previewVersion && (
                         <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleRestore(previewVersion)}
                        >
                            <RotateCcwIcon className="w-4 h-4 mr-2" />
                            Restore This Version
                        </Button>
                    )}
                </div>
                {previewVersion ? (
                    <SideBySideDiffViewer oldHtml={previewVersion.content} newHtml={scene.content} />
                ) : (
                    <div className="flex-grow flex items-center justify-center bg-primary border border-border-color rounded-md">
                        <p className="text-text-secondary">Select a version to preview its content.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SceneHistoryModal;