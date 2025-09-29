// components/views/research/ResearchSidebar.tsx
import React, { useState, useMemo } from 'react';
import { ResearchNote, Notebook } from '../../../types';
import { useAppSelector, useAppDispatch } from '../../../state/hooks';
import { useResearchActions } from '../../../hooks/useResearchActions';
import { getTypedObjectValues, arrayMove } from '../../../utils';
import { useDebounce } from '../../../hooks/useDebounce';
import { PlusCircleIcon, SearchIcon, EditIcon, TrashIcon, CheckIcon, XIcon, MenuIcon } from '../../common/Icons';
import { Input, Select, Button } from '../../common/ui';
import { showDialog } from '../../../state/uiSlice';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableNoteItem: React.FC<{ note: ResearchNote; isSelected: boolean; onSelect: (id: string) => void }> = ({ note, isSelected, onSelect }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: note.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} {...attributes} className={`touch-none ${isDragging ? 'opacity-50' : ''}`}>
            <div className={`w-full flex items-center p-2 rounded-md ${isSelected ? 'bg-accent text-white' : 'hover:bg-primary'}`}>
                <div {...listeners} className="cursor-grab p-1 mr-1 text-text-secondary/50"><MenuIcon className="w-4 h-4" /></div>
                <button onClick={() => onSelect(note.id)} className="text-left flex-grow min-w-0">
                    <p className="font-semibold truncate">{note.title}</p>
                    <p className={`text-xs truncate ${isSelected ? 'text-white/80' : 'text-text-secondary'}`}>
                        {note.content.replace(/<[^>]+>/g, '').substring(0, 50)}
                    </p>
                </button>
            </div>
        </div>
    );
};

