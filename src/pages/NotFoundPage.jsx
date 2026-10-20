import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Car } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/common/Button';
import useAuth from '../hooks/useAuth';

export default function NotFoundPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col font-sans">
      <Navbar user={user} onLogout={logout} isConnected={true} />

      <main className="flex-1 flex items-center justify-center p-6">
        <PageContainer maxWidth="md" className="text-center flex flex-col items-center gap-4">
          <div className="size-16 rounded-[14px] bg-[#141418] border border-[#27272A] flex items-center justify-center text-[#FAFAFA] shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
            <Car className="size-8 text-[#A1A1AA]" />
          </div>

          <span className="text-4xl font-bold font-mono text-[#FAFAFA]">404</span>
          <h1 className="text-xl font-semibold text-[#FAFAFA]">
            Route Not Found
          </h1>
          <p className="text-xs text-[#71717A] max-w-sm">
            The page or route you are attempting to navigate to does not exist in the UrbanCab directory.
          </p>

          <Link to="/">
            <Button variant="primary" size="md" icon={ArrowLeft}>
              Return to Home
            </Button>
          </Link>
        </PageContainer>
      </main>

      <Footer />
    </div>
  );
}
