import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';
import { PushProvider } from '../context/PushContext';
import { CartProvider } from '../context/CartContext';
import { FavoritesProvider } from '../context/FavoritesContext';
import { CompareProvider } from '../context/CompareContext';
import ErrorBoundary from '../components/common/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <PushProvider>
            <CartProvider>
              <FavoritesProvider>
                <CompareProvider>
                  <RouterProvider router={router} />
                </CompareProvider>
              </FavoritesProvider>
            </CartProvider>
          </PushProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
