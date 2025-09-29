import React from 'react';
import { CharacterEntity } from '../../../types';
import CharacterArcChart from '../../common/CharacterArcChart';
import CharacterArc from './CharacterArc';
import CharacterPrompts from './CharacterPrompts';
import EntityAssociations from './EntityAssociations';
import { useI18n } from '../../../hooks/useI18n';
import GenericEntityDetail from './GenericEntityDetail';
import { useLifeEvents } from '../../../hooks/useLifeEvents';
import { formatWorldDate } from '../../../utils';
import { useAppSelector } from '../../../state/hooks';

interface CharacterDetailProps {
    entity: CharacterEntity;
}

const CharacterVitals: React.FC<{ entity: CharacterEntity }> = ({ entity }) => {
    const { calendar } = useAppSelector(state => state.bible.present.project);
    const { t } = useI18n();
    const { birthEvent, deathEvent, status, ageString } = useLifeEvents(entity.id);

    return (
        <details open>
            <summary className="text-xl font-semibold mb-2 cursor-pointer">{t('entityDetail.vitals.title')}</summary>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-secondary p-4 mt-2 rounded-md border border-border-color">
                <div>
                    <h4 className="text-sm font-semibold text-text-secondary">{t('entityDetail.vitals.status')}</h4>
                    <p className="text-text-main">{t(status)}</p>
                </div>
                 <div>
                    <h4 className="text-sm font-semibold text-text-secondary">{t('entityDetail.vitals.age')}</h4>
                    <p className="text-text-main">{ageString}</p>
                </div>
                 <div>
                    <h4 className="text-sm font-semibold text-text-secondary">{t('entityDetail.vitals.born')}</h4>
                    <p className="text-text-main">{birthEvent ? formatWorldDate(birthEvent.startDateTime, calendar) : 'N/A'}</p>
                </div>
                 <div>
                    <h4 className="text-sm font-semibold text-text-secondary">{t('entityDetail.vitals.died')}</h4>
                    <p className="text-text-main">{deathEvent ? formatWorldDate(deathEvent.startDateTime, calendar) : 'N/A'}</p>
                </div>
            </div>
        </details>
    );
};


const CharacterDetail: React.FC<CharacterDetailProps> = ({ entity }) => {
    const { t } = useI18n();
    const { themes, conflicts } = useAppSelector(state => state.bible.present.metadata);
    
    return (
        <GenericEntityDetail entity={entity}>
            {({ draft, updateDraft, highlightElement }) => (
                <>
                    <CharacterVitals entity={entity} />
                    <details open>
                         <summary className="text-xl font-semibold mb-2 cursor-pointer">{t('entityDetail.themes.title')}</summary>
                        <EntityAssociations
                            label=""
                            itemTypeName={t('common.theme')}
                            allItems={Object.values(themes)}
                            selectedIds={(draft as CharacterEntity).themeIds}
                            onUpdate={(newIds) => updateDraft('themeIds', newIds)}
                            chipColorClass="bg-purple-500/20 text-purple-300"
                        />
                    </details>
                    <details open>
                        <summary className="text-xl font-semibold mb-2 cursor-pointer">{t('entityDetail.conflicts.title')}</summary>
                        <EntityAssociations
                            label=""
                            itemTypeName={t('common.conflict')}
                            allItems={Object.values(conflicts)}
                            selectedIds={(draft as CharacterEntity).conflictIds}
                            onUpdate={(newIds) => updateDraft('conflictIds', newIds)}
                            chipColorClass="bg-red-500/20 text-red-300"
                        />
                    </details>
                    <CharacterArcChart entity={entity} highlightElement={highlightElement} />
                    <details open>
                        <summary className="text-xl font-semibold mb-2 cursor-pointer">{t('entityDetail.arc.title')}</summary>
                        <CharacterArc entity={entity} draft={draft as CharacterEntity} updateDraft={updateDraft} />
                    </details>
                    <details open>
                        <summary className="text-xl font-semibold mb-2 cursor-pointer">{t('entityDetail.prompts.title')}</summary>
                        <CharacterPrompts prompts={(draft as CharacterEntity).prompts || {}} updateDraft={updateDraft} />
                    </details>
                </>
            )}
        </GenericEntityDetail>
    );
};

export default CharacterDetail;
