import React from 'react';

interface IconProps {
    className?: string;
}

export const BrainCircuitIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 5a3 3 0 1 0-5.993.131M12 5a3 3 0 1 0 5.993.131M12 19a3 3 0 1 0-5.993-.131M12 19a3 3 0 1 0 5.993-.131M17 12a3 3 0 1 0 .131-5.993M17 12a3 3 0 1 0-.131 5.993M7 12a3 3 0 1 0 .131 5.993M7 12a3 3 0 1 0-.131-5.993"/><path d="M12 5v14"/><path d="M7 12H5"/><path d="M9 12h6"/><path d="M17 12h2"/><path d="m14 7 2-2"/><path d="m10 7-2-2"/><path d="m14 17 2 2"/><path d="m10 17-2 2"/></svg>
);