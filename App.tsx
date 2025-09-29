

// App.tsx
import React, { useMemo, useCallback, useEffect, lazy, Suspense, useState, useRef } from 'react';
import FocusTrap from 'focus-trap-react';
import { ViewType } from './types/index';
import Sidebar from './components/layout/Sidebar';
import AppLayout from './components/layout/AppLayout';
import ConfirmationDialog from './components/common/ConfirmationDialog';
import OnboardingTutorial from './components/OnboardingTutorial';
import ErrorBoundary from './components/common/ErrorBoundary';
import { GlobalModals } from './components/common/GlobalModals';
import { useRouting } from './hooks/useRouting';
import { useGlobalKeyListener } from './hooks/useGlobalKeyListener';
import { Z_INDEX } from './constants';
import { Spinner } from './components/common/Spinner';
import { useI18n } from './hooks/useI18n';
import EntityViewSkeleton from './components/views/EntityViewSkeleton';
import { ToastContainer } from './components/common/ToastContainer';
import { useAppDispatch, useAppSelector } from './state/hooks';
import { loadInitialData } from './state/actions';
import { hideDialog, startOnboarding, toggleCommandPalette } from './state/uiSlice';
import { store } from './state/store';
import { selectHasUnsavedChanges } from './state/selectors';

// --- LAZY-LOADED COMPONENTS ---
const viewMap: Record<ViewType, () => Promise<{ default: React.ComponentType<any> }>> = {
    [ViewType.DASHBOARD]: () => import('./components/views/DashboardView'),
    [ViewType.ENTITIES]: () => import('./components/views/EntityView'),
    [ViewType.WORKS_ORGANIZER]: () => import('./components/views/WorksOrganizerView'),
    [ViewType.MAP]: () => import('./components/views/MapView'),
    // FIX: Corrected import path casing to match the file system.
    [ViewType.MIND_MAP]: () => import('./components/views/MindMapView'),
    [ViewType.MANUSCRIPT]: () => import('./components/views/ManuscriptView'),
    [ViewType.PLOTTING]: () => import('./components/views/PlottingView'),
    [ViewType.TIMELINE]: () => import('./components/views/WorldTimelineView'),
    [ViewType.RELATIONSHIPS]: () => import('./components/views/RelationshipView'),
    [ViewType.QUERY]: () => import('./components/views/QueryView'),
    [ViewType.REPORTS]: () => import('./components/views/ReportsView'),
    [ViewType.TAGS]: () => import('./components/views/TagManagerView'),
    [ViewType.EVENT_EDITOR]: () => import('./components/views/EventEditorView'),
    [ViewType.TEMPLATE_EDITOR]: () => import('./components/views/TemplateEditorView'),
    [ViewType.STORY_STRUCTURE_EDITOR]: () => import('./components/views/StoryStructureEditorView'),
    [ViewType.ENTITY_TYPE_SETTINGS]: () => import('./components/views/EntityTypeSettingsView'),
    [ViewType.PROMPT_EDITOR]: () => import('./components/views/PromptEditorView'),
    [ViewType.ROLES]: () => import('./components/views/RoleSettingsView'),
    [ViewType.RELATIONSHIP_TYPE_SETTINGS]: () => import('./components/views/RelationshipTypeSettingsView'),
    [ViewType.CALENDAR]: () => import('./components/views/CalendarSettingsView'),
    [ViewType.SNAPSHOTS]: () => import('./components/views/SnapshotView'),
    [ViewType.THEME_SETTINGS]: () => import('./components/views/ThemeSettingsView'),
    [ViewType.WRITING_ANALYTICS]: () => import('./components/views/WritingAnalyticsView'),
    [ViewType.RESEARCH]: () => import('./components/views/ResearchView'),
    [ViewType.THEMES]: () => import('./components/views/ThemeManagerView'),
    [ViewType.CONFLICTS]: () => import('./components/views/ConflictManagerView'),
    [ViewType.MAINTENANCE]: () => import('./components/views/MaintenanceView'),
    [ViewType.NARRATIVE_ANALYSIS]: () => import('./components/views/NarrativeAnalysisView'),
    [ViewType.TRASH]: () => import('./components/views/TrashView'),
    [ViewType.ASSET_MANAGER]: () => import('./components/views/AssetManagerView'),
    [ViewType.DICTIONARY]: () => import('./components/views/DictionaryView'),
    [ViewType.HELP]: () => import('./components/views/HelpView'),
};

const LazyLoadedView: React.FC<{ view: ViewType }> = ({ view }) => {
    const Component = useMemo(() => {
        const importFn = viewMap[view] || viewMap[ViewType.DASHBOARD];
        return lazy(importFn);
    }, [view]);

    return <Component />;
};

const SKELETONS: Partial<Record<ViewType, React.FC>> = {
    [ViewType.ENTITIES]: EntityViewSkeleton,
};

