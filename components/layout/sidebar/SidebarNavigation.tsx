// components/layout/sidebar/SidebarNavigation.tsx
import React from 'react';
import { useAppSelector } from '../../../state/hooks';
import { useI18n } from '../../../hooks/useI18n';
import { useNavigation } from '../../../hooks/useNavigation';
import { SidebarSectionConfig, SidebarItemConfig } from '../../../data/sidebar-config';
import { ViewType } from '../../../types';
import SidebarSection from '../SidebarSection';
import SidebarItem from '../SidebarItem';

interface SidebarNavigationProps {
    config: SidebarSectionConfig[];
    onAction: (action: { type: string; payload?: any }) => void;
    onPrefetchView: (view: ViewType) => void;
    onClose: () => void;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ config, onAction, onPrefetchView, onClose }) => {
    const { t } = useI18n();
    const { navigateToView } = useNavigation();
    const { activeView, isSidebarCollapsed } = useAppSelector(state => state.ui);

    return (
        <nav className="flex-grow p-2 space-y-4 overflow-y-auto">
            {config.map(section => (
                <SidebarSection key={section.titleKey} title={t(section.titleKey)} startCollapsed={section.startCollapsed}>
                    {section.items.map(item => (
                        <SidebarItem
                            key={item.id}
                            id={item.id}
                            icon={item.icon}
                            label={t(item.labelKey)}
                            tooltip={item.tooltipKey ? t(item.tooltipKey) : undefined}
                            onClick={() => {
                                if (item.view) {
                                    navigateToView(item.view);
                                    onClose();
                                }
                                if (item.action) {
                                    onAction(item.action);
                                }
                            }}
                            onMouseDown={item.view ? () => onPrefetchView(item.view!) : undefined}
                            isActive={item.view === activeView}
                            isCollapsed={isSidebarCollapsed}
                            variant={item.variant}
                        />
                    ))}
                </SidebarSection>
            ))}
        </nav>
    );
};

export default SidebarNavigation;
