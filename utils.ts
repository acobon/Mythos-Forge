import { CustomCalendar, WorldDate, WorldEra, WorldMonth, HistoricalEvent, WorldEvent } from './types/index';
import { Entity, EntityType, EntityId } from './types/index';
import { LOCAL_STORAGE_THEME_KEY } from './constants';

// --- dateUtils.ts ---

export const timeZoneOffsets: string[] = [
    '-12:00', '-11:00', '-10:00', '-09:30', '-09:00', '-08:00', '-07:00',
    '-06:00', '-05:00', '-04:00', '-03:30', '-03:00', '-02:00', '-01:00',
    '+00:00', '+01:00', '+02:00', '+03:00', '+03:30', '+04:00', '+04:30',
    '+05:00', '+05:30', '+05:45', '+06:00', '+06:30', '+07:00', '+08:00',
    '+08:45', '+09:00', '+09:30', '+10:00', '+10:30', '+11:00', '+12:00',
    '+12:45', '+13:00', '+14:00'
];

export const sortHistoricalEvents = (a: HistoricalEvent, b: HistoricalEvent): number => {
    const dateA = new Date(a.startDateTime).getTime();
    const dateB = new Date(b.startDateTime).getTime();
    if (isNaN(dateA)) return 1;
    if (isNaN(dateB)) return -1;
    return dateA - dateB;
};

export const sortScenes = (a: { dateTime: string }, b: { dateTime: string }): number => {
    const dateA = new Date(a.dateTime).getTime();
    const dateB = new Date(b.dateTime).getTime();
    if (isNaN(dateA)) return 1;
    if (isNaN(dateB)) return -1;
    return dateA - dateB;
};

export const isLeap = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

export const getDaysInMonth = (monthIndex: number, worldYear: number, calendar: CustomCalendar): number => {
    if (!calendar.months || calendar.months.length === 0) return 30; // Guard against invalid calendar
    const month = calendar.months[monthIndex];
    if (!month) return 30; // Fallback for safety
    const gregorianYear = worldYear + calendar.epochYear - 1;
    const leapDayMonthIndex = calendar.leapDayMonthIndex ?? 1;
    return month.days + (monthIndex === leapDayMonthIndex && isLeap(gregorianYear) ? 1 : 0);
};


