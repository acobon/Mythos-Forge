import React from 'react';

interface IconProps {
    className?: string;
}

export const Heading1Icon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M17 12h2a2 2 0 1 0 0-4h-2v8"/></svg>
);