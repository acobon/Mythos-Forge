
// components/common/editor/CommentPopover.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPopper, Instance as PopperInstance } from '@popperjs/core';
import { Comment, TrashedItem } from '../../../types/index';
import { useAppSelector, useAppDispatch } from '../../../state/hooks';
import { saveComment } from '../../../state/slices/knowledgeSlice';
import { removeItem } from '../../../state/actions';
import { Button, Textarea } from '../ui';
import { generateId, getTypedObjectValues } from '../../../utils';
import { EditIcon, CheckIcon, XIcon } from '../Icons';

interface CommentPopoverProps {
  editor: any;
  sceneId: string;
  commentId: string;
  onClose: () => void;
}

export const CommentPopover: React.FC<CommentPopoverProps> = ({ editor, sceneId, commentId, onClose }) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const popperInstanceRef = useRef<PopperInstance | null>(null);
  const dispatch = useAppDispatch();
  const allComments = useAppSelector(state => state.bible.present.knowledge.comments);
  
  const mainComment = useMemo(() => allComments[commentId], [allComments, commentId]);
  const replies = useMemo(() => 
    (getTypedObjectValues(allComments) as Comment[])
      .filter(c => c.parentId === commentId)
      .sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [allComments, commentId]
  );
  
  const [replyText, setReplyText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(mainComment?.text || '');

  
  const handleReply = () => {
      if (!replyText.trim() || !mainComment) return;
      const newReply: Comment = {
          id: generateId('comment'),
          sceneId,
          text: replyText.trim(),
          createdAt: new Date().toISOString(),
          resolved: false,
          parentId: mainComment.id,
      };
      dispatch(saveComment(newReply));
      setReplyText('');
  };
  
  const handleSaveEdit = () => {
    if (editText.trim() && mainComment) {
        dispatch(saveComment({ ...mainComment, text: editText.trim() }));
    }
    setIsEditing(false);
  };

  const handleToggleResolve = () => {
    if (!mainComment) return;
    const newResolvedState = !mainComment.resolved;
    dispatch(saveComment({ ...mainComment, resolved: newResolvedState }));
    
    editor.state.doc.descendants((node: any, pos: number) => {
        const commentMark = node.marks.find((m: any) => m.type.name === 'comment' && m.attrs.commentId === commentId);
        if (commentMark) {
            editor.chain().focus().setTextSelection({ from: pos, to: pos + node.nodeSize }).setComment({ commentId, resolved: newResolvedState }).run();
        }
    });
    
    onClose();
  };

  const handleDelete = () => {
    if (!mainComment) return;
    
    const trashedItem: TrashedItem = {
        item: mainComment,
        itemType: 'Comment',
        deletedAt: new Date().toISOString(),
        metadata: { sceneId }
    };
    dispatch(removeItem(trashedItem));
    
    onClose();
  };
  
  if (!mainComment) return null;

  return (
    <div ref={popoverRef} className="bg-secondary p-3 rounded-lg border border-border-color shadow-2xl w-80 z-50 animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="max-h-96 overflow-y-auto pr-2">
            <div className="bg-primary p-2 rounded-md mb-2">
                {isEditing ? (
                    <div className="space-y-1">
                        <Textarea value={editText} onChange={e => setEditText(e.target.value)} rows={2} className="w-full text-sm" autoFocus/>
                        <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}><XIcon className="w-4 h-4"/></Button>
                            <Button variant="ghost" size="icon" onClick={handleSaveEdit}><CheckIcon className="w-4 h-4"/></Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="text-sm font-semibold">{mainComment.text}</p>
                        <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-text-secondary">{new Date(mainComment.createdAt).toLocaleString()}</p>
                            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}><EditIcon className="w-4 h-4"/></Button>
                        </div>
                    </>
                )}
            </div>
            {/* Replies section can be added here */}
            {replies.map(reply => (
                <div key={reply.id} className="ml-4 border-l-2 border-border-color pl-2 py-1">
                     <p className="text-sm">{reply.text}</p>
                     <p className="text-xs text-text-secondary mt-1">{new Date(reply.createdAt).toLocaleDateString()}</p>
                </div>
            ))}

            <div className="mt-2">
                <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={2} placeholder="Reply..." className="w-full text-sm"/>
                <div className="text-right mt-1">
                    <Button size="sm" onClick={handleReply} disabled={!replyText.trim()}>Reply</Button>
                </div>
            </div>
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-border-color">
            <Button variant="ghost" size="sm" onClick={handleDelete}>Delete Thread</Button>
            <Button variant="secondary" size="sm" onClick={handleToggleResolve}>{mainComment.resolved ? 'Unresolve' : 'Resolve'}</Button>
        </div>
    </div>
  );
};
