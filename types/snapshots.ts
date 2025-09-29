// types/snapshots.ts
import { StoryBible } from "./project";
export type { StoryBible } from './project';

export interface SnapshotMetadata {
    id: number; // timestamp
    message: string;
    entityCount: number;
    eventCount: number;
}
export interface Snapshot extends SnapshotMetadata {
    data: StoryBible;
}

// immer Patch type, as it's related to state history/snapshots
declare namespace immer {
  export interface Patch {
      op: 'replace' | 'add' | 'remove';
      path: (string | number)[];
      value?: any;
  }
}
export type Patch = immer.Patch;
export interface HistoryEntry {
    patches: Patch[];
    inversePatches: Patch[];
}
