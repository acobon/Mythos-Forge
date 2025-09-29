
import * as React from 'react';
import '@tiptap/core';

declare module 'html2canvas' {
    function html2canvas(element: HTMLElement, options?: any): Promise<HTMLCanvasElement>;
    export default html2canvas;
}
declare module '@dnd-kit/utilities';
declare module '@tiptap/extension-highlight';
declare module '@tiptap/extension-color';
declare module '@tiptap/extension-text-style';

declare module 'react-window' {
    export interface ListChildComponentProps<T = any> {
        index: number;
        style: React.CSSProperties;
        data: T;
        isScrolling?: boolean;
    }

    export interface FixedSizeListProps {
        height: number;
        itemCount: number;
        itemSize: number;
        width: number;
        children: React.ComponentType<ListChildComponentProps>;
        [key: string]: any;
    }
    
    export interface VariableSizeListProps {
        height: number;
        itemCount: number;
        itemSize: (index: number) => number;
        width: number;
        children: React.ComponentType<ListChildComponentProps>;
        [key: string]: any;
    }

    export class FixedSizeList extends React.Component<FixedSizeListProps> {
        scrollTo(scrollOffset: number): void;
        scrollToItem(index: number, align?: 'auto' | 'smart' | 'center' | 'end' | 'start'): void;
    }
    
    export class VariableSizeList extends React.Component<VariableSizeListProps> {
        scrollTo(scrollOffset: number): void;
        scrollToItem(index: number, align?: 'auto' | 'smart' | 'center' | 'end' | 'start'): void;
        resetAfterIndex(index: number, shouldForceUpdate?: boolean): void;
    }
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    comment: {
      setComment: (attributes: { commentId: string, resolved?: boolean }) => ReturnType;
      toggleComment: (attributes: { commentId: string, resolved?: boolean }) => ReturnType;
      unsetComment: () => ReturnType;
    };
  }
}