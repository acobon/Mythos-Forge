import React from 'react';
import { Modal } from './ui/Modal';
import { DialogState } from '../../types/index';
import { useI18n } from '../../hooks/useI18n';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { Button } from './ui';

interface ConfirmationDialogProps extends Omit<DialogState, 'isOpen' | 'title' | 'message'> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  actions,
}) => {
  const { t } = useI18n();
  const { handleError } = useErrorHandler();
  const [isConfirming, setIsConfirming] = React.useState(false);
  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (onConfirm) {
      setIsConfirming(true);
      try {
        await onConfirm();
        onClose(); // Only close on success
      } catch (e) {
        handleError(e, 'Confirmation action failed.');
      } finally {
        setIsConfirming(false);
      }
    } else {
      onClose();
    }
  };

  const handleActionClick = async (action: NonNullable<DialogState['actions']>[0]) => {
      setIsConfirming(true);
      try {
          await action.onClick();
          onClose();
      } catch(e) {
          handleError(e, 'Dialog action failed.');
      } finally {
        setIsConfirming(false);
      }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="py-4">
        <p className="text-text-secondary whitespace-pre-wrap">{message}</p>
      </div>
      <div className="flex justify-end items-center pt-4 space-x-2">
        {actions ? (
          actions.map((action, index) => (
            <Button
              key={index}
              type="button"
              disabled={isConfirming}
              onClick={() => handleActionClick(action)}
              variant={action.variant || 'secondary'}
            >
              {isConfirming ? t('common.saving') : action.text}
            </Button>
          ))
        ) : (
          <>
            {onConfirm && (
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isConfirming}
              >
                {cancelText || t('common.cancel')}
              </Button>
            )}
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isConfirming}
              variant={onConfirm ? 'primary' : 'secondary'}
            >
              {isConfirming ? t('common.saving') : confirmText || (onConfirm ? t('common.confirm') : t('common.ok'))}
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ConfirmationDialog;