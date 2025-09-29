import React from 'react';

interface IconProps {
    className?: string;
}

export const PinIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 17v5"/><path d="M9 10.76A5 5 0 0 1 12 8a5 5 0 0 1 3 2.76"/><path d="M9 14h6"/><path d="M12 2v6"/><line x1="8" x2="16" y1="5" y2="5"/>
    </svg>
);