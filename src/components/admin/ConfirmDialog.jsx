import React, { useRef, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import styles from './ConfirmDialog.module.css';

/**
 * ConfirmDialog
 * Accessible confirmation modal for critical or destructive actions.
 * States consequences in plain words and never relies on color alone.
 * - Normalized props: description (message), confirmLabel (confirmText), cancelLabel (cancelText).
 * - Focuses safe (cancel) button by default on danger dialogs.
 * - Blocks closing while loading.
 * - Stacks vertically on screens <= 400px with min 48px buttons.
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  description,
  message,
  confirmLabel,
  confirmText,
  cancelLabel = 'إلغاء',
  cancelText,
  variant = 'danger',
  loading = false,
  isLoading = false,
  ...rest
}) {
  if (process.env.NODE_ENV !== 'production') {
    const knownProps = new Set([
      'isOpen',
      'onClose',
      'onCancel',
      'onConfirm',
      'title',
      'description',
      'message',
      'confirmLabel',
      'confirmText',
      'cancelLabel',
      'cancelText',
      'variant',
      'loading',
      'isLoading',
      'children',
    ]);
    Object.keys(rest).forEach((prop) => {
      if (!knownProps.has(prop)) {
        console.error(`[ConfirmDialog] Unknown prop: "${prop}"`);
      }
    });
  }

  const finalDescription = description ?? message ?? '';
  const finalConfirmLabel = confirmLabel ?? confirmText ?? 'تأكيد';
  const finalCancelLabel = cancelLabel ?? cancelText ?? 'إلغاء';
  const finalLoading = Boolean(loading || isLoading);
  const handleCancelAction = onCancel || onClose;

  const cancelBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen && variant === 'danger' && cancelBtnRef.current) {
      cancelBtnRef.current.focus?.();
    }
  }, [isOpen, variant]);

  const handleModalClose = () => {
    if (!finalLoading) {
      handleCancelAction?.();
    }
  };

  const Icon = variant === 'danger' ? AlertTriangle : variant === 'warning' ? AlertCircle : Info;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={title}
      role={variant === 'danger' || variant === 'warning' ? 'alertdialog' : 'dialog'}
      aria-describedby="confirm-dialog-description"
    >
      <div className={styles.container}>
        <div className={`${styles.iconWrapper} ${styles[variant]}`} aria-hidden="true">
          <Icon size={24} strokeWidth={2} aria-hidden="true" />
        </div>

        <div className={styles.content}>
          <p id="confirm-dialog-description" className={styles.description}>
            {finalDescription}
          </p>
        </div>

        <div className={styles.actions}>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="md"
            onClick={onConfirm}
            loading={finalLoading}
            className={styles.confirmBtn}
          >
            {finalConfirmLabel}
          </Button>
          <Button
            ref={cancelBtnRef}
            variant="outline"
            size="md"
            onClick={handleModalClose}
            disabled={finalLoading}
            className={styles.cancelBtn}
          >
            {finalCancelLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