export const getWorldDateFromISO = (isoString: string, calendar: CustomCalendar): WorldDate => {
    if (!calendar.months || calendar.months.length === 0 || !calendar.daysOfWeek || calendar.daysOfWeek.length === 0) {
        throw new Error("Calendar is not configured with months and days of the week.");
    }
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid ISO string provided: ${isoString}`);
    }

    const epochDate = new Date(`${String(calendar.epochYear).padStart(4, '0')}-01-01T00:00:00.000Z`);
    const diffMillis = date.getTime() - epochDate.getTime();
    const diffDays = Math.floor(diffMillis / (1000 * 60 * 60 * 24));
    
    let year = 1;
    let dayOfYear = diffDays;
    
    const getDaysInYear = (y: number) => {
        if (calendar.months.length === 0) return 365;
        let totalDays = calendar.months.reduce((sum, m) => sum + m.days, 0);
        return isLeap(y + calendar.epochYear - 1) ? totalDays + 1 : totalDays;
    };

    if (dayOfYear >= 0) {
        let daysInCurrentYear = getDaysInYear(year);
        while (dayOfYear >= daysInCurrentYear) {
            dayOfYear -= daysInCurrentYear;
            year++;
            daysInCurrentYear = getDaysInYear(year);
        }
    } else {
        // Handle dates before the epoch year
        while (dayOfYear < 0) {
            year--;
            const daysInPreviousYear = getDaysInYear(year);
            dayOfYear += daysInPreviousYear;
        }
    }

    let monthIndex = 0;
    while (monthIndex < calendar.months.length -1 && dayOfYear >= getDaysInMonth(monthIndex, year, calendar)) {
        dayOfYear -= getDaysInMonth(monthIndex, year, calendar);
        monthIndex++;
    }
    
    const day = dayOfYear + 1;
    
    const epochDayOfWeek = epochDate.getUTCDay(); // 0 for Sunday
    const dayOfWeek = calendar.daysOfWeek.length > 0 
        ? calendar.daysOfWeek[(epochDayOfWeek + Math.floor(diffDays) % calendar.daysOfWeek.length + calendar.daysOfWeek.length) % calendar.daysOfWeek.length]
        : '';

    const offsetMatch = isoString.match(/([+-])(\d{2}):(\d{2})$|Z$/);
    const offset = offsetMatch ? (offsetMatch[0] === 'Z' ? '+00:00' : `${offsetMatch[1]}${offsetMatch[2]}:${offsetMatch[3]}`) : '+00:00';
    
    const finalMonthDays = getDaysInMonth(monthIndex, year, calendar);

    return {
        year,
        month: { ...calendar.months[monthIndex], days: finalMonthDays },
        monthIndex,
        day,
        dayOfWeek,
        hour: date.getUTCHours(),
        minute: date.getUTCMinutes(),
        offset,
    };
};

export const getISOFromWorldDate = (worldDate: WorldDate, calendar: CustomCalendar): string => {
    if (!calendar.months || calendar.months.length === 0) {
        throw new Error("Cannot generate ISO string from a calendar with no months.");
    }
    const epochDate = new Date(`${String(calendar.epochYear).padStart(4, '0')}-01-01T00:00:00.000Z`);
    let totalDays = 0;

    const getDaysInYear = (y: number) => {
        if (calendar.months.length === 0) return 365;
        let totalDays = calendar.months.reduce((sum, m) => sum + m.days, 0);
        return isLeap(y + calendar.epochYear - 1) ? totalDays + 1 : totalDays;
    };
    
    if (worldDate.year > 1) {
        for (let y = 1; y < worldDate.year; y++) {
            totalDays += getDaysInYear(y);
        }
    } else if (worldDate.year <= 1) {
        for (let y = 0; y >= worldDate.year; y--) {
            totalDays -= getDaysInYear(y);
        }
    }

    for (let m = 0; m < worldDate.monthIndex; m++) {
        totalDays += getDaysInMonth(m, worldDate.year, calendar);
    }
    totalDays += worldDate.day - 1;

    const targetMillis = epochDate.getTime() + totalDays * (1000 * 60 * 60 * 24);
    const date = new Date(targetMillis);
    
    const yearString = String(date.getUTCFullYear()).padStart(4, '0');
    return `${yearString}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}T${String(worldDate.hour).padStart(2, '0')}:${String(worldDate.minute).padStart(2, '0')}:00.000${worldDate.offset}`;
};

export const formatWorldDate = (isoString: string, calendar: CustomCalendar, options: { year?: boolean; month?: boolean; day?: boolean; time?: boolean } = {}): string => {
    try {
        if (!isoString) return 'Date not set';
        if (!calendar.months || calendar.months.length === 0 || !calendar.daysOfWeek || calendar.daysOfWeek.length === 0) {
            return "Invalid Calendar";
        }
        const worldDate = getWorldDateFromISO(isoString, calendar);
        const allOptions = { year: true, month: true, day: true, time: false, ...options };

        const dateParts = [];
        if (allOptions.month) dateParts.push(worldDate.month.name);
        if (allOptions.day) dateParts.push(worldDate.day);
        if (allOptions.year) {
            const era = [...calendar.eras].reverse().find(e => worldDate.year >= e.startYear);
            const yearInEra = era ? worldDate.year - era.startYear + 1 : worldDate.year;
            dateParts.push(`${yearInEra}${era ? ` ${era.name}` : ''}`);
        }

        let dateString = dateParts.join(' ');
        
        if (allOptions.time) {
             const timeString = `${String(worldDate.hour).padStart(2, '0')}:${String(worldDate.minute).padStart(2, '0')}`;
             dateString += ` at ${timeString}`;
        }

        return dateString;

    } catch (e) {
        return "Invalid Date";
    }
};

type AgeResult = { value: number; unit: 'years' | 'months' | 'days' } | { status: 'Not yet born' | 'N/A' | 'Error' };

export const calculateAge = (birthISO: string | null, deathISO: string | null, calendar: CustomCalendar): AgeResult => {
    if (!birthISO) return { status: 'N/A' };
    if (!calendar.months || calendar.months.length === 0 || !calendar.daysOfWeek || calendar.daysOfWeek.length === 0) {
        return { status: 'Error' };
    }
    try {
        const birthDate = new Date(birthISO);
        const endDate = deathISO ? new Date(deathISO) : new Date(calendar.presentDate);

        if (birthDate > endDate) return { status: 'Not yet born' };
        
        const birthWorld = getWorldDateFromISO(birthISO, calendar);
        const endWorld = getWorldDateFromISO(endDate.toISOString(), calendar);

        let years = endWorld.year - birthWorld.year;
        
        if (endWorld.monthIndex < birthWorld.monthIndex || (endWorld.monthIndex === birthWorld.monthIndex && endWorld.day < birthWorld.day)) {
            years--;
        }

        if (years > 0) return { value: years, unit: 'years' };
        
        let months = (endWorld.year - birthWorld.year) * calendar.months.length + (endWorld.monthIndex - birthWorld.monthIndex);
        if (endWorld.day < birthWorld.day) {
            months--;
        }
        if (months > 0) return { value: months, unit: 'months' };

        const diffMillis = endDate.getTime() - birthDate.getTime();
        const days = Math.floor(diffMillis / (1000 * 60 * 60 * 24));
        return { value: days, unit: 'days' };
    } catch (e) {
        return { status: 'Error' };
    }
};

// --- idUtils.ts ---

/**
 * Generates a standard RFC4122 version 4 UUID to ensure unique IDs.
 * @returns A new UUID string.
 */
export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Robust fallback for environments without crypto.randomUUID
  let dt = new Date().getTime();
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (dt + Math.random()*16)%16 | 0;
      dt = Math.floor(dt/16);
      return (c=='x' ? r :(r&0x3|0x8)).toString(16);
  });
  return uuid;
};

/**
 * Generates a consistently formatted, unique ID with a given prefix.
 * @param prefix A short prefix indicating the type of ID (e.g., 'char', 'evt').
 * @returns A new unique ID string.
 */
export const generateId = (prefix: string): string => {
    return `${prefix}-${generateUUID()}`;
}

export const labelToFieldName = (label: string): string => {
    return label.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};


// --- objectUtils.ts ---

/**
 * A type-safe version of Object.values().
 * @param obj The object to get the values from.
 * @returns An array of the object's values with the correct type.
 */
export const getTypedObjectValues = <T>(obj: Record<string | number | symbol, T> | undefined | null): T[] => {
    if (!obj) {
        return [];
    }
    return Object.values(obj);
};

/**
 * Creates a deep clone of an object or array.
 * This is more robust than JSON.parse(JSON.stringify()) as it handles more types
 * and avoids issues with undefined or functions. It does not handle circular references.
 * @param obj The object or array to clone.
 * @returns A deep clone of the input.
 */
export const deepClone = <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    // Handle Date objects
    if (obj instanceof Date) {
        return new Date(obj.getTime()) as any;
    }
    
    // Handle Arrays
    if (Array.isArray(obj)) {
        const arrCopy: any[] = [];
        for (let i = 0; i < obj.length; i++) {
            arrCopy[i] = deepClone(obj[i]);
        }
        return arrCopy as T;
    }

    // Handle Objects
    if (obj instanceof Object) {
        const objCopy: { [key: string]: any } = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                objCopy[key] = deepClone((obj as any)[key]);
            }
        }
        return objCopy as T;
    }
    
    // This should not be reached for typical JSON-like data structures in this app.
    // It's a fallback for any unhandled cases.
    return obj;
};

export const deepEqual = (a: any, b: any): boolean => {
    if (a === b) return true;
    if (a && b && typeof a === 'object' && typeof b === 'object') {
        if (a.constructor !== b.constructor) return false;
        let length;
        if (Array.isArray(a)) {
            length = a.length;
            if (length !== b.length) return false;
            for (let i = length; i-- > 0;) {
                if (!deepEqual(a[i], b[i])) return false;
            }
            return true;
        }
        const keys = Object.keys(a);
        length = keys.length;
        if (length !== Object.keys(b).length) return false;
        for (let i = length; i-- > 0;) {
            const key = keys[i];
            if (!Object.prototype.hasOwnProperty.call(b, key) || !deepEqual(a[key], b[key])) return false;
        }
        return true;
    }
    return a !== a && b !== b;
};

export const arrayMove = <T>(array: T[], fromIndex: number, toIndex: number): T[] => {
    const newArray = [...array];
    const [item] = newArray.splice(fromIndex, 1);
    newArray.splice(toIndex, 0, item);
    return newArray;
};

// --- referenceUtils.ts ---

export const makeReferenceUpdater = (entityId: EntityId, newName: string) => {
    const referenceRegex = new RegExp(`@\\[([^\\]]+)\\]\\((${escapeRegExp(entityId)})\\)`, 'g');
    const replacement = `@[${newName}](${entityId})`;
    return (text: string): string => {
        if (typeof text !== 'string' || !text || !text.includes(`(${entityId})`)) {
            return text;
        }
        return text.replace(referenceRegex, replacement);
    };
};

export const makeReferenceDeleter = (entity: Entity) => {
    const referenceRegex = new RegExp(`@\\[([^\\]]+)\\]\\((${escapeRegExp(entity.id)})\\)`, 'g');
    
    return (text: string): string => {
        if (typeof text !== 'string' || !text || !text.includes(`(${entity.id})`)) {
            return text;
        }
        return text.replace(referenceRegex, '$1');
    };
};

export const deepApplyReferenceUpdates = (obj: any, updateFn: (text: string) => string): any => {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => deepApplyReferenceUpdates(item, updateFn));
    }

    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (typeof value === 'string') {
                newObj[key] = updateFn(value);
            } else if (typeof value === 'object') {
                newObj[key] = deepApplyReferenceUpdates(value, updateFn);
            } else {
                newObj[key] = value;
            }
        }
    }
    return newObj;
};

// --- textUtils.ts ---

export const escapeRegExp = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const stripReferences = (text: string): string => {
  if (!text) return '';
  return text.replace(/@\[([^\]]+)\]\((?:[^)]+)\)/g, '$1');
};

export const htmlToPlainText = (html: string | null | undefined): string => {
    if (typeof DOMParser === 'undefined' || !html) {
      return '';
    }
    try {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || '';
    } catch (e) {
        console.error("Could not parse HTML", e);
        return '';
    }
};

export const calculateWordCount = (html: string): number => {
    const text = htmlToPlainText(html);
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
};

export const middleTruncate = (text: string, maxLength: number): string => {
    if (!text || text.length <= maxLength) {
        return text || '';
    }
    const ellipsis = '...';
    const charsToShow = maxLength - ellipsis.length;
    const frontChars = Math.ceil(charsToShow / 2);
    const backChars = Math.floor(charsToShow / 2);
    return `${text.slice(0, frontChars)}${ellipsis}${text.slice(text.length - backChars)}`;
};

// --- uiUtils.ts ---

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e', '#78716c',
];

export const generateTagColor = (index: number): string => {
    return COLORS[index % COLORS.length];
};

export const applyInitialTheme = () => {
    try {
        const theme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY) || 'system';
        const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.classList.toggle('theme-dark', isDark);
    } catch (e) {
        document.documentElement.classList.add('theme-dark');
    }
};

// --- validationUtils.ts ---

export const isEntityNameDuplicate = (
    name: string,
    type: string,
    entities: Entity[],
    entityIdToExclude: EntityId | null = null
): boolean => {
    const searchName = name.trim().toLowerCase();
    if (!searchName) return false;
    return entities.some(e =>
        e.id !== entityIdToExclude &&
        e.type === type &&
        e.name.trim().toLowerCase() === searchName
    );
};
