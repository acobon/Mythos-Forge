import React, { useState } from 'react';
import { useI18n } from '../../hooks/useI18n';
import * as exportService from '../../services/exportService';
import { EntityType, StoryBible } from '../../types';
import { Select, Button } from '../common/ui';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { pushProcessing, popProcessing, showDialog } from '../../state/uiSlice';
import { selectFullStoryBible } from '../../state/selectors';

// FIX: Removed 'docx' as it's not a supported export format in the service.
type ExportFormat = 'pdf' | 'html';

const ExportCompendiumForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const storyBibleState = useAppSelector(selectFullStoryBible) as StoryBible;
    const dispatch = useAppDispatch();
    const { t } = useI18n();

    const [selectedTypes, setSelectedTypes] = useState<EntityType[]>(Object.values(EntityType));
    const [format, setFormat] = useState<ExportFormat>('pdf');

    const handleToggleType = (type: EntityType) => {
        setSelectedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const handleExport = async () => {
        dispatch(pushProcessing({ message: t('export.generating') }));
        try {
            await exportService.exportCompendium(storyBibleState, { format, entityTypes: selectedTypes });
            onClose();
        } catch (error) {
            console.error("Compendium export failed", error);
            dispatch(showDialog({ title: "Export Error", message: `Failed to generate file: ${error instanceof Error ? error.message : 'Unknown error'}` }));
        } finally {
            dispatch(popProcessing());
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="text-sm font-medium text-text-secondary">{t('export.compendium.selectTypes')}</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                    {Object.values(EntityType).map(type => (
                        <label key={type} className="flex items-center space-x-2 p-2 bg-primary rounded-md">
                            <input
                                type="checkbox"
                                checked={selectedTypes.includes(type)}
                                onChange={() => handleToggleType(type)}
                                className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                            />
                            <span className="text-sm text-text-main">{type}s</span>
                        </label>
                    ))}
                </div>
            </div>
            <div>
                <label className="text-sm font-medium text-text-secondary">{t('export.format')}</label>
                 <Select value={format} onChange={e => setFormat(e.target.value as ExportFormat)} className="mt-1">
                    <option value="pdf">PDF</option>
                    <option value="html">HTML Webpage</option>
                 </Select>
            </div>
             <div className="flex justify-end pt-4">
                <Button onClick={handleExport} disabled={selectedTypes.length === 0}>
                    {t('export.compendium.exportButton')}
                </Button>
            </div>
        </div>
    );
};

export default ExportCompendiumForm;