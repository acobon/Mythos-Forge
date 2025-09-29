
import React from 'react';
import { useAppSelector, useAppDispatch } from '../../state/hooks';
import { setSelectedNoteId } from '../../state/uiSlice';
import ResearchSidebar from './research/ResearchSidebar';
import NoteDetail from './research/NoteDetail';
import EmptyState from '../common/EmptyState';
import { NotebookIcon } from '../common/Icons';
import { useI18n } from '../../hooks/useI18n';
import { getTypedObjectValues } from '../../utils';
import { ResearchNote } from '../../types';

const ResearchView: React.FC = () => {
    const researchNotes = useAppSelector(state => state.bible.present.knowledge.researchNotes);
    const selectedNoteId = useAppSelector(state => state.ui.selectedNoteId);
    const dispatch = useAppDispatch();
    const { t } = useI18n();
    
    const researchNotesArray = React.useMemo(() => getTypedObjectValues(researchNotes) as ResearchNote[], [researchNotes]);
    const selectedNote = React.useMemo(() => selectedNoteId ? researchNotes[selectedNoteId] : undefined, [researchNotes, selectedNoteId]);

    const handleSelectNote = (id: string | null) => {
        dispatch(setSelectedNoteId(id));
    };

    return (
        <div className="flex flex-col md:flex-row h-full">
            <aside className={`w-full md:w-1/3 border-r border-border-color p-4 flex flex-col ${selectedNoteId ? 'hidden md:flex' : 'flex'}`}>
                <ResearchSidebar
                    notes={researchNotesArray}
                    selectedNoteId={selectedNoteId}
                    onSelectNote={handleSelectNote}
                />
            </aside>
            <main className={`w-full md:w-2/3 flex flex-col ${selectedNoteId ? 'flex' : 'hidden md:flex'}`}>
                {selectedNote ? (
                    <NoteDetail key={selectedNote.id} note={selectedNote} />
                ) : (
                    <EmptyState
                        icon={<NotebookIcon className="w-16 h-16" />}
                        title={researchNotesArray.length > 0 ? t('research.selectNote') : t('research.noNotes')}
                        description={researchNotesArray.length > 0 ? t('research.selectNote.description') : t('research.noNotes.description')}
                    />
                )}
            </main>
        </div>
    );
};

export default ResearchView;
