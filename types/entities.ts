// types/entities.ts
import { Attributes } from "./forms";

export type EntityId = string;

export interface EntityTypeDefinition {
  key: string; // e.g., 'character', 'location', 'magic-system'
  name: string; // e.g., 'Character', 'Location', 'Magic System'
  icon: string; // e.g., 'UserIcon', 'MapPinIcon'
  isCustom: boolean;
}

// Base Entity
export interface BaseEntity {
  id: EntityId;
  name: string;
  description: string;
  type: string; // Corresponds to the `key` in EntityTypeDefinition
  templateId?: string;
  details?: Attributes;
  tagIds?: string[];
  lastModified: string;
  avatar?: string; // image ID
}

export interface CharacterArcStageDetail {
    description: string;
    linkedSceneIds: string[];
    linkedEventIds: string[];
    emotionalValue?: number;
}
export interface CharacterArcStage {
    [key: string]: CharacterArcStageDetail;
}

export interface CharacterPrompt {
    key: string;
    label: string;
}

export interface CharacterPromptCategory {
    key: string;
    label: string;
    prompts: CharacterPrompt[];
}


// Specific Entity Types
export interface CharacterEntity extends BaseEntity {
  type: 'character';
  internalGoal?: string;
  externalGoal?: string;
  characterArc?: CharacterArcStage;
  prompts?: Record<string, string>;
  themeIds?: string[];
  conflictIds?: string[];
}

export interface LocationEntity extends BaseEntity {
  type: 'location';
  mapCoordinates?: { x: number; y: number }; // Percentage-based coordinates
}

export interface ObjectEntity extends BaseEntity {
  type: 'object';
}

export interface Member {
    entityId: EntityId;
    role: string;
}
export interface OrganizationEntity extends BaseEntity {
  type: 'organization';
  members?: Member[];
}

export type Entity = CharacterEntity | LocationEntity | ObjectEntity | OrganizationEntity;