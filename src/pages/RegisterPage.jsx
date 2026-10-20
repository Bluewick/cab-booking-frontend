import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Lock, Mail, User, Phone, ArrowRight } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';

export default function RegisterPage() {
  const [role, setRole] = useState('rider'); // 'rider' | 'driver'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !phoneNumber || !password) {
      setError('All fields are mandatory.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await register({
        full_name: fullName,
        email,
        phone_number: phoneNumber,
        password,
        role,
      });

      toast.success(`Account registered successfully as ${role}!`, 'Welcome to UrbanCab');
      navigate(role === 'driver' ? '/driver/register-vehicle' : '/', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your information.');
      toast.error(err.message || 'Registration Error', 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 pointer-events-none hero-radial-glow opacity-80" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 brand-radial-glow rounded-full blur-3xl pointer-events-none opacity-30" />

      <div className="w-full max-w-lg flex flex-col gap-6 relative z-10 py-8">
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
            Create an UrbanCab Account
          </h1>
          <p className="text-xs text-[#A1A1AA]">
            Join the real-time urban transit network
          </p>
        </div>

        {/* Register Form Card */}
        <Card level={1} className="shadow-[0_16px_40px_rgba(0,0,0,0.7)] p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 rounded-[8px] bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.3)] text-xs text-[#F87171] leading-relaxed animate-fadeIn">
                {error}
              </div>
            )}

            {/* Role Selection Segmented Control */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#A1A1AA]">I am joining as a</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#141418] border border-[#27272A] rounded-[10px]">
                <button
                  type="button"
                  onClick={() => setRole('rider')}
                  className={`py-2 px-3 rounded-[8px] text-xs font-medium transition-all duration-150 flex items-center justify-center gap-2 ${
                    role === 'rider'
                      ? 'bg-[#27272A] text-[#FAFAFA] shadow-[0_1px_2px_rgba(0,0,0,0.5)] border border-white/10'
                      : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
                  }`}
                >
                  <User className="size-3.5" />
                  <span>Rider / Passenger</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('driver')}
                  className={`py-2 px-3 rounded-[8px] text-xs font-medium transition-all duration-150 flex items-center justify-center gap-2 ${
                    role === 'driver'
                      ? 'bg-[#27272A] text-[#FAFAFA] shadow-[0_1px_2px_rgba(0,0,0,0.5)] border border-white/10'
                      : 'text-[#A1A1AA] hover:text-[#FAFAFA]'
                  }`}
                >
                  <Car className="size-3.5 text-[#34D399]" />
                  <span>Driver Partner</span>
                </button>
              </div>
            </div>

            <Input
              label="Full Name"
              type="text"
              icon={User}
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Jane Doe"
              autoComplete="name"
            />

            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@email.com"
              autoComplete="email"
            />

            <Input
              label="Phone Number (E.164 with Country Code)"
              type="tel"
              icon={Phone}
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+919876543210"
              autoComplete="tel"
            />

            <Input
              label="Password (Minimum 6 characters)"
              type="password"
              icon={Lock}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              loadingText="Creating Account..."
              className="mt-2"
            >
              Register as {role === 'driver' ? 'Driver Partner' : 'Rider'}
            </Button>
          </form>
        </Card>

        {/* Footer Link */}
        <p className="text-center text-xs text-[#A1A1AA]">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-[#FAFAFA] font-medium hover:underline inline-flex items-center gap-1"
          >
            Sign in <ArrowRight className="size-3" />
          </Link>
        </p>
      </div>
    </div>
  );
}
