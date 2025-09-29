// components/views/SnapshotView.tsx
import React, { useState } from 'react';
import { useSnapshots } from '../../hooks/useSnapshots';
import { ArchiveIcon, PlusCircleIcon, RotateCcwIcon, TrashIcon, RefreshCwIcon, ColumnsIcon } from '../common/Icons';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';
import EmptyState from '../common/EmptyState';
import { useI18n } from '../../hooks/useI18n';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { useToast } from '../../hooks/useToast';
import { Button } from '../common/ui/index';
import { pushModal } from '../../state/uiSlice';
import { ModalType, Snapshot } from '../../types/index';
import * as snapshotService from '../../services/snapshotService';

const SnapshotView: React.FC = () => {
    const { snapshots, createSnapshot, revertToSnapshot, deleteSnapshot, loading } = useSnapshots();
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const locale = useAppSelector(state => state.ui.locale);
    const showConfirm = useConfirmationDialog();
    const dispatch = useAppDispatch();
    const { t } = useI18n();
    const { showToast } = useToast();
    const [actioningId, setActioningId] = useState<number | null>(null);

    const handleCreate = async () => {
        setError('');
        const result = await createSnapshot(message);
        if (result.success) {
            showToast({ type: 'success', message: 'Snapshot created successfully!' });
            setMessage('');
        } else {
            setError(result.error || 'Failed to create snapshot.');
        }
    };

    const handleRevert = (id: number) => {
        const snapshot = snapshots.find(s => s.id === id);
        if (!snapshot) return;

        showConfirm({
            title: 'Revert to Snapshot?',
            message: `Are you sure you want to revert to "${snapshot.message}"?\n\nThis will replace your entire current project. This action is irreversible.`,
            onConfirm: async () => {
                setActioningId(id);
                await revertToSnapshot(id);
                showToast({ type: 'info', message: `Project reverted to snapshot "${snapshot.message}".` });
                setActioningId(null);
            },
        });
    };

    const handleDelete = (id: number) => {
        const snapshot = snapshots.find(s => s.id === id);
        if (!snapshot) return;

        showConfirm({
            title: 'Delete Snapshot?',
            message: 'Are you sure you want to permanently delete this snapshot? This action cannot be undone.',
            onConfirm: async () => {
                setActioningId(id);
                await deleteSnapshot(id);
                showToast({ type: 'info', message: `Snapshot "${snapshot.message}" deleted.` });
                setActioningId(null);
            },
        });
    };

    const handleInspect = async (id: number) => {
        const fullSnapshot = await snapshotService.getSnapshotData(id);
        if (fullSnapshot) {
            const snapshotWithMetadata: Snapshot = {
                id,
                message: snapshots.find(s => s.id === id)?.message || '',
                entityCount: snapshots.find(s => s.id === id)?.entityCount || 0,
                eventCount: snapshots.find(s => s.id === id)?.eventCount || 0,
                data: fullSnapshot
            };
            dispatch(pushModal({
                type: ModalType.SNAPSHOT_INSPECTOR,
                props: { snapshot: snapshotWithMetadata }
            }));
        } else {
            showToast({ type: 'error', message: 'Could not load snapshot data.' });
        }
    };
    
    const handleCompare = () => {
        dispatch(pushModal({ type: ModalType.SNAPSHOT_COMPARISON, props: {} }));
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString(String(locale), { dateStyle: 'long', timeStyle: 'short' });
    };

    return (
        <div className="p-4 md:p-8 h-full flex flex-col">
            <header className="flex justify-between items-center mb-6 flex-shrink-0">
                <div>
                    <h2 className="text-3xl font-bold text-text-main">Project Snapshots</h2>
                    <p className="text-text-secondary mt-1">Create and manage versioned backups of your project.</p>
                </div>
                 <Button variant="secondary" onClick={handleCompare} disabled={snapshots.length < 2}>
                    <ColumnsIcon className="w-5 h-5 mr-2" />
                    Compare Snapshots
                </Button>
            </header>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
                <div className="md:col-span-2 bg-secondary p-4 rounded-lg border border-border-color h-full flex flex-col">
                    <h3 className="text-xl font-semibold text-text-main mb-4 flex-shrink-0">
                        Saved Snapshots ({snapshots.length})
                    </h3>
                    <div className="flex-grow overflow-y-auto pr-2">
                        {loading ? (
                            <p className="text-text-secondary">Loading snapshots...</p>
                        ) : snapshots.length > 0 ? (
                            <div className="space-y-3">
                                {[...snapshots].reverse().map(snapshot => (
                                    <div
                                        key={snapshot.id}
                                        className="bg-primary p-3 rounded-md border border-border-color group"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div
                                                className="flex-grow cursor-pointer"
                                                onClick={() => handleInspect(snapshot.id)}
                                            >
                                                <p className="font-semibold text-text-main group-hover:text-accent">
                                                    {snapshot.message}
                                                </p>
                                                <p className="text-xs text-text-secondary">{formatDate(snapshot.id)}</p>
                                            </div>
                                            <div className="flex items-center space-x-2 flex-shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRevert(snapshot.id)}
                                                    disabled={!!actioningId}
                                                    aria-label="Revert to snapshot"
                                                >
                                                    {actioningId === snapshot.id ? (
                                                        <RefreshCwIcon className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <RotateCcwIcon className="w-4 h-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(snapshot.id)}
                                                    disabled={!!actioningId}
                                                    aria-label="Delete snapshot"
                                                >
                                                    {actioningId === snapshot.id ? (
                                                        <RefreshCwIcon className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <TrashIcon className="w-4 h-4 text-red-500" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="text-xs text-text-secondary mt-2 pt-2 border-t border-border-color flex gap-4">
                                            <span>Entities: {snapshot.entityCount}</span>
                                            <span>Events: {snapshot.eventCount}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={<ArchiveIcon className="w-16 h-16" />}
                                title={t('snapshots.empty.title')}
                                description={t('snapshots.empty.description')}
                            />
                        )}
                    </div>
                </div>
                <div className="bg-secondary p-4 rounded-lg border border-border-color">
                    <h3 className="text-xl font-semibold text-text-main mb-4">Create New Snapshot</h3>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="snapshot-message" className="block text-sm font-medium text-text-secondary">
                                Message
                            </label>
                            <input
                                id="snapshot-message"
                                type="text"
                                value={message}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setMessage(e.target.value);
                                    setError('');
                                }}
                                placeholder="e.g., Finished Chapter 1"
                                className={`w-full mt-1 bg-primary border rounded-md p-2 text-text-main focus:ring-2 focus:outline-none transition-colors ${
                                    error
                                        ? 'border-red-500 focus:ring-red-500'
                                        : 'border-border-color focus:ring-accent'
                                }`}
                            />
                            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                        </div>
                        <Button onClick={handleCreate} className="w-full">
                            <PlusCircleIcon className="w-5 h-5 mr-2" />
                            Save Snapshot
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SnapshotView;