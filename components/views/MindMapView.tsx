// components/views/MindMapView.tsx
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { MindMapNode, MindMapEdge, Entity, EntityId, EntityType, ModalType as ModalTypeEnum } from '../../types';
import { useMindMapActions } from '../../hooks/useMindMapActions';
import { BrainCircuitIcon, PaletteIcon, TrashIcon, LinkIcon, PlusCircleIcon, ZoomInIcon, ZoomOutIcon, RefreshCwIcon, PlusIcon } from '../common/Icons';
import EmptyState from '../common/EmptyState';
import { useI18n } from '../../hooks/useI18n';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';
import { useNavigation } from '../../hooks/useNavigation';
import { getEntityIcon } from '../common/iconUtils';
import { getTypedObjectValues } from '../../utils';
import { useEntityActions } from '../../hooks/useEntityActions';
import { pushModal } from '../../state/uiSlice';
import FocusTrap from 'focus-trap-react';
import { Button } from '../common/ui';

type D3Node = MindMapNode & {
    x: number;
    y: number;
    fx?: number | null;
    fy?: number | null;
};

const NODE_COLORS = [
    'var(--color-secondary)', 'var(--color-viz-1)', 'var(--color-viz-2)', 'var(--color-viz-3)',
    'var(--color-viz-4)', 'var(--color-viz-5)', 'var(--color-viz-6)', 'var(--color-viz-7)'
];

const typeColors: Record<string, string> = {
    [EntityType.CHARACTER]: 'var(--color-viz-1)',
    [EntityType.LOCATION]: 'var(--color-viz-2)',
    [EntityType.OBJECT]: 'var(--color-viz-3)',
    [EntityType.ORGANIZATION]: 'var(--color-viz-4)',
};

interface ContextMenuState {
    x: number;
    y: number;
    targetId: string;
    targetType: 'node' | 'edge';
}

