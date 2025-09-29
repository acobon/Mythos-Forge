// components/views/detail/EntityDetailDispatcher.tsx
import React from 'react';
import { Entity, EntityType, CharacterEntity, LocationEntity, ObjectEntity, OrganizationEntity } from '../../../types';
import CharacterDetail from './CharacterDetail';
import LocationDetail from './LocationDetail';
import ObjectDetail from './ObjectDetail';
import OrganizationDetail from './OrganizationDetail';
import GenericEntityDetail from './GenericEntityDetail';

export const EntityDetailDispatcher: React.FC<{ entity: Entity }> = ({ entity }) => {
    switch (entity.type) {
        case EntityType.CHARACTER:
            return <CharacterDetail entity={entity as CharacterEntity} />;
        case EntityType.LOCATION:
            return <LocationDetail entity={entity as LocationEntity} />;
        case EntityType.OBJECT:
            return <ObjectDetail entity={entity as ObjectEntity} />;
        case EntityType.ORGANIZATION:
            return <OrganizationDetail entity={entity as OrganizationEntity} />;
        default:
            return <GenericEntityDetail entity={entity} />;
    }
};