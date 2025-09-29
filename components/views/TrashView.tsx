// components/views/TrashView.tsx
import React, { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { restoreFromTrash, removeFromTrash, emptyTrash } from '../../state/slices/projectSlice';
import { restoreSceneToChapter } from '../../state/slices/narrativeSlice';
import { useI18n } from '../../hooks/useI18n';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';
import EmptyState from '../common/EmptyState';
import { TrashIcon, RotateCcwIcon, SearchIcon } from '../common/Icons';
import { Button, Input } from '../common/ui';
import { TrashedItem, NarrativeScene } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';

const TrashView: React.FC = () => {
    const dispatch = useAppDispatch();
    const { trash } = useAppSelector(state => state.bible.present.project);
    const { works } = useAppSelector(state => state.bible.present.narrative);
    const { t } = useI18n();
    const showConfirm = useConfirmationDialog();

    const [filterType, setFilterType] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const filteredTrash = useMemo(() => {
        const query = debouncedSearchTerm.toLowerCase();
        return trash
            .filter(item => {
                const typeMatch = filterType === 'All' || item.itemType === filterType;
                if (!typeMatch) return false;
                if (!query) return true;
                const name = (item.item as any).name || (item.item as any).title || '';
                return name.toLowerCase().includes(query);
            })
            .sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
    }, [trash, filterType, debouncedSearchTerm]);

    const itemTypes = useMemo(() => ['All', ...Array.from(new Set(trash.map(item => item.itemType)))], [trash]);

    const handleRestore = (item: TrashedItem, originalIndex: number) => {
        if (item.itemType === 'Scene' && item.metadata?.workId && item.metadata?.chapterId) {
            const work = works[item.metadata.workId];
            const chapterExists = work?.chapters.some(c => c.id === item.metadata?.chapterId);
            
            if (chapterExists) {
                showConfirm({
                    title: `Restore Scene "${(item.item as NarrativeScene).title}"`,
                    message: "This scene's original chapter still exists. Where would you like to restore it?",
                    actions: [
                        { text: 'Cancel', onClick: () => {}, variant: 'ghost' },
                        {
                            text: 'Restore to Original Chapter',
                            onClick: () => {
                                dispatch(restoreSceneToChapter({ scene: item.item as NarrativeScene, workId: item.metadata!.workId!, chapterId: item.metadata!.chapterId! }));
                                dispatch(removeFromTrash(originalIndex));
                            },
                            variant: 'primary',
                        },
                        {
                            text: 'Restore to Unassigned',
                            onClick: () => {
                                dispatch(restoreSceneToChapter({ scene: item.item as NarrativeScene, workId: item.metadata!.workId!, chapterId: null }));
                                dispatch(removeFromTrash(originalIndex));
                            },
                            variant: 'secondary',
                        }
                    ]
                });
                return;
            }
        }
        
        // Default restore behavior for everything else
        dispatch(restoreFromTrash({ item, index: originalIndex }));
    };

    const handleDelete = (originalIndex: number) => {
        showConfirm({
            title: t('trash.deletePermanent.confirm.title'),
            message: t('trash.deletePermanent.confirm.message'),
            onConfirm: () => {
                dispatch(removeFromTrash(originalIndex));
            },
        });
    };

    const handleEmptyTrash = () => {
        showConfirm({
            title: t('trash.emptyTrash.confirm.title'),
            message: t('trash.emptyTrash.confirm.message'),
            onConfirm: () => {
                dispatch(emptyTrash());
            },
        });
    };

    return (
        <div className="p-4 md:p-8 h-full flex flex-col">
            <header className="flex justify-between items-center mb-6 flex-shrink-0">
                <div>
                    <h2 className="text-3xl font-bold text-text-main">{t('trash.title')}</h2>
                    <p className="text-text-secondary mt-1">{t('trash.description')}</p>
                </div>
                <Button variant="destructive" onClick={handleEmptyTrash} disabled={trash.length === 0}>
                    <TrashIcon className="w-5 h-5 mr-2" />
                    {t('trash.emptyTrash')}
                </Button>
            </header>

            <div className="flex-shrink-0 mb-4 flex gap-4">
                 <div className="relative flex-grow">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <Input type="search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search trash..." className="py-1.5 pl-9 pr-4 text-sm w-full" />
                </div>
                 <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-secondary border border-border-color rounded-md p-1.5 text-sm">
                    {itemTypes.map(type => <option key={type} value={type}>{type}</option>)}
                 </select>
            </div>

            <div className="flex-grow overflow-y-auto bg-secondary p-4 rounded-lg border border-border-color">
                {filteredTrash.length > 0 ? (
                    <div className="space-y-3">
                        {filteredTrash.map((trashedItem) => {
                             const originalIndex = trash.findIndex(i => (i.item as any)?.id === (trashedItem.item as any)?.id && i.deletedAt === trashedItem.deletedAt);
                            // FIX: Safely handle the any type of trashedItem.item to prevent type errors.
                            const item: any = trashedItem.item;

                            // Ensure item is an object with a valid id before proceeding
                            if (typeof item !== 'object' || item === null || typeof item.id === 'undefined') {
                                return null; // Skip rendering if item is invalid
                            }

                            const itemId = item.id;
                            const itemName = String(item.name || item.title || '');

                             return (
                            <div key={`${trashedItem.itemType}-${String(itemId)}-${trashedItem.deletedAt}`} className="bg-primary p-3 rounded-md border border-border-color flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-text-main">{itemName}</p>
                                    <p className="text-xs text-text-secondary">
                                        {trashedItem.itemType} | Deleted: {new Date(trashedItem.deletedAt).toLocaleString()}
                                    </p>
                                </div>
                                <div className="space-x-2">
                                    <Button size="sm" variant="secondary" onClick={() => handleRestore(trashedItem, originalIndex)}>
                                        <RotateCcwIcon className="w-4 h-4 mr-1" /> {t('trash.restore')}
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(originalIndex)}>
                                        <TrashIcon className="w-4 h-4 mr-1" /> {t('trash.deletePermanent')}
                                    </Button>
                                </div>
                            </div>
                        )})}
                    </div>
                ) : (
                    <EmptyState
                        icon={<TrashIcon className="w-16 h-16" />}
                        title={t('trash.empty')}
                        description={searchTerm || filterType !== 'All' ? 'No items match your filters.' : 'When you delete items, they will appear here.'}
                    />
                )}
            </div>
        </div>
    );
};

export default TrashView;