// --- FALLBACK SPINNER ---
const MainContentSpinner: React.FC = () => {
    const activeView = useAppSelector(state => state.ui.activeView);
    const { t } = useI18n();

    const Skeleton = SKELETONS[activeView];
    if (Skeleton) {
        return <Skeleton />;
    }

    return (
        <div className="w-full h-full flex justify-center items-center bg-primary">
            <div className="bg-secondary p-6 rounded-lg flex items-center space-x-4 border border-border-color">
                <Spinner size="md" />
                <span className="text-lg font-semibold text-text-main">{t('app.loading')}</span>
            </div>
        </div>
    );
};

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(true);
    const [isHidingLoader, setIsHidingLoader] = useState(false);
    const loaderRef = useRef<HTMLDivElement>(null);
    const { entities } = useAppSelector(state => state.bible.present.entities);
    const { processingStack, onboardingStatus, dialogState, activeView } = useAppSelector(state => state.ui);

    useEffect(() => {
        dispatch(loadInitialData()).finally(() => {
            setIsHidingLoader(true);
        });
    }, [dispatch]);

    // Robust loader hiding logic using transition events and a fallback timer
    useEffect(() => {
        const loaderElement = loaderRef.current;
        if (isHidingLoader && loaderElement) {
            let handled = false;
            const handleTransitionEnd = () => {
                if (handled) return;
                handled = true;
                setIsLoading(false);
            };

            loaderElement.addEventListener('transitionend', handleTransitionEnd);
            
            // Fallback timer to ensure the app loads even if the transitionend event doesn't fire.
            const fallbackTimeout = setTimeout(handleTransitionEnd, 500); // 500ms > 300ms transition

            return () => {
                loaderElement.removeEventListener('transitionend', handleTransitionEnd);
                clearTimeout(fallbackTimeout);
            };
        }
    }, [isHidingLoader]);


    // Data Loss Prevention Listener
    useEffect(() => {
        const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
            if (selectHasUnsavedChanges(store.getState())) {
                event.preventDefault();
                event.returnValue = ''; // Required for Chrome compatibility
            }
        };
        window.addEventListener('beforeunload', beforeUnloadHandler);
        return () => {
            window.removeEventListener('beforeunload', beforeUnloadHandler);
        };
    }, []);

    const prefetchView = useCallback((view: ViewType) => {
        const importFn = viewMap[view];
        if (importFn) {
            importFn();
        }
    }, []);

    useRouting();
    useGlobalKeyListener('k', () => dispatch(toggleCommandPalette()), { ctrl: true, meta: true });

    useEffect(() => {
        // Start onboarding for new users on a fresh project
        if (!isLoading && onboardingStatus === 'pending' && Object.keys(entities).length === 0) {
            dispatch(startOnboarding());
        }
    }, [isLoading, onboardingStatus, entities, dispatch]);

    const currentProcessing = processingStack.length > 0 ? processingStack[processingStack.length - 1] : null;

    if (isLoading) {
        return (
            <div ref={loaderRef} className={`initial-loader ${isHidingLoader ? 'fade-out' : ''}`}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <>
            <ToastContainer />
            {onboardingStatus === 'active' && <OnboardingTutorial />}

            <AppLayout sidebar={<Sidebar prefetchView={prefetchView} />}>
                <ErrorBoundary>
                    <Suspense fallback={<MainContentSpinner />}>
                        <LazyLoadedView view={activeView} />
                    </Suspense>
                </ErrorBoundary>
            </AppLayout>

            {currentProcessing && (
                <FocusTrap active={!!currentProcessing}>
                    <div
                        className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center"
                        style={{ zIndex: Z_INDEX.PROCESSING_OVERLAY }}
                        role="alert"
                        aria-live="assertive"
                        aria-label={currentProcessing.message}
                    >
                        <div className="bg-secondary p-6 rounded-lg border border-border-color w-80" tabIndex={-1}>
                            <div className="flex items-center space-x-4 mb-3">
                                <Spinner size="md" />
                                <span className="text-lg font-semibold text-text-main">{currentProcessing.message}</span>
                            </div>
                            {typeof currentProcessing.progress === 'number' && (
                                <div className="w-full bg-primary rounded-full h-2.5 border border-border-color">
                                    <div
                                        className="bg-accent h-2 rounded-full"
                                        style={{ width: `${currentProcessing.progress}%` }}
                                    ></div>
                                </div>
                            )}
                        </div>
                    </div>
                </FocusTrap>
            )}

            <GlobalModals />

            <ConfirmationDialog
                isOpen={dialogState.isOpen}
                onClose={() => dispatch(hideDialog())}
                onConfirm={dialogState.onConfirm}
                title={dialogState.title}
                message={dialogState.message}
                confirmText={dialogState.confirmText || (dialogState.onConfirm ? 'Confirm' : 'OK')}
                cancelText={dialogState.onConfirm ? dialogState.cancelText || 'Cancel' : undefined}
                actions={dialogState.actions}
            />
        </>
    );
};

export default App;