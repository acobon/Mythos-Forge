import React, { useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { usePopper } from 'react-popper';
import { Placement } from '@popperjs/core';

// Popper.js can use a "virtual element" for positioning, which is just an object
// with a getBoundingClientRect method.
type VirtualElement = {
    getBoundingClientRect: () => DOMRect;
};

interface PopoverProps {
    targetElement: HTMLElement | VirtualElement | null;
    children: ReactNode;
    placement?: Placement;
    offset?: [number, number];
    onClose?: () => void;
}

export const Popover: React.FC<PopoverProps> = ({ targetElement, children, placement = 'bottom-start', offset = [0, 8], onClose }) => {
    const popperElement = useRef<HTMLDivElement>(null);
    const [portalContainer, setPortalContainer] = React.useState<HTMLDivElement | null>(null);

    // Create a container div and append it to the body on mount.
    // This removes the dependency on a static #portal-root in index.html.
    useEffect(() => {
        const el = document.createElement('div');
        document.body.appendChild(el);
        setPortalContainer(el);

        return () => {
            document.body.removeChild(el);
        };
    }, []);
    
    const { styles, attributes } = usePopper(targetElement, popperElement.current, {
        placement,
        modifiers: [
            { name: 'offset', options: { offset } },
            { name: 'preventOverflow', options: { padding: 8 } }
        ],
    });
    
    // Click outside handler
    useEffect(() => {
        if (!onClose) return;

        const handleClickOutside = (event: MouseEvent) => {
            const isTargetRealElement = targetElement && 'contains' in targetElement;
            if (
                popperElement.current && !popperElement.current.contains(event.target as Node) &&
                (!isTargetRealElement || (targetElement && !(targetElement as HTMLElement).contains(event.target as Node)))
            ) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose, targetElement]);


    if (!portalContainer || !targetElement) return null;

    return createPortal(
        <div ref={popperElement} style={styles.popper} {...attributes.popper} className="z-50">
            {children}
        </div>,
        portalContainer
    );
};
