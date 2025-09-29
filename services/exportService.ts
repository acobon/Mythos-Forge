// services/exportService.ts
import { StoryBible, EntityType, Work, NarrativeScene, Entity, CharacterEntity, HistoricalEvent, WorldEvent, ResearchNote, DictionaryEntry } from '../types';
import JSZip from 'jszip';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import DOMPurify from 'dompurify';
import { exportToWebpage, generateEntityMarkdown, sanitizeFilename, getEntityFilename } from './exportHelpers';
import * as idbService from './idbService';
import { calculateAge, formatWorldDate, htmlToPlainText, stripReferences, getTypedObjectValues } from '../utils';
import { getEventDefinition } from '../data/event-definitions';


export type ExportOptions = {
    format: 'pdf' | 'epub' | 'md' | 'txt' | 'html';
    includeTitlePage: boolean;
    authorName: string;
    title: string;
    fontSize: string;
    lineSpacing: string;
    fontFamily: string;
    includeSummaries: boolean;
    pageSize: 'A4' | 'Letter';
    margins: { top: number; bottom: number; left: number; right: number };
    publisher: string;
    coverImage: string | null;
    headerText?: string;
    footerText?: string;
};

export { exportToWebpage, generateEntityMarkdown, sanitizeFilename };


export const exportProject = async (storyBible: StoryBible, onProgress?: (progress: number) => void): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        const images = await idbService.getAllImages();
        const worker = new Worker(new URL('../export.worker.ts', import.meta.url), { type: 'module' });

        worker.onmessage = (event: MessageEvent<{ type: 'progress' | 'done'; percent?: number; blob?: Blob }>) => {
            if (event.data.type === 'progress' && event.data.percent) {
                onProgress?.(event.data.percent);
            }
            if (event.data.type === 'done' && event.data.blob) {
                const blob = event.data.blob;
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `${sanitizeFilename(storyBible.title)}.zip`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                worker.terminate();
                resolve();
            }
        };

        worker.onerror = (error) => {
            console.error('Error in export worker:', error);
            worker.terminate();
            reject(new Error('Failed to export project files.'));
        };

        // Transfer the story bible object to the worker
        worker.postMessage({ storyBible, images });
    });
};


const convertHtmlToText = (html: string): string => {
    if (!html) return '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = DOMPurify.sanitize(html);
    return tempDiv.textContent || tempDiv.innerText || '';
};

const generateHtmlForManuscript = (work: Work, storyBible: StoryBible, options: ExportOptions): string => {
    let html = `<html><head><style>
        body { font-family: ${options.fontFamily}, serif; font-size: ${options.fontSize}pt; line-height: ${options.lineSpacing}; }
        h1, h2, h3 { font-family: ${options.fontFamily}, serif; }
        .title-page { text-align: center; page-break-after: always; padding-top: 30vh; }
        .summary { font-style: italic; color: #555; border-left: 2px solid #ccc; padding-left: 1em; margin: 1em 0; }
        img { max-width: 100%; height: auto; }
    </style></head><body>`;

    if (options.includeTitlePage) {
        html += `<div class="title-page"><h1>${DOMPurify.sanitize(options.title)}</h1><h3>by ${DOMPurify.sanitize(options.authorName) || 'Anonymous'}</h3></div>`;
    }

    work.chapters.forEach(chapter => {
        html += `<h2>${DOMPurify.sanitize(chapter.title)}</h2>`;
        if (options.includeSummaries && chapter.summary) {
            html += `<p class="summary">${DOMPurify.sanitize(chapter.summary)}</p>`;
        }
        chapter.sceneIds.forEach(sceneId => {
            const scene = storyBible.scenes[sceneId];
            if (scene) {
                if (options.includeSummaries && scene.summary) {
                    html += `<h3>${DOMPurify.sanitize(scene.title)}</h3>`;
                    html += `<p class="summary">${DOMPurify.sanitize(scene.summary)}</p>`;
                }
                html += DOMPurify.sanitize(scene.content);
            }
        });
    });

    html += '</body></html>';
    return html;
};

