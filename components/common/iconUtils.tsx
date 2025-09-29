import React from 'react';
import {
    UserIcon, MapPinIcon, DiamondIcon, UsersIcon, BookIcon, SparklesIcon,
    SwordIcon, LayoutGridIcon, PieChartIcon, BarChartIcon, HomeIcon, CastleIcon, MountainIcon
} from './Icons';
import { EntityTypeDefinition } from '../../types';

export const availableIcons: Record<string, React.FC<{className?: string}>> = {
    UserIcon,
    MapPinIcon,
    DiamondIcon,
    UsersIcon,
    BookIcon,
    SparklesIcon,
    SwordIcon,
    HomeIcon,
    CastleIcon,
    MountainIcon,
    LayoutGridIcon,
    PieChartIcon,
    BarChartIcon,
};

export const getIconComponent = (iconName: string, props: { className?: string }): React.ReactNode => {
    const IconComponent = availableIcons[iconName];
    return IconComponent ? <IconComponent {...props} /> : null;
};

export const getEntityIcon = (typeKey: string, entityTypes: EntityTypeDefinition[], className?: string): React.ReactNode => {
    const typeDef = entityTypes.find(t => t.key === typeKey);
    if (!typeDef) return <UserIcon className={className} />; // Fallback icon
    return getIconComponent(typeDef.icon, { className });
};