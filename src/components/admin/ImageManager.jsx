import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Upload,
  Star,
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  RotateCw,
  Type,
  Loader2,
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
  const [uploads, setUploads] = useState([]); // per-file: { key, file, previewUrl, status: 'uploading' | 'error' }
  const [altDrafts, setAltDrafts] = useState({});
  const [altOpen, setAltOpen] = useState(() => new Set());
  const [dragIndex, setDragIndex] = useState(null);

  const toggleAlt = (imgId) => {
    setAltOpen((prev) => {
      const next = new Set(prev);
      if (next.has(imgId)) next.delete(imgId);
      else next.add(imgId);
      return next;
    });
  };

  const isEditMode = Boolean(productId);
  const currentTotal = (isEditMode ? images.length : queuedFiles.length) + uploads.length;

  const refreshImages = async () => {
    const refreshed = await adminApi.getProduct(productId);
    if (onImagesChange) onImagesChange(refreshed.data?.images || []);
  };

  // Uploads one file (compress, then POST). Failed files stay as a tile with a retry button.
  const uploadOne = async (item) => {
    setUploads((prev) => prev.map((u) => (u.key === item.key ? { ...u, status: 'uploading' } : u)));
    try {
      const compressed = await compressImage(item.file, 1600, 0.82);
      const formData = new FormData();
      formData.append('images[]', compressed);
      await adminApi.uploadProductImages(productId, formData);
      URL.revokeObjectURL(item.previewUrl);
      setUploads((prev) => prev.filter((u) => u.key !== item.key));
      return true;
    } catch {
      setUploads((prev) => prev.map((u) => (u.key === item.key ? { ...u, status: 'error' } : u)));
      return false;
    }
  };

  const retryUpload = async (item) => {
    if (await uploadOne(item)) {
      await refreshImages();
      success('تم رفع الصورة');
    }
  };

  // Uploads a batch with a concurrency limit; each file reports its own progress/failure.
  const processUploadQueue = async (files) => {
    const items = files.map((file, i) => ({
      key: `up-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'uploading',
    }));
    setUploads((prev) => [...prev, ...items]);
    const queue = [...items];
    let okCount = 0;
    const worker = async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (await uploadOne(item)) okCount += 1;
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY_LIMIT, items.length) }, worker));
    return { okCount, failed: items.length - okCount };
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
        const { okCount, failed } = await processUploadQueue(incoming);
        if (okCount > 0) {
          await refreshImages();
          success(failed ? `تم رفع ${okCount} صور، وفشل رفع ${failed}` : 'تم رفع الصور وضغطها بنجاح');
        } else if (failed) {
          toastError('فشل رفع الصور، اضغط إعادة المحاولة على الصورة');
        }
      } finally {
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

  // Reordering (arrow buttons and drag-and-drop)
  const handleMove = async (index, direction) => moveTo(index, index + direction);

  const moveTo = async (index, newIndex) => {
    const list = isEditMode ? images : queuedFiles;
    if (newIndex < 0 || newIndex >= list.length) return;

    const copy = [...list];
    const [moved] = copy.splice(index, 1);
    copy.splice(newIndex, 0, moved);

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
        disabled={currentTotal >= MAX_IMAGES}
        style={{ display: 'none' }}
      />

      <div className={styles.grid}>
        {displayList.map((item, index) => {
          const isPrimary = Boolean(item.is_primary);
          const imgSrc = isEditMode ? resolveImageUrl(item.thumb_path || item.path) : item.previewUrl;
          const currentAlt = altDrafts[item.id] !== undefined ? altDrafts[item.id] : item.alt || '';
          const showAlt = altOpen.has(item.id);
          return (
            <div
              key={item.id}
              className={`${styles.tile} ${isPrimary ? styles.tilePrimary : ''} ${dragIndex === index ? styles.tileDragging : ''}`}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null && dragIndex !== index) moveTo(dragIndex, index);
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
            >
              <div className={styles.thumbBox}>
                <img src={imgSrc} alt={currentAlt || 'صورة الجهاز'} className={styles.thumb} draggable={false} />
                <button
                  type="button"
                  className={`${styles.cornerBtn} ${styles.cornerStar} ${isPrimary ? styles.cornerOn : ''}`}
                  onClick={() => handleSetPrimary(item.id)}
                  title={isPrimary ? 'الصورة الرئيسية' : 'تعيين كصورة رئيسية'}
                  aria-label="تعيين كصورة رئيسية"
                >
                  <Star size={16} fill={isPrimary ? 'currentColor' : 'none'} />
                </button>
                <button
                  type="button"
                  className={`${styles.cornerBtn} ${styles.cornerDelete}`}
                  onClick={() => handleDelete(item.id)}
                  title="حذف الصورة"
                  aria-label="حذف الصورة"
                >
                  <X size={16} />
                </button>
                {isPrimary ? <span className={styles.coverBadge}>الرئيسية</span> : null}
              </div>
              <div className={styles.tileBar}>
                <button type="button" className={styles.barBtn} disabled={index === 0} onClick={() => handleMove(index, -1)} title="تحريك لليمين (سابق)" aria-label="تحريك لليمين">
                  <ChevronRight size={16} />
                </button>
                <button type="button" className={styles.barBtn} onClick={() => toggleAlt(item.id)} aria-label="وصف الصورة" aria-expanded={showAlt} title="وصف الصورة">
                  <Type size={15} />
                </button>
                <button type="button" className={styles.barBtn} disabled={index === displayList.length - 1} onClick={() => handleMove(index, 1)} title="تحريك لليسار (تالي)" aria-label="تحريك لليسار">
                  <ChevronLeft size={16} />
                </button>
              </div>
              {showAlt ? (
                <div className={styles.altRow}>
                  <input
                    type="text"
                    className={styles.altInput}
                    placeholder="وصف الصورة النصي لقارئات الشاشة..."
                    value={currentAlt}
                    onChange={(e) => setAltDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                    onBlur={() => handleSaveAlt(item.id, item.alt)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveAlt(item.id, item.alt);
                      }
                    }}
                  />
                  <button type="button" className={styles.barBtn} onClick={() => handleSaveAlt(item.id, item.alt)} aria-label="حفظ الوصف">
                    <Check size={14} />
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}

        {uploads.map((u) => (
          <div key={u.key} className={styles.tile}>
            <div className={styles.thumbBox}>
              <img src={u.previewUrl} alt="" className={`${styles.thumb} ${styles.thumbBusy}`} draggable={false} />
              {u.status === 'uploading' ? (
                <span className={styles.overlay}><Loader2 size={22} className={styles.spin} /><span>جاري الرفع</span></span>
              ) : (
                <span className={`${styles.overlay} ${styles.overlayError}`}>
                  <span>فشل الرفع</span>
                  <button type="button" className={styles.retryBtn} onClick={() => retryUpload(u)} aria-label="إعادة المحاولة">
                    <RotateCw size={14} />
                    <span>إعادة المحاولة</span>
                  </button>
                </span>
              )}
            </div>
          </div>
        ))}

        {currentTotal < MAX_IMAGES ? (
          <button
            type="button"
            className={`${styles.addTile} ${isDragging ? styles.addTileActive : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            aria-label="إضافة صور"
          >
            <Upload size={22} />
            <span>إضافة صور</span>
          </button>
        ) : null}
      </div>

      {displayList.length === 0 && uploads.length === 0 ? (
        <div className={styles.emptyState}>
          <AlertCircle size={20} />
          <span>لا توجد صور مرفوعة للجهاز بعد</span>
        </div>
      ) : null}

      <span className={styles.hint}>
        الحد الأقصى {MAX_IMAGES} صور — تُضغط تلقائياً (حتى 1600 بكسل). اسحب الصورة أو استخدم الأسهم لتغيير الترتيب، والنجمة تحدد الصورة الرئيسية.
      </span>
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
