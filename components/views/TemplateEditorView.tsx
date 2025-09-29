import React, { useState, useMemo } from 'react';
import { EntityType, EntityTemplate, ModalType, Entity } from '../../types';
import { useTemplateActions } from '../../hooks/useTemplateActions';
import { PlusCircleIcon, EditIcon, TrashIcon, UserIcon, MapPinIcon, DiamondIcon, UsersIcon, ClipboardListIcon } from '../common/Icons';
import { Modal } from '../common/ui';
import TemplateSchemaForm from '../forms/TemplateSchemaForm';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';
import { useI18n } from '../../hooks/useI18n';
import { getTypedObjectValues } from '../../utils';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { pushModal } from '../../state/uiSlice';

const getEntityIcon = (type: EntityType) => {
  const props = { className: "w-5 h-5 mr-2 text-text-secondary" };
  switch (type) {
    case EntityType.CHARACTER: return <UserIcon {...props} />;
    case EntityType.LOCATION: return <MapPinIcon {...props} />;
    case EntityType.OBJECT: return <DiamondIcon {...props} />;
    case EntityType.ORGANIZATION: return <UsersIcon {...props} />;
    default: return null;
  }
};

const TemplateEditorView: React.FC = () => {
  const { entities, entityTemplates } = useAppSelector(state => state.bible.present.entities);
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const showConfirm = useConfirmationDialog();
  const { saveEntityTemplate, deleteEntityTemplate } = useTemplateActions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EntityTemplate | null>(null);
  const [targetEntityType, setTargetEntityType] = useState<EntityType>(EntityType.CHARACTER);

  const handleOpenCreate = (entityType: EntityType) => {
    setTargetEntityType(entityType);
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (template: EntityTemplate) => {
    setTargetEntityType(template.entityType as EntityType);
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleSave = (template: EntityTemplate, isEditing: boolean) => {
    saveEntityTemplate(template, isEditing);
    setIsModalOpen(false);
  };

  const handleDelete = (templateId: string, entityType: EntityType) => {
    const affectedEntities = (getTypedObjectValues(entities) as Entity[]).filter(
        (e) => e.templateId === templateId
    );

    const onConfirmDelete = (migrationTemplateId?: string) => {
        deleteEntityTemplate({ templateId, entityType, migrationTemplateId });
    };

    if (affectedEntities.length > 0) {
        dispatch(pushModal({
                type: ModalType.DELETE_TEMPLATE,
                props: {
                    templateId,
                    entityType,
                    onConfirm: onConfirmDelete,
                },
            }
        ));
    } else {
        showConfirm({
            title: t('templateEditor.delete.title'),
            message: t('templateEditor.delete.message'),
            onConfirm: onConfirmDelete,
        });
    }
  };

  const isNameUnique = (name: string, id?: string): boolean => {
    const templatesForType = (entityTemplates[targetEntityType] || []) as EntityTemplate[];
    const nameLower = name.trim().toLowerCase();
    return !templatesForType.some(t => t.name.toLowerCase() === nameLower && t.id !== id);
  };

  const renderEntitySection = (entityType: EntityType) => {
    const templates = ((entityTemplates[entityType] || []) as EntityTemplate[]).sort((a, b) => a.name.localeCompare(b.name));

    return (
      <div key={entityType} className="bg-secondary p-4 rounded-lg border border-border-color">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-text-main flex items-center">{getEntityIcon(entityType)} {entityType} {t('common.templates')}</h3>
          <button onClick={() => handleOpenCreate(entityType)} className="px-3 py-1 text-sm font-semibold text-white bg-accent hover:bg-highlight rounded-md transition-colors flex items-center">
            <PlusCircleIcon className="w-5 h-5 mr-1" /> {t('templateEditor.createButton')}
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto pr-2">
          {templates.length > 0 ? (
            <div className="bg-primary p-2 rounded-md space-y-1">
              {templates.map(template => (
                <div key={template.id} className="flex items-center justify-between p-2 rounded-md hover:bg-border-color group">
                  <span>{template.name}</span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
                    <button onClick={() => handleOpenEdit(template)} className="p-1 text-text-secondary hover:text-accent"><EditIcon className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(template.id, entityType)} className="p-1 text-text-secondary hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-text-secondary p-4 italic">
              <ClipboardListIcon className="w-8 h-8 mx-auto mb-2 text-text-secondary/50" />
              {t('templateEditor.empty', { entityType: entityType })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col">
      <h2 className="text-3xl font-bold text-text-main mb-4 flex-shrink-0">{t('templateEditor.title')}</h2>
      <p className="text-text-secondary mb-6 flex-shrink-0">
        {t('templateEditor.description')}
      </p>
      <div className="flex-grow overflow-y-auto pr-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(Object.values(EntityType) as EntityType[]).map(renderEntitySection)}
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTemplate ? t('templateEditor.editTitle', { name: editingTemplate.name }) : t('templateEditor.createTitle', { entityType: targetEntityType })}
        size="lg"
      >
        <TemplateSchemaForm
          entityType={targetEntityType}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
          existingTemplate={editingTemplate}
          isNameUnique={isNameUnique}
        />
      </Modal>
    </div>
  );
};

export default TemplateEditorView;