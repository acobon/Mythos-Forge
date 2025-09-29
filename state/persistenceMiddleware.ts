
// state/persistenceMiddleware.ts
import { Middleware } from '@reduxjs/toolkit';
import { RootState } from './store';
import * as idbService from '../services/idbService';
import { StoryBible } from '../types/index';
import { setBible } from './actions';

// Debounce utility
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const debounced = (...args: Parameters<F>) => {
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => func(...args), waitFor);
    };
    
    (debounced as any).cancel = () => {
        if (timeout !== null) {
            clearTimeout(timeout);
        }
    };

    return debounced as F & { cancel: () => void };
};

let debouncedSave: ((bibleState: StoryBible) => void) & { cancel: () => void } | null = null;

export const persistenceMiddleware: Middleware = store => next => action => {
    if (setBible.match(action)) {
        // For a full project load/import, cancel any pending saves and save immediately.
        debouncedSave?.cancel();
        const result = next(action);
        idbService.setBible(action.payload);
        return result;
    }

    const prevState = store.getState();
    const result = next(action);
    const nextState = store.getState();

    const prevDelay = prevState.ui.autosaveDelay;
    const nextDelay = nextState.ui.autosaveDelay;

    // If autosave delay has changed or if the debounced function hasn't been created yet,
    // create a new one with the correct delay.
    if (prevDelay !== nextDelay || !debouncedSave) {
        debouncedSave?.cancel();
        debouncedSave = debounce((bibleState: StoryBible) => {
            idbService.setBible(bibleState);
        }, nextDelay);
    }

    // If the bible state has changed, trigger a debounced save.
    if (prevState.bible.present !== nextState.bible.present) {
        debouncedSave(nextState.bible.present);
    }
    
    return result;
};
