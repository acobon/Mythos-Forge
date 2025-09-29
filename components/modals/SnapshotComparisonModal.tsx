
// components/modals/SnapshotComparisonModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Snapshot, SnapshotMetadata, StoryBible } from '../../types/index';
import * as snapshotService from '../../services/snapshotService';
import { Spinner } from '../common/Spinner';
import { Select } from '../common/ui';
import { deepEqual } from '../../utils';

interface DiffResult {
    added: { [key: string]: string[] };
    removed: { [key: string]: string[] };
    modified: { [key: string]: string[] };
}

const diffStoryBibles = (bibleA: StoryBible, bibleB: StoryBible): DiffResult => {
    const result: DiffResult = { added: {}, removed: {}, modified: {} };
    const keysToCompare = ['entities', 'events', 'scenes', 'works', 'worldEvents', 'tags', 'themes', 'conflicts'] as const;

    keysToCompare.forEach(key => {
        const sliceA = bibleA[key] as Record<string, { name?: string, title?: string, label?: string, description?: string }>;
        const sliceB = bibleB[key] as Record<string, { name?: string, title?: string, label?: string, description?: string }>;
        const idsA = new Set(Object.keys(sliceA));
        const idsB = new Set(Object.keys(sliceB));

        const addedIds = [...idsB].filter(id => !idsA.has(id));
        const removedIds = [...idsA].filter(id => !idsB.has(id));
        const commonIds = [...idsA].filter(id => idsB.has(id));

        const getName = (item: any) => item.name || item.title || item.label || item.description?.substring(0, 20) || 'Untitled';
        
        result.added[key] = addedIds.map(id => getName(sliceB[id]));
        result.removed[key] = removedIds.map(id => getName(sliceA[id]));
        result.modified[key] = commonIds.filter(id => !deepEqual(sliceA[id], sliceB[id])).map(id => getName(sliceB[id]));
    });

    return result;
};


const DiffSection: React.FC<{ title: string; items: string[] }> = ({ title, items }) => {
    if (items.length === 0) return null;
    return (
        <div>
            <h4 className="font-semibold text-text-secondary">{title} ({items.length})</h4>
            <ul className="text-sm list-disc list-inside max-h-24 overflow-y-auto bg-primary p-2 rounded-md border border-border-color">
                {items.map((name, i) => <li key={i}>{name}</li>)}
            </ul>
        </div>
    );
};

const SnapshotComparisonModal: React.FC = () => {
    const [snapshots, setSnapshots] = useState<SnapshotMetadata[]>([]);
    const [snapAId, setSnapAId] = useState<string>('');
    const [snapBId, setSnapBId] = useState<string>('');
    const [diff, setDiff] = useState<DiffResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        snapshotService.getSnapshotsMetadata().then(meta => setSnapshots(meta.sort((a,b) => b.id - a.id)));
    }, []);

    useEffect(() => {
        const performDiff = async () => {
            if (snapAId && snapBId && snapAId !== snapBId) {
                setIsLoading(true);
                const [dataA, dataB] = await Promise.all([
                    snapshotService.getSnapshotData(Number(snapAId)),
                    snapshotService.getSnapshotData(Number(snapBId))
                ]);
                if (dataA && dataB) {
                    setDiff(diffStoryBibles(dataA, dataB));
                }
                setIsLoading(false);
            } else {
                setDiff(null);
            }
        };
        performDiff();
    }, [snapAId, snapBId]);

    const renderDiff = () => {
        if (isLoading) return <div className="flex justify-center items-center h-48"><Spinner size="lg" /></div>;
        if (!diff) return <p className="text-text-secondary text-center">Select two different snapshots to see the changes between them.</p>;
        
        const hasChanges = Object.values(diff).some(category => Object.values(category).some(items => (items as string[]).length > 0));

        if (!hasChanges) {
             return <p className="text-green-400 text-center font-semibold">No differences found between these two snapshots.</p>;
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                <div className="space-y-3">
                    <h3 className="text-lg font-bold text-green-400">Added</h3>
                    {Object.entries(diff.added).map(([key, items]) => <DiffSection key={key} title={key} items={items} />)}
                </div>
                <div className="space-y-3">
                     <h3 className="text-lg font-bold text-yellow-400">Modified</h3>
                     {Object.entries(diff.modified).map(([key, items]) => <DiffSection key={key} title={key} items={items} />)}
                </div>
                 <div className="space-y-3">
                     <h3 className="text-lg font-bold text-red-400">Removed</h3>
                     {Object.entries(diff.removed).map(([key, items]) => <DiffSection key={key} title={key} items={items} />)}
                </div>
            </div>
        );
    };
    
    return (
        <div className="h-[70vh] flex flex-col">
            <p className="text-text-secondary mb-4">Select an older snapshot ("From") and a newer one ("To") to see what has changed.</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="text-sm font-semibold">From:</label>
                    <Select value={snapAId} onChange={e => setSnapAId(e.target.value)}>
                        <option value="">Select older snapshot...</option>
                        {snapshots.map(s => <option key={s.id} value={s.id}>{s.message} ({new Date(s.id).toLocaleTimeString()})</option>)}
                    </Select>
                </div>
                 <div>
                    <label className="text-sm font-semibold">To:</label>
                    <Select value={snapBId} onChange={e => setSnapBId(e.target.value)}>
                        <option value="">Select newer snapshot...</option>
                        {snapshots.map(s => <option key={s.id} value={s.id}>{s.message} ({new Date(s.id).toLocaleTimeString()})</option>)}
                    </Select>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto bg-primary border border-border-color rounded-md p-4">
                {renderDiff()}
            </div>
        </div>
    );
};

export default SnapshotComparisonModal;
