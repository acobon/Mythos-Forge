import React from 'react';

interface IconProps {
    className?: string;
}

export const CastleIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M22 21v-4H2v4"/>
        <path d="M18 17V5l-4-2-4 2v12"/>
        <path d="M10 17V5l-4-2-4 2v12"/>
        <path d="M14 17V9"/>
        <path d="M6 17V9"/>
    </svg>
);
