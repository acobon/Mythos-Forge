import React, { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, children }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary p-8 animate-fade-in">
      <div className="w-16 h-16 mb-4 text-text-secondary/70">
        {icon}
      </div>
      <h2 className="text-2xl font-semibold text-text-main mb-2">{title}</h2>
      <div className="max-w-md">
        <p>{description}</p>
      </div>
      {children && (
        <div className="mt-6 flex flex-wrap justify-center gap-4">
            {children}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
