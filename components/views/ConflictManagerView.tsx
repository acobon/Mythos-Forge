import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { useThemeAndConflictActions } from '../../hooks/useThemeAndConflictActions';
import { Conflict, ConflictStatus, ConflictType, ModalType } from '../../types';
import { UsersIcon, EditIcon, TrashIcon, LinkIcon } from '../common/Icons';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';
import EmptyState from '../common/EmptyState';
import { useI18n } from '../../hooks/useI18n';
import { getTypedObjectValues } from '../../utils';
import { CONFLICT_TYPE, CONFLICT_STATUS } from '../../constants';
import { pushModal } from '../../state/uiSlice';

const ConflictManagerView: React.FC = () => {
    const dispatch = useAppDispatch();
    const { conflicts } = useAppSelector(state => state.bible.present.metadata);
    const showConfirm = useConfirmationDialog();
    const { saveConflict, deleteConflict } = useThemeAndConflictActions();
    const { t } = useI18n();

    const [editingConflict, setEditingConflict] = useState<Conflict | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<ConflictType>(CONFLICT_TYPE.EXTERNAL);
    const [status, setStatus] = useState<ConflictStatus>(CONFLICT_STATUS.ACTIVE);
    const [error, setError] = useState('');

    const conflictsArray = getTypedObjectValues(conflicts) as Conflict[];

    const handleSelectForEdit = (conflict: Conflict) => {
        setEditingConflict(conflict);
        setName(conflict.name);
        setDescription(conflict.description);
        setType(conflict.type);
        setStatus(conflict.status);
        setError('');
    };

    const handleCancelEdit = () => {
        setEditingConflict(null);
        setName('');
        setDescription('');
        setType(CONFLICT_TYPE.EXTERNAL);
        setStatus(CONFLICT_STATUS.ACTIVE);
        setError('');
    };

    const isNameUnique = (checkName: string, id?: string): boolean => {
        const lowerName = checkName.trim().toLowerCase();
        return !conflictsArray.some(c => c.name.toLowerCase() === lowerName && c.id !== id);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Conflict name cannot be empty.');
            return;
        }
        if (!isNameUnique(name, editingConflict?.id)) {
            setError('A conflict with this name already exists.');
            return;
        }
        saveConflict({ id: editingConflict?.id, name, description, type, status });
        handleCancelEdit();
    };

    const handleDelete = (conflictId: string) => {
        showConfirm({
            title: "Delete Conflict?",
            message: "Are you sure? This will remove the conflict from all items it's tagged on. This action can be undone.",
            onConfirm: () => deleteConflict(conflictId)
        });
    };
    
    const handleShowUsage = (conflict: Conflict) => {
        dispatch(pushModal({
            type: ModalType.ITEM_USAGE,
            props: { itemId: conflict.id, itemName: conflict.name, itemType: 'Conflict' }
        }));
    };

    return (
        <div className="p-4 md:p-8 h-full flex flex-col">
            <h2 className="text-3xl font-bold text-text-main mb-4 flex-shrink-0">Manage Conflicts</h2>
            <p className="text-text-secondary mb-6 flex-shrink-0">
                Define the internal and external struggles that drive your narrative forward.
            </p>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
                <div className="md:col-span-2 bg-secondary p-4 rounded-lg border border-border-color h-full flex flex-col">
                    <h3 className="text-xl font-semibold text-text-main mb-4 flex-shrink-0">All Conflicts ({conflictsArray.length})</h3>
                    <div className="flex-grow overflow-y-auto pr-2">
                        {conflictsArray.length > 0 ? (
                            <div className="space-y-2">
                                {conflictsArray.sort((a, b) => a.name.localeCompare(b.name)).map(conflict => (
                                    <div key={conflict.id} className="p-3 rounded-md hover:bg-border-color group">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-text-main">{conflict.name}</p>
                                                    <span className="text-xs font-mono bg-primary px-2 py-0.5 rounded-full">{conflict.type}</span>
                                                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${conflict.status === 'Active' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>{conflict.status}</span>
                                                </div>
                                                <p className="text-sm text-text-secondary mt-1">{conflict.description}</p>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2 flex-shrink-0 ml-4">
                                                <button onClick={() => handleShowUsage(conflict)} className="p-1 text-text-secondary hover:text-accent" title="View Usage"><LinkIcon className="w-4 h-4" /></button>
                                                <button onClick={() => handleSelectForEdit(conflict)} className="p-1 text-text-secondary hover:text-accent"><EditIcon className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(conflict.id)} className="p-1 text-text-secondary hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                           <EmptyState
                                icon={<UsersIcon className="w-16 h-16" />}
                                title={t('conflicts.empty.title')}
                                description={t('conflicts.empty.description')}
                           />
                        )}
                    </div>
                </div>
                <div className="bg-secondary p-4 rounded-lg border border-border-color">
                    <h3 className="text-xl font-semibold text-text-main mb-4">{editingConflict ? 'Edit Conflict' : 'Create New Conflict'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="conflict-name" className="block text-sm font-medium text-text-secondary">Name</label>
                            <input
                                id="conflict-name" type="text" value={name} onChange={e => { setName(e.target.value); setError(''); }}
                                placeholder="e.g., The War of the Magi"
                                className={`w-full mt-1 bg-primary border rounded-md p-2 text-text-main focus:ring-2 focus:outline-none ${error ? 'border-red-500' : 'border-border-color focus:ring-accent'}`}
                            />
                             {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label htmlFor="conflict-type" className="block text-sm font-medium text-text-secondary">Type</label>
                                <select id="conflict-type" value={type} onChange={e => setType(e.target.value as any)} className="w-full mt-1 bg-primary border border-border-color rounded-md p-2">
                                    {Object.values(CONFLICT_TYPE).map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="conflict-status" className="block text-sm font-medium text-text-secondary">Status</label>
                                <select id="conflict-status" value={status} onChange={e => setStatus(e.target.value as any)} className="w-full mt-1 bg-primary border border-border-color rounded-md p-2">
                                    {Object.values(CONFLICT_STATUS).map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="conflict-desc" className="block text-sm font-medium text-text-secondary">Description</label>
                            <textarea
                                id="conflict-desc" value={description} onChange={e => setDescription(e.target.value)} rows={4}
                                placeholder="A brief description of the conflict."
                                className="w-full mt-1 bg-primary border border-border-color rounded-md p-2 text-text-main"
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-accent hover:bg-highlight rounded-md flex-grow">
                                {editingConflict ? 'Save Changes' : 'Create Conflict'}
                            </button>
                            {editingConflict && (
                                <button type="button" onClick={handleCancelEdit} className="px-4 py-2 text-sm font-semibold">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ConflictManagerView;