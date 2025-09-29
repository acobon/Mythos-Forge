// components/views/WorksOrganizerView.tsx
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { PlusCircleIcon, BookOpenIcon, EditIcon, TrashIcon, MenuIcon, ChevronsRightIcon } from '../common/Icons';
import { Work, Series, Collection, ModalType } from '../../types/index';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';
import { useNavigation } from '../../hooks/useNavigation';
import EmptyState from '../common/EmptyState';
import { useI18n } from '../../hooks/useI18n';
import { getTypedObjectValues, arrayMove } from '../../utils';
import { onboardingRefService } from '../../services/onboardingRefService';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    TouchSensor,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useWorkActions } from '../../hooks/useWorkActions';
import { Button } from '../common/ui';
import { pushModal, popModal } from '../../state/uiSlice';

interface WorkCardProps extends React.HTMLAttributes<HTMLDivElement> {
    work: Work;
    onNavigate: () => void;
    onEdit: () => void;
    onDelete: () => void;
    isDragging?: boolean;
    listeners?: any;
}

const WorkCard = React.forwardRef<HTMLDivElement, WorkCardProps>(({ work, onNavigate, onEdit, onDelete, isDragging, listeners, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={`flex items-center justify-between p-2 rounded-md group bg-primary border border-border-color ${isDragging ? 'opacity-50 shadow-lg' : 'hover:bg-secondary'}`}
            {...props}
        >
            <div className="flex items-center gap-2 flex-grow min-w-0">
                <div {...listeners} className="cursor-grab p-1 text-text-secondary">
                    <MenuIcon className="w-5 h-5" />
                </div>
                <span onClick={onNavigate} className="font-semibold truncate cursor-pointer hover:underline">{work.title}</span>
            </div>
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={onEdit}><EditIcon className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={onDelete}><TrashIcon className="w-4 h-4 text-red-500" /></Button>
            </div>
        </div>
    );
});
WorkCard.displayName = 'WorkCard';


const SortableWorkItem: React.FC<{
    work: Work;
    onNavigate: (id: string) => void;
    onEdit: (work: Work) => void;
    onDelete: (work: Work) => void;
    isSortable: boolean;
}> = ({ work, onNavigate, onEdit, onDelete, isSortable }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: work.id, disabled: !isSortable });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <WorkCard
                work={work}
                onNavigate={() => onNavigate(work.id)}
                onEdit={() => onEdit(work)}
                onDelete={() => onDelete(work)}
                isDragging={isDragging}
                listeners={isSortable ? listeners : undefined}
            />
        </div>
    );
};


const SeriesCollectionHeader: React.FC<{
    item: Series | Collection;
    type: 'Series' | 'Collection';
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ item, type, isCollapsed, onToggleCollapse, onEdit, onDelete }) => (
    <div className="flex items-center justify-between p-2 rounded-md group bg-secondary border border-border-color">
        <div className="flex items-center gap-2 flex-grow min-w-0 cursor-pointer" onClick={onToggleCollapse}>
            <ChevronsRightIcon className={`w-5 h-5 transition-transform ${!isCollapsed ? 'rotate-90' : ''}`} />
            <span className="font-bold text-lg truncate">{item.title}</span>
            <span className="text-sm text-text-secondary">{type}</span>
        </div>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(); }}><EditIcon className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }}><TrashIcon className="w-4 h-4 text-red-500" /></Button>
        </div>
    </div>
);


