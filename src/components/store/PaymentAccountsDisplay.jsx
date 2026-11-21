import React, { useState } from 'react';
import { Copy, Check, Building2, Info } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { ar } from '../../content/ar';
import LatinText from '../common/LatinText';
import styles from './PaymentAccountsDisplay.module.css';

export default function PaymentAccountsDisplay({
  paymentAccounts,
  accounts,
  paymentGeneralNotes,
  generalNotes,
  orderNumber = '',
  bankDetails = null,
}) {
  const effectiveAccounts = paymentAccounts || accounts || [];
  const effectiveNotes = paymentGeneralNotes || generalNotes || '';
  const { success } = useToast();
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key, successMsg) => {
    if (!text) return;
    const str = String(text);
    const triggerSuccess = () => {
      setCopiedKey(key);
      success({
        title: successMsg || 'تم النسخ',
        detail: <LatinText>{str}</LatinText>,
        dedupeKey: `copy-${str}`,
      });
      setTimeout(() => setCopiedKey(null), 2000);
    };

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(str).then(triggerSuccess);
    } else {
      triggerSuccess();
    }
  };

  // Determine active accounts: use effectiveAccounts if present, else fallback to legacy bankDetails
  const accountsToRender =
    Array.isArray(effectiveAccounts) && effectiveAccounts.length > 0
      ? effectiveAccounts
      : (bankDetails && bankDetails.account_number)
      ? [
          {
            id: 'legacy-bank',
            bank_name: bankDetails.bank_name || 'حساب التحويل البنكي',
            account_name: bankDetails.account_name || 'متجر ويكس تكنولوجي',
            account_number: bankDetails.account_number,
            branch: bankDetails.branch_name || 'الفرع الرئيسي',
            notes: bankDetails.notes || '',
          },
        ]
      : [];

  return (
    <div className={styles.container} aria-label={ar.paymentAccounts.title}>
      {/* 1-Tap Copy for Order Number */}
      {orderNumber && (
        <div className={styles.orderNumberCard}>
          <div className={styles.orderNumberMeta}>
            <span className={styles.orderNumberLabel}>{ar.paymentAccounts.copyOrderNumber}</span>
            <span className={styles.orderNumberVal}>#{orderNumber}</span>
          </div>

          <button
            type="button"
            onClick={() =>
              handleCopy(orderNumber, 'order-number', ar.paymentAccounts.copiedOrderSuccess)
            }
            className={`${styles.copyBtn} ${copiedKey === 'order-number' ? styles.copyBtnActive : ''}`}
            title={ar.paymentAccounts.copyOrderNumber}
          >
            {copiedKey === 'order-number' ? <Check size={14} /> : <Copy size={14} />}
            <span>
              {copiedKey === 'order-number'
                ? ar.common.copied
                : ar.paymentAccounts.copyOrderNumber}
            </span>
          </button>
        </div>
      )}

      {/* General Payment Instructions above Accounts */}
      {effectiveNotes && (
        <div className={styles.generalNotesCard} role="note">
          <Info size={20} className={styles.generalNotesIcon} aria-hidden="true" />
          <div>
            <div className={styles.generalNotesTitle}>{ar.paymentAccounts.generalNotesTitle}</div>
            <div className={styles.generalNotesText}>{effectiveNotes}</div>
          </div>
        </div>
      )}

      {/* Accounts List */}
      <div className={styles.accountsList}>
        {accountsToRender.length === 0 ? (
          <div className={styles.emptyAccounts}>
            <p>لا توجد حسابات دفع مفعلة حالياً</p>
          </div>
        ) : (
          accountsToRender.map((acc, index) => {
          const accKey = `acc-${acc.id || index}`;
          const isCopied = copiedKey === accKey;

          return (
            <div key={accKey} className={styles.accountCard}>
              <div className={styles.accountHeader}>
                <div>
                  <h4 className={styles.bankName}>{acc.bank_name}</h4>
                  {(acc.branch || acc.branch_name) && (
                    <div className={styles.branch}>{acc.branch || acc.branch_name}</div>
                  )}
                </div>
                <span className={styles.bankBadge}>
                  <Building2 size={12} />
                  <span>حساب المتجر</span>
                </span>
              </div>

              <div className={styles.accountDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.label}>{ar.paymentAccounts.accountNumber}:</span>
                  <div className={styles.accountNumberBox}>
                    <span className={styles.accountNumberText}>{acc.account_number}</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          acc.account_number,
                          accKey,
                          ar.paymentAccounts.copiedAccountSuccess
                        )
                      }
                      className={`${styles.copyBtn} ${isCopied ? styles.copyBtnActive : ''}`}
                      title={ar.paymentAccounts.copyAccountNumber}
                    >
                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{isCopied ? ar.common.copied : ar.common.copy}</span>
                    </button>
                  </div>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.label}>{ar.paymentAccounts.accountName}:</span>
                  <span className={styles.value}>{acc.account_name}</span>
                </div>

                {acc.notes && (
                  <div className={styles.accountNotes}>
                    <strong>{ar.paymentAccounts.notes}: </strong>
                    <span>{acc.notes}</span>
                  </div>
                )}
              </div>
            </div>
          );
        }))}
      </div>
    </div>
  );
}
