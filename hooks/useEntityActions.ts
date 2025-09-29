// hooks/useEntityActions.ts
import { useCallback } from 'react';
import { Entity, EntityId, CharacterEntity, LocationEntity, ObjectEntity, OrganizationEntity, BaseEntity, EntityType, TrashedItem } from '../types/index';
import { generateId, getTypedObjectValues } from '../utils';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { addEntity as addEntityAction, updateEntity as updateEntityAction } from '../state/slices/entitiesSlice';
import { setSelectedId } from '../state/uiSlice';
import { useToast } from './useToast';
import * as idbService from '../services/idbService';
import { removeItem } from '../state/actions';

export const useEntityActions = () => {
    const dispatch = useAppDispatch();
    const storyBible = useAppSelector(state => state.bible.present);
    const selectedId = useAppSelector(state => state.ui.selectedId);
    const { showToast } = useToast();

    const createNewEntityObject = useCallback((
        name: string,
        description: string,
        type: string,
        templateId?: string,
        details?: Record<string, any>
    ): Entity => {
        const typePrefix = type.substring(0, 4).toLowerCase();
        const baseData: Partial<Entity> = {
          id: generateId(typePrefix),
          name,
          description,
          lastModified: new Date().toISOString(),
          templateId: templateId || undefined,
          details: details || {},
        };
        
        switch (type) {
          case 'character':
            return { ...baseData, type: 'character', prompts: {} } as CharacterEntity;
          case 'location':
            return { ...baseData, type: 'location' } as LocationEntity;
          case 'object':
            return { ...baseData, type: 'object' } as ObjectEntity;
          case 'organization':
            return { ...baseData, type: 'organization' } as OrganizationEntity;
          default: {
            return { ...baseData, type } as BaseEntity as Entity;
          }
        }
    }, []);

    const addNewEntity = useCallback((type: string) => {
        const entitiesOfType = (getTypedObjectValues(storyBible.entities.entities) as Entity[]).filter(e => e.type === type);
        const entityTypeDefinition = storyBible.entities.entityTypes.find(et => et.key === type);
        const baseName = entityTypeDefinition ? `New ${entityTypeDefinition.name}` : 'New Entity';

        let newName = baseName;
        let counter = 1;
        
        const isNameTaken = (name: string) => entitiesOfType.some(e => e.name.trim().toLowerCase() === name.trim().toLowerCase());

        while (isNameTaken(newName)) {
            newName = `${baseName} ${counter}`;
            counter++;
        }
        
        const newEntity = createNewEntityObject(newName, '', type);
        dispatch(addEntityAction(newEntity));
        dispatch(setSelectedId(newEntity.id));
    }, [createNewEntityObject, storyBible.entities, dispatch]);

    const addEntity = useCallback((entity: Entity) => {
        dispatch(addEntityAction(entity));
    }, [dispatch]);

    const updateEntity = useCallback(async (entityId: EntityId, updates: Partial<Entity>) => {
        dispatch(updateEntityAction({ entityId, updates }));
    }, [dispatch]);

    const deleteEntity = useCallback((entityId: EntityId) => {
        const entityToDelete = storyBible.entities.entities[entityId];
        if (!entityToDelete) return;

        dispatch(removeItem({ item: entityToDelete, itemType: 'Entity', deletedAt: new Date().toISOString() }));
        
        if (selectedId === entityId) {
            // Find next entity to select after deletion
            const allEntities = getTypedObjectValues(storyBible.entities.entities) as Entity[];
            const remainingEntities = allEntities.filter(e => e.id !== entityId);
            const sortedEntities = [...remainingEntities].sort((a, b) => a.name.localeCompare(b.name));
            const currentIndex = sortedEntities.findIndex(e => e.name.localeCompare(entityToDelete.name) > 0);
            
            let nextSelectedId: string | null = null;
            if (sortedEntities.length > 0) {
                 if (currentIndex !== -1) {
                    nextSelectedId = sortedEntities[currentIndex]?.id || sortedEntities[sortedEntities.length-1].id;
                 } else {
                     nextSelectedId = sortedEntities[sortedEntities.length - 1].id;
                 }
            }
            dispatch(setSelectedId(nextSelectedId));
        }
        
        showToast({ type: 'info', message: `Moved "${entityToDelete.name}" to trash.` });
    }, [selectedId, dispatch, storyBible.entities.entities, showToast]);

    return {
        createNewEntityObject,
        addNewEntity,
        addEntity,
        updateEntity,
        deleteEntity,
    };
};