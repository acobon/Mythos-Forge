// hooks/useSearchWorker.ts
import { useState, useEffect, useRef, useCallback } from 'react';

export const useSearchWorker = <T>(data: T[], searchKeys: (keyof T | string)[]) => {
    const workerRef = useRef<Worker | null>(null);
    const [results, setResults] = useState<T[]>(data); // Initially show all data
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        workerRef.current = new Worker(new URL('../search.worker.ts', import.meta.url), { type: 'module' });
        
        workerRef.current.onmessage = (event: MessageEvent<{ results: T[] }>) => {
            setResults(event.data.results);
            setIsLoading(false);
        };
        
        return () => {
            workerRef.current?.terminate();
        };
    }, []); // Create worker only once

    // This effect sends data to the worker whenever it changes
    useEffect(() => {
        if (workerRef.current) {
            workerRef.current.postMessage({
                type: 'INIT',
                data,
                keys: searchKeys,
            });
            setIsLoading(true);
        }
    }, [data, searchKeys]);

    const search = useCallback((query: string) => {
        if (workerRef.current) {
            setIsLoading(true);
            workerRef.current.postMessage({
                type: 'SEARCH',
                query,
            });
        }
    }, []);
    
    return { results, isLoading, search };
};
