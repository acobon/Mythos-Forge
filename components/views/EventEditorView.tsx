import React, { useState, useMemo } from 'react';
import { EntityType, EventSchema } from '../../types/index';
import { useEventActions } from '../../hooks/useEventActions';
import { PlusCircleIcon, EditIcon, TrashIcon, UserIcon, MapPinIcon, DiamondIcon, UsersIcon, CalendarIcon } from '../common/Icons';
import { Modal } from '../common/ui/Modal';
import EventSchemaForm from '../forms/EventSchemaForm';
import { builtinEventGroups } from '../../data/builtin-events';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';
import { useI18n } from '../../hooks/useI18n';
import { useAppSelector } from '../../state/hooks';

const getEntityIcon = (type: EntityType) => {
  const props = { className: "w-5 h-5 mr-2 text-text-secondary" };
  switch (type) {
    case EntityType.CHARACTER: return <UserIcon {...props} />;
    case EntityType.LOCATION: return <MapPinIcon {...props} />;
    case EntityType.OBJECT: return <DiamondIcon {...props} />;
    case EntityType.ORGANIZATION: return <UsersIcon {...props} />;
  }
};

interface EventTypeListProps {
  title: string;
  events: { key: string; label: string; isCustom: boolean; }[];
  onEdit?: (key: string) => void;
  onDelete?: (key: string) => void;
}
const EventTypeList: React.FC<EventTypeListProps> = ({ title, events, onEdit, onDelete }) => (
  <div className="mb-4">
    <h4 className="text-md font-semibold text-text-secondary uppercase tracking-wider mb-2">{title}</h4>
    <div className="bg-primary p-2 rounded-md space-y-1">
      {events.map(event => (
        <div key={event.key} className="flex items-center justify-between p-2 rounded-md hover:bg-border-color group">
          <span>{event.label}</span>
          {event.isCustom && onEdit && onDelete && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
              <button onClick={() => onEdit(event.key)} className="p-1 text-text-secondary hover:text-accent"><EditIcon className="w-4 h-4" /></button>
              <button onClick={() => onDelete(event.key)} className="p-1 text-text-secondary hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

const EventEditorView = () => {
  const storyBible = useAppSelector(state => state.bible.present);
  const showConfirm = useConfirmationDialog();
  const { t } = useI18n();
  const { customEventSchemas } = storyBible.events;
  const { saveCustomEventSchema, deleteCustomEventSchema } = useEventActions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchema, setEditingSchema] = useState<EventSchema | null>(null);
  const [targetEntityType, setTargetEntityType] = useState<EntityType>(EntityType.CHARACTER);

  const handleOpenCreate = (entityType: EntityType) => {
    setTargetEntityType(entityType);
    setEditingSchema(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (schema: EventSchema) => {
    setTargetEntityType(schema.entityType as EntityType);
    setEditingSchema(schema);
    setIsModalOpen(true);
  };

  const handleSave = (schema: EventSchema, isEditing: boolean) => {
    saveCustomEventSchema(schema, isEditing);
    setIsModalOpen(false);
  };

  const handleDelete = (key: string, entityType: EntityType) => {
    showConfirm({
      title: t('eventEditor.dialog.delete.title'),
      message: t('eventEditor.dialog.delete.message'),
      onConfirm: () => deleteCustomEventSchema({ key, entityType })
    });
  };

  const isLabelUnique = (label: string, key?: string): boolean => {
    const customEvents = (customEventSchemas[targetEntityType] || []) as EventSchema[];
    const builtinEvents = (builtinEventGroups[targetEntityType]?.flatMap(g => g.events) || []);

    const labelLower = label.trim().toLowerCase();

    // Check against translated built-in event labels
    const isBuiltin = builtinEvents.some(e => t(e.label as any).toLowerCase() === labelLower);
    if (isBuiltin) return false;

    // Check against other custom events
    const isCustom = customEvents.some(s => s.label.toLowerCase() === labelLower && s.key !== key);
    if (isCustom) return false;

    return true;
  };

  const renderEntitySection = (entityType: EntityType) => {
    const builtinEvents = useMemo(() =>
      (builtinEventGroups[entityType] || []).flatMap(group =>
        group.events.map(e => ({ ...e, label: t(e.label as any), isCustom: false }))
      )
      , [entityType, t]);

    const customEvents = useMemo(() =>
      ((customEventSchemas[entityType] || []) as EventSchema[]).map(schema => ({
        key: schema.key,
        label: schema.label,
        isCustom: true,
      }))
      , [customEventSchemas, entityType]);

    const allEvents = [...builtinEvents, ...customEvents].sort((a, b) => a.label.localeCompare(b.label));

    return (
      <div key={entityType} className="bg-secondary p-4 rounded-lg border border-border-color">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-text-main flex items-center">{getEntityIcon(entityType)} {entityType} {t('common.events')}</h3>
          <button onClick={() => handleOpenCreate(entityType)} className="px-3 py-1 text-sm font-semibold text-white bg-accent hover:bg-highlight rounded-md transition-colors flex items-center">
            <PlusCircleIcon className="w-5 h-5 mr-1" /> {t('eventEditor.createEvent')}
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto pr-2">
          {allEvents.length > 0 ? (
            <EventTypeList
              title={t('eventEditor.allEventTypes')}
              events={allEvents}
              onEdit={(key) => handleOpenEdit(((customEventSchemas[entityType] || []) as EventSchema[]).find(s => s.key === key)!)}
              onDelete={(key) => handleDelete(key, entityType)}
            />
          ) : (
            <div className="text-center text-text-secondary p-4 italic">
              <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-text-secondary/50" />
              {t('eventEditor.noEvents', { entityType })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 h-full flex flex-col">
      <h2 className="text-3xl font-bold text-text-main mb-4 flex-shrink-0">{t('eventEditor.title')}</h2>
      <p className="text-text-secondary mb-6 flex-shrink-0">
        {t('eventEditor.description')}
      </p>
      <div className="flex-grow overflow-y-auto pr-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(Object.values(EntityType) as EntityType[]).map(renderEntitySection)}
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSchema ? t('eventEditor.editTitle', { label: editingSchema.label }) : t('eventEditor.createTitle', { entityType: targetEntityType })}
        size="lg"
      >
        <EventSchemaForm
          entityType={targetEntityType}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
          existingSchema={editingSchema}
          isLabelUnique={isLabelUnique}
        />
      </Modal>
    </div>
  );
};

export default EventEditorView;