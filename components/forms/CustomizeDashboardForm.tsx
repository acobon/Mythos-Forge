import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { useI18n } from '../../hooks/useI18n';
import { Button } from '../common/ui';
import { setDashboardWidgets } from '../../state/uiSlice';

const WIDGET_KEYS = ['stats', 'actions', 'writingGoals', 'recentlyEdited', 'scratchpad', 'gettingStarted'];

const CustomizeDashboardForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const dispatch = useAppDispatch();
    const { dashboardWidgets } = useAppSelector(state => state.ui);
    const { t } = useI18n();
    const [widgets, setWidgets] = useState<Record<string, boolean>>(dashboardWidgets);

    const handleToggle = (widgetId: string) => {
        setWidgets(prev => ({
            ...prev,
            [widgetId]: !prev[widgetId]
        }));
    };

    const handleSave = () => {
        dispatch(setDashboardWidgets(widgets));
        onClose();
    };

    return (
        <div className="space-y-4">
            <p className="text-text-secondary">{t('dashboard.customize.description')}</p>
            <div className="space-y-2">
                {WIDGET_KEYS.map(widgetId => (
                    <div key={widgetId} className="flex items-center justify-between p-2 bg-primary rounded-md">
                        <label htmlFor={`widget-toggle-${widgetId}`} className="text-text-main font-medium">
                            {t(`dashboard.widgets.${widgetId}` as any)}
                        </label>
                        <input
                            type="checkbox"
                            id={`widget-toggle-${widgetId}`}
                            checked={widgets[widgetId] ?? false}
                            onChange={() => handleToggle(widgetId)}
                            className="h-5 w-5 rounded border-gray-300 text-accent focus:ring-accent"
                        />
                    </div>
                ))}
            </div>
            <div className="flex justify-end items-center pt-4">
                <Button type="button" variant="ghost" onClick={onClose}>
                    {t('common.cancel')}
                </Button>
                <Button type="button" onClick={handleSave} className="ml-2">
                    {t('common.save')}
                </Button>
            </div>
        </div>
    );
};

export default CustomizeDashboardForm;