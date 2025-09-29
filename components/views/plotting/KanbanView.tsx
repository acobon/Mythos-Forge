// components/views/plotting/KanbanView.tsx
import React, { useMemo, useState, useRef, useEffect, memo, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../../state/hooks';
import { Work, NarrativeScene, Chapter, ModalType } from '../../../types/index';
import { useWorkActions } from '../../../hooks/useWorkActions';
import { useI18n } from '../../../hooks/useI18n';
import { useNavigation } from '../../../hooks/useNavigation';
import { pushModal, popModal } from '../../../state/uiSlice';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useKanbanDnD } from '../../../hooks/useKanbanDnD';
import { htmlToPlainText } from '../../../utils';
import { MoreVerticalIcon, PlusCircleIcon } from '../../common/Icons';
import { Button } from '../../common/ui';

interface KanbanSceneCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
    scene: NarrativeScene;
    onClick: (sceneId: string) => void;
    listeners?: any;
    isDragging?: boolean;
}

const KanbanSceneCard = memo(React.forwardRef<HTMLDivElement, KanbanSceneCardProps>(({ scene, onClick, listeners, isDragging, ...props }, ref) => {
    const { t } = useI18n();
    return (
        <div
            ref={ref}
            {...props}
            {...listeners}
            onClick={() => onClick(scene.id)}
            className={`p-2 bg-secondary rounded-md border border-border-color hover:border-accent shadow-sm transition-all cursor-grab focus:outline-none focus:ring-2 focus:ring-accent ${isDragging ? 'opacity-50' : ''}`}
            aria-label={t('plotting.sceneCard.description', { sceneTitle: scene.title })}
        >
            <p className="font-semibold text-sm">{scene.title}</p>
            <p className="text-xs text-text-secondary mt-1 line-clamp-2">{htmlToPlainText(scene.summary || scene.content) || t('plotting.sceneCard.noContent')}</p>
        </div>
    );
}));
KanbanSceneCard.displayName = 'KanbanSceneCard';

const SortableKanbanSceneCard: React.FC<{ scene: NarrativeScene; chapterId: string; onClick: (sceneId: string) => void; }> = ({ scene, chapterId, onClick }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: scene.id, data: { chapterId } });
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <KanbanSceneCard
            ref={setNodeRef}
            style={style}
            scene={scene}
            onClick={onClick}
            listeners={listeners}
            isDragging={isDragging}
            {...attributes}
        />
    );
};

interface KanbanViewProps {
    work: Work;
}

