// components/views/manuscript/CommentSidebar.tsx
import React, { useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../../../state/hooks';
import { Comment } from '../../../types';
import { getTypedObjectValues } from '../../../utils';
import { MessageCircleIcon } from '../../common/Icons';
import { saveComment } from '../../../state/slices/knowledgeSlice';
import { Button } from '../../common/ui';

interface CommentSidebarProps {
    sceneId: string;
    onJumpToComment: (commentId: string) => void;
}

const CommentCard: React.FC<{ comment: Comment, onJump: (id: string) => void, onToggleResolve: (c: Comment) => void }> = ({ comment, onJump, onToggleResolve }) => (
    <div className={`p-2 rounded-md mb-2 ${comment.resolved ? 'bg-primary/50 opacity-70' : 'bg-primary'}`}>
        <p className="text-sm text-text-main cursor-pointer hover:underline" onClick={() => onJump(comment.id)}>
            {comment.text}
        </p>
        <div className="text-right mt-1">
            <Button variant="ghost" size="sm" onClick={() => onToggleResolve(comment)} className="!text-xs">
                {comment.resolved ? 'Unresolve' : 'Resolve'}
            </Button>
        </div>
    </div>
);

const CommentSidebar: React.FC<CommentSidebarProps> = ({ sceneId, onJumpToComment }) => {
    const dispatch = useAppDispatch();
    const allComments = useAppSelector(state => state.bible.present.knowledge.comments);

    const { resolved, unresolved } = useMemo(() => {
        const sceneComments = (getTypedObjectValues(allComments) as Comment[])
            .filter(c => c.sceneId === sceneId)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        return {
            resolved: sceneComments.filter(c => c.resolved),
            unresolved: sceneComments.filter(c => !c.resolved),
        };
    }, [allComments, sceneId]);

    const handleToggleResolve = (comment: Comment) => {
        dispatch(saveComment({ ...comment, resolved: !comment.resolved }));
    };

    return (
        <aside className="w-full h-full p-4 border-l border-border-color bg-secondary flex flex-col">
            <h3 className="text-xl font-semibold mb-4 flex-shrink-0">Comments</h3>
            <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                {unresolved.length === 0 && resolved.length === 0 && (
                    <div className="text-center text-text-secondary pt-10">
                        <MessageCircleIcon className="w-12 h-12 mx-auto mb-3" />
                        <p>No comments in this scene.</p>
                        <p className="text-xs mt-1">Select text in the editor to add one.</p>
                    </div>
                )}
                
                {unresolved.length > 0 && (
                    <section>
                        <h4 className="text-sm font-bold text-text-secondary uppercase mb-2">Unresolved</h4>
                        {unresolved.map(comment => (
                            <CommentCard key={comment.id} comment={comment} onJump={onJumpToComment} onToggleResolve={handleToggleResolve} />
                        ))}
                    </section>
                )}
                
                {resolved.length > 0 && (
                    <section>
                        <h4 className="text-sm font-bold text-text-secondary uppercase mb-2">Resolved</h4>
                        {resolved.map(comment => (
                            <CommentCard key={comment.id} comment={comment} onJump={onJumpToComment} onToggleResolve={handleToggleResolve} />
                        ))}
                    </section>
                )}
            </div>
        </aside>
    );
};

export default CommentSidebar;