const MindMapView: React.FC = () => {
    const dispatch = useAppDispatch();
    const { mindMap } = useAppSelector(state => state.bible.present.knowledge);
    const { entities: entitiesMap, entityTypes } = useAppSelector(state => state.bible.present.entities);
    const { saveNode, deleteNode, saveEdge, deleteEdge } = useMindMapActions();
    const { navigateToEntity } = useNavigation();
    const { t } = useI18n();
    const showConfirm = useConfirmationDialog();

    const svgRef = useRef<SVGSVGElement>(null);
    const workerRef = useRef<Worker | null>(null);
    const [{ width, height }, setDimensions] = useState({ width: 0, height: 0 });
    
    const [nodes, setNodes] = useState<D3Node[]>([]);
    const [edges, setEdges] = useState<MindMapEdge[]>([]);
    const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

    const [draggedNode, setDraggedNode] = useState<D3Node | null>(null);
    const [linking, setLinking] = useState<{ source: D3Node; x: number; y: number } | null>(null);
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [editingLabel, setEditingLabel] = useState('');
    const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef({ x: 0, y: 0 });
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    
    const latestPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
    const animationFrameRef = useRef<number | undefined>(undefined);

    const handleAddLabel = useCallback(() => {
        saveNode({ label: 'New Label', x: width / 2, y: height / 2 });
    }, [saveNode, width, height]);

    const getNodeCenter = useCallback((id: string) => {
        const node = nodeMap.get(id);
        if (node) return { x: node.x, y: node.y };
        return { x: 0, y: 0 };
    }, [nodeMap]);

    useEffect(() => {
        const syncedNodes = getTypedObjectValues(mindMap.nodes).map((node: MindMapNode) => {
            const entity = node.entityId ? entitiesMap[node.entityId] : undefined;
            const entityType = entity?.type || '';
            const color = entity ? (typeColors[entityType] || node.color) : node.color;
            return {
                ...node,
                label: entity ? entity.name : node.label,
                color,
                x: node.x || width / 2,
                y: node.y || height / 2,
            };
        });
        setNodes(syncedNodes);
        setEdges(mindMap.edges);
    }, [mindMap.nodes, mindMap.edges, entitiesMap, width, height]);
    
    useEffect(() => {
        if (width > 0 && height > 0) {
            const worker = new Worker(new URL('../../graph.worker.ts', import.meta.url), { type: 'module' });
            workerRef.current = worker;
            const renderLoop = () => {
                setNodes(prevNodes => prevNodes.map(node => {
                    const newPos = latestPositionsRef.current.get(node.id);
                    return (newPos && !node.fx) ? { ...node, x: newPos.x, y: newPos.y } : node;
                }));
                animationFrameRef.current = requestAnimationFrame(renderLoop);
            };
            worker.onmessage = (event) => {
                if (event.data.type === 'TICK') {
                    const positions = event.data.positions as { id: string; x: number; y: number }[];
                    positions.forEach(p => latestPositionsRef.current.set(p.id, p));
                }
            };
            animationFrameRef.current = requestAnimationFrame(renderLoop);
            return () => {
                worker.terminate();
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            };
        }
    }, [width, height]);
    
    useEffect(() => {
        if (workerRef.current && nodes.length > 0 && width > 0 && height > 0) {
            workerRef.current.postMessage({ type: 'START', nodes, edges, width, height, nodeRadius: 80 });
        }
    }, [nodes.length, edges, width, height]);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;
        const observer = new ResizeObserver(entries => {
            const { width: w, height: h } = entries[0].contentRect;
            setDimensions({ width: w, height: h });
        });
        observer.observe(svg);
        setDimensions({ width: svg.clientWidth, height: svg.clientHeight });
        return () => observer.disconnect();
    }, []);
    
     useEffect(() => {
        const handleGlobalClick = (e: MouseEvent) => {
            if (contextMenu && !(e.target as HTMLElement).closest('.context-menu-interactive')) setContextMenu(null);
        };
        window.addEventListener('click', handleGlobalClick);
        return () => window.removeEventListener('click', handleGlobalClick);
    }, [contextMenu]);

    const getSVGPoint = (clientX: number, clientY: number) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const pt = svgRef.current.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const CTM = svgRef.current.getScreenCTM()?.inverse();
        return pt.matrixTransform(CTM);
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        if ((e.target as Element).closest('.mindmap-node')) return;
        const { x, y } = getSVGPoint(e.clientX, e.clientY);
        saveNode({ label: 'New Idea', x, y });
    };

    const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!(e.target as SVGElement).closest('.mindmap-node')) {
            setIsPanning(true);
            panStartRef.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
        }
    };

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const pos = getSVGPoint(e.clientX, e.clientY);
        if (isPanning) {
            setTransform(t => ({ ...t, x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y }));
        } else if (linking) {
            setLinking(l => (l ? { ...l, x: pos.x, y: pos.y } : null));
        } else if (draggedNode) {
            const newNodes = nodes.map(n => n.id === draggedNode.id ? { ...n, fx: pos.x, fy: pos.y } : n);
            setNodes(newNodes);
            workerRef.current?.postMessage({ type: 'UPDATE_NODE', payload: { id: draggedNode.id, fx: pos.x, fy: pos.y } });
        }
    };

    const handleMouseUp = () => {
        if (draggedNode) {
            const finalNode = nodes.find(n => n.id === draggedNode.id);
            if(finalNode) saveNode({ id: finalNode.id, fx: finalNode.fx, fy: finalNode.fy });
            workerRef.current?.postMessage({ type: 'DRAG_END' });
        }
        setIsPanning(false);
        setDraggedNode(null);
    };

    const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
        e.preventDefault();
        const scaleAmount = -e.deltaY * 0.001;
        setTransform(t => ({ ...t, k: Math.max(0.2, Math.min(2, t.k * (1 + scaleAmount))) }));
    };

    const handleNodeMouseDown = (e: React.MouseEvent<SVGGElement>, node: D3Node) => {
        e.stopPropagation();
        setDraggedNode(node);
        workerRef.current?.postMessage({ type: 'DRAG_START' });
    };

    const handleNodeMouseUp = (e: React.MouseEvent<SVGGElement>, node: D3Node) => {
        if (linking && linking.source.id !== node.id) {
            saveEdge({ source: linking.source.id, target: node.id });
        }
        setLinking(null);
    };

    const handleNodeDoubleClick = (node: D3Node) => {
        if (node.entityId) navigateToEntity(node.entityId);
        else { setEditingNodeId(node.id); setEditingLabel(node.label); }
    };
    
    const handleSaveLabel = () => {
        if (editingNodeId && editingLabel.trim()) saveNode({ id: editingNodeId, label: editingLabel.trim() });
        setEditingNodeId(null);
    };

    const handleOpenContextMenu = (e: React.MouseEvent, targetId: string, targetType: 'node' | 'edge') => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, targetId, targetType });
    };
    
    const handleLinkToEntity = () => {
        const { targetId } = contextMenu!;
        setContextMenu(null);
        dispatch(pushModal({
            type: ModalTypeEnum.LINK_ENTITY_TO_NODE,
            props: { onSelect: (entityId: EntityId) => saveNode({ id: targetId, entityId }) }
        }));
    };
    
    const handleUnlinkEntity = () => saveNode({ id: contextMenu!.targetId, entityId: undefined });
    const handleNodeColorChange = (color: string) => saveNode({ id: contextMenu!.targetId, color });

    const handleDeleteTarget = () => {
        const { targetId, targetType } = contextMenu!;
        showConfirm({
            title: `Delete ${targetType}?`,
            message: `Are you sure you want to delete this ${targetType}? This action can be undone.`,
            onConfirm: () => targetType === 'node' ? deleteNode(targetId) : deleteEdge(targetId)
        });
        setContextMenu(null);
    };

    const resetView = () => setTransform({ x: 0, y: 0, k: 1 });
    const zoom = (factor: number) => setTransform(t => ({ ...t, k: Math.max(0.2, Math.min(2, t.k * factor)) }));

    if (nodes.length === 0) {
        return (
            <div onDoubleClick={handleDoubleClick} className="w-full h-full">
                <EmptyState icon={<BrainCircuitIcon className="w-16 h-16"/>} title={t('mindMap.empty.title')} description={t('mindMap.empty.description')} />
            </div>
        );
    }

    return (
        <div className="w-full h-full relative overflow-hidden bg-primary">
            <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing"
                onDoubleClick={handleDoubleClick} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onWheel={handleWheel}>
                <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
                    {edges.map(edge => {
                        const source = nodeMap.get(edge.source);
                        const target = nodeMap.get(edge.target);
                        if (!source || !target) return null;
                        return <line key={edge.id} x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke="var(--color-border-color)" strokeWidth="2" onContextMenu={(e) => handleOpenContextMenu(e, edge.id, 'edge')} />;
                    })}
                    {nodes.map(node => (
                        <g key={node.id} transform={`translate(${node.x}, ${node.y})`} className="mindmap-node"
                           onMouseDown={e => handleNodeMouseDown(e, node)} onMouseUp={e => handleNodeMouseUp(e, node)}
                           onDoubleClick={() => handleNodeDoubleClick(node)} onContextMenu={(e) => handleOpenContextMenu(e, node.id, 'node')}
                           style={{ cursor: 'pointer' }}>
                            <rect x="-75" y="-40" width="150" height="80" rx="10" fill={node.color || 'var(--color-secondary)'} stroke="var(--color-border-color)" strokeWidth="2"/>
                            {editingNodeId === node.id ? (
                                <foreignObject x="-70" y="-35" width="140" height="70">
                                    <textarea value={editingLabel} onChange={e => setEditingLabel(e.target.value)} onBlur={handleSaveLabel} autoFocus className="w-full h-full bg-transparent border-0 resize-none p-0 text-center text-text-main font-semibold" />
                                </foreignObject>
                            ) : (
                                <text x="0" y="0" textAnchor="middle" dominantBaseline="middle" fill="var(--color-text-main)" className="select-none font-semibold">
                                    {node.label}
                                </text>
                            )}
                            {node.entityId && (
                                <g transform="translate(55, -30)">
                                    {getEntityIcon(entitiesMap[node.entityId]?.type || '', entityTypes, 'w-5 h-5 text-text-secondary')}
                                </g>
                            )}
                        </g>
                    ))}
                    {/* FIX: Access the source ID correctly from the linking state object */}
                    {linking && <line x1={getNodeCenter(linking.source.id).x} y1={getNodeCenter(linking.source.id).y} x2={linking.x} y2={linking.y} stroke="var(--color-accent)" strokeWidth="2" strokeDasharray="5,5" />}
                </g>
            </svg>
            
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                <Button size="icon" onClick={() => zoom(1.2)}><ZoomInIcon className="w-5 h-5"/></Button>
                <Button size="icon" onClick={() => zoom(0.8)}><ZoomOutIcon className="w-5 h-5"/></Button>
                <Button size="icon" onClick={resetView}><RefreshCwIcon className="w-5 h-5"/></Button>
                <Button size="icon" onClick={handleAddLabel}><PlusIcon className="w-5 h-5"/></Button>
            </div>
            
            {contextMenu && (
                <FocusTrap>
                    <div style={{ top: contextMenu.y, left: contextMenu.x }} className="context-menu-interactive absolute bg-secondary border border-border-color rounded-md shadow-lg p-1 text-sm z-50 w-48">
                        {contextMenu.targetType === 'node' && (
                            <>
                                <Button variant="ghost" className="w-full !justify-start" onClick={() => {
                                    const node = nodeMap.get(contextMenu.targetId);
                                    if(node) setLinking({ source: node, x: node.x, y: node.y });
                                    setContextMenu(null);
                                }}>Start Link</Button>
                                 <Button variant="ghost" className="w-full !justify-start" onClick={handleLinkToEntity}>Link to Entity</Button>
                                 {nodeMap.get(contextMenu.targetId)?.entityId && <Button variant="ghost" className="w-full !justify-start" onClick={handleUnlinkEntity}>Unlink Entity</Button>}
                                <div className="my-1 border-t border-border-color"/>
                                <div className="p-2">
                                    <div className="grid grid-cols-4 gap-2">
                                        {NODE_COLORS.map(color => <button key={color} onClick={() => handleNodeColorChange(color)} className="w-6 h-6 rounded-full border border-border-color" style={{ backgroundColor: color }}/>)}
                                    </div>
                                </div>
                            </>
                        )}
                        <div className="my-1 border-t border-border-color"/>
                        <Button variant="ghost" className="w-full !justify-start text-red-400" onClick={handleDeleteTarget}>Delete</Button>
                    </div>
                </FocusTrap>
            )}
        </div>
    );
};

export default MindMapView;
