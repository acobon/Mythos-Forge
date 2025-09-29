import React from 'react';
import { BookOpenIcon, PlusCircleIcon } from '../../common/Icons';

interface EmptyViewProps {
    onAddWork: () => void;
}

const EmptyView: React.FC<EmptyViewProps> = ({ onAddWork }) => (
    <div className="flex flex-col items-center justify-center h-full text-center text-text-secondary p-8 animate-fade-in">
        <BookOpenIcon className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-semibold text-text-main mb-2">Structure Your Manuscript</h2>
        <p className="max-w-md mb-6">
            Create works to organize your story. Within each work, add scenes to build your narrative, linking them to your world's history and characters.
        </p>
        <button onClick={onAddWork} className="px-4 py-2 font-semibold text-white bg-accent hover:bg-highlight rounded-md transition-colors flex items-center">
            <PlusCircleIcon className="w-5 h-5 mr-2" /> Create First Work
        </button>
    </div>
);

export default EmptyView;
