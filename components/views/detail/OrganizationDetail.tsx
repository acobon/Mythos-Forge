import React from 'react';
import { OrganizationEntity } from '../../../types';
import GenericEntityDetail from './GenericEntityDetail';
import MembersSection from './MembersSection';

interface OrganizationDetailProps {
    entity: OrganizationEntity;
}

const OrganizationDetail: React.FC<OrganizationDetailProps> = ({ entity }) => {
    return (
        <GenericEntityDetail entity={entity}>
            {({ draft, updateDraft }) => (
                <details open>
                    <summary className="text-xl font-semibold mb-2 cursor-pointer">Members</summary>
                    <MembersSection members={(draft as OrganizationEntity).members} onUpdateMembers={(m) => updateDraft('members', m)} />
                </details>
            )}
        </GenericEntityDetail>
    );
};

export default OrganizationDetail;
