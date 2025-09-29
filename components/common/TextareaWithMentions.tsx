
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Entity } from '../../types/index';
import { MENTION_DROPDOWN_HEIGHT, MENTION_POPUP_WIDTH } from '../../constants';
import { useI18n } from '../../hooks/useI18n';
import { useAppSelector } from '../../state/hooks';
import { getTypedObjectValues } from '../../utils';
import { Popover } from './ui/Popover';
import MentionList, { MentionListRef } from './editor/MentionList';

const mirrorStyles: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  visibility: 'hidden',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  overflow: 'hidden',
  pointerEvents: 'none',
  zIndex: -1, 
};

export const TextareaWithMentions: React.FC<
    React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
        onValueChange: (value: string) => void;
        wrapperClassName?: string;
    }
> = ({ value, onValueChange, wrapperClassName, ...props }) => {
    const { t } = useI18n();
    const { entities } = useAppSelector(state => state.bible.present.entities);
    const [mentionState, setMentionState] = useState({
        show: false,
        query: '',
        activeIndex: 0,
        startPos: 0,
    });
    const [isFocused, setIsFocused] = useState(false);
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const mirrorRef = useRef<HTMLDivElement>(null);
    const mentionListRef = useRef<MentionListRef>(null);
    const virtualElementRef = useRef<any>(null);

    const listboxId = useMemo(() => `mention-listbox-${Math.random().toString(36).substr(2, 9)}`, []);

    const filteredEntities = useMemo(() => {
        const entitiesArray = getTypedObjectValues(entities) as Entity[];
        if (!mentionState.show || !mentionState.query) return entitiesArray.slice(0, 7);
        const lowerQuery = mentionState.query.toLowerCase();
        return entitiesArray.filter(e => e.name.toLowerCase().includes(lowerQuery)).slice(0, 7);
    }, [entities, mentionState.query, mentionState.show]);

    const closeMention = useCallback(() => {
        setMentionState(s => ({ ...s, show: false }));
    }, []);

    const handleSelect = useCallback((entity: Entity) => {
        if (!entity || !textareaRef.current) return;
    
        const currentTextarea = textareaRef.current;
        const { selectionStart } = currentTextarea;
        const text = (value as string) || '';
        
        const mentionText = `@[${entity.name}](${entity.id}) `;
        const newText = text.substring(0, mentionState.startPos) + mentionText + text.substring(selectionStart);
        
        onValueChange(newText);
        closeMention();
        
        setTimeout(() => {
            // Re-check ref in case component unmounted
            if (textareaRef.current) {
                const newCursorPos = mentionState.startPos + mentionText.length;
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    }, [mentionState.startPos, value, onValueChange, closeMention]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!mentionState.show) return;

        if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape', 'Tab'].includes(e.key)) {
            e.preventDefault();
            e.stopPropagation();

            if (e.key === 'ArrowUp') {
                setMentionState(s => ({ ...s, activeIndex: (s.activeIndex - 1 + filteredEntities.length) % filteredEntities.length }));
            } else if (e.key === 'ArrowDown') {
                 setMentionState(s => ({ ...s, activeIndex: (s.activeIndex + 1) % filteredEntities.length }));
            } else if (e.key === 'Escape' || e.key === 'Tab') {
                closeMention();
            } else if (e.key === 'Enter') {
                const entity = filteredEntities[mentionState.activeIndex];
                if (entity) handleSelect(entity);
            }
        }
    }, [mentionState.show, mentionState.activeIndex, handleSelect, closeMention, filteredEntities]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        const cursor = e.target.selectionStart;
        onValueChange(text);

        const textUpToCursor = text.substring(0, cursor);
        const lastAtPos = textUpToCursor.lastIndexOf('@');

        if (lastAtPos !== -1 && (lastAtPos === 0 || /\s/.test(textUpToCursor[lastAtPos - 1]))) {
            const query = textUpToCursor.substring(lastAtPos + 1);

            if (!/\s/.test(query)) {
                if (textareaRef.current) {
                    const textarea = textareaRef.current;

                    virtualElementRef.current = {
                        getBoundingClientRect: () => {
                            if (!mirrorRef.current || !textareaRef.current) return new DOMRect();
                            
                            const text = textarea.value;
                            const cursor = textarea.selectionStart;
                            const currentAtPos = textUpToCursor.lastIndexOf('@');
                            if (currentAtPos === -1) {
                                setTimeout(closeMention, 0);
                                return new DOMRect();
                            }
                            const textareaStyles = window.getComputedStyle(textarea);
                            
                            Object.assign(mirrorRef.current.style, {
                                font: textareaStyles.font,
                                padding: textareaStyles.padding,
                                border: textareaStyles.border,
                                width: textareaStyles.width,
                                boxSizing: textareaStyles.boxSizing,
                            });
                            
                            mirrorRef.current.textContent = text.substring(0, currentAtPos);
                            const span = document.createElement('span');
                            span.textContent = text.substring(currentAtPos, cursor);
                            mirrorRef.current.appendChild(span);
                            
                            const textareaRect = textarea.getBoundingClientRect();
                            const top = textareaRect.top + span.offsetTop - textarea.scrollTop;
                            const left = textareaRect.left + span.offsetLeft - textarea.scrollLeft;
                            const height = parseFloat(textareaStyles.lineHeight);

                            return new DOMRect(left, top + height, 0, height);
                        }
                    };

                    setMentionState({ show: true, query, activeIndex: 0, startPos: lastAtPos });
                 }
                 return;
            }
        }
        
        closeMention();
    }, [onValueChange, closeMention]);

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        setIsFocused(true);
        props.onFocus?.(e);
    }
    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        setIsFocused(false);
        props.onBlur?.(e);
    }
    
    const showHint = isFocused && !value && !mentionState.show;
    const activeDescendantId = mentionState.show && filteredEntities[mentionState.activeIndex] ? `mention-option-${filteredEntities[mentionState.activeIndex].id}` : undefined;

    return (
        <div className={`relative w-full ${wrapperClassName || ''}`}>
            <div ref={mirrorRef} style={mirrorStyles} aria-hidden="true"></div>
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onClick={closeMention}
                onFocus={handleFocus}
                onBlur={handleBlur}
                role="combobox"
                aria-expanded={mentionState.show}
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-activedescendant={activeDescendantId}
                {...props}
            />
            {mentionState.show && (
                <Popover targetElement={virtualElementRef.current} onClose={closeMention}>
                    <MentionList 
                        items={filteredEntities}
                        selectedIndex={mentionState.activeIndex}
                        command={item => handleSelect(item as Entity)}
                    />
                </Popover>
            )}
            {showHint && (
                <div className="absolute bottom-2 right-2 text-xs text-text-secondary/60 bg-secondary/80 px-2 py-1 rounded-md pointer-events-none transition-opacity duration-300">
                    {t('common.mentionHint')}
                </div>
            )}
        </div>
    );
};