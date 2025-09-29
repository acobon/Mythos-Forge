import React from 'react';

interface IconProps {
    className?: string;
}

export const FileSearch2Icon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <path d="M11.5 13.5a2.5 2.5 0 0 0-3.18-3.18"/>
        <path d="m15 17-1.5-1.5"/>
    </svg>
);
