import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Spinner from '../components/feedback/Spinner';

/**
 * Obsidian Geist Protected Route & Role-Based Access Guard
 * Verifies authentication and ensures authorized roles before rendering child views
 */
export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" color="white" />
        <span className="text-xs font-mono text-[#71717A] tracking-wider uppercase">
          Verifying Security Session...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#09090B] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#141418] border border-[rgba(239,68,68,0.3)] rounded-[14px] p-6 text-center shadow-[0_12px_36px_rgba(0,0,0,0.8)]">
          <div className="size-12 rounded-full bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.25)] flex items-center justify-center mx-auto text-[#F87171] mb-3">
            !
          </div>
          <h2 className="text-lg font-semibold text-[#FAFAFA] mb-1">
            Access Restricted
          </h2>
          <p className="text-xs text-[#A1A1AA] leading-relaxed mb-4">
            This module requires <span className="font-mono text-[#FAFAFA]">{allowedRoles.join(' or ')}</span> permissions. Your current role is <span className="font-mono text-[#F87171]">{role}</span>.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center h-10 px-4 rounded-[8px] bg-[#FAFAFA] text-[#09090B] text-xs font-medium hover:bg-[#E4E4E7]"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return children ? children : <Outlet />;
}
