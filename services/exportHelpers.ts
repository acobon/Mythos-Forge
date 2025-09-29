// services/exportHelpers.ts

import { StoryBible, Entity, EntityType, TranslationKey, Work, CharacterEntity } from '../types';
import { formatWorldDate, getTypedObjectValues } from '../utils';
import { getEventDefinition } from '../data/event-definitions';
import JSZip from 'jszip';
import DOMPurify from 'dompurify';
import { calculateAge, stripReferences } from '../utils';

// This file contains helpers for exporting to various formats,
// designed to be usable in both the main thread and web workers.

// Helper to sanitize filenames
export const sanitizeFilename = (name: string) => {
    return name.replace(/[^a-z0-9_.-]/gi, '_').substring(0, 100);
};

export const getEntityFilename = (entity: Entity) => `${sanitizeFilename(entity.name)}_${entity.id}`;

const convertReferencesToMarkdownLinks = (text: string, allEntities: Entity[]): string => {
    if (!text) return text;
    const entityFilenameMap = new Map(allEntities.map(e => [e.id, getEntityFilename(e)]));
    
    let result = '';
    let lastIndex = 0;
    let currentIndex = text.indexOf('@[', lastIndex);

    while (currentIndex !== -1) {
        result += text.substring(lastIndex, currentIndex);
        const closingBracket = text.indexOf(']', currentIndex);
        const openingParen = text.indexOf('](', closingBracket);
        const closingParen = text.indexOf(')', openingParen);

        if (closingBracket !== -1 && openingParen === closingBracket + 1 && closingParen !== -1) {
            const displayName = text.substring(currentIndex + 2, closingBracket);
            const entityId = text.substring(openingParen + 2, closingParen);
            const filename = entityFilenameMap.get(entityId);
            
            if (filename) {
                result += `[[${filename}|${displayName}]]`;
            } else {
                result += `[[${displayName}]]`; // Fallback for deleted/unknown entities
            }
            lastIndex = closingParen + 1;
        } else {
            // Malformed tag, treat as plain text
            result += text.substring(currentIndex, currentIndex + 2);
            lastIndex = currentIndex + 2;
        }
        currentIndex = text.indexOf('@[', lastIndex);
    }

    result += text.substring(lastIndex);
    return result;
};


const stripHtmlInWorker = (html: string | undefined | null): string => {
    if (!html) return '';
    // This is a simplified version for worker context where DOM is not available.
    // It's less robust than DOMPurify but works for this use case.
    return String(html).replace(/<[^>]*>?/gm, ' ');
};

export const generateEntityMarkdown = (entity: Entity, storyBible: StoryBible): string => {
    const allEvents = getTypedObjectValues(storyBible.events);
    const allEntities = getTypedObjectValues(storyBible.entities);
    const { entityTemplates, calendar } = storyBible;
    let md = `---
id: ${entity.id}
type: ${entity.type}
name: ${entity.name}
---

# ${entity.name}

## Description
${convertReferencesToMarkdownLinks(stripHtmlInWorker(entity.description), allEntities) || 'No description provided.'}

`;

    // Dummy translation function for use in non-React contexts (like workers)
    const t = (key: TranslationKey | string, replacements?: Record<string, string | number>): string => {
        let translation: string = String(key);
        if (replacements) {
            Object.entries(replacements).forEach(([placeholder, value]) => {
                translation = translation.replace(`{${placeholder}}`, String(value));
            });
        }
        return translation;
    };

    const template = entity.templateId ? entityTemplates[entity.type]?.find(t => t.id === entity.templateId) : undefined;
    if (template && entity.details) {
        const attributeEntries = Object.entries(entity.details)
            .filter(([key, value]) => (value !== null && value !== undefined && value !== ''));
        
        if (attributeEntries.length > 0) {
            md += `## Attributes\n`;
            attributeEntries.forEach(([key, value]) => {
                const fieldSchema = template.schema.find(f => f.fieldName === key);
                if (!fieldSchema) return;

                const label = fieldSchema.label || key;
                const isEntityLink = [EntityType.CHARACTER, EntityType.LOCATION, EntityType.OBJECT, EntityType.ORGANIZATION].includes(fieldSchema.fieldType as EntityType);

                let displayValue: string;
                 if (isEntityLink) {
                    const referencedEntity = allEntities.find(e => e.id === value);
                    displayValue = referencedEntity ? `[[${getEntityFilename(referencedEntity)}|${referencedEntity.name}]]` : '[[Unknown Entity]]';
                } else if (typeof value === 'string') {
                    displayValue = convertReferencesToMarkdownLinks(stripHtmlInWorker(value), allEntities);
                } else {
                    displayValue = String(value);
                }
                md += `- **${label}:** ${displayValue}\n`;
            });
            md += `\n`;
        }
    }
    
    const entityEvents = allEvents.filter(event => event.involvedEntities.some(inv => inv.entityId === entity.id));

    if (entityEvents.length > 0) {
        md += `## Chronology of Events\n`;
        const sortedEvents = [...entityEvents].sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
        sortedEvents.forEach(event => {
            md += `### ${stripHtmlInWorker(event.type)} (${formatWorldDate(event.startDateTime, calendar)}) <!-- ${event.startDateTime} -->\n`;
            md += `${convertReferencesToMarkdownLinks(stripHtmlInWorker(event.description), allEntities)}\n\n`;

            const detailEntries = Object.entries(event.details)
                .filter(([key, value]) => (value !== null && value !== undefined && value !== '') && key !== 'summary');

            if (detailEntries.length > 0) {
                md += `**Details:**\n`;
                detailEntries.forEach(([key, value]) => {
                    const eventDef = getEventDefinition(storyBible.customEventSchemas, event.type, t);
                    const fieldSchema = eventDef?.schema.find(f => f.fieldName === key);
                    const label = fieldSchema?.label || key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
                    
                    const entityFieldTypes: string[] = [EntityType.CHARACTER, EntityType.LOCATION, EntityType.OBJECT, EntityType.ORGANIZATION];
                    const isEntityLink = fieldSchema && entityFieldTypes.includes(fieldSchema.fieldType as EntityType);
                    
                    let displayValue: string;
                    if (isEntityLink) {
                        const referencedEntity = allEntities.find(e => e.id === value);
                        if (referencedEntity) {
                             displayValue = `[[${getEntityFilename(referencedEntity)}|${referencedEntity.name}]]`;
                        } else {
                            displayValue = '[[Unknown Entity]]';
                        }
                    } else if (typeof value === 'string') {
                        displayValue = convertReferencesToMarkdownLinks(stripHtmlInWorker(value), allEntities);
                    } else {
                        displayValue = String(value);
                    }
                    md += `- **${label}:** ${displayValue}\n`;
                });
                md += `\n`;
            }

            const relatedEntities = event.involvedEntities.filter(link => link.entityId !== entity.id);
            if (relatedEntities.length > 0) {
                md += `**Related Entities:**\n`;
                relatedEntities.forEach(link => {
                     const referencedEntity = allEntities.find(e => e.id === link.entityId);
                     if (referencedEntity) {
                         md += `- [[${getEntityFilename(referencedEntity)}|${referencedEntity.name}]] (${link.role})\n`;
                     }
                });
                md += `\n`;
            }
        });
    }

    return md;
};

