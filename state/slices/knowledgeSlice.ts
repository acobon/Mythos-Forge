// state/slices/knowledgeSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ResearchNote, Notebook, MindMapNode, MindMapEdge, Comment, Relationship, EntityId, StoryBible, Entity, TrashedItem, Tag } from '../../types/index';
import { defaultStoryBible } from '../../data/defaults';
import { generateId, arrayMove, getTypedObjectValues } from '../../utils';
import { restoreFromTrash } from './projectSlice';
import { removeItem, mergeTags } from '../actions';

interface KnowledgeState {
    researchNotes: Record<string, ResearchNote>;
    notebooks: Record<string, Notebook>;
    mindMap: StoryBible['mindMap'];
    comments: Record<string, Comment>;
    relationships: Record<string, Relationship>;
    relationshipTypes: string[];
    graphLayout: Record<EntityId, { x: number; y: number; fx?: number | null; fy?: number | null; }>;
}

const initialState: KnowledgeState = {
    researchNotes: defaultStoryBible.researchNotes,
    notebooks: defaultStoryBible.notebooks,
    mindMap: defaultStoryBible.mindMap,
    comments: defaultStoryBible.comments,
    relationships: defaultStoryBible.relationships,
    relationshipTypes: defaultStoryBible.relationshipTypes,
    graphLayout: defaultStoryBible.graphLayout,
};

