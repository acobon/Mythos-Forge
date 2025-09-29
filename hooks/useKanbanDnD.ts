// hooks/useKanbanDnD.ts
import { useState } from 'react';
import {
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    DragCancelEvent
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Work, Chapter, NarrativeScene } from '../types';

interface KanbanBoardData {
    chapter: Chapter;
    scenes: NarrativeScene[];
}

interface UseKanbanDnDProps {
    selectedWork: Work;
    boardData: KanbanBoardData[];
    reorderScenes: (payload: {
        workId: string;
        sourceChapterId: string;
        sourceIndex: number;
        destChapterId: string;
        destIndex: number;
    }) => void;
}

export const useKanbanDnD = ({ selectedWork, boardData, reorderScenes }: UseKanbanDnDProps) => {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(TouchSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (over && active.id !== over.id) {
            const sourceChapterId = active.data.current?.sortable.containerId;
            const sourceIndex = active.data.current?.sortable.index;

            // `over.id` can be a chapter ID if dropping on an empty chapter,
            // or a scene ID if dropping on another scene.
            const destChapterId = over.data.current?.sortable.containerId || over.id;
            const destIndex = over.data.current?.sortable.index ?? 0;
            
            if (sourceChapterId !== undefined && sourceIndex !== undefined) {
                reorderScenes({
                    workId: selectedWork.id,
                    sourceChapterId,
                    sourceIndex,
                    destChapterId,
                    destIndex
                });
            }
        }
    };

    const handleDragCancel = () => {
        setActiveId(null);
    };

    return {
        activeId,
        sensors,
        handleDragStart,
        handleDragEnd,
        handleDragCancel,
    };
};