const WorksOrganizerView: React.FC = () => {
    const dispatch = useAppDispatch();
    const { t } = useI18n();
    const { works, series, collections } = useAppSelector(state => state.bible.present.narrative);
    const { saveWork, deleteWork, saveSeries, deleteSeries, saveCollection, deleteCollection, reorderWorksInSeries } = useWorkActions();
    const { navigateToWork } = useNavigation();
    const showConfirm = useConfirmationDialog();

    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
    const [activeId, setActiveId] = useState<string | null>(null);
    const addWorkButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (addWorkButtonRef.current) {
            onboardingRefService.register('add-work-button', addWorkButtonRef.current);
            return () => onboardingRefService.register('add-work-button', null);
        }
    }, []);

    const toggleCollapse = (id: string) => {
        setCollapsedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const worksArray = useMemo(() => getTypedObjectValues(works) as Work[], [works]);
    const seriesArray = useMemo(() => getTypedObjectValues(series) as Series[], [series]);
    const collectionsArray = useMemo(() => getTypedObjectValues(collections) as Collection[], [collections]);

    const displayItems = useMemo(() => {
        const items: { id: string, type: string, data: any, parentId?: string }[] = [];
        const workMap = new Map(worksArray.map(w => [w.id, w]));
        const usedWorkIds = new Set<string>();

        seriesArray.forEach(s => {
            items.push({ id: s.id, type: 'series', data: s });
            s.workIds.forEach(workId => {
                const work = workMap.get(workId);
                if (work) {
                    items.push({ id: work.id, type: 'work', data: work, parentId: s.id });
                    usedWorkIds.add(work.id);
                }
            });
        });

        collectionsArray.forEach(c => {
            items.push({ id: c.id, type: 'collection', data: c });
            c.workIds.forEach(workId => {
                const work = workMap.get(workId);
                if (work) {
                    items.push({ id: work.id, type: 'work', data: work, parentId: c.id });
                    usedWorkIds.add(work.id);
                }
            });
        });
        
        const standaloneWorks = worksArray.filter(w => !w.seriesId && !w.collectionId);
        if (standaloneWorks.length > 0) {
            items.push({id: 'standalone', type: 'standalone_header', data: { title: 'Standalone Works'}});
            standaloneWorks.forEach(w => {
                 items.push({ id: w.id, type: 'work', data: w, parentId: 'standalone' });
            });
        }
        

        return items;
    }, [worksArray, seriesArray, collectionsArray]);

    const handleOpenModal = (type: 'Work' | 'Series' | 'Collection', itemToEdit?: Work | Series | Collection) => {
        const onSave = (data: any, isEditing: boolean) => {
            if (type === 'Work') saveWork(data, isEditing);
            if (type === 'Series') saveSeries(data);
            if (type === 'Collection') saveCollection(data);
            dispatch(popModal());
        };
        
        const modalType = type === 'Work' ? ModalType.WORK : (type === 'Series' ? ModalType.SERIES : ModalType.COLLECTION);
        const props = type === 'Work' ? { workId: itemToEdit?.id, onSave } :
                      type === 'Series' ? { seriesId: itemToEdit?.id, onSave } :
                      { collectionId: itemToEdit?.id, onSave };
                      
        dispatch(pushModal({ type: modalType, props: props as any }));
    };

    const handleDelete = (type: 'Work' | 'Series' | 'Collection', item: Work | Series | Collection) => {
        showConfirm({
            title: `Delete ${type}?`,
            message: `Are you sure you want to delete "${item.title}"? This can be undone from the trash.`,
            onConfirm: () => {
                if (type === 'Work') deleteWork(item.id);
                if (type === 'Series') deleteSeries(item.id);
                if (type === 'Collection') deleteCollection(item.id);
            }
        });
    };
    
    const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
    const activeItem = useMemo(() => displayItems.find(item => item.id === activeId), [activeId, displayItems]);

    const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);
    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
        if (over && active.id && over.id && active.id !== over.id) {
            const activeItem = displayItems.find(i => i.id === String(active.id));
            const overItem = displayItems.find(i => i.id === String(over.id));

            if (activeItem?.type === 'work' && overItem?.type === 'work' && activeItem.parentId && activeItem.parentId === overItem.parentId && activeItem.parentId.startsWith('series')) {
                const series = seriesArray.find(s => s.id === activeItem.parentId);
                if (series) {
                    const oldIndex = series.workIds.indexOf(String(active.id));
                    const newIndex = series.workIds.indexOf(String(over.id));
                    const reordered = arrayMove(series.workIds, oldIndex, newIndex);
                    reorderWorksInSeries({ seriesId: series.id, workIds: reordered });
                }
            }
        }
    };
    
    if (worksArray.length === 0 && seriesArray.length === 0 && collectionsArray.length === 0) {
        return <EmptyState icon={<BookOpenIcon className="w-16 h-16" />} title={t('works.empty.title')} description={t('works.empty.description')}>
            <Button onClick={() => handleOpenModal('Work')} ref={addWorkButtonRef}>
                <PlusCircleIcon className="w-5 h-5 mr-2" /> {t('works.empty.action')}
            </Button>
        </EmptyState>
    }

    return (
        <div className="p-4 md:p-8 h-full flex flex-col">
            <header className="flex-shrink-0 mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-text-main">Works Organizer</h2>
                    <p className="text-text-secondary mt-1">Manage all your manuscripts, series, and collections.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => handleOpenModal('Collection')}>New Collection</Button>
                    <Button variant="secondary" onClick={() => handleOpenModal('Series')}>New Series</Button>
                    <Button ref={addWorkButtonRef} onClick={() => handleOpenModal('Work')}>
                        <PlusCircleIcon className="w-5 h-5 mr-2" /> New Work
                    </Button>
                </div>
            </header>
            <div className="flex-grow overflow-y-auto pr-2">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <SortableContext items={displayItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4">
                            {displayItems.map(item => {
                                if (item.type === 'series' || item.type === 'collection') {
                                    const isCollapsed = collapsedIds.has(item.id);
                                    const worksInContainer = displayItems.filter(i => i.parentId === item.id);
                                    return (
                                        <div key={item.id}>
                                            <SeriesCollectionHeader 
                                                item={item.data} 
                                                type={item.type === 'series' ? 'Series' : 'Collection'} 
                                                isCollapsed={isCollapsed}
                                                onToggleCollapse={() => toggleCollapse(item.id)}
                                                onEdit={() => handleOpenModal(item.type === 'series' ? 'Series' : 'Collection', item.data)}
                                                onDelete={() => handleDelete(item.type === 'series' ? 'Series' : 'Collection', item.data)}
                                            />
                                            {!isCollapsed && worksInContainer.length > 0 && (
                                                 <div className="pl-8 pt-2 space-y-2">
                                                    {worksInContainer.map(workItem => (
                                                        <SortableWorkItem 
                                                            key={workItem.id} 
                                                            work={workItem.data}
                                                            onNavigate={navigateToWork}
                                                            onEdit={() => handleOpenModal('Work', workItem.data)}
                                                            onDelete={() => handleDelete('Work', workItem.data)}
                                                            isSortable={item.type === 'series'}
                                                        />
                                                    ))}
                                                 </div>
                                            )}
                                        </div>
                                    );
                                }
                                if(item.type === 'standalone_header') {
                                    return <h3 key={item.id} className="text-lg font-bold text-text-secondary mt-6 border-b border-border-color pb-1">{item.data.title}</h3>
                                }
                                if (item.type === 'work' && item.parentId === 'standalone') {
                                    return <SortableWorkItem 
                                                key={item.id} 
                                                work={item.data}
                                                onNavigate={navigateToWork}
                                                onEdit={() => handleOpenModal('Work', item.data)}
                                                onDelete={() => handleDelete('Work', item.data)}
                                                isSortable={false}
                                            />
                                }
                                return null;
                            })}
                        </div>
                    </SortableContext>
                    <DragOverlay>
                        {activeItem?.type === 'work' ? (
                            <WorkCard
                                work={activeItem.data}
                                onNavigate={() => {}}
                                onEdit={() => {}}
                                onDelete={() => {}}
                                isDragging
                            />
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>
        </div>
    );
};

export default WorksOrganizerView;