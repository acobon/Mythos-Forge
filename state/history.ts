
// state/history.ts
import { AnyAction, Reducer, createAction } from '@reduxjs/toolkit';

export interface HistoryState<T = any> {
    past: T[];
    present: T;
    future: T[];
}

export const UNDO = 'history/UNDO';
export const REDO = 'history/REDO';

export const undo = createAction(UNDO);
export const redo = createAction(REDO);

const HISTORY_LIMIT = 50; // Set the history limit

// A generic higher-order reducer to add undo/redo capabilities.
export const withHistory = <T>(reducer: Reducer<T>): Reducer<HistoryState<T>> => {
    const initialState: HistoryState<T> = {
        past: [],
        present: reducer(undefined, {} as AnyAction),
        future: [],
    };

    return (state = initialState, action: AnyAction): HistoryState<T> => {
        const { past, present, future } = state;
        
        if (undo.match(action)) {
            if (past.length === 0) return state;
            const previous = past[past.length - 1];
            const newPast = past.slice(0, past.length - 1);
            return {
                past: newPast,
                present: previous,
                future: [present, ...future],
            };
        }
        
        if (redo.match(action)) {
             if (future.length === 0) return state;
            const next = future[0];
            const newFuture = future.slice(1);
            return {
                past: [...past, present],
                present: next,
                future: newFuture,
            };
        }

        const newPresent = reducer(present, action);
        // If the state hasn't changed, don't create a new history entry.
        if (present === newPresent) {
            return state;
        }
        
        const newPast = [...past, present];
        if (newPast.length > HISTORY_LIMIT) {
            newPast.splice(0, newPast.length - HISTORY_LIMIT);
        }

        // For any other action, update the present and clear the future.
        return {
            past: newPast,
            present: newPresent,
            future: [],
        };
    };
};
