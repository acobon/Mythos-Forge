import React from 'react';
import { Modal } from './ui/Modal';
import ValidationReportModal from '../ValidationReportModal';
import CommandPalette from '../CommandPalette';
import { modalRegistry } from '../modals/modalRegistry';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { popModal, closeValidationModal, toggleCommandPalette } from '../../state/uiSlice';
import { RootState } from '../../state/store';
import { ModalType, StoryBible } from '../../types';
import { selectFullStoryBible } from '../../state/selectors';

export const GlobalModals: React.FC = () => {
    const dispatch = useAppDispatch();
    const storyBible = useAppSelector(selectFullStoryBible) as StoryBible;
    const { modalStack, isValidationModalOpen, validationIssues, isCommandPaletteOpen, selectedId } = useAppSelector((state: RootState) => state.ui);
    const selectedEntity = useAppSelector((state: RootState) => 
        selectedId ? state.bible.present.entities.entities[selectedId] : undefined
    );

    const topModal = modalStack.length > 0 ? modalStack[modalStack.length - 1] : { type: null, props: {} };

    const modalConfig = topModal.type ? modalRegistry[topModal.type as keyof typeof modalRegistry] : null;

    const handleClose = () => dispatch(popModal());
    
    const ModalComponent = modalConfig?.component;
    const modalProps = modalConfig?.prepareProps ? modalConfig.prepareProps(topModal.props as any, storyBible, selectedEntity) : topModal.props;
    const modalTitle = modalConfig?.title ? modalConfig.title(topModal.props as any, storyBible, selectedEntity) : '';
    const modalSize = modalConfig?.size;

    return (
        <>
            <ValidationReportModal
                isOpen={isValidationModalOpen}
                onClose={() => dispatch(closeValidationModal())}
                inconsistencies={validationIssues}
            />

            <CommandPalette
                isOpen={isCommandPaletteOpen}
                onClose={() => dispatch(toggleCommandPalette())}
            />
            
            {ModalComponent && (
                <Modal
                    isOpen={!!topModal.type}
                    onClose={handleClose}
                    title={modalTitle}
                    size={modalSize}
                >
                    <ModalComponent {...(modalProps as any)} onClose={handleClose} />
                </Modal>
            )}
        </>
    );
};
