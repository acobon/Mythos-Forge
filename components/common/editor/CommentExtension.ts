import { Mark, mergeAttributes, Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';

export interface CommentOptions {
  HTMLAttributes: Record<string, any>;
  onCommentClick: (commentId: string, element: HTMLElement) => void;
}

export const CommentExtension = Mark.create<CommentOptions>({
  name: 'comment',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'comment-highlight',
      },
      onCommentClick: () => {},
    };
  },

  addAttributes() {
    return {
      commentId: {
        default: null,
      },
       resolved: {
        default: false,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment-id]',
        getAttrs: element => {
            const commentId = (element as HTMLElement).getAttribute('data-comment-id');
            const resolved = (element as HTMLElement).getAttribute('data-resolved') === 'true';
            return commentId ? { commentId, resolved } : false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const customAttrs = {
        'data-comment-id': HTMLAttributes.commentId,
        'data-resolved': String(HTMLAttributes.resolved),
    };
    return ['span', mergeAttributes(this.options.HTMLAttributes, customAttrs), 0];
  },

  addCommands() {
    return {
      setComment: (attributes) => ({ commands }) => {
        return commands.setMark(this.name, attributes);
      },
      toggleComment: (attributes) => ({ commands }) => {
        return commands.toggleMark(this.name, attributes);
      },
      unsetComment: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },

  addProseMirrorPlugins() {
    const extension = this;
    return [
      new Plugin({
        key: new PluginKey('commentHandler'),
        props: {
          handleClick: (view, pos, event) => {
            const attrs = extension.editor.getAttributes(extension.name);
            if (attrs.commentId) {
              const commentSpan = (event.target as HTMLElement).closest('[data-comment-id]');
              if (commentSpan) {
                extension.options.onCommentClick(attrs.commentId, commentSpan as HTMLElement);
                return true;
              }
            }
            return false;
          },
        },
      }),
    ];
  },
});