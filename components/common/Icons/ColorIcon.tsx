import React from 'react';

interface IconProps {
    className?: string;
}

export const ColorIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m18 5-3-3-7.3 7.3a5 5 0 0 0-1.4 3.5v3.5h3.5a5 5 0 0 0 3.5-1.4Z"/>
        <path d="m19 19-3-3"/>
        <path d="m14 14 3 3"/>
        <path d="M3 21v-3.5a5 5 0 0 1 1.4-3.5L12 3"/>
    </svg>
);
