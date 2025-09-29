

// export.worker.ts
import JSZip from 'jszip';
import { StoryBible, Entity, EntityType } from './types';
import { generateEntityMarkdown, getEntityFilename, sanitizeFilename } from './services/exportHelpers';

self.onmessage = async (event: MessageEvent<{ storyBible: StoryBible, images: Map<string, Blob> }>) => {
    const { storyBible, images } = event.data;

    try {
        const zip = new JSZip();

        // Step 1: Stringify JSON
        self.postMessage({ type: 'progress', percent: 5 });
        zip.file("story_bible.json", JSON.stringify(storyBible, null, 2));
        
        // New step: add images
        const imagesFolder = zip.folder("images");
        if (imagesFolder && images) {
            for (const [id, blob] of images.entries()) {
                imagesFolder.file(id, blob);
            }
        }
        self.postMessage({ type: 'progress', percent: 20 });

        // Step 2: Generate Markdown files
        const mdFolder = zip.folder("markdown");
        if (mdFolder) {
            const allEntities = Object.values(storyBible.entities);
            allEntities.forEach((entity, index) => {
                const mdContent = generateEntityMarkdown(entity, storyBible);
                mdFolder.file(`${getEntityFilename(entity)}.md`, mdContent);
                // Progress for markdown generation (20% to 60%)
                self.postMessage({ type: 'progress', percent: 20 + (index / allEntities.length) * 40 });
            });

            // Generate and add the _index.md file
            const entitiesByType: Record<string, Entity[]> = {};

            allEntities.forEach(entity => {
                // Ensure custom types don't cause an error
                if (!entitiesByType[entity.type]) {
                    entitiesByType[entity.type] = [];
                }
                entitiesByType[entity.type].push(entity);
            });
            
            let indexMdContent = `# ${storyBible.title} - Entity Index\n\n`;
            for (const type of Object.keys(entitiesByType).sort()) {
                const group = entitiesByType[type];
                if (group.length > 0) {
                    group.sort((a, b) => a.name.localeCompare(b.name));
                    indexMdContent += `## ${type.charAt(0).toUpperCase() + type.slice(1)}s\n\n`;
                    group.forEach(entity => {
                        const filename = getEntityFilename(entity);
                        indexMdContent += `- [${entity.name}](./${filename}.md)\n`;
                    });
                    indexMdContent += `\n`;
                }
            }
            mdFolder.file("_index.md", indexMdContent);
        }
        self.postMessage({ type: 'progress', percent: 60 });

        // Step 3: Zip the files and report progress
        const blob = await zip.generateAsync(
            { type: 'blob' },
            (metadata) => {
                // Progress for zipping (60% to 100%)
                self.postMessage({ type: 'progress', percent: 60 + (metadata.percent * 0.4) });
            }
        );

        // Step 4: Send the final blob back
        self.postMessage({ type: 'done', blob });

    } catch (error) {
        // Handle errors in the worker
        self.postMessage({ type: 'error', message: error instanceof Error ? error.message : 'An unknown error occurred in the worker.' });
    }
};
