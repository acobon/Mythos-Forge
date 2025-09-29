

import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../../state/hooks';
import { useI18n } from '../../../hooks/useI18n';
import { useProjectSettingsActions } from '../../../hooks/useProjectSettingsActions';
import { useDebounce } from '../../../hooks/useDebounce';
import type { SaveStatus } from '../../../hooks/useDebouncedEntitySave';
import { EditIcon } from '../../common/Icons';
import { SaveStatusIndicator } from '../../common/SaveStatusIndicator';
import { addUnsavedChange, removeUnsavedChange } from '../../../state/uiSlice';
import { selectFullStoryBible } from '../../../state/selectors';
import { StoryBible } from '../../../types';

const SCRATCHPAD_UNSAVED_KEY = 'scratchpad-unsaved';

const ProjectScratchpad: React.FC = () => {
    const { t } = useI18n();
    const dispatch = useAppDispatch();
    const storyBible = useAppSelector(selectFullStoryBible) as StoryBible;
    const { scratchpad } = storyBible;
    const { updateScratchpad } = useProjectSettingsActions();
    
    const [draft, setDraft] = useState(scratchpad || '');
    const debouncedDraft = useDebounce(draft, 1000);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

    useEffect(() => { setDraft(scratchpad || ''); }, [scratchpad]);
    
    // Effect for handling unsaved changes tracking
    useEffect(() => {
        if (saveStatus === 'unsaved') {
            dispatch(addUnsavedChange(SCRATCHPAD_UNSAVED_KEY));
        } else {
            dispatch(removeUnsavedChange(SCRATCHPAD_UNSAVED_KEY));
        }
        
        return () => {
            dispatch(removeUnsavedChange(SCRATCHPAD_UNSAVED_KEY));
        };
    }, [saveStatus, dispatch]);

    useEffect(() => {
        if (saveStatus === 'unsaved' && debouncedDraft !== (scratchpad || '')) {
            setSaveStatus('saving');
            updateScratchpad(debouncedDraft);
            setTimeout(() => {
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            }, 300);
        }
    }, [debouncedDraft, scratchpad, updateScratchpad, saveStatus]);

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDraft(e.target.value);
        setSaveStatus('unsaved');
    };

    return (
        <section>
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-semibold text-text-secondary flex items-center gap-2">
                    <EditIcon className="w-5 h-5" />
                    {t('dashboard.scratchpad.title')}
                </h3>
                <div className="h-4">
                    <SaveStatusIndicator status={saveStatus} />
                </div>
            </div>
            <textarea
                value={draft}
                onChange={handleContentChange}
                placeholder={t('dashboard.scratchpad.placeholder')}
                rows={8}
                className="w-full text-text-main bg-secondary p-4 rounded-md border border-border-color focus:ring-2 focus:ring-accent focus:outline-none transition-colors text-sm"
            />
        </section>
    );
};

export default ProjectScratchpad;
