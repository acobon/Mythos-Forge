// components/views/detail/MembersSection.tsx
import React, { useState, useMemo } from 'react';
import { Member, Entity, EntityId, EntityType } from '../../../types';
import { useAppSelector } from '../../../state/hooks';
import { getTypedObjectValues } from '../../../utils';
import { useNavigation } from '../../../hooks/useNavigation';
import { useI18n } from '../../../hooks/useI18n';
import { PlusCircleIcon, TrashIcon } from '../../common/Icons';

interface MembersSectionProps {
    members: Member[] | undefined;
    onUpdateMembers: (newMembers: Member[]) => void;
}

const MembersSection: React.FC<MembersSectionProps> = ({ members = [], onUpdateMembers }) => {
    const { t } = useI18n();
    const { entities } = useAppSelector(state => state.bible.present.entities);
    const { navigateToEntity } = useNavigation();
    
    const characters = useMemo(() => {
        return (getTypedObjectValues(entities) as Entity[]).filter(e => e.type === EntityType.CHARACTER);
    }, [entities]);

    const handleAddMember = () => {
        onUpdateMembers([...members, { entityId: '', role: '' }]);
    };
    
    const handleUpdateMember = (index: number, field: 'entityId' | 'role', value: string) => {
        const newMembers = [...members];
        newMembers[index] = { ...newMembers[index], [field]: value };
        onUpdateMembers(newMembers);
    };

    const handleRemoveMember = (index: number) => {
        onUpdateMembers(members.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-secondary p-4 mt-2 rounded-md border border-border-color space-y-3">
            {members.length > 0 ? (
                members.map((member, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-primary p-2 rounded-md">
                        <div>
                            <label className="text-xs text-text-secondary">{t('orgDetail.members.character')}</label>
                            <select value={member.entityId} onChange={e => handleUpdateMember(index, 'entityId', e.target.value)}
                                    className="w-full bg-secondary border border-border-color rounded-md p-1.5 text-sm mt-1">
                                <option value="">{t('orgDetail.members.selectChar')}</option>
                                {characters.map(char => <option key={char.id} value={char.id}>{char.name}</option>)}
                            </select>
                        </div>
                         <div className="flex items-end gap-2">
                             <div className="flex-grow">
                                <label className="text-xs text-text-secondary">{t('orgDetail.members.role')}</label>
                                <input type="text" value={member.role} onChange={e => handleUpdateMember(index, 'role', e.target.value)}
                                       placeholder={t('orgDetail.members.rolePlaceholder')}
                                       className="w-full bg-secondary border border-border-color rounded-md p-1.5 text-sm mt-1" />
                             </div>
                             <button onClick={() => handleRemoveMember(index)} className="p-2 text-text-secondary hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                         </div>
                    </div>
                ))
            ) : (
                <p className="text-text-secondary italic">{t('orgDetail.members.empty')}</p>
            )}
            <button onClick={handleAddMember} className="flex items-center text-sm text-accent hover:text-highlight font-semibold pt-2">
                <PlusCircleIcon className="w-5 h-5 mr-2" /> Add Member
            </button>
        </div>
    );
};

export default MembersSection;
