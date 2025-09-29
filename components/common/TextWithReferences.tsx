

import React, { useMemo } from 'react';
import { EntityId, Entity } from '../../types/index';
import { useI18n } from '../../hooks/useI18n';
import { useAppSelector } from '../../state/hooks';
import { getTypedObjectValues } from '../../utils';

interface TextWithReferencesProps {
    text: string | undefined | null;
    onNavigate: (entityId: EntityId) => void;
    className?: string;
}

const TextWithReferences: React.FC<TextWithReferencesProps> = ({ text, onNavigate, className }) => {
    const { t } = useI18n();
    const entities = useAppSelector(state => state.bible.present.entities.entities);
    const entityMap = useMemo(() => new Map((getTypedObjectValues(entities) as Entity[]).map((e: Entity) => [e.id, e])), [entities]);

    if (!text) return null;
    
    const onSelectEntity = (id: EntityId) => {
        onNavigate(id);
    };

    const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = text.split(regex);
    
    const elements: React.ReactNode[] = [];
    
    for (let i = 0; i < parts.length; i += 3) {
        if (parts[i]) {
             elements.push(<span key={`part-${i}`}>{parts[i]}</span>);
        }
        
        if (i + 2 < parts.length) {
            const displayName = parts[i + 1];
            const entityId = parts[i + 2];
            const entity = entityMap.get(entityId);

            if (!entity) {
                elements.push(
                    <span
                        key={`${entityId}-${i}`}
                        className="text-text-secondary/70 line-through px-1"
                        title={t('common.deletedReferenceTooltip', { id: entityId })}
                    >
                        {displayName}
                    </span>
                );
            } else {
                 elements.push(
                    <button
                        key={`${entityId}-${i}`}
                        onClick={(e) => {
                            e.stopPropagation(); 
                            onSelectEntity(entityId);
                        }}
                        className="text-accent hover:underline font-semibold bg-transparent hover:bg-border-color transition-colors px-1 rounded-sm mx-0.5"
                    >
                        {entity.name}
                    </button>
                );
            }
        }
    }
    
    return <div className={className}>{elements}</div>;
};

export default TextWithReferences;
