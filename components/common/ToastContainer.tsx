import React from 'react';
import { Z_INDEX } from '../../constants';
import { Toast } from './Toast';
import { useAppSelector } from '../../state/hooks';

export const ToastContainer: React.FC = () => {
    const toasts = useAppSelector(state => state.ui.toasts);

    return (
        <div
            className="fixed top-4 right-4 z-50 space-y-2"
            style={{ zIndex: Z_INDEX.PROCESSING_OVERLAY + 1 }}
            aria-live="assertive"
        >
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} />
            ))}
        </div>
    );
};
