// types/events.ts
import { Entity, EntityId } from "./entities";
import { FormField, Attributes } from './forms';
import { TranslationKey } from "./i18n";

export interface InvolvedEntity {
    entityId: EntityId;
    role: string; // e.g., "Perpetrator", "Victim", "Spouse"
}

export interface HistoricalEvent {
    id: string;
    type: string;
    description: string;
    notes?: string;
    startDateTime: string; // ISO 8601 format
    endDateTime?: string; // ISO 8601 format
    details: Attributes;
    involvedEntities: InvolvedEntity[];
    tagIds?: string[];
}


export interface WorldEvent {
  id: string;
  title: string;
  content: string;
  dateTime: string; // ISO 8601 format
  entities: EntityId[];
  tagIds?: string[];
  category?: string;
}

export interface WorldEra {
    name: string;
    startYear: number;
}

export interface WorldMonth {
    name: string;
    days: number;
}

export interface CustomCalendar {
    presentDate: string; // ISO 8601 format for the "current day" of the world
    epochYear: number; // The Gregorian year that corresponds to Year 1 of this calendar
    eras: WorldEra[];
    months: WorldMonth[];
    daysOfWeek: string[];
    leapDayMonthIndex?: number; // The index of the month that gets an extra day on leap years. Defaults to 1 (February).
}


export interface EventOption {
    key: string;
    label:string;
}

export interface EventGroup {
    groupName: string;
    events: EventOption[];
}

export interface EventSchema {
    key: string;
    label: string;
    entityType: string; // key of EntityTypeDefinition
    schema: FormField[];
    summaryTemplate?: string;
}

export interface WorldDate {
    era?: WorldEra;
    year: number;
    month: WorldMonth;
    monthIndex: number;
    day: number;
    dayOfWeek?: string;
    hour: number;
    minute: number;
    offset: string;
}

export interface EventDefinition {
    schema: FormField[];
    generateSummary: (
        primaryEntity: Entity,
        details: Attributes,
        getEntityName: (id: EntityId) => string,
        t: (key: TranslationKey | string, replacements?: Record<string, string | number>) => string
    ) => string;
    isNarrative?: boolean;
}

// Timeline Chart specific types
export interface SceneWithPosition extends WorldEvent {
    position: number;
}

export interface EventWithLayout extends SceneWithPosition {
    isUp: boolean;
    verticalOffset: number;
}

export interface SwimlaneEvent extends SceneWithPosition {
    yOffset: number;
}
