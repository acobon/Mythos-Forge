
// hooks/useProjectActions.ts
import React, { useCallback } from 'react';
import { StoryBible, UISettings, ModalType, ViewType, Inconsistency } from '../types/index';
import { defaultStoryBible } from '../data/defaults';
import { useConfirmationDialog } from './useConfirmationDialog';
import { useErrorHandler } from './useErrorHandler';
import * as exportService from '../services/exportService';
import * as importService from '../services/importService';
import { validateStoryBible } from '../services/validationService';
import { useNavigation } from './useNavigation';
import { useToast } from './useToast';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { setBible } from '../state/actions';
import { pushModal, pushProcessing, popProcessing, updateProcessing, openValidationModal, applySettings } from '../state/uiSlice';
import { getTypedObjectValues } from '../utils';
import { useI18n } from './useI18n';
import { selectFullStoryBible } from '../state/selectors';

interface UseProjectActionsProps {
    fileInputRef: React.RefObject<HTMLInputElement>;
    settingsFileInputRef: React.RefObject<HTMLInputElement>;
    markdownInputRef: React.RefObject<HTMLInputElement>;
}

export const useProjectActions = ({ fileInputRef, settingsFileInputRef, markdownInputRef }: UseProjectActionsProps) => {
    const storyBible = useAppSelector(selectFullStoryBible) as StoryBible;
    const uiState = useAppSelector(state => state.ui);
    const dispatch = useAppDispatch();
    const showConfirm = useConfirmationDialog();
    const { handleError } = useErrorHandler();
    const { navigateToView, selectEntity } = useNavigation();
    const { showToast } = useToast();
    const { t } = useI18n();

    const handleDownloadProject = useCallback(async () => {
        dispatch(pushProcessing({ message: 'Exporting Project...', progress: 0 }));
        try {
            const onProgress = (progress: number) => {
                dispatch(updateProcessing({ progress }));
            };
            await exportService.exportProject(storyBible, onProgress);
        } catch (error) {
            handleError(error, 'Project export failed.');
        } finally {
            dispatch(popProcessing());
        }
    }, [storyBible, handleError, dispatch]);

    const handleUploadClick = useCallback(() => {
        fileInputRef.current?.click();
    }, [fileInputRef]);

    const handleFileSelected = useCallback(async (files: FileList | null) => {
        const file = files?.[0];
        if (!file) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
    
        const performImport = (newStoryBible: StoryBible) => {
            dispatch(setBible(newStoryBible));
            navigateToView(ViewType.DASHBOARD);
            
            showToast({ type: 'success', message: 'Project imported successfully!', duration: 5000 });

            const validationIssues = validateStoryBible(newStoryBible);
            if (validationIssues.length > 0) {
                 showConfirm({ 
                    title: "Import Warning", 
                    message: `Import complete. However, ${validationIssues.length} chronological inconsistencies were found in the data.`,
                    confirmText: "View Issues",
                    cancelText: "OK",
                    onConfirm: () => { dispatch(openValidationModal(validationIssues)); },
                });
            }
        };
    
        try {
            dispatch(pushProcessing({ message: 'Importing...', progress: 0 }));
            const onProgress = (progress: number) => {
                dispatch(updateProcessing({ progress }));
            };
            const { storyBible: newStoryBible, warnings } = await importService.importProject(file, onProgress);
            
            if (warnings.length > 0) {
                showConfirm({
                    title: "Import Warning",
                    message: `Your project file contains some invalid data that will be removed:\n\n- ${warnings.join('\n- ')}\n\nDo you want to proceed with the import?`,
                    onConfirm: () => performImport(newStoryBible),
                });
            } else {
                performImport(newStoryBible);
            }
    
        } catch (error) {
            handleError(error, 'Project import failed.');
        } finally {
            dispatch(popProcessing());
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [dispatch, handleError, showConfirm, navigateToView, showToast]);

    const handleExportManuscriptClick = useCallback(() => {
        dispatch(pushModal({ type: ModalType.EXPORT_MANUSCRIPT, props: {} }));
    }, [dispatch]);
    
    const handleExportCompendiumClick = useCallback(() => {
        dispatch(pushModal({ type: ModalType.EXPORT_COMPENDIUM, props: {} }));
    }, [dispatch]);

    const handleNewProject = useCallback(() => {
        const performNewProject = () => {
            dispatch(setBible(defaultStoryBible));
            navigateToView(ViewType.ENTITIES);
            selectEntity(null);
        };

        showConfirm({
            title: t('sidebar.dialog.newProject.title'),
            message: t('sidebar.dialog.newProject.message'),
            actions: [
                { text: t('common.cancel'), onClick: () => {}, variant: 'ghost' },
                { text: t('sidebar.dialog.newProject.action.clearOnly'), onClick: performNewProject, variant: 'destructive' },
                { 
                    text: t('sidebar.dialog.newProject.action.downloadAndStart'), 
                    onClick: async () => {
                        await handleDownloadProject();
                        performNewProject();
                    }, 
                    variant: 'primary' 
                },
            ]
        });
    }, [dispatch, navigateToView, selectEntity, showConfirm, t, handleDownloadProject]);

    const handleExportSettings = useCallback(async () => {
        try {
            const settings: UISettings = {
                theme: uiState.theme,
                activeView: uiState.activeView,
                lastSelectedId: uiState.lastSelectedId,
                isSidebarOpen: uiState.isSidebarOpen,
                autosaveDelay: uiState.autosaveDelay,
                locale: uiState.locale,
                customTheme: uiState.customTheme,
                dashboardLayout: uiState.dashboardLayout,
                dashboardWidgets: uiState.dashboardWidgets,
            };
            const content = JSON.stringify(settings, null, 2);
            const blob = new Blob([content], { type: 'application/json' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `mythos-forge-settings.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            handleError(error, 'Settings export failed.');
        }
    }, [uiState, handleError]);

    const handleImportSettingsClick = useCallback(() => {
        settingsFileInputRef.current?.click();
    }, [settingsFileInputRef]);

    const handleSettingsFileSelected = useCallback(async (files: FileList | null) => {
        const file = files?.[0];
        if (!file) {
            if (settingsFileInputRef.current) settingsFileInputRef.current.value = '';
            return;
        }

        try {
            dispatch(pushProcessing({ message: 'Importing settings...' }));
            const content = await file.text();
            const settings = JSON.parse(content);
            
            if (typeof settings !== 'object' || settings === null || !('theme' in settings || 'activeView' in settings)) {
                throw new Error("Invalid settings file format. The file does not appear to contain valid settings.");
            }

            dispatch(applySettings(settings));
            showToast({ type: 'success', message: "Your UI settings have been successfully imported and applied." });

        } catch (error) {
            handleError(error, 'Settings import failed.');
        } finally {
            dispatch(popProcessing());
            if (settingsFileInputRef.current) settingsFileInputRef.current.value = '';
        }
    }, [dispatch, settingsFileInputRef, handleError, showToast]);

    const handleImportMarkdownClick = useCallback(() => {
        markdownInputRef.current?.click();
    }, [markdownInputRef]);

    const handleMarkdownFileSelected = useCallback(async (files: FileList | null) => {
        const file = files?.[0];
        if (!file) {
            if (markdownInputRef.current) markdownInputRef.current.value = '';
            return;
        }

        try {
            dispatch(pushProcessing({ message: 'Importing Markdown...', progress: 0 }));
            const onProgress = (progress: number) => {
                dispatch(updateProcessing({ progress }));
            };
            const newStoryBible = await importService.importProjectFromMarkdown(file, onProgress);
            dispatch(setBible(newStoryBible));
            navigateToView(ViewType.ENTITIES);
            const firstEntity = getTypedObjectValues(newStoryBible.entities)[0];
            if (firstEntity) {
                selectEntity(firstEntity.id);
            }
            showToast({ type: 'success', message: "Project imported from Markdown successfully!" });
        } catch (error) {
            handleError(error, 'Markdown import failed.');
        } finally {
            dispatch(popProcessing());
            if (markdownInputRef.current) markdownInputRef.current.value = '';
        }
    }, [dispatch, markdownInputRef, handleError, showToast, navigateToView, selectEntity]);

    const handleExportProjectAsMarkdown = useCallback(async () => {
        dispatch(pushProcessing({ message: 'Exporting Markdown...' }));
        try {
            await exportService.exportAllTextAsMarkdown(storyBible);
        } catch (error) {
            handleError(error, 'Markdown export failed.');
        } finally {
            dispatch(popProcessing());
        }
    }, [storyBible, dispatch, handleError]);


    return {
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
    };
};
