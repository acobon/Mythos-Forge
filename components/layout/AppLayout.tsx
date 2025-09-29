import React, { useCallback, useRef, useEffect, useState } from 'react';
import { ArrowLeftIcon, MenuIcon } from '../common/Icons';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { setSidebarOpen, setSelectedId, setSelectedNoteId } from '../../state/uiSlice';
import { setSelectedWorkId, setSelectedSceneId } from '../../state/slices/narrativeSlice';
import GlobalSaveStatusIndicator from './GlobalSaveStatusIndicator';

interface AppLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ sidebar, children }) => {
  const dispatch = useAppDispatch();
  const title = useAppSelector(state => state.bible.present.project.title);
  const { isSidebarOpen, activeView, selectedId, selectedNoteId, distractionFreeMode } = useAppSelector(state => state.ui);
  const { selectedWorkId, selectedSceneId } = useAppSelector(state => state.bible.present.narrative);

  const sidebarRef = useRef<HTMLDivElement>(null);

  const showBackButtonOnMobile = (activeView === 'entities' && selectedId) || (activeView === 'research' && selectedNoteId) || (activeView === 'manuscript' && selectedSceneId);

  const handleBackClick = () => {
    if (activeView === 'entities') {
      dispatch(setSelectedId(null));
    } else if (activeView === 'research') {
        dispatch(setSelectedNoteId(null)); 
    } else if (activeView === 'manuscript') {
        dispatch(setSelectedSceneId(null));
    }
  };

  const mobileHeaderButton = showBackButtonOnMobile ? (
    <button onClick={handleBackClick} className="p-2 text-text-secondary hover:text-text-main" aria-label="Back to list">
      <ArrowLeftIcon className="w-6 h-6" />
    </button>
  ) : (
    <button onClick={() => dispatch(setSidebarOpen(true))} className="p-2 text-text-secondary hover:text-text-main" aria-label="Open menu">
      <MenuIcon className="w-6 h-6" />
    </button>
  );

  if (distractionFreeMode) {
    return (
      <div className="w-screen h-screen">
        {children}
        <GlobalSaveStatusIndicator />
      </div>
    );
  }

  return (
    <div className="relative md:flex h-screen bg-primary text-text-main font-sans overflow-hidden">
      <div 
        ref={sidebarRef} 
        className="hidden md:flex relative flex-shrink-0"
      >
          {sidebar}
      </div>

      {/* Mobile Sidebar */}
      <div className={`md:hidden fixed top-0 left-0 h-full transform transition-transform duration-300 ease-in-out z-40 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ width: '288px' }}>
          {sidebar}
      </div>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => dispatch(setSidebarOpen(false))}
          aria-hidden="true"
        />
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-2 bg-secondary border-b border-border-color flex-shrink-0">
          {mobileHeaderButton}
          <h1 className="text-lg font-bold truncate px-2">{title}</h1>
          <div className="w-10"></div> {/* Spacer to balance the button */}
        </header>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>
      <GlobalSaveStatusIndicator />
    </div>
  );
};

export default AppLayout;