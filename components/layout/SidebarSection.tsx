import React, { useState } from 'react';
import { ChevronsRightIcon } from '../common/Icons';

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  startCollapsed?: boolean;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({ title, children, startCollapsed }) => {
    const [isCollapsed, setIsCollapsed] = useState(startCollapsed || false);

    return (
        <div>
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-full flex items-center justify-between px-3 py-1 text-left"
                aria-expanded={!isCollapsed}
            >
                <h3 className="text-xs font-semibold uppercase text-text-secondary tracking-wider">{title}</h3>
                <ChevronsRightIcon className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${!isCollapsed ? 'rotate-90' : ''}`} />
            </button>
            {!isCollapsed && (
                <div className="mt-2 space-y-1 animate-fade-in">{children}</div>
            )}
        </div>
    );
};

export default SidebarSection;
