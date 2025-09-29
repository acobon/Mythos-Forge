// components/views/MaintenanceView.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { cleanBrokenReferences, cleanOrphanedItems, cleanOrphanedScenes } from '../../state/actions';
import { useI18n } from '../../hooks/useI18n';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';
import { BrokenReference, OrphanedItem } from '../../services/maintenanceService';
import { Wand2Icon, SearchIcon, LinkIcon, TagIcon, FileTextIcon } from '../common/Icons';
import { useToast } from '../../hooks/useToast';
import { NarrativeScene, StoryBible } from '../../types';
import { Spinner } from '../common/Spinner';
import { Button } from '../common/ui';
import { selectFullStoryBible } from '../../state/selectors';

interface MaintenanceTaskProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    scanType: string;
    worker: Worker | null;
    onClean: (results: any[]) => void;
    renderResultItem: (item: any, index: number) => React.ReactNode;
    getCleanButtonText: (count: number) => string;
    getCleanConfirmMessage: (count: number) => string;
    getScanResultsMessage: (count: number) => string;
    getNoResultsMessage: () => string;
}

const MaintenanceTask: React.FC<MaintenanceTaskProps> = ({
    title, description, icon, scanType, worker, onClean, renderResultItem, 
    getCleanButtonText, getCleanConfirmMessage, getScanResultsMessage, getNoResultsMessage
}) => {
    const storyBible = useAppSelector(selectFullStoryBible) as StoryBible;
    const [isScanning, setIsScanning] = useState(false);
    const [results, setResults] = useState<any[] | null>(null);
    const showConfirm = useConfirmationDialog();
    const currentScanType = useRef<string | null>(null);

    useEffect(() => {
        if (!worker) return;

        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === `${currentScanType.current}-results`) {
                setResults(event.data.results);
                setIsScanning(false);
            }
        };

        worker.addEventListener('message', handleMessage);
        return () => worker.removeEventListener('message', handleMessage);
    }, [worker]);

    const handleScan = useCallback(() => {
        if (!worker) return;
        setIsScanning(true);
        setResults(null);
        currentScanType.current = scanType;
        worker.postMessage({ type: scanType, storyBible });
    }, [worker, scanType, storyBible]);

    const handleClean = useCallback(() => {
        if (!results || results.length === 0) return;
        showConfirm({
            title: `Confirm Cleanup`,
            message: getCleanConfirmMessage(results.length),
            onConfirm: () => {
                onClean(results);
                handleScan(); // Rescan to confirm
            }
        });
    }, [results, showConfirm, onClean, handleScan, getCleanConfirmMessage]);

    return (
        <div className="bg-secondary p-6 rounded-lg border border-border-color">
            <h3 className="text-2xl font-semibold text-text-main flex items-center gap-3">
                {icon} {title}
            </h3>
            <p className="text-text-secondary mt-2 mb-4">{description}</p>
            <div className="flex items-center gap-4">
                <Button onClick={handleScan} disabled={isScanning} className="w-52">
                    {isScanning ? <Spinner /> : <><SearchIcon className="w-5 h-5 mr-2" /> Scan Project</>}
                </Button>
                {results && results.length > 0 && (
                    <Button onClick={handleClean} variant="destructive">
                        <Wand2Icon className="w-5 h-5 mr-2" /> {getCleanButtonText(results.length)}
                    </Button>
                )}
            </div>
            {results && (
                <div className="mt-6 animate-fade-in">
                    <p className={`font-semibold ${results.length > 0 ? 'text-highlight' : 'text-green-400'}`}>
                        {results.length > 0 ? getScanResultsMessage(results.length) : getNoResultsMessage()}
                    </p>
                    {results.length > 0 && (
                        <div className="mt-3 max-h-60 overflow-y-auto bg-primary border border-border-color rounded-md p-2 text-sm">
                            <ul className="space-y-1">{results.map(renderResultItem)}</ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const MaintenanceView: React.FC = () => {
    const dispatch = useAppDispatch();
    const { t } = useI18n();
    const { showToast } = useToast();
    const workerRef = useRef<Worker | null>(null);
    const [workerReady, setWorkerReady] = useState(false);

    useEffect(() => {
        const worker = new Worker(new URL('../../maintenance.worker.ts', import.meta.url), { type: 'module' });
        workerRef.current = worker;
        setWorkerReady(true);
        return () => {
            worker.terminate();
        };
    }, []);

    const onCleanBrokenReferences = useCallback(() => {
        dispatch(cleanBrokenReferences());
        showToast({ type: 'success', message: t('maintenance.clean.success') });
    }, [dispatch, showToast, t]);

    const onCleanOrphanedItems = useCallback((items: OrphanedItem[]) => {
        const payload = {
            tags: items.filter(i => i.itemType === 'Tag').map(i => i.id),
            themes: items.filter(i => i.itemType === 'Theme').map(i => i.id),
            conflicts: items.filter(i => i.itemType === 'Conflict').map(i => i.id),
        };
        dispatch(cleanOrphanedItems(payload));
        showToast({ type: 'success', message: 'Orphaned items cleaned up successfully.' });
    }, [dispatch, showToast]);

    const onCleanOrphanedScenes = useCallback((scenes: NarrativeScene[]) => {
        dispatch(cleanOrphanedScenes({ idsToDelete: scenes.map(s => s.id) }));
        showToast({ type: 'success', message: 'Orphaned scenes cleaned up successfully.' });
    }, [dispatch, showToast]);

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            <header className="mb-8">
                <h2 className="text-4xl font-bold text-text-main">{t('maintenance.title')}</h2>
                <p className="text-text-secondary mt-1">{t('maintenance.description')}</p>
            </header>
            
            <div className="space-y-6 max-w-4xl">
                <MaintenanceTask
                    title={t('maintenance.brokenRefs.title')}
                    description={t('maintenance.brokenRefs.description')}
                    icon={<LinkIcon className="w-6 h-6 text-accent" />}
                    scanType="scan-broken-references"
                    worker={workerRef.current}
                    onClean={onCleanBrokenReferences}
                    renderResultItem={(ref: BrokenReference, index: number) => (
                         <li key={index} className="p-2 rounded-md hover:bg-secondary">
                            <p className="font-semibold text-text-main truncate" title={ref.text}>{ref.text}</p>
                            <p className="text-xs text-text-secondary truncate">Found in: {ref.location}</p>
                        </li>
                    )}
                    getCleanButtonText={(count) => t('maintenance.clean.button', { count })}
                    getCleanConfirmMessage={(count) => t('maintenance.clean.confirm.message', { count })}
                    getScanResultsMessage={(count) => t('maintenance.scan.results.found', { count })}
                    getNoResultsMessage={() => t('maintenance.scan.results.none')}
                />
                <MaintenanceTask
                    title="Orphaned Items"
                    description="Find and remove unused Tags, Themes, and Conflicts that are not linked to any part of your project."
                    icon={<TagIcon className="w-6 h-6 text-accent" />}
                    scanType="scan-orphaned-items"
                    worker={workerRef.current}
                    onClean={onCleanOrphanedItems}
                    renderResultItem={(item: OrphanedItem, index: number) => {
                        const name = 'label' in item ? item.label : item.name;
                        return (
                            <li key={index} className="p-2 rounded-md hover:bg-secondary">
                                <p className="font-semibold text-text-main truncate" title={name}>{name}</p>
                                <p className="text-xs text-text-secondary">{item.itemType}</p>
                            </li>
                        );
                    }}
                    getCleanButtonText={(count) => `Clean ${count} Item(s)`}
                    getCleanConfirmMessage={(count) => `Are you sure you want to permanently delete ${count} unused item(s)? This can be undone.`}
                    getScanResultsMessage={(count) => `Scan complete. Found ${count} orphaned item(s).`}
                    getNoResultsMessage={() => 'Scan complete. No orphaned items found!'}
                />
                <MaintenanceTask
                    title="Orphaned Scenes"
                    description="Find and delete scenes that exist but are not part of any work or chapter."
                    icon={<FileTextIcon className="w-6 h-6 text-accent" />}
                    scanType="scan-orphaned-scenes"
                    worker={workerRef.current}
                    onClean={onCleanOrphanedScenes}
                    renderResultItem={(scene: NarrativeScene, index: number) => (
                         <li key={index} className="p-2 rounded-md hover:bg-secondary">
                            <p className="font-semibold text-text-main truncate" title={scene.title}>{scene.title}</p>
                            <p className="text-xs text-text-secondary">Last modified: {new Date(scene.lastModified).toLocaleDateString()}</p>
                        </li>
                    )}
                    getCleanButtonText={(count) => `Clean ${count} Scene(s)`}
                    getCleanConfirmMessage={(count) => `Are you sure you want to permanently delete ${count} orphaned scene(s)? This can be undone.`}
                    getScanResultsMessage={(count) => `Scan complete. Found ${count} orphaned scene(s).`}
                    getNoResultsMessage={() => 'Scan complete. No orphaned scenes found!'}
                />
            </div>
        </div>
    );
};

export default MaintenanceView;