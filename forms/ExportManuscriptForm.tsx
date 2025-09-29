import React, { useState } from 'react';
import { useI18n } from '../../hooks/useI18n';
import { exportWork, ExportOptions } from '../../services/exportService';
import { Work, StoryBible } from '../../types';
import { UploadIcon } from '../common/Icons';
import { getTypedObjectValues } from '../../utils';
import { Select, Input, Button } from '../common/ui';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { pushProcessing, popProcessing, showDialog } from '../../state/uiSlice';
import { selectFullStoryBible } from '../../state/selectors';
import { RootState } from '../../state/store';

// FIX: Removed 'docx' as it's not a supported export format in the service.
type ExportFormat = 'pdf' | 'epub' | 'md' | 'txt' | 'html';

const ExportManuscriptForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    // FIX: Explicitly pass state to the selector to ensure correct type inference by `useAppSelector`.
    const storyBible = useAppSelector((state: RootState) => selectFullStoryBible(state));
    const dispatch = useAppDispatch();
    const { t } = useI18n();
    const { works, title: projectTitle } = storyBible;
    const worksArray = getTypedObjectValues(works) as Work[];

    const [selectedWorkId, setSelectedWorkId] = useState<string>(worksArray[0]?.id || '');
    // FIX: Changed default format to a supported one ('pdf').
    const [format, setFormat] = useState<ExportFormat>('pdf');
    
    // Settings state
    const [includeTitlePage, setIncludeTitlePage] = useState(true);
    const [authorName, setAuthorName] = useState('');
    const [title, setTitle] = useState(projectTitle);
    const [fontSize, setFontSize] = useState('12');
    const [lineSpacing, setLineSpacing] = useState('1.5');
    const [fontFamily, setFontFamily] = useState('serif');
    const [includeSummaries, setIncludeSummaries] = useState(false);
    const [pageSize, setPageSize] = useState<'A4' | 'Letter'>('Letter');
    const [margins, setMargins] = useState({ top: 25, bottom: 25, left: 25, right: 25 });
    const [publisher, setPublisher] = useState('');
    const [coverImage, setCoverImage] = useState<string | null>(null);

    const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setCoverImage(event.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleExport = async () => {
        const work = worksArray.find(p => p.id === selectedWorkId);
        if (!work) return;

        dispatch(pushProcessing({ message: t('export.generating') }));
        try {
            await exportWork(work, storyBible, {
                format,
                includeTitlePage, authorName, title, fontSize, lineSpacing, fontFamily,
                includeSummaries, pageSize, margins, publisher, coverImage
            });

            onClose();
        } catch (error) {
            console.error("Export failed", error);
            dispatch(showDialog({ title: "Export Error", message: `Failed to generate file: ${error instanceof Error ? error.message : 'Unknown error'}` }));
        } finally {
            dispatch(popProcessing());
        }
    };

    const renderSettings = () => {
        const typographySettings = (
             <>
                <div>
                    <label className="text-sm font-medium">{t('export.fontSize')}</label>
                    <Select value={fontSize} onChange={e => setFontSize(e.target.value)} className="mt-1"><option>10</option><option>11</option><option>12</option><option>14</option></Select>
                </div>
                <div>
                    <label className="text-sm font-medium">{t('export.lineSpacing')}</label>
                    <Select value={lineSpacing} onChange={e => setLineSpacing(e.target.value)} className="mt-1"><option value="1">Single</option><option value="1.5">1.5 Lines</option><option value="2">Double</option></Select>
                </div>
                <div>
                    <label className="text-sm font-medium">{t('export.fontFamily')}</label>
                    <Select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="mt-1"><option value="serif">Serif (e.g., Times New Roman)</option><option value="sans">Sans-serif (e.g., Arial)</option></Select>
                </div>
            </>
        );

        switch (format) {
            case 'html':
                return <div className="grid grid-cols-2 gap-4">{typographySettings}</div>;
            case 'pdf':
                return (
                    <div className="grid grid-cols-2 gap-4">
                        {typographySettings}
                        <div>
                            <label className="text-sm font-medium">{t('export.pageSize')}</label>
                            <Select value={pageSize} onChange={e => setPageSize(e.target.value as 'A4' | 'Letter')} className="mt-1"><option>Letter</option><option>A4</option></Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">{t('export.margins')}</label>
                            <div className="grid grid-cols-4 gap-2">
                                <Input type="number" value={margins.top} onChange={e => setMargins(m => ({...m, top: parseInt(e.target.value)}))} placeholder={t('export.top')} className="mt-1" />
                                <Input type="number" value={margins.bottom} onChange={e => setMargins(m => ({...m, bottom: parseInt(e.target.value)}))} placeholder={t('export.bottom')} className="mt-1" />
                                <Input type="number" value={margins.left} onChange={e => setMargins(m => ({...m, left: parseInt(e.target.value)}))} placeholder={t('export.left')} className="mt-1" />
                                <Input type="number" value={margins.right} onChange={e => setMargins(m => ({...m, right: parseInt(e.target.value)}))} placeholder={t('export.right')} className="mt-1" />
                            </div>
                        </div>
                    </div>
                );
            case 'epub':
                return <p className="text-sm text-text-secondary">ePub styling is determined by the reader's device.</p>
            default:
                return null;
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <label className="text-sm font-medium text-text-secondary">{t('export.selectWork')}</label>
                {worksArray.length > 0 ? (
                    <Select value={selectedWorkId} onChange={e => setSelectedWorkId(e.target.value)} className="mt-1">
                        {worksArray.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </Select>
                ) : <p className="text-sm text-text-secondary mt-1">{t('export.noWorks')}</p>}
            </div>
            
            <div className="flex">
                <div className="w-1/4 pr-4 border-r border-border-color">
                    <h4 className="text-sm font-medium text-text-secondary mb-2">{t('export.format')}</h4>
                    <div className="space-y-1">
                        {/* FIX: Removed 'docx' from the list of available formats. */}
                        {(['pdf', 'epub', 'md', 'txt', 'html'] as const).map(f => (
                            <button key={f} onClick={() => setFormat(f)} className={`w-full text-left p-2 rounded-md ${format === f ? 'bg-accent text-white' : 'hover:bg-secondary'}`}>{f.toUpperCase()}</button>
                        ))}
                    </div>
                </div>
                <div className="w-3/4 pl-4 space-y-4">
                    <h4 className="text-sm font-medium text-text-secondary">{t('export.settings')}</h4>
                    <div className="p-4 bg-secondary rounded-md border border-border-color space-y-4">
                        <div className="flex items-center">
                            <input id="cover-image-check" type="checkbox" checked={!!coverImage} onChange={e => { if(!e.target.checked) setCoverImage(null); }} className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent" />
                            <label htmlFor="cover-image-check" className="ml-2 text-sm">{t('export.includeCover')}</label>
                        </div>
                        {coverImage && (
                            <div className="pl-6 animate-fade-in">
                                <img src={coverImage} alt="Cover preview" className="max-h-24 border border-border-color rounded-md"/>
                            </div>
                        )}
                         <div className="pl-6 animate-fade-in">
                            <label className="text-sm font-medium cursor-pointer text-accent hover:underline">
                                {coverImage ? 'Change' : 'Upload'} Cover Image
                                <input type="file" accept="image/*" className="hidden" onChange={handleCoverImageChange} />
                            </label>
                        </div>
                         <div className="flex items-center">
                            <input id="title-page-check" type="checkbox" checked={includeTitlePage} onChange={e => setIncludeTitlePage(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent" />
                            <label htmlFor="title-page-check" className="ml-2 text-sm">{t('export.includeTitlePage')}</label>
                        </div>
                        {includeTitlePage && (
                            <div className="grid grid-cols-2 gap-4 pl-6 animate-fade-in">
                                <div><label className="text-sm font-medium">{t('export.projectTitle')}</label><Input type="text" value={title} onChange={e => setTitle(e.target.value)} className="mt-1" /></div>
                                <div><label className="text-sm font-medium">{t('export.authorName')}</label><Input type="text" value={authorName} onChange={e => setAuthorName(e.target.value)} placeholder="Author" className="mt-1" /></div>
                            </div>
                        )}
                         <div className="flex items-center">
                            <input id="summaries-check" type="checkbox" checked={includeSummaries} onChange={e => setIncludeSummaries(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent" />
                            <label htmlFor="summaries-check" className="ml-2 text-sm">{t('export.includeSummaries')}</label>
                        </div>
                        {renderSettings()}
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button onClick={handleExport} disabled={!selectedWorkId}>
                    {t('export.exportButton')}
                </Button>
            </div>
        </div>
    );
};

export default ExportManuscriptForm;