import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminApi } from '../api/admin';
import * as clientModule from '../api/client';

describe('Admin API & Capabilities Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('correctly constructs query string for admin product list', async () => {
    const getSpy = vi.spyOn(clientModule.api, 'get').mockResolvedValue({
      success: true,
      data: [{ id: 1, name: 'Dell Latitude 5420' }],
    });

    await adminApi.getProducts({ page: 2, per_page: 10, type: 'laptop', is_active: '1', q: 'Dell' });

    expect(getSpy).toHaveBeenCalledWith('/admin/products?page=2&per_page=10&type=laptop&is_active=1&q=Dell');
  });

  it('sends correct payload when updating exchange rate in SDG', async () => {
    const postSpy = vi.spyOn(clientModule.api, 'post').mockResolvedValue({
      success: true,
      message: 'تم تحديث سعر الصرف بنجاح',
      data: { rate_sdg: 850 },
    });

    await adminApi.updateRate(850);

    expect(postSpy).toHaveBeenCalledWith('/admin/rates', { rate_sdg: 850 });
  });

  it('sends correct payload when updating user role', async () => {
    const patchSpy = vi.spyOn(clientModule.api, 'patch').mockResolvedValue({
      success: true,
      message: 'تم تحديث دور المستخدم',
      data: { id: 5, role: 'staff' },
    });

    await adminApi.updateUserRole(5, 'staff');

    expect(patchSpy).toHaveBeenCalledWith('/admin/users/5/role', { role: 'staff' });
  });

  it('sends correct payload when updating user active status', async () => {
    const patchSpy = vi.spyOn(clientModule.api, 'patch').mockResolvedValue({
      success: true,
      message: 'تم تعديل حالة الحساب',
      data: { id: 5, is_active: false },
    });

    await adminApi.updateUserStatus(5, false);

    expect(patchSpy).toHaveBeenCalledWith('/admin/users/5/status', { is_active: false });
  });

  it('correctly requests audit logs with entity and action filters', async () => {
    const getSpy = vi.spyOn(clientModule.api, 'get').mockResolvedValue({
      success: true,
      data: [],
    });

    await adminApi.getAuditLogs({ page: 1, per_page: 25, entity: 'orders', action: 'approve' });

    expect(getSpy).toHaveBeenCalledWith('/admin/audit-logs?page=1&per_page=25&entity=orders&action=approve');
  });
});
