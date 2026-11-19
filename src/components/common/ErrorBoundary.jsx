import React, { Component } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import Button from './Button';
import styles from './ErrorBoundary.module.css';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Only log to console.error in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.wrapper} role="alert">
          <div className={styles.iconBox} aria-hidden="true">
            <AlertCircle size={32} strokeWidth={1.75} />
          </div>
          <h2 className={styles.title}>حصل خطأ غير متوقع</h2>
          <p className={styles.message}>
            نعتذر عن المشكلة. يمكنك إعادة تحميل الصفحة أو المحاولة مرة أخرى.
          </p>
          <div className={styles.actions}>
            <Button
              variant="primary"
              icon={RotateCcw}
              onClick={this.handleReload}
            >
              إعادة تحميل الصفحة
            </Button>
            <Button
              variant="secondary"
              onClick={this.handleReset}
            >
              إعادة المحاولة
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
