// components/views/dashboard/GettingStartedWidget.tsx
import React from 'react';
import { useI18n } from '../../../hooks/useI18n';
import { useAppDispatch } from '../../../state/hooks';
import { setView, pushModal, popModal } from '../../../state/uiSlice';
import { useEntityActions } from '../../../hooks/useEntityActions';
import { EntityType, ModalType, Work, ViewType } from '../../../types/index';
import { useWorkActions } from '../../../hooks/useWorkActions';
import { Button } from '../../common/ui';

const GettingStartedWidget: React.FC = () => {
    const { t } = useI18n();
    const dispatch = useAppDispatch();
    const { addNewEntity } = useEntityActions();
    const { saveWork } = useWorkActions();

    const handleCreateWork = () => {
        const onSave = (data: Partial<Work> & { title: string }, isEditing: boolean) => {
            saveWork(data, isEditing);
            dispatch(popModal());
            dispatch(setView(ViewType.WORKS_ORGANIZER));
        };
        dispatch(pushModal({ type: ModalType.WORK, props: { onSave } }));
    };

    return (
        <section>
            <h3 className="text-xl font-semibold text-text-secondary mb-3">Getting Started</h3>
            <div className="bg-secondary p-4 rounded-lg border border-border-color space-y-2">
                <p className="text-sm text-text-secondary mb-3">Welcome! Here are a few steps to get your project up and running:</p>
                <div className="flex items-center justify-between p-2 bg-primary rounded-md">
                    <span>1. Create your protagonist</span>
                    <Button size="sm" onClick={() => addNewEntity(EntityType.CHARACTER)}>Create Character</Button>
                </div>
                <div className="flex items-center justify-between p-2 bg-primary rounded-md">
                    <span>2. Build your first location</span>
                    <Button size="sm" onClick={() => addNewEntity(EntityType.LOCATION)}>Create Location</Button>
                </div>
                <div className="flex items-center justify-between p-2 bg-primary rounded-md">
                    <span>3. Start your first manuscript</span>
                    <Button size="sm" onClick={handleCreateWork}>Create Work</Button>
                </div>
            </div>
        </section>
    );
};

export default GettingStartedWidget;