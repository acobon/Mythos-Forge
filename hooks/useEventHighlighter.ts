import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { setHighlightEvent } from '../state/uiSlice';

/**
 * A hook to manage the highlighting of an event element.
 * It handles scrolling the element into view, applying a temporary highlight,
 * and clearing the global highlight state.
 */
export const useEventHighlighter = () => {
    const dispatch = useAppDispatch();
    const globalHighlightId = useAppSelector(state => state.ui.highlightEventId);
    const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);
    const eventRefs = useRef(new Map<string, HTMLElement>());

    const setEventRef = useCallback((id: string, element: HTMLElement | null) => {
        if (element) {
            eventRefs.current.set(id, element);
        } else {
            eventRefs.current.delete(id);
        }
    }, []);

    const highlightElement = useCallback((id: string) => {
        const element = eventRefs.current.get(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedEventId(id);
        }
    }, []);

    // Effect to handle the one-time trigger from global state
    useEffect(() => {
        if (globalHighlightId) {
            highlightElement(globalHighlightId);
            // Clear the global trigger immediately so it doesn't re-trigger on re-renders
            dispatch(setHighlightEvent(null));
        }
    }, [globalHighlightId, highlightElement, dispatch]);

    // Effect to manage the timeout for the local highlight state
    useEffect(() => {
        if (highlightedEventId) {
            const timer = setTimeout(() => {
                setHighlightedEventId(null);
            }, 2000); // Highlight lasts 2 seconds
            
            return () => clearTimeout(timer);
        }
    }, [highlightedEventId]);

    return {
        highlightedEventId,
        setEventRef,
        highlightElement,
    };
};