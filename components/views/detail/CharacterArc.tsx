

// components/views/detail/CharacterArc.tsx
import React from 'react';
import { CharacterEntity, EntityId, NarrativeScene, HistoricalEvent, TranslationKey, CharacterArcStageDetail } from '../../../types';
import { TextareaWithMentions } from '../../common/TextareaWithMentions';
import EntityAssociations from './EntityAssociations';
import { useI18n } from '../../../hooks/useI18n';
import { useAppSelector } from '../../../state/hooks';
import { getTypedObjectValues } from '../../../utils';

interface CharacterArcProps {
    entity: CharacterEntity;
    draft: CharacterEntity;
    updateDraft: (field: string, value: any) => void;
}

const ARCS: { key: string; label: TranslationKey }[] = [
  { key: 'incitingIncident', label: 'entityDetail.arc.incitingIncident' },
  { key: 'risingAction', label: 'entityDetail.arc.risingAction' },
  { key: 'midpoint', label: 'entityDetail.arc.midpoint' },
  { key: 'darkMoment', label: 'entityDetail.arc.darkMoment' },
  { key: 'climax', label: 'entityDetail.arc.climax' },
  { key: 'fallingAction', label: 'entityDetail.arc.fallingAction' },
  { key: 'resolution', label: 'entityDetail.arc.resolution' },
];

const ArcStageEditor: React.FC<{
    stageKey: string;
    label: string;
    stageData?: CharacterArcStageDetail;
    onUpdate: (updates: Partial<CharacterArcStageDetail>) => void;
}> = ({ stageKey, label, stageData, onUpdate }) => {
    const { scenes } = useAppSelector(state => state.bible.present.narrative);
    const { events } = useAppSelector(state => state.bible.present.events);
    const { t } = useI18n();

    const allScenes = React.useMemo(() => (getTypedObjectValues(scenes) as NarrativeScene[]).map(s => ({ id: s.id, name: s.title })), [scenes]);
    const allEvents = React.useMemo(() => (getTypedObjectValues(events) as HistoricalEvent[]).map(e => ({ id: e.id, name: e.description })), [events]);
    
    return (
        <div className="bg-primary p-3 rounded-md border border-border-color">
            <h4 className="font-semibold text-text-main">{label}</h4>
            <div className="mt-2 space-y-3">
                <TextareaWithMentions 
                    value={stageData?.description || ''}
                    onValueChange={(val) => onUpdate({ description: val })}
                    placeholder="Describe what happens in this stage..."
                    rows={2}
                    className="w-full bg-secondary border border-border-color rounded-md p-2 text-sm"
                />
                 <EntityAssociations
                    label={t('entityDetail.arc.scenes')}
                    itemTypeName="Scene"
                    allItems={allScenes}
                    selectedIds={stageData?.linkedSceneIds}
                    onUpdate={(newIds) => onUpdate({ linkedSceneIds: newIds })}
                    chipColorClass="bg-blue-500/20 text-blue-300"
                />
                 <EntityAssociations
                    label={t('entityDetail.arc.events')}
                    itemTypeName="Event"
                    allItems={allEvents}
                    selectedIds={stageData?.linkedEventIds}
                    onUpdate={(newIds) => onUpdate({ linkedEventIds: newIds })}
                    chipColorClass="bg-green-500/20 text-green-300"
                />
                <div>
                    <label htmlFor={`${stageKey}-value`} className="text-sm font-medium text-text-secondary">Emotional Value (-10 to 10)</label>
                    <input id={`${stageKey}-value`} type="range" min="-10" max="10" value={stageData?.emotionalValue ?? 0}
                           onChange={e => onUpdate({ emotionalValue: parseInt(e.target.value, 10) })}
                           className="w-full h-2 bg-border-color rounded-lg appearance-none cursor-pointer mt-1 accent-accent"
                    />
                </div>
            </div>
        </div>
    );
};

const CharacterArc: React.FC<CharacterArcProps> = ({ draft, updateDraft }) => {
    const { t } = useI18n();

    const updateArc = (updates: Partial<CharacterEntity['characterArc']>) => {
        updateDraft('characterArc', { ...(draft.characterArc || {}), ...updates });
    };

    const updateStage = (stageKey: string, stageUpdates: Partial<CharacterArcStageDetail>) => {
        const currentStageData = draft.characterArc?.[stageKey] || { description: '', linkedSceneIds: [], linkedEventIds: [] };
        updateArc({ [stageKey]: { ...currentStageData, ...stageUpdates } });
    };
    
    return (
        <div className="bg-secondary p-4 mt-2 rounded-md border border-border-color space-y-4">
            <div>
                <label className="block text-sm font-medium text-text-secondary">{t('entityDetail.arc.internalGoal')}</label>
                <TextareaWithMentions
                    value={draft.internalGoal || ''}
                    onValueChange={(val) => updateDraft('internalGoal', val)}
                    rows={2}
                    className="w-full mt-1 bg-primary border border-border-color rounded-md p-2"
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-text-secondary">{t('entityDetail.arc.externalGoal')}</label>
                <TextareaWithMentions
                    value={draft.externalGoal || ''}
                    onValueChange={(val) => updateDraft('externalGoal', val)}
                    rows={2}
                    className="w-full mt-1 bg-primary border border-border-color rounded-md p-2"
                />
            </div>

            <div className="space-y-3 pt-3 border-t border-border-color">
                {ARCS.map(({ key, label }) => (
                    <ArcStageEditor
                        key={key}
                        stageKey={key}
                        label={t(label)}
                        stageData={draft.characterArc?.[key]}
                        onUpdate={(updates) => updateStage(key, updates)}
                    />
                ))}
            </div>
        </div>
    );
};

export default CharacterArc;