const getWebpageCss = (): string => `
    :root {
        --primary: #282c34; --secondary: #3a4049; --accent: #f59e0b;
        --highlight: #fbbf24; --text-main: #f3f4f6; --text-secondary: #9ca3af;
        --border-color: #4b5563;
    }
    body { font-family: Inter, system-ui, sans-serif; line-height: 1.6; margin: 0;
            background-color: var(--primary); color: var(--text-main); display: flex; height: 100vh; }
    h1, h2, h3, h4 { font-family: Georgia, serif; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    #sidebar { width: 25rem; background-color: var(--secondary); padding: 1rem;
                height: 100vh; overflow-y: auto; border-right: 1px solid var(--border-color); flex-shrink: 0; display: flex; flex-direction: column; }
    #sidebar-search { width: 100%; padding: 0.5rem; margin-bottom: 1rem; border-radius: 0.25rem; border: 1px solid var(--border-color); background-color: var(--primary); color: var(--text-main); box-sizing: border-box; }
    #entity-list-container { flex-grow: 1; overflow-y: auto; }
    #content { flex-grow: 1; padding: 2rem; height: 100vh; overflow-y: auto; }
    .entity-group h3 { font-size: 1.25rem; color: var(--text-secondary); margin-top: 1rem; }
    .entity-group ul { list-style: none; padding: 0; }
    .entity-group li a { display: block; padding: 0.5rem; border-radius: 0.25rem; }
    .entity-group li a:hover { background-color: var(--border-color); }
    .ref-link { color: var(--accent); font-weight: 600; background-color: var(--secondary);
                padding: 0.1rem 0.4rem; border-radius: 0.25rem; cursor: pointer; }
    .ref-link:hover { background-color: var(--border-color); }
    .tag { display: inline-block; color: white; padding: 0.1rem 0.6rem; border-radius: 9999px; font-size: 0.8rem; margin: 0.1rem; }
`;

