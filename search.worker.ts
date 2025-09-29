// search.worker.ts
import { htmlToPlainText } from './utils';

let dataSet: any[] = [];
let searchKeys: (string)[] = [];

const getSearchString = (item: any, keys: string[]): string => {
    return keys.map(key => {
        let value = item[key];
        if (key === 'details' && value) {
            // For details, join all attribute values into the search string
            value = Object.values(value).map(v => {
                if (typeof v === 'string' && v.startsWith('@[') && v.endsWith(')')) {
                    // Don't search the UUID part of references
                    const match = v.match(/@\[([^\]]+)\]/);
                    return match ? match[1] : '';
                }
                return v;
            }).join(' ');
        }
        if (key === 'content' || key === 'description') { // For research notes, scenes, or descriptions
            value = htmlToPlainText(value);
        }
        return String(value || '').toLowerCase();
    }).join(' ');
};

self.onmessage = (event: MessageEvent<{ type: 'INIT' | 'SEARCH'; data?: any[]; query?: string; keys?: (string)[] }>) => {
    const { type, data, query, keys } = event.data;

    if (type === 'INIT' && data && keys) {
        dataSet = data;
        searchKeys = keys;
        // When initialized, return the full dataset as the initial "unfiltered" result.
        self.postMessage({ results: dataSet });
        return;
    }

    if (type === 'SEARCH' && query !== undefined) {
        const lowerCaseQuery = query.trim().toLowerCase();

        if (!lowerCaseQuery) {
            self.postMessage({ results: dataSet });
            return;
        }

        const results = dataSet.filter(item => 
            getSearchString(item, searchKeys).includes(lowerCaseQuery)
        );
        
        self.postMessage({ results });
    }
};
