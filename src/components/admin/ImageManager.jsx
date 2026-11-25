import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Upload,
  Star,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
} from 'lucide-react';
import { compressImage } from '../../utils/imageCompressor';
import { resolveImageUrl } from '../../utils/formatters';
import adminApi from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import styles from './ImageManager.module.css';

const MAX_IMAGES = 10;
const CONCURRENCY_LIMIT = 3;

/**
 * ImageManager handles:
 * - Multi-image bulk selection and dropzone
 * - Client-side auto compression (max 1600px, 0.82 quality)
 * - Concurrency limit of 3 for parallel uploads with retry on failure
 * - Set primary image with star icon & badge
 * - Alt text editing
 * - Image reordering with up/down buttons
 * - Both Edit mode (immediate API sync) and Create mode (local queuing)
 */
export default function ImageManager({
  productId,
  images = [],
  onImagesChange,
  queuedFiles = [],
  onQueuedFilesChange,
}) {
  const { success, error: toastError, info } = useToast();
  const fileInputRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // { current, total }
  const [altDrafts, setAltDrafts] = useState({});

  const isEditMode = Boolean(productId);
  const currentTotal = isEditMode ? images.length : queuedFiles.length;

  // Process a batch of files with concurrency limit
  const processUploadQueue = async (files) => {
    const queue = [...files];
    const total = queue.length;
    let completed = 0;

    setUploadProgress({ current: 0, total });

    const worker = async () => {
      while (queue.length > 0) {
        const file = queue.shift();
        let attempts = 0;
        let uploaded = false;

        while (attempts < 2 && !uploaded) {
          try {
            attempts++;
            const compressed = await compressImage(file, 1600, 0.82);
            const formData = new FormData();
            formData.append('images[]', compressed);

            await adminApi.uploadProductImages(productId, formData);
            uploaded = true;
          } catch (err) {
            if (attempts >= 2) {
              throw err;
            }
          }
        }

        completed++;
        setUploadProgress({ current: completed, total });
      }
    };

    const workers = Array.from(
      { length: Math.min(CONCURRENCY_LIMIT, total) },
      () => worker()
    );

    await Promise.all(workers);
  };

  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const incoming = Array.from(fileList);
    if (currentTotal + incoming.length > MAX_IMAGES) {
      toastError(`الحد الأقصى للصور هو ${MAX_IMAGES} صور. يمكنك إضافة ${Math.max(0, MAX_IMAGES - currentTotal)} فقط.`);
      return;
    }

    if (isEditMode) {
      try {
        await processUploadQueue(incoming);
        success('تم رفع الصور وضغطها بنجاح');
        const refreshed = await adminApi.getProduct(productId);
        if (onImagesChange) {
          onImagesChange(refreshed.data?.images || []);
        }
      } catch (err) {
        toastError(err.message || 'فشل رفع بعض الصور، يرجى المحاولة مرة أخرى');
      } finally {
        setUploadProgress(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } else {
      // Create mode: queue files locally with object preview URLs
      try {
        const compressedList = await Promise.all(
          incoming.map((f) => compressImage(f, 1600, 0.82))
        );

        const newQueued = compressedList.map((file, idx) => ({
          id: `queue-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
          file,
          previewUrl: URL.createObjectURL(file),
          alt: '',
          is_primary: queuedFiles.length === 0 && idx === 0,
        }));

        const updated = [...queuedFiles, ...newQueued];
        if (onQueuedFilesChange) {
          onQueuedFilesChange(updated);
        }
        success(`تمت إضافة ${newQueued.length} صور في قائمة الانتظار`);
      } catch (err) {
        toastError(err.message || 'فشل تجهيز الصور للرفع');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Reordering
  const handleMove = async (index, direction) => {
    const newIndex = index + direction;
    const list = isEditMode ? images : queuedFiles;
    if (newIndex < 0 || newIndex >= list.length) return;

    const copy = [...list];
    const temp = copy[index];
    copy[index] = copy[newIndex];
    copy[newIndex] = temp;

    if (isEditMode) {
      onImagesChange(copy);
      try {
        const orderIds = copy.map((img) => img.id);
        await adminApi.reorderProductImages(productId, orderIds);
      } catch (err) {
        toastError(err.message || 'فشل تحديث ترتيب الصور');
        const refreshed = await adminApi.getProduct(productId);
        onImagesChange(refreshed.data?.images || []);
      }
    } else {
      onQueuedFilesChange(copy);
    }
  };

  // Set Primary Image
  const handleSetPrimary = async (targetId) => {
    if (isEditMode) {
      try {
        await adminApi.updateProductImage(productId, targetId, { is_primary: 1 });
        success('تم تعيين الصورة كصورة رئيسية');
        const refreshed = await adminApi.getProduct(productId);
        onImagesChange(refreshed.data?.images || []);
      } catch (err) {
        toastError(err.message || 'فشل تعيين الصورة الرئيسية');
      }
    } else {
      const updated = queuedFiles.map((item) => ({
        ...item,
        is_primary: item.id === targetId,
      }));
      onQueuedFilesChange(updated);
    }
  };

  // Delete Image
  const handleDelete = async (targetId) => {
    if (isEditMode) {
      try {
        onImagesChange(images.filter((img) => img.id !== targetId));
        await adminApi.deleteProductImage(productId, targetId);
        info('تم حذف الصورة');
        const refreshed = await adminApi.getProduct(productId);
        onImagesChange(refreshed.data?.images || []);
      } catch (err) {
        toastError(err.message || 'فشل حذف الصورة');
        const refreshed = await adminApi.getProduct(productId);
        onImagesChange(refreshed.data?.images || []);
      }
    } else {
      const itemToDelete = queuedFiles.find((item) => item.id === targetId);
      if (itemToDelete?.previewUrl) {
        URL.revokeObjectURL(itemToDelete.previewUrl);
      }
      const filtered = queuedFiles.filter((item) => item.id !== targetId);
      // If we deleted the primary, make first one primary
      if (itemToDelete?.is_primary && filtered.length > 0) {
        filtered[0].is_primary = true;
      }
      onQueuedFilesChange(filtered);
    }
  };

  // Alt Text Save
  const handleSaveAlt = async (targetId, currentVal) => {
    const newAlt = altDrafts[targetId] !== undefined ? altDrafts[targetId] : (currentVal || '');
    if (isEditMode) {
      try {
        await adminApi.updateProductImage(productId, targetId, { alt: newAlt });
        success('تم تحديث النص البديل');
      } catch (err) {
        toastError(err.message || 'فشل تحديث النص البديل');
      }
    } else {
      const updated = queuedFiles.map((item) =>
        item.id === targetId ? { ...item, alt: newAlt } : item
      );
      onQueuedFilesChange(updated);
    }
  };

  const displayList = isEditMode ? images : queuedFiles;

  return (
    <div className={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={Boolean(uploadProgress) || currentTotal >= MAX_IMAGES}
        style={{ display: 'none' }}
      />

      <div
        className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <Upload size={32} color="var(--color-royal-blue, #1D4ED8)" />
        <span className={styles.dropzoneText}>
          {uploadProgress
            ? 'جاري ضغط ورفع الصور...'
            : 'اسحب الصور وأفلتها هنا، أو اضغط للاختيار من جهازك'}
        </span>
        <span className={styles.dropzoneHint}>
          الحد الأقصى {MAX_IMAGES} صور. يتم ضغط الصور تلقائياً (بأبعاد حتى 1600 بكسل وجودة 82%)
        </span>
      </div>

      {uploadProgress && (
        <div className={styles.progressContainer}>
          <div className={styles.progressText}>
            <span>جاري رفع الصور ومعالجتها...</span>
            <span>
              {uploadProgress.current} من {uploadProgress.total}
            </span>
          </div>
          <div className={styles.progressBarTrack}>
            <div
              className={styles.progressBarFill}
              style={{
                width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {displayList.length === 0 ? (
        <div className={styles.emptyState}>
          <AlertCircle size={24} />
          <span>لا توجد صور مرفوعة للجهاز بعد</span>
        </div>
      ) : (
        <div className={styles.imagesGrid}>
          {displayList.map((item, index) => {
            const isPrimary = Boolean(item.is_primary);
            const imgSrc = isEditMode
              ? resolveImageUrl(item.thumb_path || item.path)
              : item.previewUrl;
            const currentAlt = altDrafts[item.id] !== undefined ? altDrafts[item.id] : (item.alt || '');

            return (
              <div
                key={item.id}
                className={`${styles.imageCard} ${isPrimary ? styles.imageCardPrimary : ''}`}
              >
                <div className={styles.imageThumbWrap}>
                  <img src={imgSrc} alt={currentAlt || 'صورة الجهاز'} className={styles.imageThumb} />
                  {isPrimary && (
                    <span className={styles.primaryBadge}>
                      <Star size={12} fill="#FFFFFF" />
                      الرئيسية
                    </span>
                  )}
                </div>

                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={`${styles.actionButton} ${isPrimary ? styles.actionButtonActive : ''}`}
                    onClick={() => handleSetPrimary(item.id)}
                    title={isPrimary ? 'الصورة الرئيسية' : 'تعيين كصورة رئيسية'}
                    aria-label="تعيين كصورة رئيسية"
                  >
                    <Star size={16} fill={isPrimary ? 'currentColor' : 'none'} />
                  </button>

                  <button
                    type="button"
                    className={styles.actionButton}
                    disabled={index === 0}
                    onClick={() => handleMove(index, -1)}
                    title="تحريك لليمين (سابق)"
                    aria-label="تحريك لليمين"
                  >
                    <ChevronRight size={16} />
                  </button>

                  <button
                    type="button"
                    className={styles.actionButton}
                    disabled={index === displayList.length - 1}
                    onClick={() => handleMove(index, 1)}
                    title="تحريك لليسار (تالي)"
                    aria-label="تحريك لليسار"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <button
                    type="button"
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={() => handleDelete(item.id)}
                    title="حذف الصورة"
                    aria-label="حذف الصورة"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className={styles.altSection}>
                  <input
                    type="text"
                    className={styles.altInput}
                    placeholder="وصف الصورة النصي لقارئات الشاشة..."
                    value={currentAlt}
                    onChange={(e) =>
                      setAltDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    onBlur={() => handleSaveAlt(item.id, item.alt)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveAlt(item.id, item.alt);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={() => handleSaveAlt(item.id, item.alt)}
                    title="حفظ الوصف"
                    aria-label="حفظ الوصف"
                    style={{ minHeight: 28, minWidth: 28, padding: 2 }}
                  >
                    <Check size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

ImageManager.propTypes = {
  productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  images: PropTypes.arrayOf(PropTypes.object),
  onImagesChange: PropTypes.func,
  queuedFiles: PropTypes.arrayOf(PropTypes.object),
  onQueuedFilesChange: PropTypes.func,
};
