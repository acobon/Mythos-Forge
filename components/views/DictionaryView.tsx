import React, { useState, useMemo, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { saveDictionaryEntry, importDictionaryEntries } from '../../state/slices/metadataSlice';
import { DictionaryEntry, TrashedItem } from '../../types';
import { generateId, getTypedObjectValues } from '../../utils';
import { useI18n } from '../../hooks/useI18n';
import { useConfirmationDialog } from '../../hooks/useConfirmationDialog';
import { AtSignIcon, TrashIcon, HelpCircleIcon, UploadIcon, DownloadIcon } from '../common/Icons';
import EmptyState from '../common/EmptyState';
import { Input, Textarea, Button } from '../common/ui';
import { exportDictionary } from '../../services/exportService';
import { importDictionary } from '../../services/importService';
import { removeItem } from '../../state/actions';

const DictionaryView: React.FC = () => {
    const { t } = useI18n();
    const dispatch = useAppDispatch();
    const { dictionary } = useAppSelector(state => state.bible.present.metadata);
    const showConfirm = useConfirmationDialog();
    const importInputRef = useRef<HTMLInputElement>(null);

    const [editingEntry, setEditingEntry] = useState<DictionaryEntry | null>(null);
    const [term, setTerm] = useState('');
    const [definition, setDefinition] = useState('');
    const [caseSensitive, setCaseSensitive] = useState(false);
    const [error, setError] = useState('');

    const dictionaryArray = useMemo(() => 
        (getTypedObjectValues(dictionary) as DictionaryEntry[]).sort((a,b) => a.term.localeCompare(b.term)), 
    [dictionary]);

    const handleSelectForEdit = (entry: DictionaryEntry) => {
        setEditingEntry(entry);
        setTerm(entry.term);
        setDefinition(entry.definition);
        setCaseSensitive(entry.caseSensitive);
        setError('');
    };

    const handleCancelEdit = () => {
        setEditingEntry(null);
        setTerm('');
        setDefinition('');
        setCaseSensitive(false);
        setError('');
    };

    const isTermUnique = (checkTerm: string, id?: string): boolean => {
        const termToCompare = checkTerm.trim();
        return !dictionaryArray.some(e => {
            const existingTerm = e.term;
            const termsMatch = caseSensitive
                ? existingTerm === termToCompare
                : existingTerm.toLowerCase() === termToCompare.toLowerCase();
            return termsMatch && e.id !== id;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!term.trim()) {
            setError('Term cannot be empty.');
            return;
        }
        if (!isTermUnique(term, editingEntry?.id)) {
            setError('A term with this name already exists.');
            return;
        }
        
        const payload: DictionaryEntry = {
            id: editingEntry?.id || generateId('dict'),
            term: term.trim(),
            definition: definition.trim(),
            caseSensitive,
        };
        dispatch(saveDictionaryEntry(payload));
        handleCancelEdit();
    };

    const handleDelete = (id: string) => {
        const entryToDelete = dictionary[id];
        if (!entryToDelete) return;

        showConfirm({
            title: "Delete Dictionary Term?",
            message: "Are you sure? This term will no longer be highlighted in your manuscript. This action can be undone.",
            onConfirm: () => {
                const trashedItem: TrashedItem = { item: entryToDelete, itemType: 'DictionaryEntry', deletedAt: new Date().toISOString() };
                dispatch(removeItem(trashedItem));
            },
        });
    };
    
    const handleExport = (format: 'json' | 'csv') => {
        exportDictionary(dictionary, format);
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const importedEntries = await importDictionary(file);
            // Simple merge: overwrite duplicates, add new. Could be enhanced with a confirmation.
            dispatch(importDictionaryEntries(importedEntries));
        } catch (e) {
            const message = e instanceof Error ? e.message : 'An unknown error occurred.';
            showConfirm({ title: 'Import Error', message });
        }
        
        // Reset file input
        if (event.target) {
            event.target.value = '';
        }
    };

    return (
        <div className="p-4 md:p-8 h-full flex flex-col">
            <h2 className="text-3xl font-bold text-text-main mb-4 flex-shrink-0">{t('dictionary.title')}</h2>
            <p className="text-text-secondary mb-6 flex-shrink-0">{t('dictionary.description')}</p>
            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
                <div className="md:col-span-2 bg-secondary p-4 rounded-lg border border-border-color h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4 flex-shrink-0">
                        <h3 className="text-xl font-semibold text-text-main">{t('dictionary.allTerms')} ({dictionaryArray.length})</h3>
                        <div className="flex gap-2">
                             <Button variant="secondary" size="sm" onClick={() => handleExport('csv')}><DownloadIcon className="w-4 h-4 mr-1"/> Export CSV</Button>
                            <Button variant="secondary" size="sm" onClick={() => handleExport('json')}><DownloadIcon className="w-4 h-4 mr-1"/> Export JSON</Button>
                            <Button variant="secondary" size="sm" onClick={() => importInputRef.current?.click()}>
                                <UploadIcon className="w-4 h-4 mr-1"/> Import
                            </Button>
                            <input type="file" ref={importInputRef} className="hidden" accept=".json,.csv" onChange={handleImport} />
                        </div>
                    </div>
                    <div className="flex-grow overflow-y-auto pr-2">
                        {dictionaryArray.length > 0 ? (
                            <div className="space-y-2">
                                {dictionaryArray.map(entry => (
                                    <div key={entry.id} className="flex justify-between items-start p-3 rounded-md hover:bg-border-color group">
                                        <div>
                                            <p className="font-semibold text-text-main">{entry.term}</p>
                                            <p className="text-sm text-text-secondary mt-1">{entry.definition}</p>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-4">
                                            <Button variant="ghost" size="sm" onClick={() => handleSelectForEdit(entry)}>Edit</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={<AtSignIcon className="w-16 h-16" />}
                                title={t('dictionary.empty.title')}
                                description={t('dictionary.empty.description')}
                            />
                        )}
                    </div>
                </div>
                <div className="bg-secondary p-4 rounded-lg border border-border-color">
                    <h3 className="text-xl font-semibold text-text-main mb-4">{editingEntry ? t('dictionary.edit.title') : t('dictionary.create.title')}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="dict-term" className="block text-sm font-medium text-text-secondary">{t('dictionary.term')}</label>
                            <Input id="dict-term" type="text" value={term} onChange={e => { setTerm(e.target.value); setError(''); }} placeholder={t('dictionary.term.placeholder')} error={!!error} />
                            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                        </div>
                        <div>
                            <label htmlFor="dict-def" className="block text-sm font-medium text-text-secondary">{t('dictionary.definition')}</label>
                            <Textarea id="dict-def" value={definition} onChange={e => setDefinition(e.target.value)} rows={5} placeholder={t('dictionary.definition.placeholder')} />
                        </div>
                        <div className="flex items-center">
                            <input id="dict-case" type="checkbox" checked={caseSensitive} onChange={e => setCaseSensitive(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent" />
                            <label htmlFor="dict-case" className="ml-2 text-sm">{t('dictionary.caseSensitive')}</label>
                            {!caseSensitive && (
                                <span className="ml-2 text-text-secondary" title="Uniqueness check will be case-insensitive.">
                                    <HelpCircleIcon className="w-4 h-4"/>
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <Button type="submit" className="flex-grow">{editingEntry ? t('common.saveChanges') : t('dictionary.create.button')}</Button>
                            {editingEntry && <Button type="button" variant="ghost" onClick={handleCancelEdit}>{t('common.cancel')}</Button>}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DictionaryView;
