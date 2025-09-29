
import React, { FC, useEffect, useRef, useState, useMemo } from 'react';
import { Entity, EntityId, CharacterEntity, InteractionMatrix } from '../../../types';
import { VIRTUALIZED_MATRIX_CELL_SIZE } from '../../../constants';
import { useI18n } from '../../../hooks/useI18n';
import { FixedSizeList } from 'react-window';
import { middleTruncate } from '../../../utils';

interface InteractionMatrixReportProps {
    data: InteractionMatrix;
    onSelectEntity: (id: EntityId) => void;
}

export const InteractionMatrixReport: FC<InteractionMatrixReportProps> = ({ data, onSelectEntity }) => {
    const { t } = useI18n();
    const { entities: characters, matrix } = data;
    const listContainerRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const outerRef = useRef<HTMLDivElement>(null);

    const maxInteractions = useMemo(() => {
        let max = 0;
        Object.values(matrix).forEach(row => {
            Object.values(row).forEach(count => {
                if (count > max) max = count;
            });
        });
        return Math.max(1, max);
    }, [matrix]);

    const getCellColor = (count: number) => {
        if (count === 0) return 'transparent';
        const opacity = Math.log(count + 1) / Math.log(maxInteractions + 1);
        return `rgba(245, 158, 11, ${opacity})`; // amber-500
    };

    useEffect(() => {
        const container = listContainerRef.current;
        if (!container) return;
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                setDimensions({ width, height });
            }
        });
        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
        const outerElement = outerRef.current;
        if (!outerElement) return;
    
        const syncScroll = () => {
            if (headerRef.current) {
                headerRef.current.scrollLeft = outerElement.scrollLeft;
            }
        };
    
        outerElement.addEventListener('scroll', syncScroll);
        return () => {
            if (outerElement) {
                outerElement.removeEventListener('scroll', syncScroll);
            }
        };
    }, []);

    const Row: FC<{ index: number, style: React.CSSProperties }> = ({ index, style }) => {
        const char1 = characters[index];
        return (
            <div style={style} className="flex items-center">
                <div 
                    className="sticky left-0 bg-primary p-2 border-r border-border-color font-semibold text-text-main whitespace-nowrap z-10 flex items-center" 
                    style={{ width: `${VIRTUALIZED_MATRIX_CELL_SIZE}px`, height: '100%' }}
                >
                    <button onClick={() => onSelectEntity(char1.id)} className="hover:text-accent font-semibold truncate w-full text-left" title={char1.name}>
                        {middleTruncate(char1.name, 15)}
                    </button>
                </div>
                {characters.map(char2 => {
                    const count = matrix[char1.id]?.[char2.id] || 0;
                    return (
                        <div 
                            key={`${char1.id}-${char2.id}`} 
                            className={`flex-shrink-0 flex items-center justify-center font-mono border-l border-border-color transition-colors ${count > 0 ? 'text-text-main font-bold' : 'text-text-secondary/50'} ${char1.id === char2.id ? 'bg-border-color' : ''}`}
                            style={{ width: `${VIRTUALIZED_MATRIX_CELL_SIZE}px`, height: '100%', backgroundColor: getCellColor(count) }}
                            title={`${count} interactions`}
                        >
                            {char1.id === char2.id ? '—' : count}
                        </div>
                    );
                })}
            </div>
        );
    };

    const fullWidth = (characters.length + 1) * VIRTUALIZED_MATRIX_CELL_SIZE;

    if (characters.length === 0) {
        return (
             <div>
                <h4 className="text-lg font-bold mb-2">{t('reports.interactionMatrix.title')}</h4>
                <p className="text-sm text-text-secondary">No characters found to generate a matrix.</p>
            </div>
        )
    }

    return (
        <div>
            <h4 className="text-lg font-bold mb-2">{t('reports.interactionMatrix.title')}</h4>
            <p className="text-sm text-text-secondary mb-4">{t('reports.interactionMatrix.subtitle')}</p>
            <div className="mt-4 border border-border-color rounded-lg h-[70vh] flex flex-col">
                <div ref={headerRef} className="overflow-x-hidden flex-shrink-0">
                    <div style={{ width: `${fullWidth}px` }}>
                        <div className="sticky top-0 flex items-center bg-primary z-20">
                             <div className="sticky left-0 z-10 p-2 border-r border-b border-border-color bg-primary" style={{ width: `${VIRTUALIZED_MATRIX_CELL_SIZE}px`, height: `${VIRTUALIZED_MATRIX_CELL_SIZE}px`}}></div>
                             {characters.map(char => (
                                 <div key={char.id} className="flex-shrink-0 p-2 border-b border-l border-border-color flex items-center justify-center" style={{ width: `${VIRTUALIZED_MATRIX_CELL_SIZE}px`, height: `${VIRTUALIZED_MATRIX_CELL_SIZE}px`}}>
                                     <button onClick={() => onSelectEntity(char.id)} className="hover:text-accent font-semibold truncate" title={char.name}>{middleTruncate(char.name, 15)}</button>
                                 </div>
                             ))}
                        </div>
                    </div>
                </div>
                <div ref={listContainerRef} className="flex-grow">
                    <FixedSizeList
                        outerRef={outerRef}
                        height={dimensions.height}
                        itemCount={characters.length}
                        itemSize={VIRTUALIZED_MATRIX_CELL_SIZE}
                        width={dimensions.width}
                        innerElementType={React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(({ children, ...rest }, ref) => (
                            <div ref={ref} {...rest} style={{ ...rest.style, width: fullWidth }}>
                                {children}
                            </div>
                        ))}
                    >
                        {Row}
                    </FixedSizeList>
                </div>
            </div>
        </div>
    );
};
