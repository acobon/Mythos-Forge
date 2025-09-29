import { StoryBible, Snapshot, SnapshotMetadata } from '../types';
import { IDB_NAME, IDB_VERSION, IDB_SNAPSHOTS_STORE, IDB_BIBLE_STORE } from '../constants';
import * as idb from 'idb';

const dbPromise = idb.openDB(IDB_NAME, IDB_VERSION, {
    upgrade(db) {
        if (!db.objectStoreNames.contains(IDB_SNAPSHOTS_STORE)) {
            db.createObjectStore(IDB_SNAPSHOTS_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(IDB_BIBLE_STORE)) {
            db.createObjectStore(IDB_BIBLE_STORE);
        }
    },
});


export const saveSnapshot = async (snapshot: Snapshot): Promise<void> => {
    const db = await dbPromise;
    await db.put(IDB_SNAPSHOTS_STORE, snapshot);
};

export const getSnapshotsMetadata = async (): Promise<SnapshotMetadata[]> => {
    const db = await dbPromise;
    const allSnapshots: Snapshot[] = await db.getAll(IDB_SNAPSHOTS_STORE);
    return allSnapshots.map(({ id, message, entityCount, eventCount }) => ({
        id, message, entityCount, eventCount
    }));
};

export const getSnapshotData = async (id: number): Promise<StoryBible | null> => {
    const db = await dbPromise;
    const snapshot: Snapshot | undefined = await db.get(IDB_SNAPSHOTS_STORE, id);
    return snapshot ? snapshot.data : null;
};

export const deleteSnapshot = async (id: number): Promise<void> => {
    const db = await dbPromise;
    await db.delete(IDB_SNAPSHOTS_STORE, id);
};