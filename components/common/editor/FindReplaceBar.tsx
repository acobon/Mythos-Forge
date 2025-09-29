

import React, { useState, useEffect } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import { ArrowLeftIcon, ArrowRightIcon, XIcon } from '../Icons';
import { useI18n } from '../../../hooks/useI18n';

const FindReplaceBar: React.FC<{ editor: any, close: () => void }> = ({ editor, close }) => {
    const { t } = useI18n();
    const [searchTerm, setSearchTerm] = useState('');
    const [replaceTerm, setReplaceTerm] = useState('');
    const [results, setResults] = useState<{from: number, to: number}[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    
    const debouncedSearchTerm = useDebounce(searchTerm, 250);

    useEffect(() => {
        if (!debouncedSearchTerm) {
            setResults([]);
            setCurrentIndex(-1);
            return;
        }

        const newResults: {from: number, to: number}[] = [];
        editor.state.doc.descendants((node: any, pos: number) => {
            if (!node.isText) return;

            const regex = new RegExp(debouncedSearchTerm, 'gi');
            let match;
            while ((match = regex.exec(node.text!)) !== null) {
                const from = pos + match.index;
                const to = from + match[0].length;
                newResults.push({ from, to });
            }
        });
        
        setResults(newResults);
        if (newResults.length > 0) {
            setCurrentIndex(0);
            const { from, to } = newResults[0];
            editor.chain().focus().setTextSelection({ from, to }).run();
            editor.commands.scrollIntoView();
        } else {
            setCurrentIndex(-1);
        }
    }, [debouncedSearchTerm, editor]);

    const navigateResults = (direction: 'next' | 'prev') => {
        if (results.length === 0) return;
        
        let nextIndex = currentIndex;
        if (direction === 'next') {
            nextIndex = (currentIndex + 1) % results.length;
        } else {
            nextIndex = (currentIndex - 1 + results.length) % results.length;
        }
        
        setCurrentIndex(nextIndex);
        const { from, to } = results[nextIndex];
        editor.chain().focus().setTextSelection({ from, to }).scrollIntoView().run();
    };

    const replace = () => {
        if (currentIndex === -1 || results.length === 0) return;
        const { from, to } = results[currentIndex];
        editor.chain().focus().insertContentAt({ from, to }, replaceTerm).run();
    };

    const replaceAll = () => {
        if (results.length === 0) return;
        const { tr } = editor.state;
        // Iterate backwards to avoid position shifts
        [...results].reverse().forEach(({ from, to }) => {
            tr.replaceWith(from, to, replaceTerm);
        });
        editor.view.dispatch(tr);
    };

    return (
        <div className="p-2 border-b border-border-color bg-secondary flex items-center gap-2 text-sm flex-wrap">
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Find" className="bg-primary border border-border-color rounded px-2 py-1 w-40"/>
            <input type="text" value={replaceTerm} onChange={e => setReplaceTerm(e.target.value)} placeholder="Replace" className="bg-primary border border-border-color rounded px-2 py-1 w-40"/>
            <div className="flex items-center gap-1">
                <button onClick={() => navigateResults('prev')} disabled={results.length < 2} className="p-1 hover:bg-border-color rounded disabled:opacity-50" aria-label={t('editor.find.previous')}><ArrowLeftIcon className="w-4 h-4" /></button>
                <span className="text-xs text-text-secondary w-16 text-center">{results.length > 0 ? `${currentIndex + 1} of ${results.length}` : '0 of 0'}</span>
                <button onClick={() => navigateResults('next')} disabled={results.length < 2} className="p-1 hover:bg-border-color rounded disabled:opacity-50" aria-label={t('editor.find.next')}><ArrowRightIcon className="w-4 h-4" /></button>
            </div>
            <button onClick={replace} disabled={results.length === 0} className="px-3 py-1 bg-primary rounded hover:bg-border-color disabled:opacity-50">Replace</button>
            <button onClick={replaceAll} disabled={results.length === 0} className="px-3 py-1 bg-primary rounded hover:bg-border-color disabled:opacity-50">Replace All</button>
            <button onClick={close} className="p-1 hover:bg-border-color rounded ml-auto" aria-label={t('editor.find.close')}><XIcon className="w-4 h-4"/></button>
        </div>
    );
};

export default FindReplaceBar;