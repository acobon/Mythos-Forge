// graph.worker.ts
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, Simulation, SimulationNodeDatum } from 'd3-force';
import { GraphNode, GraphEdge, EntityId } from './types';

type D3Node = GraphNode & SimulationNodeDatum;

let simulation: Simulation<D3Node, GraphEdge> | null = null;

interface StartData {
    type: 'START';
    nodes: D3Node[];
    edges: GraphEdge[];
    width: number;
    height: number;
    nodeRadius: number;
}

interface UpdateNodeData {
    type: 'UPDATE_NODE';
    payload: { id: EntityId; fx: number | null; fy: number | null };
}

type WorkerMessage =
    | StartData
    | UpdateNodeData
    | { type: 'DRAG_START' }
    | { type: 'DRAG_END' }
    | { type: 'STOP' };

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const { type } = event.data;

    switch (type) {
        case 'START': {
            const { nodes, edges, width, height, nodeRadius } = event.data;

            if (simulation) {
                simulation.stop();
            }

            simulation = forceSimulation(nodes)
                .force('link', forceLink<D3Node, GraphEdge>(edges).id(d => d.id).distance(120).strength(0.3))
                .force('charge', forceManyBody().strength(-500))
                .force('center', forceCenter(width / 2, height / 2))
                .force('collide', forceCollide().radius(nodeRadius * 1.5).strength(1));

            simulation.on('tick', () => {
                const positions = (simulation?.nodes() || []).map(n => ({ id: n.id, x: n.x, y: n.y }));
                self.postMessage({ type: 'TICK', positions });
            });

            simulation.alpha(1).restart();
            break;
        }
        case 'UPDATE_NODE': {
            if (!simulation) break;
            const { id, fx, fy } = event.data.payload;
            const node = simulation.nodes().find(n => n.id === id);
            if (node) {
                node.fx = fx;
                node.fy = fy;
            }
            break;
        }
        case 'DRAG_START':
            if (simulation) simulation.alphaTarget(0.1).restart();
            break;
        case 'DRAG_END':
            if (simulation) simulation.alphaTarget(0);
            break;
        case 'STOP':
             if (simulation) {
                simulation.stop();
                simulation = null;
            }
            break;
    }
};