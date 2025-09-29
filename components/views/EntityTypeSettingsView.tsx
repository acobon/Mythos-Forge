
import React, { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { useI18n } from '../../hooks/useI18n';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';
import { EntityTypeDefinition, ModalType, Entity } from '../../types';
import { saveEntityType, deleteEntityType as deleteEntityTypeAction } from '../../state/slices/entitiesSlice';
import { getIconComponent, availableIcons } from '../common/iconUtils';
import { EditIcon, TrashIcon, PlusCircleIcon } from '../common/Icons';
import { generateId, getTypedObjectValues } from '../../utils';
import { pushModal } from '../../state/uiSlice';
import { Button, Input, Select } from '../common/ui';

const EntityTypeSettingsView: React.FC = () => {
    const { t } = useI18n();
    const dispatch = useAppDispatch();
    const showConfirm = useConfirmationDialog();
    const { entityTypes, entities } = useAppSelector(state => state.bible.present.entities);

    const [editingType, setEditingType] = useState<EntityTypeDefinition | null>(null);
    const [name, setName] = useState('');
    const [icon, setIcon] = useState(Object.keys(availableIcons)[0] || '');
    const [error, setError] = useState('');

    const isNameUnique = (checkName: string, key?: string): boolean => {
        const lowerName = checkName.trim().toLowerCase();
        return !entityTypes.some(t => t.name.toLowerCase() === lowerName && t.key !== key);
    };
    
    const handleStartEdit = (typeDef: EntityTypeDefinition) => {
        setEditingType(typeDef);
        setName(typeDef.name);
        setIcon(typeDef.icon);
        setError('');
    };

    const handleCancel = () => {
        setEditingType(null);
        setName('');
        setIcon(Object.keys(availableIcons)[0] || '');
        setError('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError(t('validation.error.required', { field: t('entityTypeSettings.typeName') }));
            return;
        }
        if (!isNameUnique(name, editingType?.key)) {
            setError(t('validation.error.duplicate', { name }));
            return;
        }

        const payload: EntityTypeDefinition = {
            key: editingType?.key || `custom:${name.toLowerCase().replace(/\s+/g, '-')}:${generateId('')}`,
            name: name.trim(),
            icon,
            isCustom: true,
        };
        dispatch(saveEntityType(payload));
        handleCancel();
    };

    const handleDelete = (typeDef: EntityTypeDefinition) => {
        const affectedCount = (getTypedObjectValues(entities) as Entity[]).filter(e => e.type === typeDef.key).length;
        if (affectedCount > 0) {
            dispatch(pushModal({
                type: ModalType.DELETE_ENTITY_TYPE,
                props: {
                    entityType: typeDef,
                    onConfirm: (migrationTypeKey: string) => {
                        dispatch(deleteEntityTypeAction({ typeKeyToDelete: typeDef.key, migrationTypeKey }));
                    },
                },
            }));
        } else {
            showConfirm({
                title: t('entityTypeSettings.delete.title'),
                message: t('entityTypeSettings.delete.message', { typeName: typeDef.name }),
                onConfirm: () => {
                    dispatch(deleteEntityTypeAction({ typeKeyToDelete: typeDef.key, migrationTypeKey: '' }));
                },
            });
        }
    };
    
    return (
        <div className="p-4 md:p-8 h-full flex flex-col">
            <h2 className="text-3xl font-bold text-text-main mb-4 flex-shrink-0">{t('entityTypeSettings.title')}</h2>
            <p className="text-text-secondary mb-6 flex-shrink-0">{t('entityTypeSettings.description')}</p>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
                <div className="md:col-span-2 bg-secondary p-4 rounded-lg border border-border-color h-full flex flex-col">
                    <h3 className="text-xl font-semibold text-text-main mb-4 flex-shrink-0">{t('entityTypeSettings.allTypes')}</h3>
                    <div className="flex-grow overflow-y-auto pr-2 space-y-2">
                        {entityTypes.map(typeDef => (
                            <div key={typeDef.key} className="flex items-center justify-between p-2 rounded-md hover:bg-border-color group">
                                <div className="flex items-center gap-3">
                                    {getIconComponent(typeDef.icon, { className: "w-5 h-5 text-text-secondary" })}
                                    <span className="font-semibold">{typeDef.name}</span>
                                    {!typeDef.isCustom && <span className="text-xs bg-primary text-text-secondary px-2 py-0.5 rounded-full">Built-in</span>}
                                </div>
                                {typeDef.isCustom && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleStartEdit(typeDef)}><EditIcon className="w-4 h-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(typeDef)}><TrashIcon className="w-4 h-4 text-red-500" /></Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-secondary p-4 rounded-lg border border-border-color">
                    <h3 className="text-xl font-semibold text-text-main mb-4">{editingType ? t('entityTypeSettings.edit.title') : t('entityTypeSettings.create.title')}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="type-name" className="block text-sm font-medium text-text-secondary">{t('entityTypeSettings.typeName')}</label>
                            <Input id="type-name" type="text" value={name} onChange={e => { setName(e.target.value); setError(''); }} placeholder={t('entityTypeSettings.typeName.placeholder')} error={!!error} />
                            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                        </div>
                        <div>
                            <label htmlFor="type-icon" className="block text-sm font-medium text-text-secondary">{t('entityTypeSettings.icon')}</label>
                            <Select id="type-icon" value={icon} onChange={e => setIcon(e.target.value)}>
                                {Object.keys(availableIcons).map(iconName => (
                                    <option key={iconName} value={iconName}>{iconName}</option>
                                ))}
                            </Select>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <Button type="submit" className="flex-grow">
                                {editingType ? t('common.saveChanges') : t('entityTypeSettings.create.button')}
                            </Button>
                            {editingType && (
                                <Button type="button" variant="ghost" onClick={handleCancel}>{t('common.cancel')}</Button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EntityTypeSettingsView;
