import React, { useState } from 'react';
import { useThemeAndConflictActions } from '../../hooks/useThemeAndConflictActions';
import { ModalType, Theme } from '../../types';
import { PlusCircleIcon, EditIcon, TrashIcon, BookOpenIcon, CheckIcon, XIcon, LinkIcon } from '../common/Icons';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';
import EmptyState from '../common/EmptyState';
import { useI18n } from '../../hooks/useI18n';
import { getTypedObjectValues } from '../../utils';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { pushModal } from '../../state/uiSlice';

const ThemeManagerView: React.FC = () => {
    const dispatch = useAppDispatch();
    const { themes } = useAppSelector(state => state.bible.present.metadata);
    const showConfirm = useConfirmationDialog();
    const { saveTheme, deleteTheme } = useThemeAndConflictActions();
    const { t } = useI18n();

    const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    const themesArray = getTypedObjectValues(themes) as Theme[];

    const handleSelectForEdit = (theme: Theme) => {
        setEditingTheme(theme);
        setName(theme.name);
        setDescription(theme.description);
        setError('');
    };

    const handleCancelEdit = () => {
        setEditingTheme(null);
        setName('');
        setDescription('');
        setError('');
    };

    const isNameUnique = (checkName: string, id?: string): boolean => {
        const lowerName = checkName.trim().toLowerCase();
        return !themesArray.some(t => t.name.toLowerCase() === lowerName && t.id !== id);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Theme name cannot be empty.');
            return;
        }
        if (!isNameUnique(name, editingTheme?.id)) {
            setError('A theme with this name already exists.');
            return;
        }
        saveTheme({ id: editingTheme?.id, name, description });
        handleCancelEdit();
    };

    const handleDelete = (themeId: string) => {
        showConfirm({
            title: "Delete Theme?",
            message: "Are you sure? This will remove the theme from all items it's tagged on. This action can be undone.",
            onConfirm: () => deleteTheme(themeId)
        });
    };

    const handleShowUsage = (theme: Theme) => {
        dispatch(pushModal({
            type: ModalType.ITEM_USAGE,
            props: { itemId: theme.id, itemName: theme.name, itemType: 'Theme' }
        }));
    };

    return (
        <div className="p-4 md:p-8 h-full flex flex-col">
            <h2 className="text-3xl font-bold text-text-main mb-4 flex-shrink-0">Manage Themes</h2>
            <p className="text-text-secondary mb-6 flex-shrink-0">
                Define the central ideas and recurring concepts that underpin your narrative.
            </p>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
                <div className="md:col-span-2 bg-secondary p-4 rounded-lg border border-border-color h-full flex flex-col">
                    <h3 className="text-xl font-semibold text-text-main mb-4 flex-shrink-0">All Themes ({themesArray.length})</h3>
                    <div className="flex-grow overflow-y-auto pr-2">
                        {themesArray.length > 0 ? (
                            <div className="space-y-2">
                                {themesArray.sort((a, b) => a.name.localeCompare(b.name)).map(theme => (
                                    <div key={theme.id} className="p-3 rounded-md hover:bg-border-color group">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-text-main">{theme.name}</p>
                                                <p className="text-sm text-text-secondary mt-1">{theme.description}</p>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2 flex-shrink-0 ml-4">
                                                <button onClick={() => handleShowUsage(theme)} className="p-1 text-text-secondary hover:text-accent" title="View Usage"><LinkIcon className="w-4 h-4" /></button>
                                                <button onClick={() => handleSelectForEdit(theme)} className="p-1 text-text-secondary hover:text-accent"><EditIcon className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(theme.id)} className="p-1 text-text-secondary hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={<BookOpenIcon className="w-16 h-16" />}
                                title={t('themes.empty.title')}
                                description={t('themes.empty.description')}
                            />
                        )}
                    </div>
                </div>
                <div className="bg-secondary p-4 rounded-lg border border-border-color">
                    <h3 className="text-xl font-semibold text-text-main mb-4">{editingTheme ? 'Edit Theme' : 'Create New Theme'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="theme-name" className="block text-sm font-medium text-text-secondary">Name</label>
                            <input
                                id="theme-name" type="text" value={name} onChange={e => { setName(e.target.value); setError(''); }}
                                placeholder="e.g., Redemption, Loss of Innocence"
                                className={`w-full mt-1 bg-primary border rounded-md p-2 text-text-main focus:ring-2 focus:outline-none ${error ? 'border-red-500' : 'border-border-color focus:ring-accent'}`}
                            />
                            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                        </div>
                        <div>
                            <label htmlFor="theme-desc" className="block text-sm font-medium text-text-secondary">Description</label>
                            <textarea
                                id="theme-desc" value={description} onChange={e => setDescription(e.target.value)} rows={4}
                                placeholder="A brief description of the theme."
                                className="w-full mt-1 bg-primary border border-border-color rounded-md p-2 text-text-main"
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-accent hover:bg-highlight rounded-md flex-grow">
                                {editingTheme ? 'Save Changes' : 'Create Theme'}
                            </button>
                            {editingTheme && (
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

export default ThemeManagerView;