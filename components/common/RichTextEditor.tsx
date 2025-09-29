// components/common/RichTextEditor.tsx
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { EditorContent, Editor, useEditor } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import DOMPurify from 'dompurify';
import suggestion, { type SuggestionProps, type SuggestionKeyDownProps } from '@tiptap/suggestion';

import { Entity, DictionaryEntry, ResearchNote } from '../../types/index';
import { generateId, getTypedObjectValues } from '../../utils';
import { useAppSelector } from '../../state/hooks';
import { useNavigation } from '../../hooks/useNavigation';
import MentionList, { MentionListRef } from './editor/MentionList';

import { Toolbar } from './editor/Toolbar';
import FindReplaceBar from './editor/FindReplaceBar';
import { Popover } from './ui/Popover';
import { CommentPopover } from './editor/CommentPopover';
import { CommentExtension } from './editor/CommentExtension';
import { DictionaryExtension } from './editor/DictionaryExtension';

interface RichTextEditorProps {
    value: string;
    onValueChange: (updates: { html: string; json: any }) => void;
    className?: string;
    placeholder?: string;
    entities: Record<string, Entity>;
    sceneId?: string;
}

const RichTextEditor = React.forwardRef< { editor: Editor | null }, RichTextEditorProps>(({ value, onValueChange, className, placeholder, entities, sceneId }, ref) => {
    const { dictionary } = useAppSelector(state => state.bible.present.metadata);
    const { researchNotes } = useAppSelector(state => state.bible.present.knowledge);
    const allNotes = useMemo(() => getTypedObjectValues(researchNotes) as ResearchNote[], [researchNotes]);
    const { navigateToNote } = useNavigation();

    const dictionaryEntries = useMemo(() => getTypedObjectValues(dictionary) as DictionaryEntry[], [dictionary]);

    const imageInputRef = useRef<HTMLInputElement>(null);
    const [isFindReplaceVisible, setIsFindReplaceVisible] = useState(false);
    const [mentionProps, setMentionProps] = useState<SuggestionProps<Entity> | null>(null);
    const [mentionIndex, setMentionIndex] = useState(0);
    const [noteMentionProps, setNoteMentionProps] = useState<SuggestionProps<ResearchNote> | null>(null);
    const [noteMentionIndex, setNoteMentionIndex] = useState(0);
    const [activeComment, setActiveComment] = useState<{ id: string; element: HTMLElement } | null>(null);
    const [activeDictionaryTerm, setActiveDictionaryTerm] = useState<{ term: string; definition: string; element: HTMLElement } | null>(null);

    const handleCommentClick = useCallback((commentId: string, element: HTMLElement) => {
        setActiveComment({ id: commentId, element });
    }, []);

    const editor: Editor | null = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2] },
                blockquote: { HTMLAttributes: { class: 'border-l-4 border-border-color pl-4 text-text-secondary italic' } },
            }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Table.configure({ resizable: true }),
            TableRow, TableHeader, TableCell,
            Placeholder.configure({ placeholder }),
            Image.configure({ inline: false }),
            Link.extend({
                addAttributes() { return { ...this.parent?.(), 'data-note-id': { default: null } } }
            }).configure({
                openOnClick: false, autolink: true, validate: href => !/^\s*javascript:/i.test(href),
                HTMLAttributes: { rel: 'noopener noreferrer nofollow' },
            }),
            Mention.configure({
                HTMLAttributes: { class: 'text-accent bg-secondary px-1 rounded-sm no-underline' },
                renderHTML({ node }) { return ['a', { 'data-entity-id': node.attrs.id, 'contenteditable': 'false' }, `${node.attrs.label}`]; },
                suggestion: {
                    items: ({ query }) => (getTypedObjectValues(entities) as Entity[]).filter(item => item.name.toLowerCase().includes(query.toLowerCase())).slice(0, 7),
                    render: () => ({
                        onStart: props => { setMentionProps(props); setMentionIndex(0); },
                        onUpdate: props => { setMentionProps(props); setMentionIndex(0); },
                        onKeyDown: (props: SuggestionKeyDownProps) => {
                            if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape', 'Tab'].includes(props.event.key)) {
                                return true;
                            }
                            return false;
                        },
                        onExit: () => setMentionProps(null),
                    }),
                },
            }),
            Extension.create({
                name: 'noteSuggestions',
                addProseMirrorPlugins() {
                    return [
                        suggestion<ResearchNote>({
                            editor: this.editor, char: '[',
                            command: ({ editor, range, props }: { editor: Editor, range: any, props: ResearchNote }) => {
                                editor.chain().focus().insertContentAt({ from: range.from - 1, to: range.to }, '').setLink({ href: `#note-${props.id}`, 'data-note-id': props.id } as any).insertContent(props.title).unsetLink().run();
                            },
                            items: ({ query }) => allNotes.filter(n => n.title.toLowerCase().includes(query.toLowerCase())).slice(0,5),
                            render: () => ({
                                onStart: props => { setNoteMentionProps(props); setNoteMentionIndex(0); },
                                onUpdate: props => { setNoteMentionProps(props); setNoteMentionIndex(0); },
                                onKeyDown: (props: SuggestionKeyDownProps) => {
                                    if (['ArrowUp', 'ArrowDown', 'Enter'].includes(props.event.key)) {
                                        return true;
                                    }
                                    return false;
                                },
                                onExit: () => setNoteMentionProps(null),
                            })
                        })
                    ];
                }
            }),
            CommentExtension.configure({ onCommentClick: handleCommentClick }),
            DictionaryExtension.configure({ dictionary: dictionaryEntries }),
        ],
        content: DOMPurify.sanitize(value),
        onUpdate: ({ editor }) => onValueChange({ html: editor.getHTML(), json: editor.getJSON() }),
        editorProps: {
            attributes: { class: `prose dark:prose-invert max-w-none focus:outline-none font-serif text-lg leading-relaxed ${className || ''}`, spellcheck: 'true' },
            handleClick: (view, pos, event) => {
                const target = event.target as HTMLElement;

                const dictionarySpan = target.closest('.dictionary-term');
                if (dictionarySpan) {
                    const term = (dictionarySpan as HTMLElement).dataset.term || '';
                    const definition = (dictionarySpan as HTMLElement).dataset.definition || '';
                    setActiveDictionaryTerm({ term, definition, element: dictionarySpan as HTMLElement });
                    return true;
                }

                if (!target.closest('.comment-highlight')) {
                    setActiveComment(null);
                    setActiveDictionaryTerm(null);
                }
                return false;
            },
            handleClickOn: (view, pos, node, nodePos, event) => {
                const target = event.target as HTMLElement;
                const noteLink = target.closest('a[data-note-id]');
                if (noteLink) {
                    const noteId = noteLink.getAttribute('data-note-id');
                    if(noteId) { navigateToNote(noteId); return true; }
                }
                return false;
            },
        },
    });

    React.useImperativeHandle(ref, () => ({ editor }));

    useEffect(() => {
        if (editor && !editor.isDestroyed && value !== editor.getHTML()) {
            const { from, to } = editor.state.selection;
            editor.commands.setContent(DOMPurify.sanitize(value), false);
            if (editor.state.doc.content.size >= to) editor.commands.setTextSelection({ from, to });
        }
    }, [value, editor]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && editor) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) editor.chain().focus().setImage({ src: event.target.result as string }).run();
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddComment = useCallback(() => {
        if (!editor || !sceneId) return;
        const commentId = generateId('comment');
        editor.chain().focus().setComment({ commentId }).run();
        setTimeout(() => {
             const commentSpan = editor.view.dom.querySelector(`[data-comment-id="${commentId}"]`);
             if (commentSpan) setActiveComment({ id: commentId, element: commentSpan as HTMLElement });
        }, 50);
    }, [editor, sceneId]);

    const virtualMentionEl = useMemo(() => {
        if (!mentionProps?.clientRect) return null;
        return {
            getBoundingClientRect: () => {
                return mentionProps.clientRect?.() || new DOMRect();
            },
        };
    }, [mentionProps]);

    const virtualNoteMentionEl = useMemo(() => {
        if (!noteMentionProps?.clientRect) return null;
        return {
            getBoundingClientRect: () => {
                return noteMentionProps.clientRect?.() || new DOMRect();
            },
        };
    }, [noteMentionProps]);
    
    if (!editor) return null;

    return (
        <div className="flex flex-col h-full">
            <input type="file" ref={imageInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
            <Toolbar 
                editor={editor} 
                onAddImage={() => imageInputRef.current?.click()}
                onAddComment={handleAddComment}
                onToggleFindReplace={() => setIsFindReplaceVisible(v => !v)}
                isFindReplaceVisible={isFindReplaceVisible}
                canAddComment={!!sceneId && !editor.state.selection.empty}
            />
            {isFindReplaceVisible && <FindReplaceBar editor={editor} close={() => setIsFindReplaceVisible(false)} />}
            <div className="flex-grow overflow-y-auto">
                <EditorContent editor={editor} />
            </div>

            {virtualMentionEl && (
                <Popover targetElement={virtualMentionEl}>
                    <MentionList
                        items={mentionProps!.items}
                        selectedIndex={mentionIndex}
                        command={(item) => mentionProps!.command({ id: item.id, label: item.name })}
                    />
                </Popover>
            )}
            
            {virtualNoteMentionEl && (
                <Popover targetElement={virtualNoteMentionEl}>
                    <MentionList
                        items={noteMentionProps!.items.map(i => ({...i, name: i.title}))}
                        selectedIndex={noteMentionIndex}
                        command={(item) => noteMentionProps!.command(item)}
                    />
                </Popover>
            )}

            {activeComment && (
                <Popover targetElement={activeComment.element} onClose={() => setActiveComment(null)}>
                    <CommentPopover editor={editor} sceneId={sceneId!} commentId={activeComment.id} onClose={() => setActiveComment(null)} />
                </Popover>
            )}

            {activeDictionaryTerm && (
                <Popover targetElement={activeDictionaryTerm.element} placement="top" onClose={() => setActiveDictionaryTerm(null)}>
                    <div className="bg-secondary p-3 rounded-lg border border-border-color shadow-2xl w-72 z-50 animate-fade-in pointer-events-none">
                        <h4 className="font-bold text-text-main text-sm">{activeDictionaryTerm.term}</h4>
                        <p className="text-xs text-text-secondary mt-1">{activeDictionaryTerm.definition}</p>
                    </div>
                </Popover>
            )}
        </div>
    );
});
RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;
