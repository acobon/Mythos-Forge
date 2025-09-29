import React from 'react';
import { ObjectEntity } from '../../../types';
import GenericEntityDetail from './GenericEntityDetail';
import ObjectHistory from './ObjectHistory';

interface ObjectDetailProps {
    entity: ObjectEntity;
}

const ObjectDetail: React.FC<ObjectDetailProps> = ({ entity }) => {
    return (
        <GenericEntityDetail entity={entity}>
            {() => (
                <details open>
                    <summary className="text-xl font-semibold mb-2 cursor-pointer">Object History</summary>
                    <ObjectHistory entity={entity} />
                </details>
            )}
        </GenericEntityDetail>
    );
};

export default ObjectDetail;
