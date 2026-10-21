import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Public Pages
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import NotFoundPage from '../pages/NotFoundPage';

// User & Safety Pages
import ProfilePage from '../pages/ProfilePage';
import RideHistoryPage from '../pages/RideHistoryPage';
import SupportPage from '../pages/SupportPage';
import ActiveRidePage from '../pages/ActiveRidePage';
import ReceiptPage from '../pages/ReceiptPage';

// Driver Console Pages
import DriverDashboardPage from '../pages/driver/DriverDashboardPage';
import DriverRegisterPage from '../pages/driver/DriverRegisterPage';
import DriverEarningsPage from '../pages/driver/DriverEarningsPage';
import DriverActiveTripPage from '../pages/driver/DriverActiveTripPage';

// Admin Operations
import AdminSOSPage from '../pages/admin/AdminSOSPage';
import AdminHealthPage from '../pages/admin/AdminHealthPage';
import AdminSupportPage from '../pages/admin/AdminSupportPage';
import AdminDriversPage from '../pages/admin/AdminDriversPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Authenticated User Routes */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <RideHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/support"
        element={
          <ProtectedRoute>
            <SupportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rides/:id"
        element={
          <ProtectedRoute>
            <ActiveRidePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/receipt/:id"
        element={
          <ProtectedRoute>
            <ReceiptPage />
          </ProtectedRoute>
        }
      />

      {/* Driver Partner Protected Routes (role === 'driver') */}
      <Route
        path="/driver/dashboard"
        element={
          <ProtectedRoute allowedRoles={['driver']}>
            <DriverDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/register-vehicle"
        element={
          <ProtectedRoute allowedRoles={['driver']}>
            <DriverRegisterPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/earnings"
        element={
          <ProtectedRoute allowedRoles={['driver']}>
            <DriverEarningsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver/trips/:id"
        element={
          <ProtectedRoute allowedRoles={['driver']}>
            <DriverActiveTripPage />
          </ProtectedRoute>
        }
      />

      {/* Admin / Dispatcher Protected Routes (role === 'admin') */}
      <Route
        path="/admin/drivers"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDriversPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/driver-verification"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDriversPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sos"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSOSPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/health"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminHealthPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/support"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSupportPage />
          </ProtectedRoute>
        }
      />

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