const getWebpageJs = (storyBible: StoryBible): string => `
    const data = ${JSON.stringify(storyBible)};
    const entitiesArray = Object.values(data.entities);
    const eventsArray = Object.values(data.events);

    const entityMap = new Map(entitiesArray.map(e => [e.id, e]));

    const simpleSanitize = (str) => {
        if (!str) return '';
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    };

    function renderSidebar() {
        const sidebar = document.getElementById('sidebar');
        let html = '<h1>' + simpleSanitize(data.title) + '</h1>';
        html += '<input type="search" id="sidebar-search" placeholder="Search entities..." oninput="filterSidebar()">';
        html += '<div id="entity-list-container">';

        const entityTypes = ['Character', 'Location', 'Object', 'Organization'];

        entityTypes.forEach(type => {
            const entitiesOfType = entitiesArray.filter(e => e.type === type.toLowerCase());
            if (entitiesOfType.length > 0) {
                html += '<div class="entity-group"><h3>' + type + 's</h3><ul>';
                entitiesOfType.sort((a,b) => a.name.localeCompare(b.name)).forEach(e => {
                    html += '<li><a href="#" onclick="renderEntity(\\\'' + e.id + '\\\')">' + simpleSanitize(e.name) + '</a></li>';
                });
                html += '</ul></div>';
            }
        });
        html += '</div>';
        sidebar.innerHTML = html;
    }
    
    function filterSidebar() {
        const query = document.getElementById('sidebar-search').value.toLowerCase();
        const entityGroups = document.querySelectorAll('.entity-group');

        entityGroups.forEach(group => {
            const listItems = group.querySelectorAll('li');
            let visibleCount = 0;
            listItems.forEach(li => {
                const link = li.querySelector('a');
                if (link && link.textContent.toLowerCase().includes(query)) {
                    li.style.display = '';
                    visibleCount++;
                } else {
                    li.style.display = 'none';
                }
            });

            const header = group.querySelector('h3');
            if (header) {
                header.style.display = visibleCount > 0 ? '' : 'none';
            }
        });
    }

    function parseReferences(text) {
        if (!text) return '';
        const regex = /@\\[([^\\]]+)\\]\\(([^)]+)\\)/g;
        const parts = text.split(regex);
        let result = '';
        for (let i = 0; i < parts.length; i += 3) {
            if (parts[i]) result += simpleSanitize(parts[i]);
            if (i + 2 < parts.length) {
                const displayName = parts[i+1];
                const entityId = parts[i+2];
                result += '<a class="ref-link" onclick="renderEntity(\\\'' + entityId + '\\\')">' + simpleSanitize(displayName) + '</a>';
            }
        }
        return result;
    }
    
    function renderEntity(id) {
        const entity = entityMap.get(id);
        if (!entity) {
            document.getElementById('content').innerHTML = '<h1>Entity not found</h1>';
            return;
        }

        let html = '<h1>' + simpleSanitize(entity.name) + ' <small>(' + entity.type + ')</small></h1>';
        html += '<h2>Description</h2><p>' + parseReferences(entity.description) + '</p>';

        // Render Tags
        if (entity.tagIds && entity.tagIds.length > 0) {
            const tagMap = new Map(Object.values(data.tags).map(t => [t.id, t]));
            html += '<div>';
            entity.tagIds.forEach(tagId => {
                const tag = tagMap.get(tagId);
                if(tag) html += '<span class="tag" style="background-color:' + tag.color + ';">' + simpleSanitize(tag.label) + '</span>';
            });
            html += '</div>';
        }

        // Render Attributes
        const template = data.entityTemplates[entity.type]?.find(t => t.id === entity.templateId);
        if (template && entity.details) {
            html += '<h2>Attributes (' + simpleSanitize(template.name) + ')</h2><ul>';
            Object.entries(entity.details).forEach(([key, value]) => {
                const fieldDef = template.schema.find(f => f.fieldName === key);
                if (fieldDef && value) {
                    let displayValue = value;
                    const entityTypes = ['character', 'location', 'object', 'organization'];
                    if (entityTypes.includes(fieldDef.fieldType)) {
                        const linked = entityMap.get(value);
                        displayValue = linked ? '<a class="ref-link" onclick="renderEntity(\\\'' + linked.id + '\\\')">' + simpleSanitize(linked.name) + '</a>' : 'Unknown';
                    } else {
                        displayValue = parseReferences(String(value));
                    }
                    html += '<li><strong>' + simpleSanitize(fieldDef.label) + ':</strong> ' + displayValue + '</li>';
                }
            });
            html += '</ul>';
        }

        // Render Events
        const entityEvents = eventsArray.filter(e => e.involvedEntities.some(inv => inv.entityId === id))
            .sort((a,b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
        
        if (entityEvents.length > 0) {
            html += '<h2>Events</h2>';
            entityEvents.forEach(event => {
                html += '<div><h3>' + simpleSanitize(event.type) + '</h3><p>' + parseReferences(event.description) + '</p></div>';
            });
        }

        document.getElementById('content').innerHTML = html;
        window.scrollTo(0, 0);
    }

    document.addEventListener('DOMContentLoaded', () => {
        renderSidebar();
    });
`;

export const exportToWebpage = async (storyBible: StoryBible): Promise<void> => {
    const css = getWebpageCss();
    const js = getWebpageJs(storyBible);

    const content = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>${storyBible.title}</title>
            <style>${css}</style>
        </head>
        <body>
            <aside id="sidebar"></aside>
            <main id="content">
                <h1>Welcome to ${storyBible.title}</h1>
                <p>Select an entity from the sidebar to begin.</p>
            </main>
            <script>
                ${js}
            </script>
        </body>
        </html>
    `;
    const blob = new Blob([content], { type: 'text/html' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${sanitizeFilename(storyBible.title)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
