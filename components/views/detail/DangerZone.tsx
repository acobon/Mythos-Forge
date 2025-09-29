import React from 'react';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import { Button } from '../../common/ui';

interface DangerZoneProps {
    title: string;
    description: string;
    actionButtonText: string;
    onAction: () => void;
}

const DangerZone: React.FC<DangerZoneProps> = ({
    title,
    description,
    actionButtonText,
    onAction
}) => {
    return (
        <section>
            <h3 className="text-xl font-semibold mb-2 text-red-400">{title}</h3>
            <div className="bg-secondary p-4 rounded-md border border-red-500/50">
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-text-main">{actionButtonText}</h4>
                        <p className="text-sm text-text-secondary mt-1">{description}</p>
                    </div>
                    <Button onClick={onAction} variant="destructive">
                        {actionButtonText}
                    </Button>
                </div>
            </div>
        </section>
    );
};

export default DangerZone;