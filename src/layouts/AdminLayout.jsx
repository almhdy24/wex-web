import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminShell from '../components/admin/AdminShell';

/**
 * AdminLayout
 * Root administrative layout wrapping nested routes inside the adaptive AdminShell.
 */
export default function AdminLayout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