const ResearchSidebar: React.FC<{
    notes: ResearchNote[];
    selectedNoteId: string | null;
    onSelectNote: (id: string | null) => void;
}> = ({ notes, selectedNoteId, onSelectNote }) => {
    const dispatch = useAppDispatch();
    const notebooks = useAppSelector(state => state.bible.present.knowledge.notebooks);
    const { addResearchNote, saveNotebook, deleteNotebook, moveNote, reorderNotesInNotebook } = useResearchActions();

    const notebooksArray = useMemo(() => (getTypedObjectValues(notebooks) as Notebook[]).sort((a,b) => a.name.localeCompare(b.name)), [notebooks]);
    const notesMap = useMemo(() => new Map(notes.map(n => [n.id, n])), [notes]);
    
    const [selectedNotebookId, setSelectedNotebookId] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [editingNotebook, setEditingNotebook] = useState<{ id: string, name: string } | null>(null);
    const [activeDragId, setActiveDragId] = useState<string | null>(null);

    const filteredNotes = useMemo(() => {
        return notes.filter(n => {
            const query = debouncedSearchTerm.toLowerCase();
            if (!query) return true;
            const content = n.content.replace(/<[^>]+>/g, '').toLowerCase();
            return n.title.toLowerCase().includes(query) || content.includes(query);
        });
    }, [notes, debouncedSearchTerm]);

    const notebooksWithNotes = useMemo(() => {
        const queryFilteredNoteIds = new Set(filteredNotes.map(n => n.id));
        const unassigned = filteredNotes.filter(n => !n.notebookId);

        const notebookGroups = notebooksArray.map(nb => ({
            ...nb,
            notes: (nb.noteIds || []).map(id => notesMap.get(id)).filter((n): n is ResearchNote => !!n && queryFilteredNoteIds.has(n.id))
        }));

        if (selectedNotebookId !== 'All') {
            if (selectedNotebookId === 'Unassigned') {
                return [{ id: 'unassigned', name: 'Unassigned', notes: unassigned }];
            }
            const selected = notebookGroups.find(nb => nb.id === selectedNotebookId);
            return selected ? [selected] : [];
        }
        
        return [...notebookGroups, { id: 'unassigned', name: 'Unassigned', notes: unassigned }];

    }, [filteredNotes, notebooksArray, notesMap, selectedNotebookId]);
    
    const handleAddNote = () => {
        const data: Partial<Omit<ResearchNote, 'id' | 'lastModified'>> = { title: 'New Note', content: '' };
        if (selectedNotebookId && selectedNotebookId !== 'All' && selectedNotebookId !== 'unassigned') {
            data.notebookId = selectedNotebookId;
        }
        const newNote = addResearchNote(data);
        if (newNote) onSelectNote(newNote.id);
    };
    
    const handleSaveNotebook = () => {
        if (editingNotebook && editingNotebook.name.trim()) {
            saveNotebook(editingNotebook);
            setEditingNotebook(null);
        }
    };
    
    const handleDeleteNotebook = (id: string, name: string) => {
        dispatch(showDialog({
            title: `Delete Notebook "${name}"?`,
            message: "Are you sure? Notes in this notebook will become uncategorized. This action can be undone.",
            onConfirm: () => {
                deleteNotebook(id);
                if (selectedNotebookId === id) setSelectedNotebookId('All');
            }
        }));
    };
    
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const handleDragStart = (event: DragStartEvent) => setActiveDragId(event.active.id as string);
    const handleDragEnd = (event: DragEndEvent) => {
        setActiveDragId(null);
        const { active, over } = event;

        if (!over || active.id === over.id) return;
        
        const sourceContainerId = active.data.current?.sortable.containerId;
        const destContainerId = over.data.current?.sortable.containerId || over.id;

        if (sourceContainerId === destContainerId) {
            // Reordering within the same container
            if (sourceContainerId === 'unassigned') return; // Cannot reorder unassigned
            const oldIndex = active.data.current?.sortable.index;
            const newIndex = over.data.current?.sortable.index;
            if (oldIndex !== newIndex) {
                reorderNotesInNotebook({ notebookId: sourceContainerId, oldIndex, newIndex });
            }
        } else {
            // Moving to a different container
            const destIndex = over.data.current?.sortable.index ?? notebooksArray.find(nb => nb.id === destContainerId)?.noteIds.length ?? 0;
            moveNote({
                noteId: active.id as string,
                sourceNotebookId: sourceContainerId === 'unassigned' ? undefined : sourceContainerId,
                destNotebookId: destContainerId === 'unassigned' ? undefined : destContainerId,
                destIndex: destIndex
            });
        }
    };
    
    const activeNote = activeDragId ? notes.find(n => n.id === activeDragId) : null;

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-2xl font-bold">Research</h2>
                    <button onClick={handleAddNote} className="p-2 text-text-secondary hover:text-accent" aria-label="Add Note"><PlusCircleIcon className="w-6 h-6" /></button>
                </div>
                <div className="relative mb-2 flex-shrink-0">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
                    <Input type="search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search notes..." className="pl-10"/>
                </div>
                <div className="mb-4 flex-shrink-0">
                    <label htmlFor="notebook-filter" className="text-sm font-semibold text-text-secondary">Notebook</label>
                    <Select id="notebook-filter" value={selectedNotebookId} onChange={e => setSelectedNotebookId(e.target.value)} className="mt-1 w-full">
                        <option value="All">All Notes</option>
                        <option value="Unassigned">Unassigned</option>
                        {notebooksArray.map(nb => <option key={nb.id} value={nb.id}>{nb.name}</option>)}
                    </Select>
                </div>

                <div className="flex-grow overflow-y-auto pr-2">
                    {notebooksWithNotes.map(nb => ( (nb.notes.length > 0 || selectedNotebookId !== 'All') && (
                        <div key={nb.id} className="mb-4">
                            <div className="flex justify-between items-center group p-1">
                                <h3 className="font-bold text-text-secondary">{nb.name}</h3>
                                {nb.id !== 'unassigned' && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setEditingNotebook({id: nb.id, name: nb.name})} className="p-1"><EditIcon className="w-4 h-4"/></button>
                                        <button onClick={() => handleDeleteNotebook(nb.id, nb.name)} className="p-1"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                )}
                            </div>
                            <SortableContext items={nb.notes.map(n => n.id)} id={nb.id}>
                                <div className="space-y-1">
                                    {nb.notes.map(note => <SortableNoteItem key={note.id} note={note} isSelected={selectedNoteId === note.id} onSelect={onSelectNote} />)}
                                </div>
                            </SortableContext>
                        </div>
                    )))}
                </div>
                <DragOverlay>
                    {activeNote ? <div className="p-2 bg-accent rounded-md border border-highlight shadow-lg text-white"><p className="font-semibold text-sm">{activeNote.title}</p></div> : null}
                </DragOverlay>

                <div className="flex-shrink-0 pt-2 border-t border-border-color">
                    <h3 className="text-sm font-semibold text-text-secondary mb-2">Manage Notebooks</h3>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {notebooksArray.map(nb => (
                            <div key={nb.id} className="flex items-center justify-between group p-1 rounded-md hover:bg-primary">
                                {editingNotebook?.id === nb.id ? (
                                    <>
                                        <Input value={editingNotebook.name} onChange={e => setEditingNotebook({ ...editingNotebook, name: e.target.value })} className="text-sm !py-0.5" autoFocus onKeyDown={e => { if (e.key === 'Enter') handleSaveNotebook(); if(e.key === 'Escape') setEditingNotebook(null);}} onBlur={handleSaveNotebook}/>
                                        <div className="flex"><button onClick={handleSaveNotebook} className="p-1"><CheckIcon className="w-4 h-4 text-green-400"/></button><button onClick={() => setEditingNotebook(null)} className="p-1"><XIcon className="w-4 h-4 text-red-400"/></button></div>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-sm">{nb.name}</span>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => setEditingNotebook({ id: nb.id, name: nb.name })} className="p-1"><EditIcon className="w-4 h-4"/></button><button onClick={() => handleDeleteNotebook(nb.id, nb.name)} className="p-1"><TrashIcon className="w-4 h-4"/></button></div>
                                    </>
                                )}
                            </div>
                        ))}
                         <Button variant="ghost" size="sm" onClick={() => saveNotebook({ name: 'New Notebook' })} className="w-full justify-start text-text-secondary">
                            <PlusCircleIcon className="w-4 h-4 mr-2"/> Add Notebook
                        </Button>
                    </div>
                </div>
            </div>
        </DndContext>
    );
};

export default ResearchSidebar;
