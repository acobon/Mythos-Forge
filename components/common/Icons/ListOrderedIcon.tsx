import React from 'react';

interface IconProps {
    className?: string;
}

export const ListOrderedIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line>
        <path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4l2-2h-2v-2"/>
    </svg>
);
