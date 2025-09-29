
// components/views/RoleSettingsView.tsx
import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { updateCommonRoles } from '../../state/slices/metadataSlice';
import { PlusCircleIcon, EditIcon, TrashIcon, CheckIcon, XIcon } from '../common/Icons';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';
import { useI18n } from '../../hooks/useI18n';
import { Input } from '../common/ui';

const RoleSettingsView: React.FC = () => {
    const dispatch = useAppDispatch();
    const showConfirm = useConfirmationDialog();
    const { commonRoles } = useAppSelector(state => state.bible.present.metadata);
    const { t } = useI18n();

    const [draftRoles, setDraftRoles] = useState<string[]>([]);
    const [newRole, setNewRole] = useState('');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingValue, setEditingValue] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        setDraftRoles(commonRoles || []);
    }, [commonRoles]);

    const isRoleUnique = (checkRole: string, indexToExclude?: number): boolean => {
        const lowerRole = checkRole.trim().toLowerCase();
        return !draftRoles.some((r, i) => r.toLowerCase() === lowerRole && i !== indexToExclude);
    };

    const handleAddRole = () => {
        if (!newRole.trim()) {
            setError(t('validation.error.required', { field: 'Role' }));
            return;
        }
        if (!isRoleUnique(newRole)) {
            setError(t('validation.error.duplicate', { name: newRole }));
            return;
        }
        const updatedRoles = [...draftRoles, newRole.trim()].sort((a,b) => a.localeCompare(b));
        dispatch(updateCommonRoles(updatedRoles));
        setNewRole('');
        setError('');
    };
    
    const handleStartEdit = (index: number) => {
        setEditingIndex(index);
        setEditingValue(draftRoles[index]);
        setError('');
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
        setEditingValue('');
        setError('');
    };

    const handleSaveEdit = (index: number) => {
        if (!editingValue.trim()) {
            setError('Role cannot be empty.');
            return;
        }
        if (!isRoleUnique(editingValue, index)) {
            setError(`Role "${editingValue.trim()}" already exists.`);
            return;
        }

        const updatedRoles = [...draftRoles];
        updatedRoles[index] = editingValue.trim();
        updatedRoles.sort((a,b) => a.localeCompare(b));
        dispatch(updateCommonRoles(updatedRoles));
        handleCancelEdit();
    };


    const handleDeleteRole = (index: number) => {
        showConfirm({
            title: "Delete Role?",
            message: "Are you sure you want to delete this common role? It will be removed from the list, but will not affect events where it's already in use. This can be undone.",
            onConfirm: () => {
                const updatedRoles = draftRoles.filter((_, i) => i !== index);
                dispatch(updateCommonRoles(updatedRoles));
            }
        });
    };

    return (
        <div className="p-4 md:p-8 h-full flex flex-col">
            <h2 className="text-3xl font-bold text-text-main mb-4 flex-shrink-0">{t('sidebar.roleManagement')}</h2>
            <p className="text-text-secondary mb-6 flex-shrink-0">
                Create a list of reusable roles for entities involved in events.
            </p>
            <div className="flex-grow bg-secondary p-4 rounded-lg border border-border-color h-full flex flex-col max-w-lg mx-auto">
                <h3 className="text-xl font-semibold text-text-main mb-4 flex-shrink-0">Common Roles ({draftRoles.length})</h3>
                <div className="flex-grow overflow-y-auto pr-2 space-y-2 mb-4">
                    {draftRoles.map((role, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-md hover:bg-border-color group">
                           {editingIndex === index ? (
                                <input
                                    type="text"
                                    value={editingValue}
                                    onChange={e => setEditingValue(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSaveEdit(index)}
                                    onBlur={() => handleSaveEdit(index)}
                                    autoFocus
                                    className="bg-primary border border-accent rounded-md px-2 py-1 text-sm flex-grow"
                                />
                           ) : (
                               <span>{role}</span>
                           )}
                            <div className="space-x-2">
                                {editingIndex === index ? (
                                    <>
                                        <button onClick={() => handleSaveEdit(index)} className="p-1 text-text-secondary hover:text-green-400"><CheckIcon className="w-4 h-4" /></button>
                                        <button onClick={handleCancelEdit} className="p-1 text-text-secondary hover:text-red-500"><XIcon className="w-4 h-4" /></button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => handleStartEdit(index)} className="p-1 text-text-secondary hover:text-accent opacity-0 group-hover:opacity-100"><EditIcon className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteRole(index)} className="p-1 text-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100"><TrashIcon className="w-4 h-4" /></button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex-shrink-0 border-t border-border-color pt-4">
                     <div className="flex items-center gap-2">
                         <input
                            type="text"
                            value={newRole}
                            onChange={e => { setNewRole(e.target.value); setError(''); }}
                            placeholder="Add a new role..."
                            className={`flex-grow bg-primary border rounded-md p-2 text-text-main focus:ring-2 focus:outline-none ${error ? 'border-red-500 focus:ring-red-500' : 'border-border-color focus:ring-accent'}`}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddRole(); } }}
                        />
                        <button onClick={handleAddRole} className="p-2 text-white bg-accent rounded-md hover:bg-highlight"><PlusCircleIcon className="w-5 h-5" /></button>
                     </div>
                      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default RoleSettingsView;
