import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { DictionaryEntry } from '../../../types';

export interface DictionaryOptions {
  dictionary: DictionaryEntry[];
}

const findDictionaryTerms = (doc: any, dictionary: DictionaryEntry[]) => {
    const decorations: Decoration[] = [];
    if (dictionary.length === 0) return DecorationSet.empty;

    const caseSensitiveTerms = dictionary.filter(d => d.caseSensitive);
    const caseInsensitiveTerms = dictionary.filter(d => !d.caseSensitive);

    const buildRegex = (terms: DictionaryEntry[], flags: string) => {
        if (terms.length === 0) return null;
        const regexParts = terms.map(entry => {
            return entry.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        });
        return new RegExp(`\\b(${regexParts.join('|')})\\b`, flags);
    };

    const regexCS = buildRegex(caseSensitiveTerms, 'g');
    const regexCI = buildRegex(caseInsensitiveTerms, 'gi');

    doc.descendants((node: any, pos: number) => {
        if (!node.isText) return;

        const text = node.text as string;

        const findMatches = (regex: RegExp | null, isCaseSensitive: boolean) => {
            if (!regex) return;
            let match;
            while ((match = regex.exec(text)) !== null) {
                const term = match[0];
                const entry = dictionary.find(d => 
                    d.caseSensitive === isCaseSensitive && 
                    (isCaseSensitive ? d.term === term : d.term.toLowerCase() === term.toLowerCase())
                );
                
                if (entry) {
                    const from = pos + match.index;
                    const to = from + term.length;
                    decorations.push(
                        Decoration.inline(from, to, {
                            class: 'dictionary-term',
                            'data-term': entry.term,
                            'data-definition': entry.definition,
                        })
                    );
                }
            }
        };

        findMatches(regexCS, true);
        findMatches(regexCI, false);
    });

    return DecorationSet.create(doc, decorations);
};

export const DictionaryExtension = Extension.create<DictionaryOptions>({
    name: 'dictionary',

    addOptions() {
        return {
            dictionary: [],
        };
    },

    addProseMirrorPlugins() {
        const extension = this;
        return [
            new Plugin({
                key: new PluginKey('dictionary'),
                state: {
                    init(_, { doc }) {
                        return findDictionaryTerms(doc, extension.options.dictionary);
                    },
                    apply(tr, old) {
                        // Re-run on doc change or if the dictionary itself changes.
                        // The dictionary change is handled by re-creating the editor view.
                        return tr.docChanged ? findDictionaryTerms(tr.doc, extension.options.dictionary) : old;
                    },
                },
                props: {
                    decorations(state) {
                        return this.getState(state);
                    },
                },
            }),
        ];
    },
});
