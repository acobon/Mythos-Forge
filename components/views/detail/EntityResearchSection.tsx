import React, { useMemo } from 'react';
import { Entity, ResearchNote } from '../../../types';
import { useAppSelector } from '../../../state/hooks';
import { useNavigation } from '../../../hooks/useNavigation';
import { getTypedObjectValues } from '../../../utils';
import { useI18n } from '../../../hooks/useI18n';

interface EntityResearchSectionProps {
    entity: Entity;
}

const EntityResearchSection: React.FC<EntityResearchSectionProps> = ({ entity }) => {
    const { researchNotes } = useAppSelector(state => state.bible.present.knowledge);
    const { navigateToNote } = useNavigation();
    const { t } = useI18n();

    const linkedNotes = useMemo(() => {
        return (getTypedObjectValues(researchNotes) as ResearchNote[])
            .filter(note => note.entityIds?.includes(entity.id))
            .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
    }, [researchNotes, entity.id]);

    if (linkedNotes.length === 0) {
        return null;
    }

    return (
        <section>
            <details open>
                <summary className="text-xl font-semibold mb-2 cursor-pointer">
                    Research Notes ({linkedNotes.length})
                </summary>
                <div className="bg-secondary p-4 mt-2 rounded-md border border-border-color space-y-2">
                    {linkedNotes.map(note => (
                        <button 
                            key={note.id}
                            onClick={() => navigateToNote(note.id)}
                            className="w-full text-left p-2 rounded-md hover:bg-primary transition-colors"
                        >
                            <p className="font-semibold text-accent">{note.title}</p>
                            <p className="text-xs text-text-secondary truncate">{note.content ? t('search.result.snippet', { snippet: note.content.replace(/<[^>]+>/g, '').substring(0, 100) }) : 'No content'}</p>
                        </button>
                    ))}
                </div>
            </details>
        </section>
    );
};

export default EntityResearchSection;