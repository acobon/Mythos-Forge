
import React, { useState, useEffect, useImperativeHandle, forwardRef, memo } from 'react';
import { Entity } from '../../../types';
import type { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';

export interface MentionListRef {
    onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

interface MentionItem {
    id: string;
    name: string;
    type?: string;
    [key: string]: any;
}

interface MentionListProps {
    items: MentionItem[];
    selectedIndex: number;
    command: (item: MentionItem) => void;
}


const MentionList = memo(forwardRef<MentionListRef, MentionListProps>((props, ref) => {
    const { items, selectedIndex, command } = props;
    
    const selectItem = (index: number) => {
        const item = items[index];
        if (item) {
            command(item);
        }
    };

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: SuggestionKeyDownProps): boolean => {
            // This logic is handled by the parent component that owns the state.
            return false;
        },
    }));

    return (
        <div className="z-50 bg-primary border border-border-color rounded-md shadow-lg py-1 max-h-60 overflow-y-auto w-64">
            {items.length ? (
                items.map((item, index: number) => (
                    <button
                        key={item.id}
                        onClick={() => selectItem(index)}
                        className={`w-full text-left px-3 py-1.5 text-sm truncate ${index === selectedIndex ? 'bg-accent text-white' : 'text-text-main hover:bg-secondary'}`}
                    >
                        {item.name} {item.type && <span className="text-xs text-text-secondary/80">({item.type})</span>}
                    </button>
                ))
            ) : (
                <div className="px-3 py-1.5 text-sm text-text-secondary">No results</div>
            )}
        </div>
    );
}));

MentionList.displayName = 'MentionList';

export default MentionList;