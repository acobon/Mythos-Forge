// maintenance.worker.ts
import { StoryBible } from './types';
import { findBrokenReferences, findOrphanedItems, findOrphanedScenes } from './services/maintenanceService';

self.onmessage = (event: MessageEvent<{ type: string; storyBible: StoryBible }>) => {
    const { type, storyBible } = event.data;

    try {
        if (type === 'scan-broken-references') {
            const results = findBrokenReferences(storyBible);
            self.postMessage({ type: 'scan-broken-references-results', results });
        } else if (type === 'scan-orphaned-items') {
            const results = findOrphanedItems(storyBible);
            self.postMessage({ type: 'scan-orphaned-items-results', results });
        } else if (type === 'scan-orphaned-scenes') {
            const results = findOrphanedScenes(storyBible);
            self.postMessage({ type: 'scan-orphaned-scenes-results', results });
        }
    } catch (error) {
        self.postMessage({ type: 'error', message: error instanceof Error ? error.message : 'An unknown error occurred in the worker.' });
    }
};
