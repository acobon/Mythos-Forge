
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { sidebarConfig } from '../../data/sidebar-config';
import { ViewType, ModalType, StoryBible } from '../../types/index';
import { Z_INDEX } from '../../constants';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { setSidebarOpen, openValidationModal, toggleCommandPalette, pushModal } from '../../state/uiSlice';
import { useProjectActions } from '../../hooks/useProjectActions';
import { validateStoryBible } from '../../services/validationService';
import { selectFullStoryBible } from '../../state/selectors';

import SidebarHeader from './sidebar/SidebarHeader';
import SidebarNavigation from './sidebar/SidebarNavigation';
import SidebarFooter from './sidebar/SidebarFooter';

interface SidebarProps {
  prefetchView: (view: ViewType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ prefetchView }) => {
    const isSidebarOpen = useAppSelector(state => state.ui.isSidebarOpen);
    const dispatch = useAppDispatch();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const settingsFileInputRef = useRef<HTMLInputElement>(null);
    const markdownInputRef = useRef<HTMLInputElement>(null);

    const {
        handleDownloadProject,
        handleUploadClick,
        handleFileSelected,
        handleExportManuscriptClick,
        handleExportCompendiumClick,
        handleNewProject,
        handleExportSettings,
        handleImportSettingsClick,
        handleSettingsFileSelected,
        handleImportMarkdownClick,
        handleMarkdownFileSelected,
        handleExportProjectAsMarkdown,
    } = useProjectActions({ fileInputRef, settingsFileInputRef, markdownInputRef });
    
    const storyBible = useAppSelector(selectFullStoryBible) as StoryBible;
    const handleValidateTimeline = useCallback(() => {
        const issues = validateStoryBible(storyBible);
        dispatch(openValidationModal(issues));
    }, [storyBible, dispatch]);
    
    const handleAction = useCallback((action: { type: string; payload?: any }) => {
        if (!action) return;
        switch (action.type) {
            case 'OPEN_COMMAND_PALETTE': dispatch(toggleCommandPalette()); break;
            case 'OPEN_GLOBAL_SEARCH': dispatch(pushModal({ type: ModalType.GLOBAL_SEARCH, props: {} })); break;
            case 'VALIDATE_TIMELINE': handleValidateTimeline(); break;
            case 'UPLOAD_PROJECT': handleUploadClick(); break;
            case 'IMPORT_MARKDOWN': handleImportMarkdownClick(); break;
            case 'DOWNLOAD_PROJECT': handleDownloadProject(); break;
            case 'EXPORT_PROJECT_AS_MARKDOWN': handleExportProjectAsMarkdown(); break;
            case 'EXPORT_MANUSCRIPT': handleExportManuscriptClick(); break;
            case 'EXPORT_COMPENDIUM': handleExportCompendiumClick(); break;
            case 'EXPORT_SETTINGS': handleExportSettings(); break;
            case 'IMPORT_SETTINGS': handleImportSettingsClick(); break;
            case 'NEW_PROJECT': handleNewProject(); break;
            default: console.warn(`Unknown sidebar action: ${action.type}`);
        }
    }, [
        dispatch,
        handleValidateTimeline,
        handleUploadClick,
        handleImportMarkdownClick,
        handleDownloadProject,
        handleExportManuscriptClick,
        handleExportCompendiumClick,
        handleExportSettings,
        handleImportSettingsClick,
        handleNewProject,
        handleExportProjectAsMarkdown,
    ]);

    const handleClose = () => dispatch(setSidebarOpen(false));

    return (
        <>
            <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleFileSelected(e.target.files)} accept=".json,.zip,.mythos" />
            <input ref={settingsFileInputRef} type="file" className="hidden" onChange={(e) => handleSettingsFileSelected(e.target.files)} accept=".json" />
            <input ref={markdownInputRef} type="file" className="hidden" onChange={(e) => handleMarkdownFileSelected(e.target.files)} accept=".md,.zip" />
            
            <aside className={`absolute top-0 left-0 h-full bg-secondary z-30 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:z-auto ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ zIndex: Z_INDEX.SIDEBAR, width: '100%' }} aria-label="Main navigation">
                <div className="flex flex-col h-full">
                    <SidebarHeader onClose={handleClose} />
                    <SidebarNavigation
                        config={sidebarConfig}
                        onAction={handleAction}
                        onPrefetchView={prefetchView}
                        onClose={handleClose}
                    />
                    <SidebarFooter />
                </div>
            </aside>
        </>
    );
};
export default Sidebar;
