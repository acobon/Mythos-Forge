// components/views/detail/EntityAppearances.tsx
import React, { useMemo } from 'react';
import { Entity, NarrativeScene, Work } from '../../../types';
import { useAppSelector } from '../../../state/hooks';
import { useNavigation } from '../../../hooks/useNavigation';
import { getTypedObjectValues } from '../../../utils';
import { useI18n } from '../../../hooks/useI18n';

interface EntityAppearancesProps {
    entity: Entity;
}

const EntityAppearances: React.FC<EntityAppearancesProps> = ({ entity }) => {
    const { works, scenes } = useAppSelector(state => state.bible.present.narrative);
    const { navigateToScene } = useNavigation();
    const { t } = useI18n();

    const appearances = useMemo(() => {
        const result: { scene: NarrativeScene; work: Work }[] = [];
        const allWorks = getTypedObjectValues(works) as Work[];
        for (const work of allWorks) {
            const allSceneIds = new Set([...work.sceneIds, ...work.chapters.flatMap(c => c.sceneIds)]);
            allSceneIds.forEach(sceneId => {
                const scene = scenes[sceneId];
                if (scene && (scene.involvedEntityIds.includes(entity.id) || scene.povEntityId === entity.id)) {
                    result.push({ scene, work });
                }
            });
        }
        return result;
    }, [entity.id, scenes, works]);

    if (appearances.length === 0) {
        return null;
    }

    return (
        <details open>
            <summary className="text-xl font-semibold mb-2 cursor-pointer">{t('entityDetail.appearances.title')} ({appearances.length})</summary>
            <div className="bg-secondary p-4 mt-2 rounded-md border border-border-color space-y-2">
                {appearances.map(({ scene, work }) => (
                    <button
                        key={scene.id}
                        onClick={() => navigateToScene(work.id, scene.id)}
                        className="w-full text-left p-2 rounded-md hover:bg-primary transition-colors"
                    >
                        <p className="font-semibold text-accent">{scene.title}</p>
                        <p className="text-xs text-text-secondary">{t('search.result.inWork', { workTitle: work.title })}</p>
                    </button>
                ))}
            </div>
        </details>
    );
};

export default EntityAppearances;
