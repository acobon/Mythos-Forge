// components/views/reports/TagThemeFrequencyReport.tsx
import React from 'react';
import { TagThemeFrequencyData } from '../../../types';

const FrequencyList: React.FC<{ title: string; items: TagThemeFrequencyData['tags'] | TagThemeFrequencyData['themes'] | TagThemeFrequencyData['conflicts'] }> = ({ title, items }) => (
    <div>
        <h5 className="text-md font-bold mb-2 text-text-secondary">{title}</h5>
        {items.length > 0 ? (
            <div className="space-y-2">
                {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm p-2 bg-primary rounded-md">
                        <div className="flex items-center gap-2">
                            {item.color && <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />}
                            <span className="font-semibold">{item.name}</span>
                        </div>
                        <span className="font-mono bg-secondary px-2 py-0.5 rounded-full text-xs">{item.count}</span>
                    </div>
                ))}
            </div>
        ) : (
            <p className="text-sm text-text-secondary italic">No usage data available.</p>
        )}
    </div>
);

const TagThemeFrequencyReport: React.FC<{ data: TagThemeFrequencyData }> = ({ data }) => {
    return (
        <div>
            <h4 className="text-lg font-bold mb-2">Tag, Theme & Conflict Frequency</h4>
            <p className="text-sm text-text-secondary mb-4">Count of how many times each item is associated with entities, scenes, etc.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FrequencyList title="Tags" items={data.tags} />
                <FrequencyList title="Themes" items={data.themes} />
                <FrequencyList title="Conflicts" items={data.conflicts} />
            </div>
        </div>
    );
};

export default TagThemeFrequencyReport;
