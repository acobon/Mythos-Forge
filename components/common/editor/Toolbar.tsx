// components/common/editor/Toolbar.tsx
import React, { useCallback } from 'react';
import { Editor } from '@tiptap/react';
import {
    BoldIcon, ItalicIcon, StrikethroughIcon, Heading1Icon, Heading2Icon, ListUnorderedIcon,
    ListOrderedIcon, QuoteIcon, LinkIcon, ImageIcon, FileSearch2Icon, AlignLeftIcon,
    AlignCenterIcon, AlignRightIcon, TableIcon, CommentIcon
} from '../Icons';

interface ToolbarProps {
    editor: Editor;
    onAddImage: () => void;
    onAddComment: () => void;
    onToggleFindReplace: () => void;
    isFindReplaceVisible: boolean;
    canAddComment: boolean;
}

const ToolbarButton: React.FC<{
    command?: () => void;
    onClick?: () => void;
    isActive: boolean;
    label: string;
    children: React.ReactNode;
    disabled?: boolean;
}> = ({ command, onClick, isActive, label, children, disabled }) => (
    <button
        type="button"
        onClick={onClick}
        onMouseDown={command ? (e => { e.preventDefault(); command(); }) : undefined}
        className={`p-2 hover:bg-border-color rounded ${isActive ? 'bg-border-color text-accent' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
        title={label}
        aria-label={label}
        aria-pressed={isActive}
        disabled={disabled}
    >
        {children}
    </button>
);


export const Toolbar: React.FC<ToolbarProps> = ({ editor, onAddImage, onAddComment, onToggleFindReplace, isFindReplaceVisible, canAddComment }) => {

    const handleAddLink = useCallback(() => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);
        if (url === null) return;
        
        const trimmedUrl = url.trim();

        if (trimmedUrl === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        if (/^\s*javascript:/i.test(trimmedUrl)) {
            console.warn('Attempted to set an invalid URL.');
            return;
        }
        
        editor.chain().focus().extendMarkRange('link').setLink({ href: trimmedUrl }).run();
    }, [editor]);

    return (
        <div className="flex-shrink-0 flex items-center gap-1 p-2 bg-secondary border border-b-0 border-border-color rounded-t-md flex-wrap">
            <ToolbarButton command={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} label="Bold"><BoldIcon className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton command={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} label="Italic"><ItalicIcon className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton command={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} label="Strikethrough"><StrikethroughIcon className="w-4 h-4" /></ToolbarButton>
            <div className="w-px h-5 bg-border-color mx-1"></div>
            <ToolbarButton command={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} label="Heading 1"><Heading1Icon className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton command={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} label="Heading 2"><Heading2Icon className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton command={() => editor.chain().focus().setParagraph().run()} isActive={editor.isActive('paragraph')} label="Paragraph"><span className="px-1 text-xs font-bold">P</span></ToolbarButton>
            <div className="w-px h-5 bg-border-color mx-1"></div>
            <ToolbarButton command={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} label="Align Left"><AlignLeftIcon className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton command={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} label="Align Center"><AlignCenterIcon className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton command={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} label="Align Right"><AlignRightIcon className="w-4 h-4" /></ToolbarButton>
            <div className="w-px h-5 bg-border-color mx-1"></div>
            <ToolbarButton command={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} label="Bulleted List"><ListUnorderedIcon className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton command={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} label="Numbered List"><ListOrderedIcon className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton command={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} label="Blockquote"><QuoteIcon className="w-4 h-4" /></ToolbarButton>
            <div className="w-px h-5 bg-border-color mx-1"></div>
            <ToolbarButton command={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} isActive={editor.isActive('table')} label="Insert Table"><TableIcon className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton command={handleAddLink} isActive={editor.isActive('link')} label="Add Link"><LinkIcon className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton onClick={onAddImage} isActive={false} label="Add Image"><ImageIcon className="w-4 h-4" /></ToolbarButton>
            <ToolbarButton onClick={onAddComment} isActive={false} disabled={!canAddComment} label="Add Comment"><CommentIcon className="w-4 h-4" /></ToolbarButton>
            <div className="w-px h-5 bg-border-color mx-1"></div>
            <ToolbarButton onClick={onToggleFindReplace} isActive={isFindReplaceVisible} label="Find and Replace"><FileSearch2Icon className="w-4 h-4" /></ToolbarButton>
        </div>
    );
};
