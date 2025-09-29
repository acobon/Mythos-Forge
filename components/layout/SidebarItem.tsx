import React, { useMemo } from 'react';
import { Button } from '../common/ui/Button';
import { useAppSelector } from '../../state/hooks';
import { RootState } from '../../state/store';

interface SidebarItemProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  onMouseDown?: () => void;
  tooltip?: string;
  isActive: boolean;
  isCollapsed: boolean;
  variant?: 'destructive';
}

const iconBaseClasses = "w-5 h-5 flex-shrink-0";

const SidebarItem: React.FC<SidebarItemProps> = ({ id, icon, label, onClick, onMouseDown, tooltip, isActive, isCollapsed, variant }) => {
    
    const countSelector = useMemo(() => {
        switch(id) {
            case 'timeline': return (state: RootState) => Object.keys(state.bible.present.events.worldEvents).length;
            case 'trash': return (state: RootState) => state.bible.present.project.trash.length;
            default: return () => undefined;
        }
    }, [id]);
    
    const count = useAppSelector(countSelector);

    const activeClasses = isActive ? 'bg-accent/10 text-accent font-semibold' : 'text-text-secondary hover:text-text-main hover:bg-secondary';
    const destructiveClasses = variant === 'destructive' ? '!text-red-400 hover:!bg-red-500/10 hover:!text-red-300' : '';

    const buttonContent = (
        <div className={`flex items-center w-full relative ${isCollapsed ? 'justify-center' : ''}`}>
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-accent rounded-r-full transition-transform duration-200 ${isActive ? 'scale-100' : 'scale-0'}`} />
            {React.cloneElement(icon as React.ReactElement<any>, {
                className: `${iconBaseClasses} ${isCollapsed ? '' : 'mr-3'}`,
            })}
            {!isCollapsed && (
                <>
                    <span className="truncate">{label}</span>
                    {count !== undefined && count > 0 && (
                        <span key={count} className="ml-auto text-xs font-mono bg-primary px-2 py-0.5 rounded-full animate-scale-in">
                            {count}
                        </span>
                    )}
                </>
            )}
        </div>
    );

    const button = (
        <Button 
            variant="ghost"
            onClick={onClick} 
            onMouseDown={onMouseDown}
            className={`w-full !justify-start !p-2 !font-medium !h-10 ${activeClasses} ${destructiveClasses}`}
            title={isCollapsed ? (tooltip || label) : tooltip}
        >
            {buttonContent}
        </Button>
    );

    return (
        <div className="flex items-center justify-between group">
            {button}
        </div>
    );
};

export default SidebarItem;
