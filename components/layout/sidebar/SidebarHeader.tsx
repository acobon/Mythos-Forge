// components/layout/sidebar/SidebarHeader.tsx
import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../../state/hooks';
import { updateTitle } from '../../../state/slices/projectSlice';
import { undo, redo } from '../../../state/history';
import { useDebounce } from '../../../hooks/useDebounce';
import { useI18n } from '../../../hooks/useI18n';
import { Input, Button } from '../../common/ui';
import { XIcon, RotateCcwIcon, RotateCwIcon } from '../../common/Icons';

interface SidebarHeaderProps {
  onClose: () => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ onClose }) => {
  const dispatch = useAppDispatch();
  const { title } = useAppSelector(state => state.bible.present.project);
  const { past, future } = useAppSelector(state => state.bible);
  const { isSidebarCollapsed } = useAppSelector(state => state.ui);
  const { t } = useI18n();

  const [draftTitle, setDraftTitle] = useState(title);
  const debouncedDraftTitle = useDebounce(draftTitle, 750);

  useEffect(() => {
    if (debouncedDraftTitle && debouncedDraftTitle.trim() && debouncedDraftTitle.trim() !== title) {
        dispatch(updateTitle(debouncedDraftTitle.trim()));
    }
  }, [debouncedDraftTitle, title, dispatch]);

  useEffect(() => {
    setDraftTitle(title);
  }, [title]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraftTitle(e.target.value);
  };

  return (
    <div className={`flex items-center justify-between p-4 border-b border-border-color flex-shrink-0 transition-all ${isSidebarCollapsed ? 'px-2' : ''}`}>
        {!isSidebarCollapsed && (
             <Input
                type="text"
                value={draftTitle || ''}
                onChange={handleTitleChange}
                className="text-lg font-bold bg-transparent focus:outline-none w-full !p-0 !border-0"
                aria-label={t('sidebar.projectTitle')}
            />
        )}
        <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => dispatch(undo())} disabled={past.length === 0} className="p-1 text-text-secondary hover:text-text-main disabled:opacity-50" aria-label={t('sidebar.undo')} title={t('sidebar.undo')}><RotateCcwIcon className="w-5 h-5"/></Button>
            <Button variant="ghost" size="icon" onClick={() => dispatch(redo())} disabled={future.length === 0} className="p-1 text-text-secondary hover:text-text-main disabled:opacity-50" aria-label={t('sidebar.redo')} title={t('sidebar.redo')}><RotateCwIcon className="w-5 h-5"/></Button>
            <button onClick={onClose} className="md:hidden p-1 text-text-secondary hover:text-text-main" aria-label={t('sidebar.closeMenu')}>
                <XIcon className="w-6 h-6" />
            </button>
        </div>
    </div>
  );
};

export default SidebarHeader;