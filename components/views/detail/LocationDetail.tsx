import React from 'react';
import { LocationEntity } from '../../../types';
import GenericEntityDetail from './GenericEntityDetail';
import MapPosition from './MapPosition';

interface LocationDetailProps {
    entity: LocationEntity;
}

const LocationDetail: React.FC<LocationDetailProps> = ({ entity }) => {
    return (
        <GenericEntityDetail entity={entity}>
            {() => (
                <details open>
                    <summary className="text-xl font-semibold mb-2 cursor-pointer">Map Position</summary>
                    <MapPosition entity={entity} />
                </details>
            )}
        </GenericEntityDetail>
    );
};

export default LocationDetail;
