import React from 'react';
import useViewport from '../../hooks/useViewport';
import Modal from './Modal';
import Sheet from './Sheet';

/**
 * Adaptive Dialog component:
 * - Mobile (< 640px): bottom Sheet
 * - Tablet & Desktop (>= 640px): centered Modal (max 560px)
 */
export default function Dialog({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '560px',
  className = '',
  forceVariant, // 'sheet' | 'modal' | undefined
}) {
  const { isMobile } = useViewport();

  const variant = forceVariant || (isMobile ? 'sheet' : 'modal');

  if (variant === 'sheet') {
    return (
      <Sheet
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        footer={footer}
        className={className}
      >
        {children}
      </Sheet>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footer}
      maxWidth={maxWidth}
      className={className}
    >
      {children}
    </Modal>
  );
}
