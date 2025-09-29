import { useCallback } from 'react';
import { MindMapNode, MindMapEdge, Entity } from '../types';
import { generateId } from '../utils';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { updateMindMapNode, deleteMindMapNode, updateMindMapEdge, deleteMindMapEdge, addEntityNodeToMindMap } from '../state/slices/knowledgeSlice';

export const useMindMapActions = () => {
    const dispatch = useAppDispatch();

    const saveNode = useCallback((node: Partial<MindMapNode>) => {
        const payload: MindMapNode = {
            id: node.id || generateId('mmn'),
            label: node.label || 'New Node',
            x: node.x || 0,
            y: node.y || 0,
            ...node,
        };
        dispatch(updateMindMapNode(payload));
        return payload;
    }, [dispatch]);

    const deleteNode = useCallback((nodeId: string) => {
        dispatch(deleteMindMapNode(nodeId));
    }, [dispatch]);

    const saveEdge = useCallback((edge: Partial<MindMapEdge>) => {
        const payload: MindMapEdge = {
            id: edge.id || generateId('mme'),
            source: edge.source!,
            target: edge.target!,
            style: edge.style || 'solid',
            color: edge.color
        };
        dispatch(updateMindMapEdge(payload));
        return payload;
    }, [dispatch]);

    const deleteEdge = useCallback((edgeId: string) => {
        dispatch(deleteMindMapEdge(edgeId));
    }, [dispatch]);

    const addEntityToMindMap = useCallback((entity: Entity) => {
        dispatch(addEntityNodeToMindMap(entity));
    }, [dispatch]);

    return { saveNode, deleteNode, saveEdge, deleteEdge, addEntityToMindMap };
};
