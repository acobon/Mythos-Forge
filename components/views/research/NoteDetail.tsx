
// components/views/research/NoteDetail.tsx
import React, { useState, useEffect } from 'react';
import { ResearchNote, Tag } from '../../../types';
import { useAppSelector, useAppDispatch } from '../../../state/hooks';
import { useResearchActions } from '../../../hooks/useResearchActions';
import { useTagActions } from '../../../hooks/useTagActions';
import { useDebounce } from '../../../hooks/useDebounce';
import RichTextEditor from '../../common/RichTextEditor';
import EntityAssociations from '../detail/EntityAssociations';
import { getTypedObjectValues, generateTagColor } from '../../../utils';
import { TrashIcon } from '../../common/Icons';
import { Input, Button } from '../../common/ui';
import { showDialog } from '../../../state/uiSlice';

interface NoteDetailProps {
    note: ResearchNote;
}

const NoteDetail: React.FC<NoteDetailProps> = ({ note }) => {
    const dispatch = useAppDispatch();
    const { entities } = useAppSelector(state => state.bible.present.entities);
    const { tags } = useAppSelector(state => state.bible.present.metadata);
    const { updateResearchNote, deleteResearchNote } = useResearchActions();
    const { createTag } = useTagActions();
    
    const allTagsArray = React.useMemo(() => getTypedObjectValues(tags) as Tag[], [tags]);
    const tagMap = React.useMemo(() => new Map(allTagsArray.map(t => [t.id, t])), [allTagsArray]);

    const [draftTitle, setDraftTitle] = useState(note.title);
    const [draftContent, setDraftContent] = useState(note.content);
    const [draftJsonContent, setDraftJsonContent] = useState<any>(note.jsonContent || null);

    const debouncedTitle = useDebounce(draftTitle, 750);
    const debouncedContent = useDebounce(draftContent, 750);
    const debouncedJsonContent = useDebounce(draftJsonContent, 750);

    useEffect(() => {
        const hasTitleChanged = debouncedTitle !== note.title;
        const hasContentChanged = debouncedContent !== note.content;

        if(hasTitleChanged || hasContentChanged) {
            const updates: Partial<ResearchNote> = {};
            if (hasTitleChanged) updates.title = debouncedTitle;
            if (hasContentChanged) {
                updates.content = debouncedContent;
                updates.jsonContent = debouncedJsonContent;
            }
            updateResearchNote(note.id, updates);
        }
    }, [debouncedTitle, debouncedContent, debouncedJsonContent, note, updateResearchNote]);

    const handleDelete = () => {
        dispatch(showDialog({
            title: "Delete Research Note?",
            message: "Are you sure you want to permanently delete this note? This action can be undone.",
            onConfirm: () => deleteResearchNote(note.id)
        }));
    };

    const handleCreateTag = (name: string): Tag | undefined => {
        const newColor = generateTagColor(allTagsArray.length);
        return createTag(name, newColor);
    };

    return (
        <div className="p-4 md:p-6 flex-grow flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <Input
                    type="text"
                    value={draftTitle}
                    onChange={e => setDraftTitle(e.target.value)}
                    className="text-2xl font-bold bg-transparent focus:outline-none w-full !p-0 !border-0"
                    aria-label="Note Title"
                />
                <Button variant="ghost" size="icon" onClick={handleDelete}><TrashIcon className="w-5 h-5"/></Button>
            </div>
            <div className="mb-4 flex-shrink-0">
                <EntityAssociations
                    label="Tags"
                    itemTypeName="Tag"
                    allItems={allTagsArray.map(tag => ({ id: tag.id, name: tag.label }))}
                    selectedIds={note.tagIds}
                    onUpdate={newTagIds => updateResearchNote(note.id, { tagIds: newTagIds })}
                    chipColorClass="bg-gray-500/20 text-gray-300"
                    onCreateNew={(name) => {
                        const newTag = handleCreateTag(name);
                        if (newTag) updateResearchNote(note.id, { tagIds: [...(note.tagIds || []), newTag.id] });
                    }}
                    tagMap={tagMap}
                />
            </div>
            <div className="flex-grow overflow-hidden">
                <RichTextEditor
                    value={draftContent}
                    onValueChange={updates => {
                        setDraftContent(updates.html);
                        setDraftJsonContent(updates.json);
                    }}
                    entities={useAppSelector(state => state.bible.present.entities.entities)}
                    placeholder="Start your research note..."
                />
            </div>
        </div>
    );
};

export default NoteDetail;
