import React from 'react';
import { Modal } from './common/ui/Modal';
import { Inconsistency, EntityId } from '../types/index';
import { UserIcon, CalendarIcon } from './common/Icons';
import { useI18n } from '../hooks/useI18n';
import { useNavigation } from '../hooks/useNavigation';

interface ValidationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  inconsistencies: Inconsistency[];
}

const ValidationReportModal: React.FC<ValidationReportModalProps> = ({ isOpen, onClose, inconsistencies }) => {
    const { t } = useI18n();
    const { navigateToEntity } = useNavigation();
    
    const groupedIssues = inconsistencies.reduce((acc, issue) => {
        if (!acc[issue.type]) {
            acc[issue.type] = [];
        }
        acc[issue.type].push(issue);
        return acc;
    }, {} as Record<Inconsistency['type'], Inconsistency[]>);

    const handleNavigate = (issue: Inconsistency) => {
        if (issue.entityId && issue.eventId) {
            navigateToEntity(issue.entityId, { source: 'validation', highlightEventId: issue.eventId });
        }
    };

    const getIcon = (type: Inconsistency['type']) => {
        switch(type) {
            case 'Post-Mortem Event':
            case 'Pre-Birth Event':
                return <UserIcon className="w-5 h-5 text-accent"/>;
            case 'Invalid Event Dates':
                return <CalendarIcon className="w-5 h-5 text-accent"/>
            default:
                return <UserIcon className="w-5 h-5 text-accent"/>;
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('validationModal.title')} size="lg">
            <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-6">
                {inconsistencies.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-lg text-green-400 font-semibold">{t('validationModal.noIssues')}</p>
                        <p className="text-text-secondary mt-2">{t('validationModal.noIssues.subtitle')}</p>
                    </div>
                ) : (
                    Object.entries(groupedIssues).map(([type, issues]: [string, Inconsistency[]]) => (
                        <div key={type}>
                            <h3 className="text-xl font-semibold text-text-main mb-3 border-b border-border-color pb-2">{type} ({issues.length})</h3>
                            <ul className="space-y-2">
                                {issues.map((issue, index) => (
                                    <li key={index}>
                                        <button 
                                            onClick={() => handleNavigate(issue)}
                                            disabled={!issue.entityId}
                                            className="w-full text-left p-3 bg-primary rounded-md hover:bg-border-color transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0 mt-1">{getIcon(issue.type)}</div>
                                                <div>
                                                    <p className="font-semibold text-text-main">{issue.entityName}</p>
                                                    <p className="text-sm text-text-secondary">{t(issue.messageKey, issue.messageParams)}</p>
                                                </div>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                )}
            </div>
        </Modal>
    );
};

export default ValidationReportModal;