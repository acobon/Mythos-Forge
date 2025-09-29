// hooks/useResearchActions.ts
import { useCallback } from 'react';
import { ResearchNote, Notebook } from '../types';
import { generateId, calculateWordCount } from '../utils';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { addResearchNote as addResearchNoteAction, updateResearchNote as updateResearchNoteAction, saveNotebook as saveNotebookAction, moveNote as moveNoteAction, reorderNotesInNotebook as reorderNotesInNotebookAction } from '../state/slices/knowledgeSlice';
import { removeItem } from '../state/actions';

export const useResearchActions = () => {
    const dispatch = useAppDispatch();
    const { notebooks, researchNotes } = useAppSelector(state => state.bible.present.knowledge);

    const addResearchNote = useCallback((data?: Partial<Omit<ResearchNote, 'id' | 'lastModified'>>) => {
        const content = data?.content || '';
        const newNote: ResearchNote = {
            id: generateId('note'),
            title: data?.title || 'New Note',
            content: content,
            wordCount: calculateWordCount(content),
            notebookId: data?.notebookId,
            entityIds: data?.entityIds || [],
            lastModified: new Date().toISOString()
        };
        dispatch(addResearchNoteAction(newNote));
        return newNote;
    }, [dispatch]);

    const updateResearchNote = useCallback((id: string, updates: Partial<Omit<ResearchNote, 'id' | 'lastModified'>>) => {
        dispatch(updateResearchNoteAction({ id, updates }));
    }, [dispatch]);
    
    const deleteResearchNote = useCallback((id: string) => {
        const note = researchNotes[id];
        if (note) {
            dispatch(removeItem({ item: note, itemType: 'ResearchNote', deletedAt: new Date().toISOString() }));
        }
    }, [dispatch, researchNotes]);
    
    const saveNotebook = useCallback((notebook: Partial<Notebook> & { name: string }) => {
        const existingNotebook = notebook.id ? notebooks[notebook.id] : undefined;
        const payload: Notebook = {
            id: notebook.id || generateId('nb'),
            name: notebook.name,
            noteIds: existingNotebook ? existingNotebook.noteIds : [],
        };
        dispatch(saveNotebookAction(payload));
    }, [dispatch, notebooks]);
    
    const deleteNotebook = useCallback((id: string) => {
        const notebook = notebooks[id];
        if (notebook) {
            dispatch(removeItem({ item: notebook, itemType: 'Notebook', deletedAt: new Date().toISOString() }));
        }
    }, [dispatch, notebooks]);
    
    const moveNote = useCallback((payload: {
        noteId: string;
        sourceNotebookId?: string;
        destNotebookId?: string;
        destIndex: number;
    }) => {
        dispatch(moveNoteAction(payload));
    }, [dispatch]);

    const reorderNotesInNotebook = useCallback((payload: {
        notebookId: string;
        oldIndex: number;
        newIndex: number;
    }) => {
        const notebook = notebooks[payload.notebookId];
        if (notebook) {
            dispatch(reorderNotesInNotebookAction({ ...payload, notebookId: notebook.id }));
        }
    }, [dispatch, notebooks]);

    return { addResearchNote, updateResearchNote, deleteResearchNote, saveNotebook, deleteNotebook, moveNote, reorderNotesInNotebook };
};
