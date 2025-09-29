import React, { useMemo } from 'react';
import { Entity, EntityId, RelationshipListItem } from '../../../types/index';
import { LinkIcon } from '../../common/Icons';
import { useI18n } from '../../../hooks/useI18n';
import EmptyState from '../../common/EmptyState';

interface EntityRelationshipsProps {
  entity: Entity;
  relationships: RelationshipListItem[];
  onSelectEntity: (id: EntityId) => void;
}

const EntityRelationships: React.FC<EntityRelationshipsProps> = ({ entity, relationships, onSelectEntity }) => {
  const { t } = useI18n();
  
  const filteredRelationships = useMemo(() => {
    return relationships
      .filter(rel => rel.entity1.id === entity.id || rel.entity2.id === entity.id)
      .map(rel => {
        const otherEntity = rel.entity1.id === entity.id ? rel.entity2 : rel.entity1;
        return {
          entityId: otherEntity.id,
          name: otherEntity.name,
          type: rel.label,
          isExplicit: rel.isExplicit,
        };
      })
      .sort((a,b) => a.name.localeCompare(b.name));
  }, [relationships, entity.id]);

  return (
    <section>
      <h3 className="text-xl font-semibold mb-2">{t('entityDetail.relationships.title')}</h3>
      <div className="bg-secondary p-4 rounded-md border border-border-color">
        {filteredRelationships.length > 0 ? (
          <ul className="space-y-2">
            {filteredRelationships.map(rel => (
              <li key={rel.entityId} className="flex items-center justify-between p-2 rounded-md hover:bg-border-color">
                <button onClick={() => onSelectEntity(rel.entityId)} className="font-semibold text-accent hover:underline">
                  {rel.name}
                </button>
                <div className="flex items-center gap-2">
                  {rel.isExplicit && <span title="Explicit Relationship"><LinkIcon className="w-4 h-4 text-text-secondary flex-shrink-0" /></span>}
                  <span className="text-sm text-text-secondary capitalize text-right">{rel.type}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<LinkIcon className="w-12 h-12" />}
            title={t('entityDetail.relationships.empty')}
            description={t('entityDetail.relationships.empty.subtitle')}
          />
        )}
      </div>
    </section>
  );
};

export default EntityRelationships;