// components/views/plotting/CorkboardView.tsx
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAppSelector } from '../../../state/hooks';
import { Work, NarrativeScene, CorkboardLabel, CorkboardConnection, EntityId } from '../../../types/index';
import { useWorkActions } from '../../../hooks/useWorkActions';
import { htmlToPlainText } from '../../../utils';
import { useI18n } from '../../../hooks/useI18n';
import { PaletteIcon, TrashIcon, LinkIcon, PlusCircleIcon, ZoomInIcon, ZoomOutIcon, RefreshCwIcon, PlusIcon } from '../../common/Icons';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import { useNavigation } from '../../../hooks/useNavigation';
import { Button } from '../../common/ui';

const NODE_COLORS = ['#FFF9C4', '#F8BBD0', '#C8E6C9', '#B3E5FC', '#D1C4E9'];
const CARD_WIDTH = 200;
const CARD_HEIGHT = 120;

const SceneCard: React.FC<{ scene: NarrativeScene, isSelected: boolean }> = ({ scene, isSelected }) => (
    <div className={`w-full h-full p-3 rounded-lg shadow-md flex flex-col border-2 overflow-hidden ${isSelected ? 'border-highlight' : 'border-border-color'}`} style={{ backgroundColor: scene.color || NODE_COLORS[0] }}>
        <h4 className="font-bold text-sm text-gray-800 line-clamp-2">{scene.title}</h4>
        <p className="text-xs text-gray-600 mt-1 line-clamp-4 flex-grow">{htmlToPlainText(scene.summary || scene.content)}</p>
    </div>
);

const LabelCard: React.FC<{ label: CorkboardLabel, isEditing: boolean, value: string, onChange: (val: string) => void, onBlur: () => void }> = ({ label, isEditing, value, onChange, onBlur }) => (
    <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        autoFocus={isEditing}
        className="w-full h-full bg-transparent border-2 border-dashed border-border-color/50 focus:border-accent resize-none p-2 text-center font-semibold focus:ring-0"
        style={{ color: label.color || '#333' }}
    />
);

interface CorkboardViewProps { work: Work }

