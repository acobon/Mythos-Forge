// data/defaults.ts
import { CustomCalendar, StoryBible, EntityTypeDefinition, Timeline } from '../types/index';
import { defaultCharacterPrompts } from './character-prompts';

export const defaultEntityTypes: EntityTypeDefinition[] = [
    { key: 'character', name: 'Character', icon: 'UserIcon', isCustom: false },
    { key: 'location', name: 'Location', icon: 'MapPinIcon', isCustom: false },
    { key: 'object', name: 'Object', icon: 'DiamondIcon', isCustom: false },
    { key: 'organization', name: 'Organization', icon: 'UsersIcon', isCustom: false },
];

export const defaultCalendar: CustomCalendar = {
  presentDate: '0100-01-01T12:00:00.000+00:00', // A default "present" for the world.
  epochYear: 1, // Year 1 in the custom calendar aligns with Gregorian year 1 for calculation base.
  eras: [{ name: 'Common Era', startYear: 1 }],
  months: [
    { name: 'January', days: 31 },
    { name: 'February', days: 28 },
    { name: 'March', days: 31 },
    { name: 'April', days: 30 },
    { name: 'May', days: 31 },
    { name: 'June', days: 30 },
    { name: 'July', days: 31 },
    { name: 'August', days: 31 },
    { name: 'September', days: 30 },
    { name: 'October', days: 31 },
    { name: 'November', days: 30 },
    { name: 'December', days: 31 },
  ],
  daysOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  leapDayMonthIndex: 1, // Corresponds to February
};

const defaultTimeline: Timeline = {
    id: 'default-timeline',
    name: 'Main Timeline',
    description: 'The primary timeline of significant world events.',
    eventIds: [],
};

export const defaultStoryBible: StoryBible = {
  title: 'New Project',
  entityTypes: defaultEntityTypes,
  entities: {},
  events: {},
  relationships: {},
  worldEvents: {},
  timelines: {
    [defaultTimeline.id]: defaultTimeline,
  },
  customEventSchemas: {
      character: [],
      location: [],
      object: [],
      organization: [],
  },
  entityTemplates: {
      character: [],
      location: [],
      object: [],
      organization: [],
  },
  calendar: defaultCalendar,
  works: {},
  series: {},
  collections: {},
  scenes: {},
  tags: {},
  comments: {},
  commonRoles: ['Witness', 'Accomplice', 'Participant', 'Victim'],
  relationshipTypes: ['Family', 'Political', 'Romantic', 'Professional', 'Friendly', 'Hostile'],
  characterPrompts: defaultCharacterPrompts,
  dictionary: {},
  map: {
      layers: [],
      baseLayerId: null,
  },
  researchNotes: {},
  notebooks: {},
  graphLayout: {},
  mindMap: {
    nodes: {},
    edges: [],
  },
  writingGoals: {
    projectWordGoal: 50000,
    dailyWordGoal: 1000,
  },
  writingHistory: [],
  themes: {},
  conflicts: {},
  savedQueries: {},
  storyStructures: {},
  scratchpad: '',
  trash: [],
};