




import React, { useCallback, useState, useEffect } from 'react';
import { ModalType, Entity, Attributes, EntityType } from '../../types/index';
import EntityList from './EntityList';
import EmptyView from './entity/EmptyView';
import { useEntityActions } from '../../hooks/useEntityActions';
import { isEntityNameDuplicate, getTypedObjectValues } from '../../utils';
import { useI18n } from '../../hooks/useI18n';
import { useNavigation } from '../../hooks/useNavigation';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { pushModal, popModal, showDialog } from '../../state/uiSlice';
import { EntityDetailDispatcher } from './detail/EntityDetailDispatcher';

interface EntityViewProps { }

const EntityView: React.FC<EntityViewProps> = () => {
    const dispatch = useAppDispatch();
    const entities = useAppSelector(state => state.bible.present.entities.entities);
    const selectedId = useAppSelector(state => state.ui.selectedId);
    const { t } = useI18n();
    const { selectEntity } = useNavigation();
    const { createNewEntityObject, addEntity } = useEntityActions();
    const selectedEntity = selectedId ? entities[selectedId] : undefined;
    
    const [isDesktop, setIsDesktop] = useState(window.matchMedia('(min-width: 768px)').matches);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 768px)');
        const handler = () => setIsDesktop(mediaQuery.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, []);

    const handleAddEntity = useCallback((type: string) => {
        const handleSaveNewEntity = (data: { name: string; description: string; type: string; templateId?: string; details?: Attributes; }) => {
            if (isEntityNameDuplicate(data.name, data.type as EntityType, getTypedObjectValues(entities) as Entity[], null)) {
                dispatch(showDialog({ title: t('validation.error.duplicateNameTitle'), message: t('validation.error.duplicateName', { name: data.name, type: data.type }) }));
                return;
            }

            const newEntity = createNewEntityObject(data.name, data.description, data.type, data.templateId, data.details);
            addEntity(newEntity);
            dispatch(popModal());
            
            if (isDesktop) {
                selectEntity(newEntity.id);
            }
        };

        dispatch(pushModal({ type: ModalType.NEW_ENTITY, props: { entityType: type, onSave: handleSaveNewEntity } }));
    }, [entities, dispatch, t, createNewEntityObject, addEntity, selectEntity, isDesktop]);

  if (isDesktop) {
    return (
        <div className="flex h-full">
            <div className="w-2/5 lg:w-1/3 border-r border-border-color p-4 h-full flex-shrink-0 flex flex-col">
                <EntityList onAdd={handleAddEntity} />
            </div>
            <main className="w-3/5 lg:w-2/3 h-full">
                <div className="w-full h-full p-4 md:p-8 overflow-y-auto">
                    {selectedEntity ? (
                        <EntityDetailDispatcher entity={selectedEntity} />
                    ) : (
                        <EmptyView onAddEntity={handleAddEntity} hasEntities={Object.keys(entities).length > 0} />
                    )}
                </div>
            </main>
        </div>
    );
  }

  // Mobile layout
  return (
    <div className="h-full">
        {!selectedId ? (
             <div className="p-4 h-full flex flex-col">
                <EntityList onAdd={handleAddEntity} />
            </div>
        ) : (
             <div className="w-full h-full p-4 overflow-y-auto animate-fade-in">
                {selectedEntity && <EntityDetailDispatcher entity={selectedEntity} />}
            </div>
        )}
    </div>
  );
};

export default EntityView;
