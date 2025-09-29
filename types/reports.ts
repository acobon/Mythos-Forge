// types/reports.ts
import { Entity, CharacterEntity } from './entities';
import { Tag, Theme, Conflict } from './project';

export interface OrphanedEntity {
    id: string;
    name: string;
    type: string;
}

export type PovDistribution = Record<string, number>;

export interface ScenePacingInfo {
    id: string;
    title: string;
    wordCount: number;
    chapterTitle: string;
}

export interface InteractionMatrix {
    entities: CharacterEntity[];
    matrix: Record<string, Record<string, number>>;
}

export interface CharacterMentions {
    id: string;
    name: string;
    count: number;
}

export interface ItemUsage {
    id: string;
    name: string;
    type: string;
    location: string;
    workId?: string;
}

export interface FrequencyInfo {
    id: string;
    name: string;
    count: number;
    color?: string;
    type: 'tag' | 'theme' | 'conflict';
}

export interface TagThemeFrequencyData {
    tags: FrequencyInfo[];
    themes: FrequencyInfo[];
    conflicts: FrequencyInfo[];
}