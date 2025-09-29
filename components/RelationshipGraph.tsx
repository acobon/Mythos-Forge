// components/RelationshipGraph.tsx
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { GraphNode, GraphEdge, EntityType, EntityId } from '../types/index';
import { useDebounce } from '../hooks/useDebounce';
import { RELATIONSHIP_GRAPH_NODE_RADIUS, RELATIONSHIP_GRAPH_FONT_SIZE } from '../constants';
import { PinIcon } from './common/Icons';
import { useGraphActions } from '../hooks/useGraphActions';
import { middleTruncate } from '../utils';
import { useConfirmationDialog } from '../hooks/useConfirmationDialog';
import DOMPurify from 'dompurify';
import { useAppSelector } from '../state/hooks';

interface RelationshipGraphProps {
    nodes: GraphNode[];
    edges: GraphEdge[];
    onNodeClick: (node: GraphNode) => void;
    highlightedConnection?: { source: string; target: string } | null;
}

const typeColors: Record<EntityType, string> = {
    [EntityType.CHARACTER]: 'var(--color-viz-1)',
    [EntityType.LOCATION]: 'var(--color-viz-2)',
    [EntityType.OBJECT]: 'var(--color-viz-3)',
    [EntityType.ORGANIZATION]: 'var(--color-viz-4)',
};

const getEdgeKey = (edge: GraphEdge): string => [edge.source, edge.target].sort().join('--');

type D3Node = GraphNode & {
    x: number;
    y: number;
    fx?: number | null;
    fy?: number | null;
    pinned?: boolean;
    sanitizedLabel: string;
};


