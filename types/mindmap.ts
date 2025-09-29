// types/mindmap.ts
export interface MindMapNode {
    id: string;
    label: string;
    x: number;
    y: number;
    fx?: number | null;
    fy?: number | null;
    color?: string;
    entityId?: string;
    shape?: 'rect' | 'circle';
}
export interface MindMapEdge {
    id: string;
    source: string;
    target: string;
    style?: 'solid' | 'dashed';
    color?: string;
}
