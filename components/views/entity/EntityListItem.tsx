import React, { useRef, useEffect, forwardRef, memo } from 'react';
import { Entity, EntityId, EntityTypeDefinition } from '../../../types';
import { PlusCircleIcon } from '../../common/Icons';
import { getIconComponent } from '../../common/iconUtils';
import { useI18n } from '../../../hooks/useI18n';
import { useOnboarding } from '../../../contexts/OnboardingContext';
import { middleTruncate } from '../../../utils';
import { useStoredImage } from '../../../hooks/useStoredImage';
import { useAppSelector } from '../../../state/hooks';

type ItemType = { type: 'header'; entityType: EntityTypeDefinition } | { type: 'entity'; entity: Entity } | { type: 'placeholder', entityType: EntityTypeDefinition, placeholderText: string };

interface EntityListItemProps {
    item: ItemType;
    isSelected: boolean;
    onSelect: (id: EntityId) => void;
    onAdd: (type: string) => void;
}

const EntityAvatarIcon: React.FC<{ entity: Entity; isSelected: boolean }> = ({ entity, isSelected }) => {
    const { entityTypes } = useAppSelector(state => state.bible.present.entities);
    const imageUrl = useStoredImage(entity.avatar);
    const typeDef = entityTypes.find(t => t.key === entity.type);
    
    if (imageUrl) {
        return <img src={imageUrl} alt={entity.name} className="w-6 h-6 rounded-full mr-2 object-cover flex-shrink-0" />;
    }
    
    if (typeDef) {
        return (
            <div className="w-5 h-5 mr-2 flex-shrink-0">
                {getIconComponent(typeDef.icon, { className: `w-5 h-5 ${isSelected ? 'text-white/70' : 'text-text-secondary/70'}` })}
            </div>
        );
    }

    return null;
};


const EntityListItem: React.ForwardRefRenderFunction<HTMLButtonElement, EntityListItemProps> = ({ item, isSelected, onSelect, onAdd }, ref) => {
    const { t } = useI18n();
    const { register } = useOnboarding();
    const headerButtonRef = useRef<HTMLButtonElement>(null);
    const onboardingRef = useRef<HTMLButtonElement>(null);
    
    const onboardingKey = item.type === 'entity' && isSelected ? 'selected-entity-item' : undefined;
    
    useEffect(() => {
        const currentRef = onboardingRef.current;
        if (onboardingKey && currentRef) {
            register(onboardingKey, currentRef);
            return () => {
                register(onboardingKey, null);
            };
        }
    }, [onboardingKey, register]);

    const headerOnboardingKey = item.type === 'header' && item.entityType.key === 'character' ? 'add-character' : undefined;
    useEffect(() => {
        if (headerOnboardingKey && headerButtonRef.current) {
            register(headerOnboardingKey, headerButtonRef.current);
            return () => {
                register(headerOnboardingKey, null);
            };
        }
    }, [headerOnboardingKey, register]);
    
    if (item.type === 'header') {
        return (
            <div className="flex justify-between items-center w-full pr-2">
                <h3 className="text-lg font-semibold text-text-secondary flex items-center">
                    {getIconComponent(item.entityType.icon, { className: "w-5 h-5 mr-2"})}
                    {item.entityType.name}s
                </h3>
                <button 
                    ref={headerButtonRef}
                    onClick={() => onAdd(item.entityType.key)} 
                    className="p-1 rounded-md text-text-secondary hover:text-text-main hover:bg-highlight transition-colors"
                    aria-label={t('entityList.add', { entityType: item.entityType.name })}
                >
                    <PlusCircleIcon className="w-5 h-5" />
                </button>
            </div>
        );
    }

    if (item.type === 'placeholder') {
         return (
            <div className="px-2 py-2 flex items-center w-full">
                <p className="text-sm text-text-secondary/70">{item.placeholderText}</p>
            </div>
         );
    }

    const entity = item.entity;
    
    return (
         <button
            ref={(node: HTMLButtonElement) => {
                (onboardingRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
                if (typeof ref === 'function') {
                    ref(node);
                } else if (ref) {
                    ref.current = node;
                }
            }}
            onClick={() => onSelect(entity.id)}
            className={`w-full h-full text-left px-2 rounded-md transition-colors flex items-center ${isSelected ? 'bg-accent text-white font-semibold' : 'hover:bg-border-color'}`}
            data-entity-id={entity.id}
            aria-current={isSelected ? 'true' : 'false'}
        >
            <EntityAvatarIcon entity={entity} isSelected={isSelected} />
            <span className="truncate" title={entity.name}>{middleTruncate(entity.name, 40)}</span>
        </button>
    );
};

export default memo(forwardRef(EntityListItem));
