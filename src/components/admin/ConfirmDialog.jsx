import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import styles from './ConfirmDialog.module.css';

/**
 * ConfirmDialog
 * Accessible confirmation modal for critical or destructive actions.
 * States consequences in plain words and never relies on color alone.
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  variant = 'danger',
  loading = false,
}) {
  const Icon = variant === 'danger' ? AlertTriangle : variant === 'warning' ? AlertCircle : Info;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className={styles.container}>
        <div className={`${styles.iconWrapper} ${styles[variant]}`}>
          <Icon size={24} strokeWidth={2} />
        </div>

        <div className={styles.content}>
          <p className={styles.description}>{description}</p>
        </div>

        <div className={styles.actions}>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="md"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
