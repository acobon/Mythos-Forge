
import React, { ReactNode, useRef, useEffect } from 'react';
import FocusTrap from 'focus-trap-react';
import { XIcon } from '../Icons';
import { Z_INDEX } from '../../../constants';
import { useI18n } from '../../../hooks/useI18n';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'auto';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (isOpen) {
      triggerElementRef.current = document.activeElement as HTMLElement;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onClose();
        }
    };

    if (isOpen) {
        document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen && triggerElementRef.current) {
        triggerElementRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    auto: 'w-fit'
  };
  
  return (
    <FocusTrap
      active={isOpen}
      focusTrapOptions={{
        onDeactivate: onClose,
        initialFocus: () => modalRef.current,
        clickOutsideDeactivates: true,
      }}
    >
      <div 
        className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center animate-fade-in"
        style={{ zIndex: Z_INDEX.MODAL }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div 
          ref={modalRef}
          tabIndex={-1}
          className={`bg-secondary rounded-lg shadow-2xl p-6 m-4 border border-border-color transform focus:outline-none animate-scale-in ${size === 'auto' ? '' : 'w-full'} ${sizeClasses[size]}`}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 id="modal-title" className="text-2xl font-bold text-text-main">{title}</h2>
            <Button 
              variant="ghost"
              size="icon"
              onClick={onClose} 
              aria-label={t('modal.close', { title: title })}
            >
              <XIcon className="w-6 h-6" />
            </Button>
          </div>
          <div id="modal-content">{children}</div>
        </div>
      </div>
    </FocusTrap>
  );
};