const RelationshipGraph: React.FC<RelationshipGraphProps> = ({ nodes: propNodes, edges, onNodeClick, highlightedConnection }) => {
    const { updateGraphLayout } = useGraphActions();
    const { graphLayout } = useAppSelector(state => state.bible.present.knowledge);
    const showConfirm = useConfirmationDialog();

    const svgRef = useRef<SVGSVGElement>(null);
    const workerRef = useRef<Worker | null>(null);
    const [{ width, height }, setDimensions] = useState({ width: 0, height: 0 });
    
    const [layoutNodes, setLayoutNodes] = useState<D3Node[]>([]);
    const nodeMap = useMemo(() => new Map(layoutNodes.map(n => [n.id, n])), [layoutNodes]);
    
    const [draggedNode, setDraggedNode] = useState<D3Node | null>(null);
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
    const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
    
    const latestPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
    const animationFrameRef = useRef<number | undefined>(undefined);
    
    const nodesKey = useMemo(() => propNodes.map(n => n.id).sort().join(','), [propNodes]);
    const edgesKey = useMemo(() => edges.map(getEdgeKey).sort().join(','), [edges]);

    // Initialize and manage the simulation worker
    useEffect(() => {
        if (width > 0 && height > 0) {
            const worker = new Worker(new URL('../graph.worker.ts', import.meta.url), { type: 'module' });
            workerRef.current = worker;
            
            const renderLoop = () => {
                const latestPositions = latestPositionsRef.current;
                setLayoutNodes(prevNodes => {
                    let hasChanged = false;
                    const newNodes = prevNodes.map(node => {
                        const newPos = latestPositions.get(node.id);
                        if (newPos && !node.fx && (node.x !== newPos.x || node.y !== newPos.y)) {
                            hasChanged = true;
                            return { ...node, x: newPos.x, y: newPos.y };
                        }
                        return node;
                    });
                    return hasChanged ? newNodes : prevNodes;
                });
                animationFrameRef.current = window.requestAnimationFrame(renderLoop);
            };


            worker.onmessage = (event) => {
                if (event.data.type === 'TICK') {
                    const positions = event.data.positions as { id: string; x: number; y: number }[];
                    positions.forEach(p => latestPositionsRef.current.set(p.id, p));
                }
            };

            animationFrameRef.current = window.requestAnimationFrame(renderLoop);
            
            return () => {
                workerRef.current?.postMessage({ type: 'STOP' });
                workerRef.current?.terminate();
                if (animationFrameRef.current) {
                    window.cancelAnimationFrame(animationFrameRef.current);
                }
            };
        }
    }, [width, height]);
    
    useEffect(() => {
        const initialNodes = propNodes.map(propNode => {
            const savedPos = graphLayout?.[propNode.id];
            return {
                ...propNode,
                sanitizedLabel: DOMPurify.sanitize(propNode.label || ''),
                x: savedPos?.x ?? width / 2,
                y: savedPos?.y ?? height / 2,
                fx: savedPos?.fx ?? null,
                fy: savedPos?.fy ?? null,
                pinned: !!savedPos?.fx,
            };
        });

        setLayoutNodes(initialNodes);
        
        if (workerRef.current && initialNodes.length > 0 && width > 0 && height > 0) {
            workerRef.current.postMessage({
                type: 'START',
                nodes: initialNodes,
                edges,
                width,
                height,
                nodeRadius: RELATIONSHIP_GRAPH_NODE_RADIUS,
            });
        }
    }, [nodesKey, edgesKey, width, height, graphLayout, propNodes, edges]);
    
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

    const handleNodeMouseDown = useCallback((e: React.MouseEvent<SVGGElement>, node: D3Node) => {
        setDraggedNode(node);
        workerRef.current?.postMessage({ type: 'DRAG_START' });
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
        if (!draggedNode) return;
        const CTM = svgRef.current?.getScreenCTM();
        if (!CTM) return;
        const svgX = (e.clientX - CTM.e - transform.x) / transform.k;
        const svgY = (e.clientY - CTM.f - transform.y) / transform.k;
        
        setLayoutNodes(prev => prev.map(n => n.id === draggedNode.id ? {...n, fx: svgX, fy: svgY} : n));
        
        workerRef.current?.postMessage({
            type: 'UPDATE_NODE',
            payload: { id: draggedNode.id, fx: svgX, fy: svgY }
        });
    }, [draggedNode, transform]);
    
    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        if (draggedNode) {
            workerRef.current?.postMessage({ type: 'DRAG_END' });
            const finalNode = layoutNodes.find(n => n.id === draggedNode.id);
            if (finalNode) {
                updateGraphLayout({ id: finalNode.id, pos: { x: finalNode.x, y: finalNode.y, fx: finalNode.fx, fy: finalNode.fy } });
            }
        }
        setDraggedNode(null);
    }, [draggedNode, updateGraphLayout, layoutNodes]);

    const togglePin = useCallback((node: D3Node) => {
        const isPinned = !node.pinned;
        const newFx = isPinned ? node.x : null;
        const newFy = isPinned ? node.y : null;
        
        const updatedNode = { ...node, fx: newFx, fy: newFy, pinned: isPinned };
        setLayoutNodes(prev => prev.map(n => n.id === node.id ? updatedNode : n));
        
        updateGraphLayout({ id: node.id, pos: { x: node.x, y: node.y, fx: newFx, fy: newFy } });

        workerRef.current?.postMessage({
            type: 'UPDATE_NODE',
            payload: { id: node.id, fx: newFx, fy: newFy }
        });

        if (!isPinned) {
            workerRef.current?.postMessage({ type: 'DRAG_START' });
            setTimeout(() => workerRef.current?.postMessage({ type: 'DRAG_END' }), 200);
        }
    }, [updateGraphLayout]);

    const handleNodeActivation = useCallback((node: D3Node) => {
        showConfirm({
            title: `${node.sanitizedLabel} Actions`,
            message: 'Select an action for this node.',
            actions: [
                { text: 'Cancel', onClick: () => {}, variant: 'ghost' },
                { text: 'View Details', onClick: () => onNodeClick(node), variant: 'primary' },
                { text: node.pinned ? 'Unpin Node' : 'Pin Node', onClick: () => togglePin(node), variant: 'secondary' }
            ]
        });
    }, [showConfirm, onNodeClick, togglePin]);

    const handleCanvasKeyDown = useCallback((e: React.KeyboardEvent) => {
        const panAmount = 20;
        switch (e.key) {
            case 'ArrowUp': setTransform(t => ({...t, y: t.y + panAmount})); e.preventDefault(); break;
            case 'ArrowDown': setTransform(t => ({...t, y: t.y - panAmount})); e.preventDefault(); break;
            case 'ArrowLeft': setTransform(t => ({...t, x: t.x + panAmount})); e.preventDefault(); break;
            case 'ArrowRight': setTransform(t => ({...t, x: t.x - panAmount})); e.preventDefault(); break;
        }
    }, []);
    
    const activeNodeId = hoveredNodeId || focusedNodeId;

    const activeAndConnected = useMemo(() => {
        if (highlightedConnection) {
            return {
                nodes: new Set([highlightedConnection.source, highlightedConnection.target]),
                edges: new Set([[highlightedConnection.source, highlightedConnection.target].sort().join('--')])
            };
        }
        if (!activeNodeId) return { nodes: new Set(), edges: new Set() };
        const connectedNodes = new Set<string>([activeNodeId]);
        const connectedEdges = new Set<string>();
        
        edges.forEach(edge => {
            const edgeKey = getEdgeKey(edge);
            if (edge.source === activeNodeId) {
                connectedNodes.add(edge.target);
                connectedEdges.add(edgeKey);
            } else if (edge.target === activeNodeId) {
                connectedNodes.add(edge.source);
                connectedEdges.add(edgeKey);
            }
        });
        return { nodes: connectedNodes, edges: connectedEdges };
    }, [activeNodeId, edges, highlightedConnection]);

    return (
        <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onContextMenu={(e) => e.preventDefault()} onKeyDown={handleCanvasKeyDown} tabIndex={0} aria-label="Relationship graph canvas, use arrow keys to pan" role="img">
            <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
                {/* Edges */}
                {edges.map(edge => {
                    const sourceNode = nodeMap.get(edge.source);
                    const targetNode = nodeMap.get(edge.target);
                    if (!sourceNode || !targetNode) return null;

                    const edgeKey = getEdgeKey(edge);
                    const isHighlighted = activeAndConnected.edges.has(edgeKey);
                    const isDimmed = (activeNodeId !== null || highlightedConnection !== null) && !isHighlighted;
                    
                    return (
                        <line
                            key={edgeKey}
                            x1={sourceNode.x}
                            y1={sourceNode.y}
                            x2={targetNode.x}
                            y2={targetNode.y}
                            stroke="var(--color-border-color)"
                            strokeWidth={isHighlighted ? 3 : 1.5}
                            strokeDasharray={edge.isExplicit ? '8 4' : 'none'}
                            opacity={isDimmed ? 0.2 : 0.7}
                            className="transition-all"
                        />
                    );
                })}

                {/* Nodes */}
                {layoutNodes.map(node => {
                    const isPrimaryActive = activeNodeId === node.id || highlightedConnection?.source === node.id || highlightedConnection?.target === node.id;
                    const isConnected = activeAndConnected.nodes.has(node.id);
                    const isDimmed = (activeNodeId !== null || highlightedConnection !== null) && !isConnected;

                    return (
                        <g
                            key={node.id}
                            transform={`translate(${node.fx ?? node.x ?? 0}, ${node.fy ?? node.y ?? 0})`}
                            onClick={() => onNodeClick(node)}
                            onMouseDown={(e) => handleNodeMouseDown(e, node)}
                            onMouseEnter={() => setHoveredNodeId(node.id)}
                            onMouseLeave={() => setHoveredNodeId(null)}
                            onFocus={() => setFocusedNodeId(node.id)}
                            onBlur={() => setFocusedNodeId(null)}
                            onContextMenu={(e) => { e.preventDefault(); handleNodeActivation(node); }}
                            style={{ cursor: draggedNode ? 'grabbing' : 'grab' }}
                            className="transition-opacity focus:outline-none focus:ring-2 focus:ring-accent rounded-full group"
                            opacity={isDimmed ? 0.3 : 1}
                            aria-label={`Entity: ${node.sanitizedLabel}, Type: ${node.type}`}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') handleNodeActivation(node); }}
                        >
                            <circle
                                r={RELATIONSHIP_GRAPH_NODE_RADIUS}
                                fill={typeColors[node.type as EntityType]}
                                stroke={isPrimaryActive ? 'var(--color-highlight)' : 'var(--color-text-main)'}
                                strokeWidth={isPrimaryActive ? 4 : 2}
                                className="transition-all"
                            />
                            <text
                                textAnchor="middle"
                                dy="0.3em"
                                fill="var(--color-text-main)"
                                fontSize={RELATIONSHIP_GRAPH_FONT_SIZE}
                                fontWeight="bold"
                                style={{ pointerEvents: 'none' }}
                            >
                                <title>{node.sanitizedLabel}</title>
                                {middleTruncate(node.sanitizedLabel, 15)}
                            </text>
                            <g 
                                transform={`translate(${RELATIONSHIP_GRAPH_NODE_RADIUS - 12}, -${RELATIONSHIP_GRAPH_NODE_RADIUS - 12})`} 
                                onClick={(e) => { e.stopPropagation(); togglePin(node); }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                aria-label={node.pinned ? `Unpin ${node.sanitizedLabel}` : `Pin ${node.sanitizedLabel}`}
                            >
                                <circle r="12" fill="var(--color-secondary)" />
                                <PinIcon className={`w-4 h-4 -translate-x-2 -translate-y-2 ${node.pinned ? 'text-highlight' : 'text-text-secondary'}`} />
                            </g>
                             {isPrimaryActive && (
                                <text
                                    textAnchor="middle"
                                    y={RELATIONSHIP_GRAPH_NODE_RADIUS + RELATIONSHIP_GRAPH_FONT_SIZE + 2}
                                    fill="var(--color-text-main)"
                                    fontSize={RELATIONSHIP_GRAPH_FONT_SIZE}
                                    style={{ pointerEvents: 'none' }}
                                    className="animate-fade-in"
                                >
                                    {node.sanitizedLabel}
                                </text>
                            )}
                        </g>
                    );
                })}
            </g>
        </svg>
    );
};

export default RelationshipGraph;