// state/slices/entitiesSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Entity, EntityId, EntityType, EntityTypeDefinition, EntityTemplate, OrganizationEntity, CharacterEntity, BaseEntity, TrashedItem, Tag, Theme, Conflict } from '../../types/index';
import { defaultStoryBible } from '../../data/defaults';
import { isEntityNameDuplicate, getTypedObjectValues } from '../../utils';
import { restoreFromTrash } from './projectSlice';
import { removeItem, mergeTags } from '../actions';

interface EntitiesState {
    entities: Record<string, Entity>;
    entityTypes: EntityTypeDefinition[];
    entityTemplates: Record<string, EntityTemplate[]>;
}

const initialState: EntitiesState = {
    entities: defaultStoryBible.entities,
    entityTypes: defaultStoryBible.entityTypes,
    entityTemplates: defaultStoryBible.entityTemplates,
};

const entitiesSlice = createSlice({
    name: 'entities',
    initialState,
    reducers: {
        addEntity: (state, action: PayloadAction<Entity>) => {
            if (!isEntityNameDuplicate(action.payload.name, action.payload.type as string, getTypedObjectValues(state.entities), null)) {
                state.entities[action.payload.id] = action.payload;
            }
        },
        updateEntity: (state, action: PayloadAction<{ entityId: EntityId; updates: Partial<Entity> }>) => {
            const { entityId, updates } = action.payload;
            const entity = state.entities[entityId];
            if (entity) {
                Object.assign(entity, updates, { lastModified: new Date().toISOString() });
            }
        },
        deleteEntity: (state, action: PayloadAction<EntityId>) => {
            delete state.entities[action.payload];
        },
        saveEntityType: (state, action: PayloadAction<EntityTypeDefinition>) => {
            const newType = action.payload;
            const index = state.entityTypes.findIndex(t => t.key === newType.key);
            if (index > -1) {
                state.entityTypes[index] = newType;
            } else {
                state.entityTypes.push(newType);
            }
        },
        deleteEntityType: (state, action: PayloadAction<{ typeKeyToDelete: string; migrationTypeKey: string }>) => {
            const { typeKeyToDelete, migrationTypeKey } = action.payload;
            getTypedObjectValues(state.entities).forEach((entity: Entity) => {
                if (entity.type === typeKeyToDelete) {
                    entity.type = migrationTypeKey as EntityType;
                }
            });
            state.entityTypes = state.entityTypes.filter(t => t.key !== typeKeyToDelete);
        },
        addEntityTemplate: (state, action: PayloadAction<EntityTemplate>) => {
            const { entityType } = action.payload;
            if (!state.entityTemplates[entityType]) {
                state.entityTemplates[entityType] = [];
            }
            state.entityTemplates[entityType].push(action.payload);
        },
        updateEntityTemplate: (state, action: PayloadAction<EntityTemplate>) => {
            const { entityType, id } = action.payload;
            const templates = state.entityTemplates[entityType];
            if (templates) {
                const index = templates.findIndex(t => t.id === id);
                if (index !== -1) templates[index] = action.payload;
            }
        },
        deleteEntityTemplate: (state, action: PayloadAction<{ templateId: string; entityType: string; migrationTemplateId?: string }>) => {
            const { templateId, entityType, migrationTemplateId } = action.payload;
            state.entityTemplates[entityType] = state.entityTemplates[entityType]?.filter(t => t.id !== templateId);
            getTypedObjectValues(state.entities).forEach((e: Entity) => {
                if (e.templateId === templateId) {
                    e.templateId = migrationTemplateId;
                }
            });
        },
    },
    extraReducers: builder => {
        builder
            .addCase(restoreFromTrash, (state, action: PayloadAction<{ item: TrashedItem, index: number }>) => {
                const { item, itemType } = action.payload.item;
                if (itemType === 'Entity') {
                    state.entities[(item as Entity).id] = item as Entity;
                }
            })
            .addCase(removeItem, (state, action: PayloadAction<TrashedItem>) => {
                const { item, itemType } = action.payload;
                if (itemType === 'Entity') {
                    delete state.entities[(item as Entity).id];
                }

                if (itemType === 'Tag') {
                    const tagId = (item as Tag).id;
                    (getTypedObjectValues(state.entities) as Entity[]).forEach(e => {
                        if (e.tagIds?.includes(tagId)) e.tagIds = e.tagIds.filter(id => id !== tagId);
                    });
                }
                if (itemType === 'Theme') {
                     const themeId = (item as Theme).id;
                     (getTypedObjectValues(state.entities) as Entity[]).forEach(e => {
                        if (e.type === 'character' && (e as CharacterEntity).themeIds?.includes(themeId)) {
                             (e as CharacterEntity).themeIds = (e as CharacterEntity).themeIds?.filter(id => id !== themeId);
                        }
                    });
                }
                if (itemType === 'Conflict') {
                     const conflictId = (item as Conflict).id;
                     (getTypedObjectValues(state.entities) as Entity[]).forEach(e => {
                        if (e.type === 'character' && (e as CharacterEntity).conflictIds?.includes(conflictId)) {
                             (e as CharacterEntity).conflictIds = (e as CharacterEntity).conflictIds?.filter(id => id !== conflictId);
                        }
                    });
                }

                // Cascading cleanup: if an entity is deleted, clean references within this slice.
                if (itemType === 'Entity') {
                    const entityId = (item as Entity).id;
                    (getTypedObjectValues(state.entities) as Entity[]).forEach(entity => {
                        if ((entity as OrganizationEntity).type === 'organization') {
                            const org = entity as OrganizationEntity;
                            if (org.members) {
                                org.members = org.members.filter(m => m.entityId !== entityId);
                            }
                        }
                    });
                }
            })
            .addCase(mergeTags, (state, action) => {
                const { sourceTagId, targetTagId } = action.payload;
                const updateIds = (ids?: string[]) => {
                    if (!ids) return ids;
                    const idSet = new Set(ids);
                    if (idSet.has(sourceTagId)) {
                        idSet.delete(sourceTagId);
                        idSet.add(targetTagId);
                        return Array.from(idSet);
                    }
                    return ids;
                };
                (getTypedObjectValues(state.entities) as Entity[]).forEach(e => { e.tagIds = updateIds(e.tagIds); });
            });
    }
});

export const { 
    addEntity, 
    updateEntity, 
    deleteEntity,
    saveEntityType, 
    deleteEntityType, 
    addEntityTemplate, 
    updateEntityTemplate, 
    deleteEntityTemplate 
} = entitiesSlice.actions;

export default entitiesSlice.reducer;