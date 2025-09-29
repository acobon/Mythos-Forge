// types/relationships.ts
import { Entity, EntityId } from "./entities";

export interface RelationshipStatus {
  id: string; // unique id for this status entry
  type: string; // e.g., "Allies", "Rivals", "Family"
  startDate: string; // The date this status began, from the event
  startEventId?: string; // The event that triggered this status
  description?: string;
}

export interface Relationship {
  id: string;
  entityIds: [EntityId, EntityId];
  statuses: RelationshipStatus[];
}

export interface RelationshipListItem {
  id: string;
  relationship: Relationship;
  entity1: Entity;
  entity2: Entity;
  label: string; // current status
  isExplicit: boolean;
}

export interface GraphNode {
    id: EntityId;
    label: string;
    type: string; // Corresponds to EntityTypeDefinition key
    x: number;
    y: number;
    fx?: number | null; // Fixed x for force simulation
    fy?: number | null; // Fixed y for force simulation
    pinned?: boolean;
}
export interface GraphEdge {
    source: EntityId;
    target: EntityId;
    label: string;
    isExplicit?: boolean;
}