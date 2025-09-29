
import React, { useState } from 'react';
import { Button, Input } from '../common/ui';

interface DestructiveConfirmationModalProps {
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
    message: string;
    title: string;
}

const DestructiveConfirmationModal: React.FC<DestructiveConfirmationModalProps> = ({ onClose, onConfirm, itemName, message }) => {
    const [input, setInput] = useState('');
    const canConfirm = input === itemName;

    const handleConfirm = () => {
        if (canConfirm) {
            onConfirm();
            onClose();
        }
    };

    return (
        <div className="space-y-4">
            <p className="text-text-secondary whitespace-pre-wrap">{message}</p>
            <p className="text-text-secondary">
                To confirm this action, please type{' '}
                <strong className="text-text-main font-semibold bg-primary px-1 rounded">{itemName}</strong>{' '}
                in the box below.
            </p>
            <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoFocus
                className="mt-1"
                aria-label={`Type ${itemName} to confirm deletion`}
            />
            <div className="flex justify-end pt-2 space-x-2">
                <Button variant="ghost" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    variant="destructive"
                    onClick={handleConfirm}
                    disabled={!canConfirm}
                >
                    Delete this item
                </Button>
            </div>
        </div>
    );
};

export default DestructiveConfirmationModal;
