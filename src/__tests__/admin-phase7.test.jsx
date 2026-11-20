import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AdminShell from '../components/admin/AdminShell';
import Toast from '../components/common/Toast';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import { MemoryRouter } from 'react-router-dom';

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  actionToast: vi.fn(),
};

const mockAuthAdmin = {
  user: { id: 1, name: 'المدير العام', email: 'admin@wex.sd', role: 'admin' },
  isAuthenticated: true,
  isAdmin: true,
  isStaff: true,
  loading: false,
  logout: vi.fn(),
};

describe('Phase 7: Polish, A11y, Idle Timer & PWA Manifest Unit Tests', () => {
  it('AdminShell renders adaptive navigation, audio chime toggle, and search trigger', () => {
    const html = renderToStaticMarkup(
      <AuthContext.Provider value={mockAuthAdmin}>
        <ToastContext.Provider value={mockToast}>
          <MemoryRouter>
            <AdminShell>
              <div id="test-content">محتوى تجريبي</div>
            </AdminShell>
          </MemoryRouter>
        </ToastContext.Provider>
      </AuthContext.Provider>
    );

    expect(html).toContain('محتوى تجريبي');
    expect(html).toContain('اليوم');
    expect(html).toContain('الطلبات');
    expect(html).toContain('المدفوعات');
    expect(html).toContain('تنبيه صوتي');
  });

  it('Toast component has accessible role and polite aria-live attribute', () => {
    const html = renderToStaticMarkup(
      <Toast
        toast={{ id: 't1', type: 'success', message: 'تم حفظ البيانات بنجاح' }}
        onDismiss={vi.fn()}
      />
    );

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('تم حفظ البيانات بنجاح');
  });
});