export const exportWork = async (work: Work, storyBible: StoryBible, options: ExportOptions): Promise<void> => {
    const html = generateHtmlForManuscript(work, storyBible, options);
    const sanitizedTitle = sanitizeFilename(work.title);
    const link = document.createElement("a");

    switch(options.format) {
        case 'pdf': {
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = DOMPurify.sanitize(html, { ADD_ATTR: ['style'] });

            Object.assign(tempContainer.style, {
                position: 'fixed',
                top: '-9999px',
                left: '0',
                width: options.pageSize === 'Letter' ? '8.5in' : '210mm',
                padding: `${options.margins.top}mm ${options.margins.right}mm ${options.margins.bottom}mm ${options.margins.left}mm`,
                boxSizing: 'border-box',
                background: 'white'
            });
            document.body.appendChild(tempContainer);
        
            const canvas = await html2canvas(tempContainer, { scale: 2, useCORS: true });
            document.body.removeChild(tempContainer);
    
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: options.pageSize.toLowerCase(),
            });
    
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = imgHeight / imgWidth;
            let finalImgHeight = pdfWidth * ratio;
            let heightLeft = finalImgHeight;
            let position = 0;
    
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, finalImgHeight);
            heightLeft -= pdfHeight;
    
            while (heightLeft > 0) {
                position -= pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, finalImgHeight);
                heightLeft -= pdfHeight;
            }
    
            pdf.save(`${sanitizedTitle}.pdf`);
            return;
        }
        case 'epub': {
            const zip = new JSZip();
            zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

            const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
            zip.folder("META-INF")?.file("container.xml", containerXml);

            const oebps = zip.folder("OEBPS");
            if (!oebps) throw new Error("Could not create OEBPS folder");

            const bookId = `urn:uuid:${crypto.randomUUID()}`;
            const now = new Date().toISOString().split('.')[0] + 'Z';

            const css = `body { font-family: ${options.fontFamily}, serif; line-height: 1.5; font-size: ${options.fontSize}pt; } h1, h2, h3 { text-align: center; font-family: ${options.fontFamily}, serif; } .title-page { text-align: center; height: 100vh; display: flex; flex-direction: column; justify-content: center; } .summary { font-style: italic; color: #555; border-left: 2px solid #ccc; padding-left: 1em; margin: 1em 0; } img { max-width: 100%; height: auto; }`;
            oebps.file("style.css", css);

            const manifestItems: { id: string, href: string, mediaType: string, properties?: string }[] = [{ id: 'css', href: 'style.css', mediaType: 'text/css' }];
            const spineItems: { idref: string }[] = [];
            const tocItems: { title: string, href: string }[] = [];

            if (options.coverImage) {
                manifestItems.push({ id: 'cover-image', href: 'cover.jpeg', mediaType: 'image/jpeg', properties: 'cover-image' });
                manifestItems.push({ id: 'cover-page', href: 'cover.xhtml', mediaType: 'application/xhtml+xml' });
                spineItems.push({ idref: 'cover-page' });
                
                const coverImageBase64 = options.coverImage.split(',')[1];
                oebps.file('cover.jpeg', coverImageBase64, { base64: true });

                const coverXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en">
<head>
    <title>Cover</title>
    <style> body { margin: 0; padding: 0; text-align: center; } img { max-width: 100%; max-height: 100vh; } </style>
</head>
<body>
    <img src="cover.jpeg" alt="Cover Image"/>
</body>
</html>`;
                oebps.file('cover.xhtml', coverXhtml);
            }
            
            if (options.includeTitlePage) {
                const titlePageId = 'title-page';
                const titlePageHref = 'title-page.xhtml';
                manifestItems.push({ id: titlePageId, href: titlePageHref, mediaType: 'application/xhtml+xml' });
                spineItems.push({ idref: titlePageId });
                tocItems.push({ title: 'Title Page', href: titlePageHref });

                const titlePageHtml = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
<head>
    <title>${DOMPurify.sanitize(options.title)}</title>
    <link rel="stylesheet" type="text/css" href="style.css" />
</head>
<body>
    <div class="title-page">
        <h1>${DOMPurify.sanitize(options.title)}</h1>
        <h2>by ${DOMPurify.sanitize(options.authorName) || 'Anonymous'}</h2>
    </div>
</body>
</html>`;
                oebps.file(titlePageHref, titlePageHtml);
            }

            work.chapters.forEach((chapter, index) => {
                const chapterId = `chapter-${index + 1}`;
                const chapterHref = `chapter-${index + 1}.xhtml`;
                
                manifestItems.push({ id: chapterId, href: chapterHref, mediaType: 'application/xhtml+xml' });
                spineItems.push({ idref: chapterId });
                tocItems.push({ title: chapter.title, href: chapterHref });

                let chapterHtml = `<h1>${DOMPurify.sanitize(chapter.title)}</h1>`;
                if (options.includeSummaries && chapter.summary) chapterHtml += `<p class="summary">${DOMPurify.sanitize(chapter.summary)}</p>`;
                chapter.sceneIds.forEach(sceneId => {
                    const scene = storyBible.scenes[sceneId];
                    if (scene) {
                        if (options.includeSummaries && scene.summary) {
                            chapterHtml += `<h2>${DOMPurify.sanitize(scene.title)}</h2>`;
                            chapterHtml += `<p class="summary">${DOMPurify.sanitize(scene.summary)}</p>`;
                        }
                        chapterHtml += DOMPurify.sanitize(scene.content);
                    }
                });

                const chapterXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en">
<head>
    <title>${DOMPurify.sanitize(chapter.title)}</title>
    <link rel="stylesheet" type="text/css" href="style.css" />
</head>
<body>${chapterHtml}</body>
</html>`;
                oebps.file(chapterHref, chapterXhtml);
            });
            
            manifestItems.push({ id: 'toc', href: 'toc.xhtml', mediaType: 'application/xhtml+xml', properties: 'nav' });
            const tocXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en">
<head>
    <title>Table of Contents</title>
</head>
<body>
    <nav epub:type="toc">
        <h1>Table of Contents</h1>
        <ol>
            ${tocItems.map(item => `<li><a href="${item.href}">${DOMPurify.sanitize(item.title)}</a></li>`).join('')}
        </ol>
    </nav>
</body>
</html>`;
            oebps.file('toc.xhtml', tocXhtml);

            const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:title>${DOMPurify.sanitize(options.title)}</dc:title>
        <dc:creator>${DOMPurify.sanitize(options.authorName) || 'Unknown'}</dc:creator>
        <dc:identifier id="bookid">${bookId}</dc:identifier>
        <dc:language>en</dc:language>
        <meta property="dcterms:modified">${now}</meta>
        ${options.coverImage ? '<meta name="cover" content="cover-image" />' : ''}
    </metadata>
    <manifest>
        ${manifestItems.map(item => `<item id="${item.id}" href="${item.href}" media-type="${item.mediaType}" ${item.properties ? `properties="${item.properties}"` : ''} />`).join('\n        ')}
    </manifest>
    <spine>
        ${spineItems.map(item => `<itemref idref="${item.idref}" />`).join('\n        ')}
    </spine>
</package>`;
            oebps.file('content.opf', contentOpf);
            
            const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
            link.href = URL.createObjectURL(blob);
            link.download = `${sanitizedTitle}.epub`;
            break;
        }
        case 'md':
        case 'txt': {
            let textContent = '';
            if (options.includeTitlePage) {
                textContent += `# ${options.title}\n\nby ${options.authorName || 'Anonymous'}\n\n---\n\n`;
            }
            work.chapters.forEach(chapter => {
                textContent += `## ${chapter.title}\n\n`;
                if(options.includeSummaries && chapter.summary) textContent += `> ${chapter.summary}\n\n`;
                chapter.sceneIds.forEach(sceneId => {
                    const scene = storyBible.scenes[sceneId];
                    if(scene) {
                        if (options.includeSummaries && scene.summary) {
                            textContent += `### ${scene.title}\n\n`;
                            textContent += `> ${scene.summary}\n\n`;
                        }
                        textContent += `${convertHtmlToText(scene.content)}\n\n---\n\n`;
                    }
                });
            });
            const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
            link.href = URL.createObjectURL(blob);
            link.download = `${sanitizedTitle}.${options.format}`;
            break;
        }
        case 'html': {
             const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
             link.href = URL.createObjectURL(blob);
             link.download = `${sanitizedTitle}.html`;
             break;
        }
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const generateCompendiumHtml = (storyBible: StoryBible, entityTypes: string[]): string => {
    let html = `<html><head><style>
        body { font-family: sans-serif; }
        h1, h2, h3 { font-family: serif; }
        .entity { page-break-inside: avoid; margin-bottom: 2rem; border-bottom: 1px solid #eee; padding-bottom: 1rem; }
        .toc ul { list-style: none; padding-left: 0; }
        .toc a { text-decoration: none; color: #0000ee; }
        .ref-link { color: #000; text-decoration: none; font-weight: bold; }
        .page-break { page-break-before: always; }
    </style></head><body><h1>${DOMPurify.sanitize(storyBible.title)} - Compendium</h1>`;

    const filteredEntities = getTypedObjectValues(storyBible.entities).filter(e => entityTypes.includes(e.type));
    
    // Table of Contents
    html += '<div class="toc"><h2>Table of Contents</h2><ul>';
    entityTypes.forEach(type => {
        const typePlural = `${type.charAt(0).toUpperCase() + type.slice(1)}s`;
        if (filteredEntities.some(e => e.type === type)) {
             html += `<li><a href="#${type}">${typePlural}</a></li>`;
        }
    });
    html += '</ul></div>';

    // Entity Details
    entityTypes.forEach(type => {
        const entitiesOfType = filteredEntities.filter(e => e.type === type).sort((a,b) => a.name.localeCompare(b.name));
        if (entitiesOfType.length > 0) {
            const typePlural = `${type.charAt(0).toUpperCase() + type.slice(1)}s`;
            html += `<h2 class="page-break" id="${type}">${typePlural}</h2>`;
            entitiesOfType.forEach(entity => {
                html += `<div class="entity"><h3>${DOMPurify.sanitize(entity.name)}</h3>`;
                html += DOMPurify.sanitize(stripReferences(entity.description));
                // You could add attribute details here as well
                html += `</div>`;
            });
        }
    });
    
    html += `</body></html>`;
    return html;
};

export const exportCompendium = async (storyBible: StoryBible, options: { format: 'pdf' | 'html', entityTypes: string[] }): Promise<void> => {
    if (options.format === 'html') {
        return exportToWebpage({ ...storyBible, entities: Object.fromEntries(Object.entries(storyBible.entities).filter(([, entity]) => options.entityTypes.includes(entity.type))) });
    }
    
    const html = generateCompendiumHtml(storyBible, options.entityTypes);

    if (options.format === 'pdf') {
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = DOMPurify.sanitize(html, { ADD_ATTR: ['style', 'id'] });
        Object.assign(tempContainer.style, { position: 'fixed', top: '-9999px', left: '0', width: '8.5in', background: 'white' });
        document.body.appendChild(tempContainer);

        const canvas = await html2canvas(tempContainer, { scale: 2 });
        document.body.removeChild(tempContainer);
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgHeight = canvas.height * pdfWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
        while (heightLeft > 0) {
            position = -heightLeft;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();
        }
        pdf.save(`${sanitizeFilename(storyBible.title)}_compendium.pdf`);
    }
};

export const exportAllTextAsMarkdown = async (storyBible: StoryBible): Promise<void> => {
    const zip = new JSZip();

    // Export all entities
    const entitiesFolder = zip.folder('entities');
    if (entitiesFolder) {
        getTypedObjectValues(storyBible.entities).forEach(entity => {
            const content = generateEntityMarkdown(entity, storyBible);
            entitiesFolder.file(`${getEntityFilename(entity)}.md`, content);
        });
    }

    // Export all works
    const worksFolder = zip.folder('works');
    if (worksFolder) {
        getTypedObjectValues(storyBible.works).forEach(work => {
            let workContent = `# ${work.title}\n\n${work.description}\n\n---\n\n`;
            work.chapters.forEach(chapter => {
                workContent += `## ${chapter.title}\n\n`;
                if (chapter.summary) {
                    workContent += `> ${chapter.summary}\n\n`;
                }
                chapter.sceneIds.forEach(sceneId => {
                    const scene = storyBible.scenes[sceneId];
                    if (scene) {
                        workContent += `### ${scene.title}\n\n`;
                        if (scene.summary) {
                            workContent += `> ${scene.summary}\n\n`;
                        }
                        workContent += `${htmlToPlainText(scene.content)}\n\n---\n\n`;
                    }
                });
            });
            worksFolder.file(`${sanitizeFilename(work.title)}.md`, workContent);
        });
    }

    // Export research notes
    const researchFolder = zip.folder('research');
    if (researchFolder) {
        getTypedObjectValues(storyBible.researchNotes).forEach(note => {
            let noteContent = `# ${note.title}\n\n`;
            noteContent += htmlToPlainText(note.content);
            researchFolder.file(`${sanitizeFilename(note.title)}.md`, noteContent);
        });
    }
    
    const blob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${sanitizeFilename(storyBible.title)}_markdown_export.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


export const exportDictionary = (dictionary: Record<string, DictionaryEntry>, format: 'json' | 'csv'): void => {
    const entries = Object.values(dictionary);
    let content: string;
    let mimeType: string;
    let fileExtension: string;

    if (format === 'json') {
        content = JSON.stringify(entries, null, 2);
        mimeType = 'application/json';
        fileExtension = 'json';
    } else { // csv
        const header = ['term', 'definition', 'caseSensitive'];
        const rows = entries.map(e => [
            `"${e.term.replace(/"/g, '""')}"`,
            `"${e.definition.replace(/"/g, '""')}"`,
            e.caseSensitive
        ]);
        content = [header.join(','), ...rows.map(row => row.join(','))].join('\n');
        mimeType = 'text/csv';
        fileExtension = 'csv';
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `dictionary.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};