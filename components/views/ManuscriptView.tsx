// components/views/ManuscriptView.tsx
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Work, NarrativeScene, Chapter, ModalType } from '../../types/index';
import { EditIcon, TrashIcon, PanelRightIcon, MinimizeIcon, ArrowLeftIcon, ArrowRightIcon, ArchiveIcon, RotateCcwIcon, MessageCircleIcon } from '../common/Icons';
import RichTextEditor from '../common/RichTextEditor';
import { calculateWordCount, getTypedObjectValues } from '../../utils';
import { useDebounce } from '../../hooks/useDebounce';
import EmptyView from './manuscript/EmptyView';
import ReferencePanel from './manuscript/ReferencePanel';
import CommentSidebar from './manuscript/CommentSidebar';
import { useToast } from '../../hooks/useToast';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { useWorkActions } from '../../hooks/useWorkActions';
import { pushModal, popModal, showDialog, toggleDistractionFreeMode } from '../../state/uiSlice';
import { setSelectedWorkId, setSelectedSceneId } from '../../state/slices/narrativeSlice';


const ManuscriptView = () => {
    const dispatch = useAppDispatch();
    const { works, scenes: allScenes, selectedWorkId, selectedSceneId } = useAppSelector(state => state.bible.present.narrative);
    const { entities } = useAppSelector(state => state.bible.present.entities);
    const { distractionFreeMode, autosaveDelay } = useAppSelector(state => state.ui);
    const { saveWork, deleteScene, saveScene, updateNarrativeScene, saveSceneVersion, exportManuscript } = useWorkActions();
    const { showToast } = useToast();
    
    const [isReferencePanelOpen, setIsReferencePanelOpen] = useState(false);
    const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);
    
    const worksArray = useMemo(() => getTypedObjectValues(works) as Work[], [works]);
    const selectedWork = useMemo(() => worksArray.find(p => p.id === selectedWorkId), [worksArray, selectedWorkId]);
    const selectedScene = useMemo(() => selectedSceneId ? allScenes[selectedSceneId] : undefined, [allScenes, selectedSceneId]);

    const [draftContent, setDraftContent] = useState(selectedScene?.content || '');
    const debouncedContent = useDebounce(draftContent, autosaveDelay);
    const latestJsonRef = useRef<any>(selectedScene?.jsonContent || null);
    const editorRef = useRef<{ editor: any }>(null);


    const workScenes = useMemo(() => {
        if (!selectedWork) return [];
        return (selectedWork.sceneIds as string[]).map(id => allScenes[id]).filter(Boolean);
    }, [selectedWork, allScenes]);

    const unassignedScenes = useMemo(() => {
        if (!selectedWork) return [];
        const assignedSceneIds = new Set((selectedWork.chapters as Chapter[]).flatMap(c => c.sceneIds));
        return workScenes.filter(s => !assignedSceneIds.has(s.id));
    }, [selectedWork, workScenes]);

    const orderedSceneIds = useMemo(() => {
        if (!selectedWork) return [];
        const chapterSceneIds = (selectedWork.chapters as Chapter[]).flatMap(c => c.sceneIds as string[]);
        const assignedSceneIds = new Set(chapterSceneIds);
        const unassignedScenesForWork = (selectedWork.sceneIds as string[]).filter(id => !assignedSceneIds.has(id));
        return [...chapterSceneIds, ...unassignedScenesForWork];
    }, [selectedWork]);

    const currentSceneIndex = useMemo(() => {
        if (!selectedSceneId) return -1;
        return orderedSceneIds.indexOf(selectedSceneId);
    }, [orderedSceneIds, selectedSceneId]);
    
    useEffect(() => {
        if (!selectedWorkId && worksArray.length > 0) {
            dispatch(setSelectedWorkId(worksArray[0].id));
        }
    }, [selectedWorkId, worksArray, dispatch]);

    useEffect(() => { 
        setDraftContent(selectedScene?.content || '');
        latestJsonRef.current = selectedScene?.jsonContent || null;
    }, [selectedScene]);

    useEffect(() => {
        if (selectedWorkId && selectedSceneId && debouncedContent !== (selectedScene?.content || '')) {
            updateNarrativeScene({ sceneId: selectedSceneId, updates: { content: debouncedContent, jsonContent: latestJsonRef.current } });
        }
    }, [debouncedContent, selectedWorkId, selectedSceneId, selectedScene, updateNarrativeScene]);
    
    useEffect(() => {
        if (selectedWork && workScenes.length > 0 && !selectedSceneId) {
            const firstChapterSceneId = (selectedWork.chapters as Chapter[])[0]?.sceneIds[0];
            const firstScene = firstChapterSceneId ? allScenes[firstChapterSceneId] : unassignedScenes[0];
            if (firstScene) dispatch(setSelectedSceneId(firstScene.id));
        } else if (selectedWork && workScenes.length === 0) {
            dispatch(setSelectedSceneId(null));
        }
    }, [selectedWork, selectedSceneId, unassignedScenes, dispatch, allScenes, workScenes]);
    
    const openSceneModal = (scene?: NarrativeScene) => {
        if (!selectedWorkId) return;
        const onSave = (workId: string, sceneData: Partial<NarrativeScene> & { title: string }) => {
            saveScene({ workId, sceneData });
            dispatch(popModal());
        };
        dispatch(pushModal({ type: ModalType.SCENE, props: { workId: selectedWorkId, sceneId: scene?.id, onSave } }));
    };
    
    const handleDeleteScene = (workId: string, sceneId: string) => {
        dispatch(showDialog({
            title: 'Delete Scene?',
            message: 'Are you sure you want to delete this scene? This can be undone.',
            onConfirm: () => deleteScene({ workId, sceneId }),
        }));
    };

    const flushContent = useCallback(() => {
        if (selectedSceneId && draftContent !== (selectedScene?.content || '')) {
            updateNarrativeScene({ sceneId: selectedSceneId, updates: { content: draftContent, jsonContent: latestJsonRef.current } });
        }
    }, [draftContent, selectedScene, selectedSceneId, updateNarrativeScene]);

    const handleSaveVersion = useCallback(() => {
        if (selectedSceneId) {
            flushContent();
            // A small delay allows the debounced save to process before versioning.
            setTimeout(() => {
                saveSceneVersion({ sceneId: selectedSceneId });
                showToast({ type: 'success', message: 'Scene version saved!' });
            }, autosaveDelay / 2);
        }
    }, [selectedSceneId, flushContent, saveSceneVersion, showToast, autosaveDelay]);

    const openHistoryModal = () => {
        if (selectedSceneId) {
            flushContent();
            setTimeout(() => {
                dispatch(pushModal({ type: ModalType.SCENE_HISTORY, props: { sceneId: selectedSceneId } } ));
            }, autosaveDelay / 2);
        }
    };

    const handleAddWork = () => {
        const newWorkId = saveWork({ title: 'New Work', description: '' }, false);
        if (newWorkId) dispatch(setSelectedWorkId(newWorkId));
    };

    const handleExportClick = (work: Work) => {
        dispatch(showDialog({
            title: 'Export Manuscript',
            message: 'Choose a format to export this manuscript.',
            actions: [
                { text: 'Cancel', onClick: () => {}, variant: "ghost" },
                { text: 'Export as Markdown (.md)', onClick: () => exportManuscript(work, 'md'), variant: "primary" },
                { text: 'Export as Text (.txt)', onClick: () => exportManuscript(work, 'txt'), variant: "primary" }
            ]
        }));
    };

    const handlePrevScene = () => {
        if (currentSceneIndex > 0) {
            dispatch(setSelectedSceneId(orderedSceneIds[currentSceneIndex - 1]));
        }
    };
    const handleNextScene = () => {
        if (currentSceneIndex >= 0 && currentSceneIndex < orderedSceneIds.length - 1) {
            dispatch(setSelectedSceneId(orderedSceneIds[currentSceneIndex + 1]));
        }
    };

    const handleJumpToComment = (commentId: string) => {
        const editor = editorRef.current?.editor;
        if (!editor) return;

        const commentSpan = editor.view.dom.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentSpan) {
            const pos = editor.view.posAtDOM(commentSpan, 0);
            editor.chain().focus().setTextSelection(pos).scrollIntoView().run();
        }
    };

    if (worksArray.length === 0) return <EmptyView onAddWork={handleAddWork} />;
    
    return (
        <div className="flex flex-col md:flex-row h-full">
            <main className="flex-grow flex flex-col min-w-0">
                {selectedScene ? (
                    <div className="flex-grow flex flex-col p-4 md:p-6 overflow-hidden">
                        {!distractionFreeMode && (
                            <div className="flex justify-between items-start mb-2 flex-shrink-0 flex-wrap">
                                <div className="flex items-center gap-2 min-w-0">
                                    <button
                                        onClick={handlePrevScene}
                                        disabled={currentSceneIndex <= 0}
                                        className="p-2 text-text-secondary hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                        aria-label="Previous Scene"
                                        title="Previous Scene"
                                    >
                                        <ArrowLeftIcon className="w-5 h-5" />
                                    </button>
                                    <h3 className="text-2xl font-bold truncate" title={selectedScene.title}>{selectedScene.title}</h3>
                                    <button
                                        onClick={handleNextScene}
                                        disabled={currentSceneIndex < 0 || currentSceneIndex >= orderedSceneIds.length - 1}
                                        className="p-2 text-text-secondary hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                        aria-label="Next Scene"
                                        title="Next Scene"
                                    >
                                        <ArrowRightIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex items-center space-x-1 flex-shrink-0">
                                    <button onClick={handleSaveVersion} className="p-2 text-text-secondary hover:text-accent" aria-label="Save Version" title="Save Version"><ArchiveIcon className="w-4 h-4" /></button>
                                    <button onClick={openHistoryModal} className="p-2 text-text-secondary hover:text-accent" aria-label="View History" title="View History"><RotateCcwIcon className="w-4 h-4" /></button>
                                    <button onClick={() => dispatch(toggleDistractionFreeMode())} className="p-2 text-text-secondary hover:text-accent" aria-label="Toggle Distraction-Free Mode"><MinimizeIcon className="w-4 h-4" /></button>
                                    <button onClick={() => { setIsCommentPanelOpen(p => !p); setIsReferencePanelOpen(false); }} className="p-2 text-text-secondary hover:text-accent" aria-label="Toggle Comments"><MessageCircleIcon className="w-4 h-4" /></button>
                                    <button onClick={() => { setIsReferencePanelOpen(p => !p); setIsCommentPanelOpen(false); }} className="p-2 text-text-secondary hover:text-accent" aria-label="Toggle Reference Panel"><PanelRightIcon className="w-4 h-4" /></button>
                                    <button onClick={() => openSceneModal(selectedScene)} className="p-2 text-text-secondary hover:text-accent" aria-label="Edit Scene Details"><EditIcon className="w-4 h-4" /></button>
                                    <button onClick={() => handleDeleteScene(selectedWork!.id, selectedScene.id)} className="p-2 text-text-secondary hover:text-red-500" aria-label="Delete Scene"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            </div>
                        )}
                         {distractionFreeMode && (
                            <button onClick={() => dispatch(toggleDistractionFreeMode())} className="fixed top-4 right-4 z-50 p-2 bg-secondary/80 rounded-full hover:bg-border-color" aria-label="Exit Distraction-Free Mode"><MinimizeIcon className="w-5 h-5" /></button>
                         )}
                        <RichTextEditor
                            ref={editorRef}
                            key={selectedScene.id}
                            sceneId={selectedScene.id}
                            value={draftContent}
                            onValueChange={(updates) => {
                                setDraftContent(updates.html);
                                latestJsonRef.current = updates.json;
                            }}
                            className="w-full h-full bg-primary p-4 rounded-b-md border border-t-0 border-border-color focus:ring-2 focus:ring-accent focus:outline-none resize-none font-serif text-lg leading-relaxed"
                            placeholder="Start writing your scene..."
                            entities={entities}
                        />
                        <div className="flex-shrink-0 pt-2 text-right text-sm text-text-secondary font-mono">
                            Word Count: {calculateWordCount(draftContent).toLocaleString()} | Work Total: {workScenes.reduce((sum, s) => sum + calculateWordCount(allScenes[s.id]?.content || ''), 0).toLocaleString()} words
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-text-secondary p-8">
                        {selectedWork ? "Select a scene to begin writing, or create one." : "Select a work to view its scenes."}
                    </div>
                )}
            </main>
             {isReferencePanelOpen && !distractionFreeMode && (
                <aside className="w-full md:w-2/5 flex-shrink-0 h-96 md:h-full max-w-full md:max-w-lg">
                    <ReferencePanel />
                </aside>
            )}
             {isCommentPanelOpen && !distractionFreeMode && selectedSceneId && (
                <aside className="w-full md:w-2/5 flex-shrink-0 h-96 md:h-full max-w-full md:max-w-lg">
                    <CommentSidebar sceneId={selectedSceneId} onJumpToComment={handleJumpToComment} />
                </aside>
            )}
        </div>
    );
};

export default ManuscriptView;