const CorkboardView: React.FC<CorkboardViewProps> = ({ work }) => {
    const { t } = useI18n();
    const { scenes: allScenes, selectedSceneId } = useAppSelector(state => state.bible.present.narrative);
    const { updateNarrativeScene, saveCorkboardLabel, deleteCorkboardLabel, saveCorkboardConnection, deleteCorkboardConnection } = useWorkActions();
    const { navigateToScene } = useNavigation();
    const showConfirm = useConfirmationDialog();
    const svgRef = useRef<SVGSVGElement>(null);

    const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
    const [draggedItem, setDraggedItem] = useState<{ id: string, type: 'scene' | 'label', offsetX: number, offsetY: number } | null>(null);
    const [linking, setLinking] = useState<{ sourceId: string, x: number, y: number } | null>(null);
    const [contextMenu, setContextMenu] = useState<{ id: string, type: 'scene' | 'label' | 'connection', x: number, y: number } | null>(null);
    const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
    const [editingLabelText, setEditingLabelText] = useState('');

    const scenes = useMemo(() => work.sceneIds.map(id => allScenes[id]).filter(Boolean), [work.sceneIds, allScenes]);
    const labels = useMemo(() => work.corkboardLabels || [], [work.corkboardLabels]);
    const connections = useMemo(() => work.corkboardConnections || [], [work.corkboardConnections]);

    const getSVGPoint = (clientX: number, clientY: number) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const pt = svgRef.current.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const CTM = svgRef.current.getScreenCTM()?.inverse();
        return pt.matrixTransform(CTM);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0 || (e.target as HTMLElement).closest('.corkboard-item')) return;
        const start = getSVGPoint(e.clientX, e.clientY);
        const onMove = (moveEvent: MouseEvent) => {
            const pos = getSVGPoint(moveEvent.clientX, moveEvent.clientY);
            setTransform(t => ({ ...t, x: t.x + (pos.x - start.x) * t.k, y: t.y + (pos.y - start.y) * t.k }));
        };
        const onUp = () => document.removeEventListener('mousemove', onMove);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp, { once: true });
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const scaleAmount = -e.deltaY * 0.001;
        setTransform(t => ({ ...t, k: Math.max(0.2, Math.min(2, t.k * (1 + scaleAmount))) }));
    };

    const handleDragStart = (e: React.MouseEvent, id: string, type: 'scene' | 'label') => {
        e.stopPropagation();
        const pos = getSVGPoint(e.clientX, e.clientY);
        const itemPos = type === 'scene' 
            ? scenes.find(s => s.id === id)?.corkboardPosition
            : labels.find(l => l.id === id);
        if(!itemPos) return;
        setDraggedItem({ id, type, offsetX: pos.x - itemPos.x, offsetY: pos.y - itemPos.y });
    };

    const handleDragMove = (e: React.MouseEvent) => {
        if (!draggedItem) return;
        const pos = getSVGPoint(e.clientX, e.clientY);
        const newX = pos.x - draggedItem.offsetX;
        const newY = pos.y - draggedItem.offsetY;
        if (draggedItem.type === 'scene') {
            updateNarrativeScene({ sceneId: draggedItem.id, updates: { corkboardPosition: { x: newX, y: newY } } });
        } else {
            saveCorkboardLabel(work.id, { id: draggedItem.id, x: newX, y: newY });
        }
    };

    const handleDragEnd = () => setDraggedItem(null);

    const handleAddLabel = () => saveCorkboardLabel(work.id, { text: 'New Label', x: 100, y: 100, color: '#333' });
    
    const getNodeCenter = (id: string) => {
        const scene = scenes.find(s => s.id === id);
        if (scene && scene.corkboardPosition) return { x: scene.corkboardPosition.x + CARD_WIDTH / 2, y: scene.corkboardPosition.y + CARD_HEIGHT / 2 };
        const label = labels.find(l => l.id === id);
        if (label) return { x: label.x + CARD_WIDTH / 2, y: label.y };
        return { x: 0, y: 0 };
    };

    const handleNodeMouseUp = (e: React.MouseEvent, id: string) => {
        if (linking && linking.sourceId !== id) {
            saveCorkboardConnection(work.id, { id: `conn-${Date.now()}`, source: linking.sourceId, target: id });
        }
        setLinking(null);
    };

    return (
        <div className="w-full h-full relative overflow-hidden bg-secondary">
            <svg ref={svgRef} width="100%" height="100%" onMouseDown={handleMouseDown} onMouseMove={handleDragMove} onMouseUp={handleDragEnd} onWheel={handleWheel} onDoubleClick={handleAddLabel}>
                <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
                    {connections.map(conn => {
                        const sourcePos = getNodeCenter(conn.source);
                        const targetPos = getNodeCenter(conn.target);
                        return <line key={conn.id} x1={sourcePos.x} y1={sourcePos.y} x2={targetPos.x} y2={targetPos.y} stroke="var(--color-border-color)" strokeWidth="2" />;
                    })}
                    {scenes.map(scene => (
                        <foreignObject key={scene.id} x={scene.corkboardPosition?.x || 0} y={scene.corkboardPosition?.y || 0} width={CARD_WIDTH} height={CARD_HEIGHT} className="corkboard-item cursor-grab"
                            onMouseDown={e => handleDragStart(e, scene.id, 'scene')} onMouseUp={e => handleNodeMouseUp(e, scene.id)}
                            onClick={() => navigateToScene(work.id, scene.id)}>
                            <SceneCard scene={scene} isSelected={scene.id === selectedSceneId} />
                        </foreignObject>
                    ))}
                    {labels.map(label => (
                        <foreignObject key={label.id} x={label.x || 0} y={label.y || 0} width={CARD_WIDTH} height={40} className="corkboard-item cursor-grab"
                            onMouseDown={e => handleDragStart(e, label.id, 'label')} onMouseUp={e => handleNodeMouseUp(e, label.id)}
                            onDoubleClick={e => { e.stopPropagation(); setEditingLabelId(label.id); setEditingLabelText(label.text); }}>
                            <LabelCard label={label} isEditing={editingLabelId === label.id} value={editingLabelId === label.id ? editingLabelText : label.text} onChange={setEditingLabelText} onBlur={() => { saveCorkboardLabel(work.id, { id: label.id, text: editingLabelText }); setEditingLabelId(null); }}/>
                        </foreignObject>
                    ))}
                    {linking && <line x1={getNodeCenter(linking.sourceId).x} y1={getNodeCenter(linking.sourceId).y} x2={linking.x} y2={linking.y} stroke="var(--color-accent)" strokeWidth="2" strokeDasharray="5,5" />}
                </g>
            </svg>
             <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                <Button size="icon" onClick={() => setTransform(t => ({ ...t, k: Math.min(2, t.k * 1.2)}))}><ZoomInIcon className="w-5 h-5"/></Button>
                <Button size="icon" onClick={() => setTransform(t => ({ ...t, k: Math.max(0.2, t.k * 0.8)}))}><ZoomOutIcon className="w-5 h-5"/></Button>
                <Button size="icon" onClick={() => setTransform({ x: 0, y: 0, k: 1 })}><RefreshCwIcon className="w-5 h-5"/></Button>
                <Button size="icon" onClick={handleAddLabel}><PlusIcon className="w-5 h-5"/></Button>
            </div>
        </div>
    );
};

export default CorkboardView;