const KanbanView: React.FC<KanbanViewProps> = ({ work }) => {
    const { t } = useI18n();
    const dispatch = useAppDispatch();
    const { scenes: allScenes } = useAppSelector(state => state.bible.present.narrative);
    const { reorderScenes, addChapter, updateChapter, deleteChapter, saveScene } = useWorkActions();
    const { navigateToScene } = useNavigation();
    const addChapterButtonRef = useRef<HTMLButtonElement>(null);
    const showConfirm = useConfirmationDialog();

    const [editingChapter, setEditingChapter] = useState<{ id: string; title: string } | null>(null);
    const [chapterMenu, setChapterMenu] = useState<{ id: string; x: number; y: number } | null>(null);

    const boardData = useMemo(() => {
        if (!work) return [];
        const sceneMap = new Map<string, NarrativeScene>();
        work.sceneIds.forEach(id => {
            const scene = allScenes[id];
            if(scene) sceneMap.set(id, scene);
        });
        
        const result = work.chapters.map(chapter => ({
            chapter,
            scenes: chapter.sceneIds.map(id => sceneMap.get(id)).filter((s): s is NarrativeScene => !!s)
        }));

        const assignedSceneIds = new Set(result.flatMap(c => c.scenes.map(s => s.id)));
        const unassignedScenes = Array.from(sceneMap.values()).filter(s => !assignedSceneIds.has(s.id));
        
        if (unassignedScenes.length > 0) {
            const unassignedChapter: Chapter = { 
                id: 'unassigned', 
                title: t('plotting.unassigned'), 
                sceneIds: unassignedScenes.map(s => s.id)
            };
            result.push({ chapter: unassignedChapter, scenes: unassignedScenes });
        }
        return result;
    }, [work, allScenes, t]);

    const { activeId, sensors, handleDragStart, handleDragEnd, handleDragCancel } = useKanbanDnD({
        selectedWork: work,
        boardData,
        reorderScenes
    });
    
    const handleSceneClick = useCallback((sceneId: string) => {
        navigateToScene(work.id, sceneId);
    }, [navigateToScene, work.id]);
    
    const handleAddScene = (chapterId: string) => {
        const onSave = (workId: string, sceneData: Partial<NarrativeScene> & { title: string }) => {
            saveScene({ workId, sceneData: { ...sceneData, chapterId } });
            dispatch(popModal());
        };
        dispatch(pushModal({ type: ModalType.SCENE, props: { workId: work.id, onSave, chapterId } }));
    };

    const handleSaveChapterTitle = useCallback(() => {
        if (editingChapter && editingChapter.title.trim()) {
            updateChapter({ workId: work.id, chapterId: editingChapter.id, updates: { title: editingChapter.title } });
        }
        setEditingChapter(null);
    }, [editingChapter, updateChapter, work.id]);

    const handleDeleteChapter = useCallback((chapterId: string) => {
        showConfirm({
            title: 'Delete Chapter?',
            message: 'Are you sure? Scenes in this chapter will become unassigned. This action can be undone.',
            onConfirm: () => deleteChapter({ workId: work.id, chapterId })
        });
    }, [showConfirm, deleteChapter, work.id]);

    const activeScene = useMemo(() => activeId ? allScenes[activeId] : null, [activeId, allScenes]);

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
            <div className="absolute inset-0 p-4">
                <div className="flex h-full space-x-4">
                    {boardData.map(({ chapter, scenes }) => (
                        <div key={chapter.id} className="w-72 flex-shrink-0 h-full flex flex-col bg-primary rounded-md">
                            <div className="font-bold p-2 border-b border-border-color flex-shrink-0 flex justify-between items-center">
                                {editingChapter?.id === chapter.id ? (
                                    <input type="text" value={editingChapter.title} onChange={e => setEditingChapter({ ...editingChapter, title: e.target.value })} onBlur={handleSaveChapterTitle} onKeyDown={e => e.key === 'Enter' && handleSaveChapterTitle()} autoFocus className="bg-secondary w-full p-1 rounded-sm"/>
                                ) : (
                                    <h3 onClick={() => chapter.id !== 'unassigned' && setEditingChapter({ id: chapter.id, title: chapter.title })} className="flex-grow truncate cursor-pointer">{chapter.title}</h3>
                                )}
                                {chapter.id !== 'unassigned' && (
                                    <div className="relative">
                                        <button onClick={(e) => { e.stopPropagation(); setChapterMenu({id: chapter.id, x: e.clientX, y: e.clientY})}} className="p-1 hover:bg-secondary rounded-full" aria-label={`Chapter options for ${chapter.title}`}><MoreVerticalIcon className="w-4 h-4"/></button>
                                    </div>
                                )}
                            </div>
                            <SortableContext items={scenes.map(s => s.id)} id={chapter.id} strategy={verticalListSortingStrategy}>
                                <div className="flex-grow p-2 space-y-2 overflow-y-auto">
                                    {scenes.map((scene) => (
                                        <SortableKanbanSceneCard key={scene.id} scene={scene} chapterId={chapter.id} onClick={handleSceneClick} />
                                    ))}
                                    {chapter.id !== 'unassigned' && (
                                        <Button variant="ghost" size="sm" onClick={() => handleAddScene(chapter.id)} className="w-full mt-2">
                                            <PlusCircleIcon className="w-4 h-4 mr-1"/> Add Scene
                                        </Button>
                                    )}
                                </div>
                            </SortableContext>
                        </div>
                    ))}
                    <button ref={addChapterButtonRef} onClick={() => addChapter({ workId: work.id, title: 'New Chapter'})} className="w-72 h-12 flex-shrink-0 bg-primary/50 hover:bg-primary rounded-md flex items-center justify-center text-text-secondary font-semibold border-2 border-dashed border-border-color hover:border-accent">
                        <PlusCircleIcon className="w-5 h-5 mr-2"/> New Chapter
                    </button>
                </div>
            </div>
            <DragOverlay>{activeScene ? <KanbanSceneCard scene={activeScene} onClick={() => {}} isDragging={true} /> : null}</DragOverlay>
            {chapterMenu && (
                 <div className="fixed inset-0 z-50" onClick={() => setChapterMenu(null)}>
                    <div style={{ top: Math.min(chapterMenu.y, window.innerHeight - 80), left: Math.min(chapterMenu.x, window.innerWidth - 120) }} className="absolute bg-primary border border-border-color rounded-md shadow-lg p-1 text-sm">
                        <button onClick={() => { handleDeleteChapter(chapterMenu.id); setChapterMenu(null); }} className="w-full text-left px-2 py-1 text-red-400 hover:bg-red-500/20 rounded">Delete Chapter</button>
                    </div>
                 </div>
            )}
        </DndContext>
    );
};

export default KanbanView;