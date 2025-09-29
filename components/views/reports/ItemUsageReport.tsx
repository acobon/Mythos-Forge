// components/views/reports/ItemUsageReport.tsx
import React from 'react';
import { ItemUsage } from '../../../types';
import { useI18n } from '../../../hooks/useI18n';
import { useNavigation } from '../../../hooks/useNavigation';
import { Button } from '../../common/ui';

interface ItemUsageReportProps {
    data: ItemUsage[];
    itemName: string;
    onClose?: () => void;
    isModal?: boolean;
}

const ItemUsageReport: React.FC<ItemUsageReportProps> = ({ data, itemName, onClose, isModal }) => {
    const { t } = useI18n();
    const { navigateToEntity, navigateToScene } = useNavigation();

    const handleNavigate = (usageItem: ItemUsage) => {
        if (usageItem.type === 'Scene' && usageItem.workId) {
            navigateToScene(usageItem.workId, usageItem.id);
        } else {
            navigateToEntity(usageItem.id);
        }
        onClose?.();
    };

    return (
        <div className={isModal ? '' : 'h-full'}>
            {!isModal && (
                <>
                    <h4 className="text-lg font-bold mb-2">{t('reports.itemUsage.title', { name: itemName })}</h4>
                    <p className="text-sm text-text-secondary mb-4">A list of all items associated with this tag, theme, or conflict.</p>
                </>
            )}
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {data.length > 0 ? (
                    data.map((usageItem, index) => (
                        <button key={index} onClick={() => handleNavigate(usageItem)} className="w-full text-left p-2 bg-primary rounded-md hover:bg-border-color">
                            <p className="font-semibold">{usageItem.name}</p>
                            <p className="text-xs text-text-secondary">{usageItem.location} ({usageItem.type})</p>
                        </button>
                    ))
                ) : (
                    <p className="text-text-secondary italic">This item is not currently used anywhere.</p>
                )}
            </div>
        </div>
    );
};

export default ItemUsageReport;