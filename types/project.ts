// types/project.ts
import { Entity, EntityTypeDefinition, EntityId, CharacterPromptCategory } from "./entities";
import { HistoricalEvent, WorldEvent, CustomCalendar, EventSchema } from "./events";
import { Work, Series, Collection, NarrativeScene, Timeline, StoryStructureTemplate } from "./narrative";
import { Relationship } from "./relationships";
import { SavedQuery } from './ui';
import { FormField } from "./forms";
import { MindMapNode, MindMapEdge } from "./mindmap";
import { CONFLICT_TYPE, CONFLICT_STATUS } from '../constants';
import { Comment } from './comments';

export type ConflictType = typeof CONFLICT_TYPE[keyof typeof CONFLICT_TYPE];
export type ConflictStatus = typeof CONFLICT_STATUS[keyof typeof CONFLICT_STATUS];


export interface TrashedItem {
  item: any; // The deleted item
  itemType: string; // e.g., 'Entity', 'Work', 'Scene'
  deletedAt: string; // ISO string
  metadata?: { // For context when restoring
      workId?: string;
      chapterId?: string;
      seriesId?: string;
      collectionId?: string;
      sceneId?: string;
      // any other parent IDs
  }
}

export interface EntityTemplate {
    id: string;
    name: string;
    entityType: string; // key of EntityTypeDefinition
    schema: FormField[];
}

export interface Tag {
  id: string;
  label: string;
  color: string;
  lastModified: string;
}

export interface MapLayer {
    id: string;
    name: string;
    image: string; // image ID
    width: number;
    height: number;
    isVisible: boolean;
}

export interface ResearchNote {
  id: string;
  title: string;
  content: string;
  jsonContent?: any;
  wordCount: number;
  notebookId?: string;
  entityIds?: EntityId[];
  lastModified: string;
  tagIds?: string[];
}

export interface Notebook {
  id: string;
  name: string;
  noteIds: string[];
}

export interface Theme {
  id: string;
  name: string;
  description: string;
}

export interface Conflict {
  id: string;
  name: string;
  description: string;
  type: ConflictType;
  status: ConflictStatus;
}

export interface DictionaryEntry {
    id: string;
    term: string;
    definition: string;
    caseSensitive: boolean;
}

export interface StoryBible {
  title: string;
  entityTypes: EntityTypeDefinition[];
  entities: Record<string, Entity>;
  events: Record<string, HistoricalEvent>;
  relationships: Record<string, Relationship>;
  worldEvents: Record<string, WorldEvent>;
  timelines: Record<string, Timeline>;
  customEventSchemas: Record<string, EventSchema[]>;
  entityTemplates: Record<string, EntityTemplate[]>;
  calendar: CustomCalendar;
  works: Record<string, Work>;
  series: Record<string, Series>;
  collections: Record<string, Collection>;
  scenes: Record<string, NarrativeScene>; // Normalized scene data
  tags: Record<string, Tag>;
  comments: Record<string, Comment>;
  commonRoles: string[];
  relationshipTypes: string[];
  characterPrompts: CharacterPromptCategory[];
  dictionary: Record<string, DictionaryEntry>;
  map: {
    layers: MapLayer[];
    baseLayerId: string | null;
  };
  researchNotes: Record<string, ResearchNote>;
  notebooks: Record<string, Notebook>;
  graphLayout: Record<EntityId, { x: number; y: number; fx?: number | null; fy?: number | null; }>;
  mindMap: {
    nodes: Record<string, MindMapNode>;
    edges: MindMapEdge[];
  };
  writingGoals: {
    projectWordGoal: number;
    dailyWordGoal: number;
  };
  writingHistory: Array<{
    date: string; // YYYY-MM-DD
    wordCount: number;
  }>;
  themes: Record<string, Theme>;
  conflicts: Record<string, Conflict>;
  savedQueries: Record<string, SavedQuery>;
  storyStructures: Record<string, StoryStructureTemplate>;
  scratchpad: string;
  trash: TrashedItem[];
}