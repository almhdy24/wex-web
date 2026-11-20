import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCw, RefreshCw } from 'lucide-react';
import { Skeleton } from '../common/Skeleton';
import styles from './ImageViewer.module.css';

/**
 * ImageViewer
 * Interactive image viewer supporting zoom, pan, and 90-degree rotation.
 * All mutations are transform-only for 60fps performance on low-end devices.
 */
export default function ImageViewer({ src, alt = 'صورة الإشعار', loading = false }) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.35, 4));
  const handleZoomOut = () => {
    setScale((s) => {
      const next = Math.max(s - 0.35, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handlePointerDown = (e) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      handleReset();
    } else {
      setScale(2);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingBox}>
        <Skeleton height="100%" width="100%" borderRadius="var(--radius-lg)" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Floating Toolbar */}
      <div className={styles.toolbar} role="toolbar" aria-label="أدوات عرض الصورة">
        <button
          type="button"
          onClick={handleZoomIn}
          className={styles.toolBtn}
          title="تكبير"
          aria-label="تكبير"
        >
          <ZoomIn size={18} />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={scale <= 1}
          className={styles.toolBtn}
          title="تصغير"
          aria-label="تصغير"
        >
          <ZoomOut size={18} />
        </button>
        <button
          type="button"
          onClick={handleRotate}
          className={styles.toolBtn}
          title="تدوير 90 درجة"
          aria-label="تدوير"
        >
          <RotateCw size={18} />
        </button>
        <button
          type="button"
          onClick={handleReset}
          className={styles.toolBtn}
          title="إعادة ضبط"
          aria-label="إعادة ضبط"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Viewport Canvas */}
      <div
        className={`${styles.viewport} ${scale > 1 ? styles.canDrag : ''} ${isDragging ? styles.dragging : ''}`}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onDoubleClick={handleDoubleClick}
      >
        <img
          src={src}
          alt={alt}
          className={styles.image}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}