const knowledgeSlice = createSlice({
    name: 'knowledge',
    initialState,
    reducers: {
        saveNotebook: (state, action: PayloadAction<Notebook>) => {
            const existing = state.notebooks[action.payload.id];
            state.notebooks[action.payload.id] = {
                ...existing,
                ...action.payload,
            };
        },
        addResearchNote: (state, action: PayloadAction<ResearchNote>) => {
            const note = action.payload;
            state.researchNotes[note.id] = note;
            if (note.notebookId && state.notebooks[note.notebookId]) {
                if (!state.notebooks[note.notebookId].noteIds) {
                    state.notebooks[note.notebookId].noteIds = [];
                }
                state.notebooks[note.notebookId].noteIds.push(note.id);
            }
        },
        updateResearchNote: (state, action: PayloadAction<{ id: string, updates: Partial<ResearchNote>}>) => {
            const { id, updates } = action.payload;
            const note = state.researchNotes[id];
            if (note) Object.assign(note, updates, { lastModified: new Date().toISOString() });
        },
        moveNote: (state, action: PayloadAction<{ noteId: string; sourceNotebookId?: string; destNotebookId?: string; destIndex: number }>) => {
            const { noteId, sourceNotebookId, destNotebookId, destIndex } = action.payload;
            const note = state.researchNotes[noteId];
            if (!note) return;
            
            // Remove from source
            if (sourceNotebookId && state.notebooks[sourceNotebookId]) {
                const sourceNotebook = state.notebooks[sourceNotebookId];
                if (sourceNotebook.noteIds) {
                   sourceNotebook.noteIds = sourceNotebook.noteIds.filter(id => id !== noteId);
                }
            }
            
            // Add to destination
            if (destNotebookId && state.notebooks[destNotebookId]) {
                const destNotebook = state.notebooks[destNotebookId];
                if (!destNotebook.noteIds) destNotebook.noteIds = [];
                destNotebook.noteIds.splice(destIndex, 0, noteId);
            }
            
            // Update note's notebookId
            note.notebookId = destNotebookId;
        },
        reorderNotesInNotebook: (state, action: PayloadAction<{ notebookId: string; oldIndex: number; newIndex: number }>) => {
            const { notebookId, oldIndex, newIndex } = action.payload;
            const notebook = state.notebooks[notebookId];
            if (notebook && notebook.noteIds) {
                notebook.noteIds = arrayMove(notebook.noteIds, oldIndex, newIndex);
            }
        },
        addRelationship: (state, action: PayloadAction<Relationship>) => {
            state.relationships[action.payload.id] = action.payload;
        },
        updateRelationship: (state, action: PayloadAction<Relationship>) => {
            state.relationships[action.payload.id] = action.payload;
        },
        updateRelationshipTypes: (state, action: PayloadAction<string[]>) => {
            state.relationshipTypes = action.payload;
        },
        updateGraphLayout: (state, action: PayloadAction<{ id: EntityId; pos: { x: number; y: number; fx?: number | null; fy?: number | null } }>) => {
            state.graphLayout[action.payload.id] = action.payload.pos;
        },
        updateMindMapNode: (state, action: PayloadAction<MindMapNode>) => {
            state.mindMap.nodes[action.payload.id] = action.payload;
        },
        deleteMindMapNode: (state, action: PayloadAction<string>) => {
            delete state.mindMap.nodes[action.payload];
            state.mindMap.edges = state.mindMap.edges.filter(e => e.source !== action.payload && e.target !== action.payload);
        },
        updateMindMapEdge: (state, action: PayloadAction<MindMapEdge>) => {
            const index = state.mindMap.edges.findIndex(e => e.id === action.payload.id);
            if (index > -1) state.mindMap.edges[index] = action.payload;
            else state.mindMap.edges.push(action.payload);
        },
        deleteMindMapEdge: (state, action: PayloadAction<string>) => {
            state.mindMap.edges = state.mindMap.edges.filter(e => e.id !== action.payload);
        },
        addEntityNodeToMindMap: (state, action: PayloadAction<Entity>) => {
            const entity = action.payload;
            // FIX: Cast node to MindMapNode to access entityId property safely.
            const existingNode = (getTypedObjectValues(state.mindMap.nodes) as MindMapNode[]).find(n => n.entityId === entity.id);
            if (existingNode) return;

            const newNode: MindMapNode = {
                id: generateId('mmn'),
                label: entity.name,
                x: Math.random() * 500,
                y: Math.random() * 500,
                entityId: entity.id,
            };
            state.mindMap.nodes[newNode.id] = newNode;
        },
        saveComment: (state, action: PayloadAction<Comment>) => {
            state.comments[action.payload.id] = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(restoreFromTrash, (state, action: PayloadAction<{ item: TrashedItem }>) => {
                const { item, itemType } = action.payload.item;
                if (itemType === 'Relationship') state.relationships[(item as Relationship).id] = item as Relationship;
                if (itemType === 'ResearchNote') state.researchNotes[(item as ResearchNote).id] = item as ResearchNote;
                if (itemType === 'Notebook') state.notebooks[(item as Notebook).id] = item as Notebook;
                if (itemType === 'Comment') state.comments[(item as Comment).id] = item as Comment;
            })
            .addCase(removeItem, (state, action: PayloadAction<TrashedItem>) => {
                const { item, itemType } = action.payload;
                // Direct deletion
                if (itemType === 'Relationship') delete state.relationships[(item as Relationship).id];
                if (itemType === 'ResearchNote') delete state.researchNotes[(item as ResearchNote).id];
                if (itemType === 'Notebook') {
                    delete state.notebooks[(item as Notebook).id];
                    Object.values(state.researchNotes).forEach((note: ResearchNote) => {
                        if (note.notebookId === (item as Notebook).id) {
                            note.notebookId = undefined;
                        }
                    });
                }
                 if (itemType === 'Tag') {
                    const tagId = (item as Tag).id;
                    (getTypedObjectValues(state.researchNotes) as ResearchNote[]).forEach(n => {
                        if (n.tagIds?.includes(tagId)) n.tagIds = n.tagIds.filter(id => id !== tagId);
                    });
                }
                if (itemType === 'Comment') {
                    const comment = item as Comment;
                    const commentId = comment.id;
                    const commentsToDelete = [commentId];
                    const queue = [commentId];
                    
                    // Find all descendant replies to delete the entire thread
                    while (queue.length > 0) {    
                        const parentId = queue.shift();
                        (getTypedObjectValues(state.comments) as Comment[]).forEach(c => {
                            if (c && c.parentId === parentId) {
                                commentsToDelete.push(c.id);
                                queue.push(c.id);
                            }
                        });
                    }
                    commentsToDelete.forEach(id => { delete state.comments[id]; });
                }
                
                if (itemType === 'Entity') {
                    const entity = item as Entity;
                    if (entity && typeof entity.id === 'string') {
                        const entityId = entity.id;

                        // Remove from relationships
                        Object.keys(state.relationships).forEach(relId => {
                            const rel = state.relationships[relId];
                            if (rel && rel.entityIds.includes(entityId)) {
                                delete state.relationships[relId];
                            }
                        });
                        // Unlink from mind map nodes
                        // FIX: Cast the result to MindMapNode[] to ensure type safety.
                        (getTypedObjectValues(state.mindMap.nodes) as MindMapNode[]).forEach(node => {
                            if (node.entityId === entityId) {
                                node.entityId = undefined;
                            }
                        });
                        // Remove from graph layout
                        delete state.graphLayout[entityId];
                        // Unlink from research notes
                        Object.values(state.researchNotes).forEach((note: ResearchNote) => {
                            if (note.entityIds?.includes(entityId)) {
                                note.entityIds = note.entityIds.filter(id => id !== entityId);
                            }
                        });
                    }
                }
            })
            .addCase(mergeTags, (state, action) => {
                const { sourceTagId, targetTagId } = action.payload;
                const updateIds = (ids?: string[]) => {
                    if (!ids) return ids;
                    const idSet = new Set(ids);
                    if (idSet.has(sourceTagId)) {
                        idSet.delete(sourceTagId);
                        idSet.add(targetTagId);
                        return Array.from(idSet);
                    }
                    return ids;
                };
                (getTypedObjectValues(state.researchNotes) as ResearchNote[]).forEach(n => { n.tagIds = updateIds(n.tagIds); });
            });
    }
});

export const {
    saveNotebook,
    addResearchNote, updateResearchNote,
    moveNote, reorderNotesInNotebook,
    addRelationship, updateRelationship,
    updateRelationshipTypes,
    updateGraphLayout,
    updateMindMapNode, deleteMindMapNode, updateMindMapEdge, deleteMindMapEdge,
    addEntityNodeToMindMap,
    saveComment,
} = knowledgeSlice.actions;

export default knowledgeSlice.reducer;