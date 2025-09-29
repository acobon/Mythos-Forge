import React from 'react';

interface IconProps {
    className?: string;
}

export const Heading2Icon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M21 18h-4a2 2 0 1 1 0-4h4v-4a2 2 0 0 0-4-2h-1"/></svg>
);