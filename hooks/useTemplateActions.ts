
import { useCallback } from 'react';
import { EntityTemplate, EntityType } from '../types';
import { useAppDispatch } from '../state/hooks';
import { addEntityTemplate, updateEntityTemplate, deleteEntityTemplate as deleteEntityTemplateAction } from '../state/slices/entitiesSlice';

export const useTemplateActions = () => {
    const dispatch = useAppDispatch();

    const saveEntityTemplate = useCallback((template: EntityTemplate, isEditing: boolean) => {
        dispatch(isEditing ? updateEntityTemplate(template) : addEntityTemplate(template));
    }, [dispatch]);

    const deleteEntityTemplate = useCallback((payload: { templateId: string; entityType: string; migrationTemplateId?: string }) => {
        dispatch(deleteEntityTemplateAction(payload));
    }, [dispatch]);
    
    return { saveEntityTemplate, deleteEntityTemplate };
};
