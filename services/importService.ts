

import { StoryBible, Entity, EntityType, EntityId, HistoricalEvent, InvolvedEntity, DictionaryEntry } from '../types';
import { defaultStoryBible } from '../data/defaults';
import { validateAndCleanStoryBible } from './validationService';
import { generateId, deepClone, getTypedObjectValues, labelToFieldName } from '../utils';
import JSZip, { JSZipObject } from 'jszip';
import * as idbService from './idbService';


// This file implements the project import logic.
// It handles both the standard .zip format (containing story_bible.json)
// and the experimental Markdown-based .zip format.

/**
 * Converts custom Markdown wiki-links `[[filename|display name]]` into the application's
 * internal `@[]()` reference format.
 * @param text The text content containing Markdown links.
 * @param entityFilenameMap A map from filenames back to entity IDs.
 * @param entityIdMap A map from entity IDs to entity objects.
 * @returns Text with references converted to the internal format.
 */
const convertMarkdownLinksToReferences = (text: string, entityFilenameMap: Map<string, EntityId>, entityIdMap: Map<EntityId, Entity>): string => {
    if (!text) return text;
    // Regex for [[filename|display name]] or [[display name]]
    const linkRegex = /\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g;
    return text.replace(linkRegex, (match, target, displayName) => {
        // Try to find the entity by filename, or fall back to finding by name.
        const entityId = entityFilenameMap.get(target.trim()) || [...entityIdMap.values()].find(e => e.name.trim().toLowerCase() === target.trim().toLowerCase())?.id;
        const name = displayName || target;
        if (entityId) {
            return `@[${name}](${entityId})`;
        }
        return name; // If link doesn't resolve, just return the name as plain text.
    });
};

/**
 * Parses the body of an entity's Markdown file using a state machine.
 * This is more robust than using multiple complex regular expressions.
 * @param content The Markdown content, excluding frontmatter.
 * @returns An object with parsed description, attributes, and events.
 */
