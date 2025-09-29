import React from 'react';

interface IconProps {
    className?: string;
}

export const SwordIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M14.5 17.5 3 6V3h3l11.5 11.5"/>
        <path d="m21.5 14.5-5-5"/>
        <path d="m17 19-5-5"/>
        <path d="m19 17-5-5"/>
    </svg>
);
