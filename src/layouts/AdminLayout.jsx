import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminShell from '../components/admin/AdminShell';
import '../styles/admin.css';

/**
 * AdminLayout
 * Root administrative layout wrapping nested routes inside the isolated .admin-root scope.
 */
export default function AdminLayout() {
  return (
    <div className="admin-root">
      <AdminShell>
        <Outlet />
      </AdminShell>
    </div>
  );
}
