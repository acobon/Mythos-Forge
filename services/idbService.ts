

import { StoryBible, Work } from '../types';
import { IDB_NAME, IDB_VERSION, IDB_BIBLE_STORE, IDB_SNAPSHOTS_STORE, IDB_IMAGES_STORE } from '../constants';
import * as idb from 'idb';
import { defaultStoryBible } from '../data/defaults';
import { RootState } from '../state/store';

interface ImageRecord {
    id: string;
    blob: Blob;
}

const dbPromise = idb.openDB(IDB_NAME, IDB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
        if (!db.objectStoreNames.contains(IDB_BIBLE_STORE)) {
            db.createObjectStore(IDB_BIBLE_STORE);
        }
        if (!db.objectStoreNames.contains(IDB_SNAPSHOTS_STORE)) {
            db.createObjectStore(IDB_SNAPSHOTS_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(IDB_IMAGES_STORE)) {
            db.createObjectStore(IDB_IMAGES_STORE, { keyPath: 'id' });
        }
    },
    blocked() {
        // This event fires if another tab has an older version of the DB open,
        // preventing the 'upgrade' callback from running.
        alert("The database is blocked. Please close any other tabs running this application and refresh the page.");
    },
});

export const getBible = async (): Promise<StoryBible | null> => {
    try {
        const db = await dbPromise;
        const tx = db.transaction(IDB_BIBLE_STORE, 'readonly');
        const store = tx.objectStore(IDB_BIBLE_STORE);
        
        // Use a cursor to safely iterate and build the object, as the order of
        // getAllKeys and getAll is not guaranteed to be the same.
        const assembledBible: Partial<StoryBible> = {};
        let cursor = await store.openCursor();
        while (cursor) {
            if (typeof cursor.key === 'string') {
                // This is a bit unsafe but necessary given the structure
                (assembledBible as any)[cursor.key] = cursor.value;
            }
            cursor = await cursor.continue();
        }

        if (Object.keys(assembledBible).length === 0) {
            return null;
        }
        
        // Ensure all default keys are present to prevent crashes if a slice is missing
        return { ...defaultStoryBible, ...assembledBible } as StoryBible;

    } catch (error) {
        console.error("Failed to retrieve story bible from IndexedDB:", error);
        return null;
    }
};

export const setBible = async (storyBible: StoryBible): Promise<void> => {
    try {
        const db = await dbPromise;
        const tx = db.transaction(IDB_BIBLE_STORE, 'readwrite');
        const store = tx.objectStore(IDB_BIBLE_STORE);
        await store.clear();
        const slicePromises = Object.entries(storyBible).map(([key, value]) => {
            return store.put(value, key);
        });
        await Promise.all([...slicePromises, tx.done]);
    } catch (error) {
        console.error("Failed to save story bible to IndexedDB:", error);
    }
};


export const saveBibleSlice = async (sliceName: keyof RootState['bible']['present'], data: any): Promise<void> => {
    try {
        const db = await dbPromise;
        await db.put(IDB_BIBLE_STORE, data, sliceName);
    } catch (error) {
        console.error(`Failed to save slice ${String(sliceName)} to IndexedDB:`, error);
    }
}

export const saveImage = async (id: string, blob: Blob): Promise<void> => {
    try {
        const db = await dbPromise;
        await db.put(IDB_IMAGES_STORE, { id, blob });
    } catch (error) {
        console.error("Failed to save image to IndexedDB:", error);
    }
};

export const getImage = async (id: string): Promise<Blob | null> => {
    try {
        const db = await dbPromise;
        const record: ImageRecord | undefined = await db.get(IDB_IMAGES_STORE, id);
        return record ? record.blob : null;
    } catch (error) {
        console.error("Failed to retrieve image from IndexedDB:", error);
        return null;
    }
};

export const deleteImage = async (id: string): Promise<void> => {
    try {
        const db = await dbPromise;
        await db.delete(IDB_IMAGES_STORE, id);
    } catch (error) {
        console.error("Failed to delete image from IndexedDB:", error);
    }
};

export const getAllImages = async (): Promise<Map<string, Blob>> => {
    try {
        const db = await dbPromise;
        const records: ImageRecord[] = await db.getAll(IDB_IMAGES_STORE);
        return new Map(records.map(r => [r.id, r.blob]));
    } catch (error) {
        console.error("Failed to retrieve all images from IndexedDB:", error);
        return new Map();
    }
};