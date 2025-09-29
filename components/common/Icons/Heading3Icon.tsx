import React from 'react';

interface IconProps {
    className?: string;
}

export const Heading3Icon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M4 12h8"/>
        <path d="M4 18V6"/>
        <path d="M12 18V6"/>
        <path d="M17.5 10.5c1.5-1.5 1.5-4 0-5.5-2-1.5-4.5.5-4.5 2.5 0 1.5 1 2.5 2 3"/>
        <path d="M17.5 13.5c1.5 1.5 1.5 4 0 5.5-2 1.5-4.5-.5-4.5-2.5 0-1.5 1-2.5 2-3"/>
    </svg>
);