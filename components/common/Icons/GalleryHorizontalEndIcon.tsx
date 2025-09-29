// components/common/Icons/GalleryHorizontalEndIcon.tsx
import React from 'react';

interface IconProps {
    className?: string;
}

export const GalleryHorizontalEndIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M2 7v10" />
        <path d="M6 5v14" />
        <rect width="12" height="18" x="10" y="3" rx="2" />
    </svg>
);