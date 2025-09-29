import React from 'react';

interface IconProps {
    className?: string;
}

export const HighlighterIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m18.7 3.8-3.4 3.4"/>
        <path d="m14 2-3.4 3.4"/>
        <path d="M9 7.5 4 12.5l9 9 5-5-3.5-3.5Z"/>
    </svg>
);