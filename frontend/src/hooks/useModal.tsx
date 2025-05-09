import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface UseModalOptions {
    onClose?: () => void;
    closeOnEsc?: boolean;
    closeOnOverlayClick?: boolean;
}

export const useModal = (options: UseModalOptions = {}) => {
    const {
        onClose,
        closeOnEsc = true,
        closeOnOverlayClick = true,
    } = options;

    const [isOpen, setIsOpen] = useState(false);
    const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

    useEffect(() => {
        const container = document.createElement('div');
        container.id = 'modal-portal';
        document.body.appendChild(container);
        setPortalContainer(container);

        return () => {
            document.body.removeChild(container);
        };
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const handleEsc = (e: KeyboardEvent) => {
            if (closeOnEsc && e.key === 'Escape') {
                close();
            }
        };

        document.addEventListener('keydown', handleEsc);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [isOpen, closeOnEsc]);

    const open = useCallback(() => {
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
        onClose?.();
    }, [onClose]);

    const handleOverlayClick = useCallback((e: React.MouseEvent) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
            close();
        }
    }, [closeOnOverlayClick, close]);

    const renderModal = (content: React.ReactNode) => {
        if (!isOpen || !portalContainer) return null;

        return createPortal(
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center"
                onClick={handleOverlayClick}
            >
                {content}
            </div>,
            portalContainer
        );
    };

    return {
        isOpen,
        open,
        close,
        renderModal,
    };
};
