
import { describe, it, expect, vi, afterEach } from 'vitest';
import JSZip from 'jszip';
import { importProject, importProjectFromMarkdown } from './importService';
import * as idbService from './idbService';
import { StoryBible, EntityType, CharacterEntity } from '../types/index';

// Mock the idbService to prevent actual database operations during tests
vi.mock('./idbService', () => ({
    saveImage: vi.fn().mockResolvedValue(undefined),
}));

describe('importService', () => {

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('importProject (JSON)', () => {
        it('should import a valid project from a JSON zip file', async () => {
            const mockBible: Partial<StoryBible> = { title: 'Test Project', entities: {} };
            const zip = new JSZip();
            zip.file('story_bible.json', JSON.stringify(mockBible));
            const blob = await zip.generateAsync({ type: 'blob' });
            const file = new File([blob], 'test.zip', { type: 'application/zip' });

            const { storyBible, warnings } = await importProject(file);

            expect(storyBible.title).toBe('Test Project');
            expect(warnings).toHaveLength(0);
        });

        it('should handle missing optional fields with defaults', async () => {
            const mockBible: Partial<StoryBible> = { title: 'Minimal Project' }; // Missing entities, etc.
            const zip = new JSZip();
            zip.file('story_bible.json', JSON.stringify(mockBible));
            const blob = await zip.generateAsync({ type: 'blob' });
            const file = new File([blob], 'test.zip', { type: 'application/zip' });

            const { storyBible } = await importProject(file);

            expect(storyBible.title).toBe('Minimal Project');
            expect(storyBible.entities).toEqual({});
            expect(storyBible.calendar).toBeDefined();
        });

        it('should import images along with the project JSON', async () => {
            const mockBible: Partial<StoryBible> = { title: 'Project With Image' };
            const mockImageBlob = new Blob(['mock image data'], { type: 'image/png' });

            const zip = new JSZip();
            zip.file('story_bible.json', JSON.stringify(mockBible));
            const imagesFolder = zip.folder('images');
            imagesFolder!.file('img-123', mockImageBlob);
            
            const blob = await zip.generateAsync({ type: 'blob' });
            const file = new File([blob], 'test.zip', { type: 'application/zip' });

            await importProject(file);

            expect(idbService.saveImage).toHaveBeenCalledTimes(1);
            expect(idbService.saveImage).toHaveBeenCalledWith('img-123', expect.any(Blob));
        });

        it('should reject if story_bible.json is missing', async () => {
            const zip = new JSZip();
            zip.file('other_file.txt', 'hello');
            const blob = await zip.generateAsync({ type: 'blob' });
            const file = new File([blob], 'test.zip', { type: 'application/zip' });

            await expect(importProject(file)).rejects.toThrow('Invalid project file: story_bible.json not found.');
        });
    });

    describe('importProjectFromMarkdown', () => {
        it('should parse entities, references, attributes, and events correctly', async () => {
            const heroMd = `---
id: char-hero
type: Character
name: Aragorn
---
## Description
The heir of Isildur, also known as [[Arwen|Arwen Undómiel]]'s partner.
## Attributes
- **Title:** Chieftain of the Dúnedain
- **Weapon:** [[Anduril|Andúril, Flame of the West]]
## Chronology of Events
### Battle of Helm's Deep (0030-03-03T22:00:00.000Z) <!-- 0030-03-03T22:00:00.000Z -->
He fought alongside many Rohan soldiers.
**Details:**
- **Location:** [[Helm's Deep|Helm's Deep]]
**Related Entities:**
- [[Gimli_char-gimli|Gimli]] (Ally)
`;
            const arwenMd = `---
id: char-arwen
type: Character
name: Arwen
---
## Description
An elf maiden.
`;
            const weaponMd = `---
id: obj-anduril
type: Object
name: Anduril
---
`;
            const locationMd = `---
id: loc-helms-deep
type: Location
name: Helm's Deep
---
`;
             const gimliMd = `---
id: char-gimli
type: Character
name: Gimli
---
`;

            const zip = new JSZip();
            const mdFolder = zip.folder('markdown');
            mdFolder!.file('Aragorn_char-hero.md', heroMd);
            mdFolder!.file('Arwen_char-arwen.md', arwenMd);
            mdFolder!.file('Anduril_obj-anduril.md', weaponMd);
            mdFolder!.file('Helms_Deep_loc-helms-deep.md', locationMd);
            mdFolder!.file('Gimli_char-gimli.md', gimliMd);
            
            const blob = await zip.generateAsync({ type: 'blob' });
            const file = new File([blob], 'lotr_markdown.zip', { type: 'application/zip' });
            
            const storyBible = await importProjectFromMarkdown(file);

            // Check entities
            expect(Object.keys(storyBible.entities)).toHaveLength(5);
            const aragorn = Object.values(storyBible.entities).find(e => e.name === 'Aragorn');
            expect(aragorn).toBeDefined();
            expect(aragorn?.description).toBe("The heir of Isildur, also known as @[Arwen Undómiel](char-arwen)'s partner.");
            
            // Check attributes with references
            expect(aragorn?.details?.title).toBe('Chieftain of the Dúnedain');
            expect(aragorn?.details?.weapon).toBe('@[Andúril, Flame of the West](obj-anduril)');
            
            // Check events
            expect(Object.keys(storyBible.events)).toHaveLength(1);
            const battleEvent = Object.values(storyBible.events)[0];
            expect(battleEvent.type).toBe("Battle of Helm's Deep");
            expect(battleEvent.description).toContain('He fought alongside many Rohan soldiers.');
            expect(battleEvent.details.location).toBe('@[Helm\'s Deep](loc-helms-deep)');

            // Check involved entities in event
            const involvedIds = battleEvent.involvedEntities.map(inv => inv.entityId);
            expect(involvedIds).toContain('char-hero'); // The main entity of the file
            expect(involvedIds).toContain('char-gimli'); // The related entity
            expect(battleEvent.involvedEntities.find(i => i.entityId === 'char-gimli')?.role).toBe('Ally');
        });
    });
});
