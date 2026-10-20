import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Car, Lock, Mail, Sparkles, ArrowRight } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [clerkLoading, setClerkLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, syncClerkUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await login({ email, password });
      toast.success(`Welcome back, ${data.user.full_name || data.user.email}!`, 'Signed In');
      navigate(data.user.role === 'driver' ? '/driver/dashboard' : redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
      toast.error(err.message || 'Authentication failed', 'Login Error');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickCredentials = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  const handleClerkSSOSimulation = async () => {
    try {
      setClerkLoading(true);
      setError('');
      // Simulate Clerk SSO token and user sync with backend POST /api/v1/auth/sync-clerk
      await syncClerkUser({
        clerk_id: `user_clerk_${Date.now()}`,
        email: 'clerkuser@example.com',
        full_name: 'Clerk Synced Passenger',
        phone_number: '+919876543212',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        role: 'rider',
      });
      toast.success('Clerk account synchronized successfully!', 'Clerk SSO Connected');
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message || 'Clerk synchronization failed.');
      toast.error(err.message || 'Clerk Sync Failed', 'Error');
    } finally {
      setClerkLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 pointer-events-none hero-radial-glow opacity-80" />
      <div className="absolute top-1/4 -right-20 w-96 h-96 brand-radial-glow rounded-full blur-3xl pointer-events-none opacity-30" />

      <div className="w-full max-w-md flex flex-col gap-6 relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <Link to="/" className="flex items-center gap-2.5 mb-2 group">
            <div className="size-10 rounded-[10px] bg-[#141418] border border-[#27272A] flex items-center justify-center text-[#FAFAFA] group-hover:border-[#3F3F46] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] transition-colors">
              <Car className="size-5 text-[#FAFAFA]" />
            </div>
            <span className="font-bold text-xl tracking-tight text-[#FAFAFA]">
              Urban<span className="text-[#3B82F6]">Cab</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[#FAFAFA]">
            Sign in to your account
          </h1>
          <p className="text-xs text-[#A1A1AA]">
            Access live ride tracking, fleet dispatching, and secure settlements
          </p>
        </div>

        {/* Login Form Card */}
        <Card level={1} className="shadow-[0_16px_40px_rgba(0,0,0,0.7)] p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 rounded-[8px] bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.3)] text-xs text-[#F87171] leading-relaxed animate-fadeIn">
                {error}
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rider@email.com"
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              icon={Lock}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              loadingText="Verifying Credentials..."
              className="mt-2"
            >
              Sign In to UrbanCab
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#27272A]" />
            </div>
            <span className="relative bg-[#0F0F12] px-3 text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
              Or continue with SSO
            </span>
          </div>

          {/* Clerk Single Sign-On Button */}
          <Button
            type="button"
            variant="secondary"
            size="md"
            fullWidth
            loading={clerkLoading}
            loadingText="Connecting Clerk..."
            onClick={handleClerkSSOSimulation}
            icon={Sparkles}
            className="border-[#27272A] hover:border-[#3B82F6]/50"
          >
            Sign in with Clerk SSO
          </Button>

          {/* Quick Demo Credentials Preset Bar */}
          <div className="mt-6 pt-5 border-t border-[#27272A]/70 flex flex-col gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#71717A]">
              Quick Demo Fill (Backend Seeded)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillQuickCredentials('rider@email.com', 'Pass@123')}
                className="py-1.5 px-2 rounded-[6px] bg-[#141418] border border-[#27272A] text-[11px] text-[#A1A1AA] hover:text-[#FAFAFA] hover:border-[#3F3F46] transition-colors"
              >
                Rider
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredentials('driver@email.com', 'Pass@123')}
                className="py-1.5 px-2 rounded-[6px] bg-[#141418] border border-[#27272A] text-[11px] text-[#A1A1AA] hover:text-[#FAFAFA] hover:border-[#3F3F46] transition-colors"
              >
                Driver
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredentials('admin@email.com', 'Pass@123')}
                className="py-1.5 px-2 rounded-[6px] bg-[#141418] border border-[#27272A] text-[11px] text-[#A1A1AA] hover:text-[#FAFAFA] hover:border-[#3F3F46] transition-colors"
              >
                Admin
              </button>
            </div>
          </div>
        </Card>

        {/* Footer Link */}
        <p className="text-center text-xs text-[#A1A1AA]">
          Don't have an account yet?{' '}
          <Link
            to="/register"
            className="text-[#FAFAFA] font-medium hover:underline inline-flex items-center gap-1"
          >
            Create account <ArrowRight className="size-3" />
          </Link>
        </p>
      </div>
    </div>
  );
}
