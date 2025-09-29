
import React, { useState, useEffect, useMemo } from 'react';
import { NarrativeScene, EntityId, EntityType, Entity, Theme, Conflict, HistoricalEvent, FormFieldType } from '../../types/index';
import EntityAssociations from '../views/detail/EntityAssociations';
import { getTypedObjectValues } from '../../utils';
import { useAppSelector } from '../../state/hooks';
import { Input, Textarea, Select, Button } from '../common/ui';
import { useFormValidation } from '../../hooks/useFormValidation';

interface NarrativeSceneFormProps {
    plotId: string;
    onSave: (plotId: string, scene: Partial<NarrativeScene> & { title: string }) => void;
    onClose: () => void;
    sceneToEdit?: NarrativeScene | null;
}

const NarrativeSceneForm: React.FC<NarrativeSceneFormProps> = ({ plotId, onSave, onClose, sceneToEdit }) => {
    const { entities } = useAppSelector(state => state.bible.present.entities);
    const { events } = useAppSelector(state => state.bible.present.events);
    const { themes, conflicts } = useAppSelector(state => state.bible.present.metadata);

    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [povEntityId, setPovEntityId] = useState<EntityId | undefined>(undefined);
    const [involvedEntityIds, setInvolvedEntityIds] = useState<EntityId[]>([]);
    const [linkedEventIds, setLinkedEventIds] = useState<string[]>([]);
    const [themeIds, setThemeIds] = useState<string[]>([]);
    const [conflictIds, setConflictIds] = useState<string[]>([]);
    
    const validationSchema = useMemo(() => ({
        title: { field: { fieldName: 'title', label: 'Title', fieldType: 'text' as FormFieldType, validation: { required: true } } }
    }), []);
    const { errors, validate, clearError } = useFormValidation(validationSchema);
    
    useEffect(() => {
        if (sceneToEdit) {
            setTitle(sceneToEdit.title);
            setSummary(sceneToEdit.summary || '');
            setPovEntityId(sceneToEdit.povEntityId);
            setInvolvedEntityIds(sceneToEdit.involvedEntityIds || []);
            setLinkedEventIds(sceneToEdit.linkedEventIds || []);
            setThemeIds(sceneToEdit.themeIds || []);
            setConflictIds(sceneToEdit.conflictIds || []);
        }
    }, [sceneToEdit]);

    const characters = useMemo(() => (getTypedObjectValues(entities) as Entity[]).filter(e => e.type === EntityType.CHARACTER), [entities]);
    
    const toggleSelection = (id: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
        setList(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate({ title })) return;

        onSave(plotId, {
            id: sceneToEdit?.id,
            title,
            summary,
            povEntityId,
            involvedEntityIds,
            linkedEventIds,
            content: sceneToEdit?.content || '',
            themeIds,
            conflictIds,
        });
    };
    
    const entitiesArray = useMemo(() => getTypedObjectValues(entities) as Entity[], [entities]);
    const eventsArray = useMemo(() => getTypedObjectValues(events) as HistoricalEvent[], [events]);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="sceneTitle" className="block text-sm font-medium text-text-secondary">Scene Title</label>
                <Input id="sceneTitle" type="text" value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setTitle(e.target.value); clearError('title'); }} placeholder="e.g., The Confrontation" className="mt-1" error={!!errors.title} autoFocus />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>
            
            <div>
                <label htmlFor="sceneSummary" className="block text-sm font-medium text-text-secondary">Summary (Optional)</label>
                <Textarea id="sceneSummary" value={summary} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSummary(e.target.value)} rows={2} placeholder="A brief one-sentence summary of the scene." className="mt-1" />
            </div>

             <div>
                <label htmlFor="scenePov" className="block text-sm font-medium text-text-secondary">Point-of-View Character (Optional)</label>
                <Select id="scenePov" value={povEntityId || ''} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPovEntityId(e.target.value || undefined)} className="mt-1">
                    <option value="">None</option>
                    {characters.map(char => <option key={char.id} value={char.id}>{char.name}</option>)}
                </Select>
            </div>

            <EntityAssociations
                label="Themes"
                itemTypeName="Theme"
                allItems={getTypedObjectValues(themes) as Theme[]}
                selectedIds={themeIds}
                onUpdate={setThemeIds}
                chipColorClass="bg-purple-500/20 text-purple-300"
            />

            <EntityAssociations
                label="Conflicts"
                itemTypeName="Conflict"
                allItems={getTypedObjectValues(conflicts) as Conflict[]}
                selectedIds={conflictIds}
                onUpdate={setConflictIds}
                chipColorClass="bg-red-500/20 text-red-300"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-text-secondary">Other Involved Entities</label>
                    <div className="mt-1 w-full max-h-40 overflow-y-auto bg-primary border border-border-color rounded-md p-2 space-y-1">
                        {entitiesArray.length > 0 ? (
                            entitiesArray.map(entity => (
                                <button type="button" key={entity.id} onClick={() => toggleSelection(entity.id, involvedEntityIds, setInvolvedEntityIds)} className={`w-full text-left p-2 text-sm rounded-md transition-colors ${involvedEntityIds.includes(entity.id) ? 'bg-accent text-white' : 'hover:bg-secondary'}`}>
                                    {entity.name} <span className="text-xs opacity-70">({entity.type})</span>
                                </button>
                            ))
                        ) : (
                            <p className="text-sm text-center text-text-secondary p-4">No entities to link.</p>
                        )}
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-text-secondary">Linked Historical Events</label>
                    <div className="mt-1 w-full max-h-40 overflow-y-auto bg-primary border border-border-color rounded-md p-2 space-y-1">
                        {eventsArray.length > 0 ? (
                            eventsArray.map(event => (
                                <button type="button" key={event.id} onClick={() => toggleSelection(event.id, linkedEventIds, setLinkedEventIds)} className={`w-full text-left p-2 text-sm rounded-md transition-colors ${linkedEventIds.includes(event.id) ? 'bg-accent text-white' : 'hover:bg-secondary'}`}>
                                    {event.description.substring(0, 50)}...
                                </button>
                            ))
                        ) : (
                            <p className="text-sm text-center text-text-secondary p-4">No events to link.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end items-center pt-2">
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit" className="ml-2">
                    Save Scene Details
                </Button>
            </div>
        </form>
    );
};

export default NarrativeSceneForm;
