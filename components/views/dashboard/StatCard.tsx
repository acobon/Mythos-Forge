
// components/views/dashboard/StatCard.tsx
import React from 'react';

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string | number;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, title, value }) => (
    <div className="bg-primary p-4 rounded-lg border border-border-color flex items-center space-x-4">
        <div className="text-accent">{icon}</div>
        <div>
            <p className="text-sm text-text-secondary">{title}</p>
            <p className="text-2xl font-bold text-text-main">{value}</p>
        </div>
    </div>
);
