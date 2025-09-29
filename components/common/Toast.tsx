import React, { useEffect, useState } from 'react';
import { ToastMessage } from '../../types';
import { CheckIcon, XIcon, HelpCircleIcon } from './Icons';
import { useAppDispatch } from '../../state/hooks';
import { removeToast } from '../../state/uiSlice';

const icons = {
    success: <CheckIcon className="w-5 h-5 text-green-400" />,
    error: <XIcon className="w-5 h-5 text-red-400" />,
    info: <HelpCircleIcon className="w-5 h-5 text-blue-400" />,
};

const bgColors = {
    success: 'bg-green-500/20 border-green-500/50',
    error: 'bg-red-500/20 border-red-500/50',
    info: 'bg-blue-500/20 border-blue-500/50',
};

export const Toast: React.FC<{ toast: ToastMessage }> = ({ toast }) => {
    const dispatch = useAppDispatch();
    const { id, message, type, duration = 5000 } = toast;
    const [isHiding, setIsHiding] = useState(false);

    const handleClose = React.useCallback(() => {
        setIsHiding(true);
        setTimeout(() => {
            dispatch(removeToast(id));
        }, 300); // Corresponds to transition duration in styles.css
    }, [dispatch, id]);

    useEffect(() => {
        const timer = setTimeout(handleClose, duration);
        return () => clearTimeout(timer);
    }, [id, duration, handleClose]);

    return (
        <div className={`toast-wrapper ${isHiding ? 'hiding' : ''}`}>
            <div
                role="alert"
                className={`flex items-start p-4 w-80 max-w-sm rounded-lg shadow-lg border ${bgColors[type]} animate-fade-in`}
            >
                <div className="flex-shrink-0">{icons[type]}</div>
                <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-text-main">{message}</p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                    <button
                        onClick={handleClose}
                        className="inline-flex rounded-md text-text-secondary hover:text-text-main focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
                        aria-label="Close notification"
                    >
                        <span className="sr-only">Close</span>
                        <XIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};