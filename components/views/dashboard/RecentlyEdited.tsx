// components/views/dashboard/RecentlyEdited.tsx
import React, { useMemo } from 'react';
import { useAppSelector } from '../../../state/hooks';
import { getTypedObjectValues } from '../../../utils';
import { useI18n } from '../../../hooks/useI18n';
import { useNavigation } from '../../../hooks/useNavigation';
import { Entity, NarrativeScene, ResearchNote, Work } from '../../../types';

type EditableItem = {
    id: string;
    name: string;
    type: string;
    lastModified: string;
    item: Entity | NarrativeScene | ResearchNote;
};

const RecentlyEdited: React.FC = () => {
    const { t } = useI18n();
    const { navigateToEntity, navigateToScene, navigateToNote } = useNavigation();
    const { entities } = useAppSelector(state => state.bible.present.entities);
    const { scenes, works } = useAppSelector(state => state.bible.present.narrative);
    const { researchNotes } = useAppSelector(state => state.bible.present.knowledge);

    const sceneToWorkMap = useMemo(() => {
        const map = new Map<string, string>();
        (getTypedObjectValues(works) as Work[]).forEach(work => {
            const allSceneIds = new Set([...work.sceneIds, ...work.chapters.flatMap(c => c.sceneIds)]);
            allSceneIds.forEach(sceneId => map.set(sceneId, work.id));
        });
        return map;
    }, [works]);

    const recentItems = useMemo(() => {
        const allItems: EditableItem[] = [
            ...(getTypedObjectValues(entities) as Entity[]).map(e => ({ id: e.id, name: e.name, type: e.type, lastModified: e.lastModified, item: e })),
            ...(getTypedObjectValues(scenes) as NarrativeScene[]).map(s => ({ id: s.id, name: s.title, type: 'Scene', lastModified: s.lastModified, item: s })),
            ...(getTypedObjectValues(researchNotes) as ResearchNote[]).map(n => ({ id: n.id, name: n.title, type: 'Note', lastModified: n.lastModified, item: n })),
        ];

        return allItems.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()).slice(0, 5);
    }, [entities, scenes, researchNotes]);

    const handleNavigate = (item: EditableItem) => {
        switch(item.type) {
            case 'Scene': {
                const workId = sceneToWorkMap.get(item.id);
                if (workId) navigateToScene(workId, item.id);
                break;
            }
            case 'Note':
                navigateToNote(item.id);
                break;
            default: // It's an entity type
                navigateToEntity(item.id);
                break;
        }
    };

    return (
        <section>
            <h3 className="text-xl font-semibold text-text-secondary mb-3">{t('dashboard.recentlyEdited.title')}</h3>
            <div className="bg-secondary p-4 rounded-lg border border-border-color space-y-2">
                {recentItems.length > 0 ? (
                    recentItems.map(item => (
                        <button key={item.id} onClick={() => handleNavigate(item)} className="w-full text-left p-2 rounded-md hover:bg-primary">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-text-main truncate">{item.name}</span>
                                <span className="text-xs text-text-secondary capitalize">{item.type}</span>
                            </div>
                        </button>
                    ))
                ) : (
                    <p className="text-sm text-text-secondary text-center p-4">{t('dashboard.recentlyEdited.empty')}</p>
                )}
            </div>
        </section>
    );
};

export default RecentlyEdited;