import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Skeleton } from '../common/Skeleton';
import Button from '../common/Button';
import styles from './ImageViewer.module.css';

/**
 * ImageViewer
 * Touch-friendly payment receipt and image inspector:
 * - Native non-passive wheel listener (I1)
 * - Two-pointer pinch-to-zoom and double-tap toggle 1x / 2.5x (I2)
 * - Pointer capture with bounded pan clamping (I3)
 * - Rotation fit-scale (I4)
 * - Zero transition lag during active pointer drag (I5)
 * - 44px toolbar buttons positioned at bottom-end on phones (I6)
 * - Skeleton and error fallback with retry and direct open link (I7)
 * - Responsive height: min(70dvh, 560px) (I8)
 * - Keyboard navigation (+, -, R, 0, Arrow keys, Esc) (I9)
 */
export default function ImageViewer({
  src,
  alt = 'صورة الإشعار',
  loading: externalLoading = false,
  onClose,
}) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgNaturalDimensions, setImgNaturalDimensions] = useState({ width: 0, height: 0 });

  const viewportRef = useRef(null);
  const activePointersRef = useRef(new Map());
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastTapTimeRef = useRef(0);
  const pinchStartDistRef = useRef(0);
  const pinchStartScaleRef = useRef(1);

  // Reset state when src changes
  useEffect(() => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setImgLoaded(false);
    setImgError(false);
  }, [src]);

  // Clamp pan position within visible viewport bounds (I3)
  const clampPosition = useCallback(
    (nextX, nextY, currentScale) => {
      if (!viewportRef.current || currentScale <= 1) {
        return { x: 0, y: 0 };
      }
      const rect = viewportRef.current.getBoundingClientRect();
      const maxOverflowX = (rect.width * (currentScale - 1)) / 2 + 40;
      const maxOverflowY = (rect.height * (currentScale - 1)) / 2 + 40;

      return {
        x: Math.max(-maxOverflowX, Math.min(maxOverflowX, nextX)),
        y: Math.max(-maxOverflowY, Math.min(maxOverflowY, nextY)),
      };
    },
    []
  );

  const handleZoomIn = useCallback(() => {
    setScale((s) => {
      const next = Math.min(s + 0.5, 4);
      return next;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((s) => {
      const next = Math.max(s - 0.5, 1);
      if (next === 1) {
        setPosition({ x: 0, y: 0 });
      } else {
        setPosition((pos) => clampPosition(pos.x, pos.y, next));
      }
      return next;
    });
  }, [clampPosition]);

  const handleRotate = useCallback(() => {
    setRotation((r) => (r + 90) % 360);
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  // I1: Non-passive native wheel listener
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (e) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        handleZoomIn();
      } else {
        handleZoomOut();
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, [handleZoomIn, handleZoomOut]);

  // I9: Keyboard controls
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleRotate();
      } else if (e.key === '0') {
        e.preventDefault();
        handleReset();
      } else if (e.key === 'Escape' && onClose) {
        e.preventDefault();
        onClose();
      } else if (scale > 1) {
        const step = 25;
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setPosition((p) => clampPosition(p.x, p.y + step, scale));
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setPosition((p) => clampPosition(p.x, p.y - step, scale));
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setPosition((p) => clampPosition(p.x + step, p.y, scale));
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setPosition((p) => clampPosition(p.x - step, p.y, scale));
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleZoomIn, handleZoomOut, handleRotate, handleReset, onClose, scale, clampPosition]);

  // I2 & I3 & I5: Pointer events for single-touch pan and multi-touch pinch
  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Double-tap detection (I2)
    const now = Date.now();
    if (activePointersRef.current.size === 1 && now - lastTapTimeRef.current < 300) {
      if (scale > 1) {
        handleReset();
      } else {
        setScale(2.5);
      }
      lastTapTimeRef.current = 0;
      return;
    }
    lastTapTimeRef.current = now;

    if (activePointersRef.current.size === 1) {
      if (scale > 1) {
        setIsDragging(true);
        dragStartRef.current = {
          x: e.clientX - position.x,
          y: e.clientY - position.y,
        };
      }
    } else if (activePointersRef.current.size === 2) {
      // Begin pinch
      setIsDragging(false);
      const points = Array.from(activePointersRef.current.values());
      pinchStartDistRef.current = Math.hypot(
        points[0].x - points[1].x,
        points[0].y - points[1].y
      );
      pinchStartScaleRef.current = scale;
    }
  };

  const handlePointerMove = (e) => {
    if (!activePointersRef.current.has(e.pointerId)) return;
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 2) {
      // Pinch to zoom (I2)
      const points = Array.from(activePointersRef.current.values());
      const currentDist = Math.hypot(
        points[0].x - points[1].x,
        points[0].y - points[1].y
      );
      if (pinchStartDistRef.current > 0) {
        const factor = currentDist / pinchStartDistRef.current;
        const targetScale = Math.min(4, Math.max(1, pinchStartScaleRef.current * factor));
        setScale(targetScale);
        if (targetScale === 1) {
          setPosition({ x: 0, y: 0 });
        }
      }
    } else if (isDragging && scale > 1 && activePointersRef.current.size === 1) {
      // Pan (I3)
      const nextX = e.clientX - dragStartRef.current.x;
      const nextY = e.clientY - dragStartRef.current.y;
      setPosition(clampPosition(nextX, nextY, scale));
    }
  };

  const handlePointerUp = (e) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size === 0) {
      setIsDragging(false);
    } else if (activePointersRef.current.size === 1) {
      const remaining = activePointersRef.current.values().next().value;
      dragStartRef.current = {
        x: remaining.x - position.x,
        y: remaining.y - position.y,
      };
    }
  };

  // I4: Rotation fit scale
  const isRotatedQuarter = rotation % 180 !== 0;
  let rotationFitScale = 1;
  if (isRotatedQuarter && imgNaturalDimensions.width && imgNaturalDimensions.height && viewportRef.current) {
    const vRect = viewportRef.current.getBoundingClientRect();
    const naturalRatio = imgNaturalDimensions.width / imgNaturalDimensions.height;
    const viewportRatio = vRect.width / vRect.height;
    if (naturalRatio > 1 && viewportRatio < 1) {
      rotationFitScale = Math.min(vRect.width / vRect.height, 0.85);
    }
  }

  const finalRenderScale = scale * rotationFitScale;

  const handleImageLoad = (e) => {
    setImgLoaded(true);
    setImgError(false);
    setImgNaturalDimensions({
      width: e.target.naturalWidth || 800,
      height: e.target.naturalHeight || 600,
    });
  };

  const handleImageError = () => {
    setImgLoaded(false);
    setImgError(true);
  };

  const handleRetry = () => {
    setImgError(false);
    setImgLoaded(false);
  };

  if (externalLoading) {
    return (
      <div className={styles.loadingBox}>
        <Skeleton height="100%" width="100%" borderRadius="var(--radius-lg)" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* I7: Image Loading Skeleton */}
      {!imgLoaded && !imgError && (
        <div className={styles.skeletonOverlay}>
          <Skeleton height="100%" width="100%" />
        </div>
      )}

      {/* I7: Error State */}
      {imgError && (
        <div className={styles.errorContainer}>
          <AlertCircle size={40} className={styles.errorIcon} />
          <p className={styles.errorTitle}>تعذر تحميل صورة الإشعار</p>
          <div className={styles.errorActions}>
            <Button variant="outline" size="sm" onClick={handleRetry}>
              <RefreshCw size={14} />
              <span>إعادة المحاولة</span>
            </Button>
            {src && (
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.externalLink}
              >
                <span>فتح الصورة الأصلية</span>
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      )}

      {/* I6: Floating 44px Toolbar (bottom-end on phones, top-start on desktop) */}
      {!imgError && (
        <div className={styles.toolbar} role="toolbar" aria-label="أدوات عرض الصورة">
          <button
            type="button"
            onClick={handleZoomIn}
            className={styles.toolBtn}
            title="تكبير (+)"
            aria-label="تكبير"
          >
            <ZoomIn size={20} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className={styles.toolBtn}
            title="تصغير (-)"
            aria-label="تصغير"
          >
            <ZoomOut size={20} />
          </button>
          <button
            type="button"
            onClick={handleRotate}
            className={styles.toolBtn}
            title="تدوير 90 درجة (R)"
            aria-label="تدوير"
          >
            <RotateCw size={20} />
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={scale === 1 && rotation === 0}
            className={styles.toolBtn}
            title="إعادة ضبط (0)"
            aria-label="إعادة ضبط"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      )}

      {/* Viewport Canvas */}
      <div
        ref={viewportRef}
        className={`${styles.viewport} ${scale > 1 ? styles.canDrag : ''} ${isDragging ? styles.dragging : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <img
          src={src}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`${styles.image} ${!imgLoaded ? styles.hiddenImage : ''}`}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${finalRenderScale})`,
            transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0, 0, 1)', // I5
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}