const parseMarkdownEntityContent = (content: string) => {
    const lines = content.split('\n');
    let description = '';
    const attributes: Record<string, any> = {};
    const events: any[] = [];

    let currentState: 'description' | 'attributes' | 'events' | 'none' = 'none';
    let currentEvent: any | null = null;
    let currentEventSubState: 'description' | 'details' | 'related' = 'description';

    for (const line of lines) {
        const h2Match = line.match(/^##\s+(.+)/);
        if (h2Match) {
            if (currentEvent) {
                events.push(currentEvent);
                currentEvent = null;
            }
            const sectionTitle = h2Match[1].trim().toLowerCase();
            if (sectionTitle === 'description') {
                currentState = 'description';
            } else if (sectionTitle === 'attributes') {
                currentState = 'attributes';
            } else if (sectionTitle === 'chronology of events') {
                currentState = 'events';
            } else {
                currentState = 'none';
            }
            continue;
        }

        if (currentState === 'events') {
            const h3Match = line.match(/^###\s+(.+)/);
            if (h3Match) {
                if (currentEvent) {
                    events.push(currentEvent);
                }
                const eventHeaderMatch = h3Match[1].trim().match(/(.+?)\s+\(.+?\)\s+<!--\s+(.+?)\s+-->/);
                if (eventHeaderMatch) {
                    currentEvent = {
                        type: eventHeaderMatch[1].trim(),
                        startDateTime: eventHeaderMatch[2].trim(),
                        description: '',
                        details: {},
                        involvedEntities: [], // will be populated later
                    };
                    currentEventSubState = 'description';
                } else {
                    currentEvent = null;
                }
                continue;
            }
            
            if (currentEvent) {
                if (line.trim() === '**Details:**') {
                    currentEventSubState = 'details';
                    continue;
                }
                if (line.trim() === '**Related Entities:**') {
                    currentEventSubState = 'related';
                    continue;
                }
                
                if (currentEventSubState === 'description') {
                    currentEvent.description += line + '\n';
                } else if (currentEventSubState === 'details') {
                    const detailMatch = line.match(/-\s+\*\*([^:]+):\*\*\s+(.*)/);
                    if (detailMatch) {
                        currentEvent.details[labelToFieldName(detailMatch[1])] = detailMatch[2].trim();
                    }
                } else if (currentEventSubState === 'related') {
                    const relatedMatch = line.match(/-\s+\[\[(.+?)\|.+?\]\]\s+\((.+?)\)/);
                    if (relatedMatch) {
                        currentEvent.involvedEntities.push({ filename: relatedMatch[1], role: relatedMatch[2] });
                    }
                }
            }
        } else if (currentState === 'description') {
            description += line + '\n';
        } else if (currentState === 'attributes') {
            const attrMatch = line.match(/-\s+\*\*([^:]+):\*\*\s+(.*)/);
            if (attrMatch) {
                attributes[labelToFieldName(attrMatch[1])] = attrMatch[2].trim();
            }
        }
    }

    if (currentEvent) {
        events.push(currentEvent);
    }

    return {
        description: description.trim(),
        attributes,
        events,
    };
};


/**
 * Imports a standard project from a .zip file containing a story_bible.json.
 * @param file The .zip file to import.
 * @returns A validated and cleaned StoryBible object and any warnings.
 */
export const importProject = async (file: File, onProgress?: (progress: number) => void): Promise<{ storyBible: StoryBible, warnings: string[] }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            if (!e.target?.result) {
                return reject(new Error("File could not be read."));
            }
            try {
                onProgress?.(25);
                const zip = await JSZip.loadAsync(e.target.result as ArrayBuffer);
                onProgress?.(50);
                const jsonFile = zip.file("story_bible.json");
                if (!jsonFile) {
                    throw new Error("Invalid project file: story_bible.json not found.");
                }
                const jsonContent = await jsonFile.async("string");
                const loadedData = JSON.parse(jsonContent);
                const result = validateAndCleanStoryBible(loadedData);
                onProgress?.(75);
                
                // New logic: Import images
                const imagesFolder = zip.folder("images");
                if (imagesFolder) {
                    const imagePromises: Promise<void>[] = [];
                    imagesFolder.forEach((relativePath, file) => {
                        if (!file.dir) {
                           imagePromises.push(
                               (async () => {
                                   const blob = await file.async("blob");
                                   // relativePath is the filename, which is the image ID
                                   await idbService.saveImage(relativePath, blob);
                               })()
                           );
                        }
                    });
                    await Promise.all(imagePromises);
                }

                onProgress?.(100);
                resolve(result);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Imports a project from a .zip file containing Markdown files. This is a more comprehensive
 * implementation that parses attributes and detailed events.
 * @param file The .zip file containing the Markdown project structure.
 * @returns A promise that resolves to a newly constructed StoryBible object.
 */
export const importProjectFromMarkdown = async (file: File, onProgress?: (progress: number) => void): Promise<StoryBible> => {
    onProgress?.(10);
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    onProgress?.(30);

    const mdFiles = Object.values(zip.files).filter((f: JSZipObject) => 
        f.name.endsWith('.md') && 
        !f.name.startsWith('__MACOSX/') &&
        !f.dir
    );
    
    const newStoryBible: StoryBible = deepClone(defaultStoryBible);
    newStoryBible.title = file.name.replace(/_markdown\.zip$/, '').replace(/\.zip$/, '');

    const parseFrontmatter = (content: string): Record<string, string> => {
        const match = content.match(/^---\n([\s\S]+?)\n---\n/);
        if (!match) return {};
        const frontmatter: Record<string, string> = {};
        match[1].split('\n').forEach(line => {
            const parts = line.split(': ');
            if (parts.length >= 2) {
                frontmatter[parts[0].trim()] = parts.slice(1).join(': ').trim();
            }
        });
        return frontmatter;
    };

    const entityFileContents = await Promise.all(mdFiles.map(async (f: JSZipObject) => ({
        filename: f.name.replace(/^markdown\//, ''),
        content: await f.async('string')
    })));
    onProgress?.(50);

    const entityFilenameMap = new Map<string, EntityId>();
    
    // Pass 1: Create basic entity objects and map filenames to IDs.
    for (const { filename, content } of entityFileContents) {
        if (filename.endsWith('_index.md')) continue;
        const frontmatter = parseFrontmatter(content);
        if (frontmatter.id && frontmatter.name && frontmatter.type) {
            const newEntity: Entity = {
                id: frontmatter.id,
                name: frontmatter.name,
                type: frontmatter.type as EntityType,
                description: '',
                lastModified: new Date().toISOString(),
                details: {}
            };
            newStoryBible.entities[newEntity.id] = newEntity;
            entityFilenameMap.set(filename.trim(), frontmatter.id);
        }
    }
    onProgress?.(70);

    const entityIdMap = new Map(getTypedObjectValues(newStoryBible.entities).map(e => [e.id, e]));

    // Pass 2: Parse full content, attributes, and events, resolving links.
    for (const { filename, content } of entityFileContents) {
        const entityId = entityFilenameMap.get(filename.trim());
        if (!entityId) continue;
        
        const entity = entityIdMap.get(entityId);
        if (!entity) continue;

        const body = content.replace(/^---\n[\s\S]+?\n---\n/, '').trim();
        const parsed = parseMarkdownEntityContent(body);

        entity.description = convertMarkdownLinksToReferences(parsed.description, entityFilenameMap, entityIdMap);
        
        entity.details = {};
        for (const [key, value] of Object.entries(parsed.attributes)) {
            entity.details[key] = convertMarkdownLinksToReferences(value, entityFilenameMap, entityIdMap);
        }

        parsed.events.forEach(parsedEvent => {
            const involvedEntities: InvolvedEntity[] = [{ entityId, role: 'Participant' }];
            parsedEvent.involvedEntities.forEach((link: {filename: string, role: string}) => {
                const relatedEntityId = entityFilenameMap.get(link.filename);
                if (relatedEntityId && !involvedEntities.some(inv => inv.entityId === relatedEntityId)) {
                    involvedEntities.push({ entityId: relatedEntityId, role: link.role });
                }
            });
            
            const detailsWithConvertedLinks: Record<string, any> = {};
            for (const [key, value] of Object.entries(parsedEvent.details)) {
                detailsWithConvertedLinks[key] = convertMarkdownLinksToReferences(value as string, entityFilenameMap, entityIdMap);
            }

            const newEvent: HistoricalEvent = {
                id: generateId('he'),
                type: parsedEvent.type,
                startDateTime: parsedEvent.startDateTime,
                description: convertMarkdownLinksToReferences(parsedEvent.description.trim(), entityFilenameMap, entityIdMap),
                involvedEntities,
                details: detailsWithConvertedLinks,
            };
            newStoryBible.events[newEvent.id] = newEvent;
        });
    }
    onProgress?.(100);

    return newStoryBible;
};

export const importDictionary = async (file: File): Promise<DictionaryEntry[]> => {
    const text = await file.text();
    if (file.name.endsWith('.json')) {
        const data = JSON.parse(text);
        if (!Array.isArray(data) || !data.every(item => 'term' in item && 'definition' in item && 'caseSensitive' in item)) {
            throw new Error('Invalid JSON format for dictionary.');
        }
        return data.map(item => ({ ...item, id: generateId('dict') }));
    } else if (file.name.endsWith('.csv')) {
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length < 1) return [];
        
        const header = lines[0].split(',').map(h => h.trim());
        const termIndex = header.indexOf('term');
        const defIndex = header.indexOf('definition');
        const caseIndex = header.indexOf('caseSensitive');

        if (termIndex === -1 || defIndex === -1 || caseIndex === -1) {
            throw new Error('CSV must have "term", "definition", and "caseSensitive" columns.');
        }

        return lines.slice(1).map(line => {
            const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
            const cleanValues = values.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));

            return {
                id: generateId('dict'),
                term: cleanValues[termIndex] || '',
                definition: cleanValues[defIndex] || '',
                caseSensitive: cleanValues[caseIndex] === 'true',
            };
        });
    }
    throw new Error('Unsupported file type. Please use .json or .csv.');
};