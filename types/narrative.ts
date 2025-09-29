// types/narrative.ts
import { EntityId } from "./entities";
import { TranslationKey } from './i18n';
import { WORK_TYPE, WORK_STATUS } from '../constants';

export type WorkType = typeof WORK_TYPE[keyof typeof WORK_TYPE];
export type WorkStatus = typeof WORK_STATUS[keyof typeof WORK_STATUS];


export interface SceneVersion {
    timestamp: string; // ISO string
    content: string;
    jsonContent?: any;
}

export interface NarrativeScene {
  id: string;
  title: string;
  content: string;
  jsonContent?: any;
  wordCount: number;
  summary?: string;
  povEntityId?: EntityId;
  involvedEntityIds: EntityId[];
  linkedEventIds: string[];
  tagIds?: string[];
  lastModified: string;
  themeIds?: string[];
  conflictIds?: string[];
  corkboardPosition?: { x: number; y: number };
  history?: SceneVersion[];
  color?: string;
}

export interface CorkboardLabel {
    id: string;
    text: string;
    x: number;
    y: number;
    color: string;
}

export interface CorkboardConnection {
    id: string;
    source: string; // sceneId
    target: string; // sceneId
}

export interface Chapter {
    id: string;
    title: string;
    summary?: string;
    sceneIds: string[];
}

export interface Work {
  id: string;
  title: string;
  description: string;
  sceneIds: string[]; // All scene IDs belonging to this work
  chapters: Chapter[];
  themeIds?: string[];
  conflictIds?: string[];
  workType: WorkType;
  status: WorkStatus;
  seriesId?: string;
  collectionId?: string;
  tagIds?: string[];
  lastModified: string;
  corkboardLabels?: CorkboardLabel[];
  corkboardConnections?: CorkboardConnection[];
}

export interface Series {
  id: string;
  title: string;
  description: string;
  workIds: string[]; // Ordered list of work IDs in this series
  tagIds?: string[];
  lastModified: string;
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  workIds: string[]; // Unordered list of work IDs in this collection
  tagIds?: string[];
  lastModified: string;
}

export interface StoryStructureTemplate_BuiltIn {
    nameKey: TranslationKey;
    descriptionKey: TranslationKey;
    chapters: {
        titleKey: TranslationKey;
        summaryKey: TranslationKey;
    }[];
}

export interface StoryStructureChapter {
    id: string;
    title: string;
    summary: string;
}

export interface StoryStructureTemplate {
    id: string;
    name: string;
    description: string;
    chapters: StoryStructureChapter[];
}

export interface TranslatedStoryStructure {
    name: string;
    description: string;
    chapters: {
        title: string;
        summary: string;
    }[];
}


export interface Timeline {
    id: string;
    name: string;
    description?: string;
    eventIds: string[];
}