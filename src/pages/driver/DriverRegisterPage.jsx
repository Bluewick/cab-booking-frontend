import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, Clock } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import driverService from '../../services/driver.service';

export default function DriverRegisterPage() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [licenseNumber, setLicenseNumber] = useState('');
  const [make, setMake] = useState('Toyota');
  const [model, setModel] = useState('Camry Hybrid');
  const [plateNumber, setPlateNumber] = useState('KA-01-EQ-5544');
  const [color, setColor] = useState('Silver');
  const [vehicleCategory, setVehicleCategory] = useState('comfort');
  const [isVerified, setIsVerified] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Prefill existing profile if driver is updating fleet specs
  useEffect(() => {
    let isMounted = true;

    async function loadExisting() {
      try {
        const data = await driverService.getDriverProfile();
        if (isMounted && data) {
          setHasProfile(true);
          if (data.license_number) setLicenseNumber(data.license_number);
          if (data.is_verified) setIsVerified(Boolean(data.is_verified));

          const vehicle = data.vehicle || data;
          if (vehicle.make) setMake(vehicle.make);
          if (vehicle.model) setModel(vehicle.model);
          if (vehicle.plate_number) setPlateNumber(vehicle.plate_number);
          if (vehicle.color) setColor(vehicle.color);
          if (vehicle.vehicle_category) setVehicleCategory(vehicle.vehicle_category);
        }
      } catch {
        // No existing profile yet
      }
    }

    loadExisting();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!licenseNumber || !make || !model || !plateNumber || !color) {
      setError('All vehicle and license fields are required.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await driverService.registerDriver({
        license_number: licenseNumber.trim(),
        make: make.trim(),
        model: model.trim(),
        plate_number: plateNumber.trim().toUpperCase(),
        color: color.trim(),
        vehicle_category: vehicleCategory,
      });

      toast.success('Driver profile & vehicle registered successfully!', 'Registration Complete');
      navigate('/driver/dashboard');
    } catch (err) {
      setError(err.message || 'Driver registration failed.');
      toast.error(err.message || 'Registration Error', 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col font-sans">
      <Navbar user={user} onLogout={logout} isConnected={true} />

      <main className="flex-1 py-10">
        <PageContainer maxWidth="3xl">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#27272A]">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA]">
                  Driver & Vehicle Registration
                </h1>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  Register your commercial driving credentials and vehicle specifications for dispatch qualification
                </p>
              </div>

              {hasProfile && (
                <div>
                  {isVerified ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[rgba(16,185,129,0.15)] text-[#34D399] border border-[rgba(16,185,129,0.3)]">
                      <ShieldCheck className="size-3.5" /> Verified Commercial Driver
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[rgba(245,158,11,0.15)] text-[#FBBF24] border border-[rgba(245,158,11,0.3)]">
                      <Clock className="size-3.5" /> Verification Pending
                    </span>
                  )}
                </div>
              )}
            </div>

            <Card level={1} className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                  <div className="p-3 rounded-[8px] bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.3)] text-xs text-[#F87171]">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Driver's License Number"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="KA01-2024-009876"
                  />

                  <Select
                    label="Vehicle Service Category"
                    value={vehicleCategory}
                    onChange={(e) => setVehicleCategory(e.target.value)}
                    options={[
                      { value: 'standard', label: 'Standard (Compact / Hatchback)' },
                      { value: 'comfort', label: 'Comfort (Sedan / EV)' },
                      { value: 'premium', label: 'Premium XL (Luxury SUV / 6 Seater)' },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Vehicle Make"
                    required
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="Toyota / Hyundai / Tata"
                  />

                  <Input
                    label="Vehicle Model"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Camry / Etios / Nexon EV"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Registration Plate Number"
                    required
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    placeholder="KA-01-EQ-5544"
                  />

                  <Input
                    label="Vehicle Color"
                    required
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Silver / White / Black"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-[#27272A]/70">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={loading}
                    loadingText="Submitting Vehicle..."
                    icon={CheckCircle2}
                  >
                    Submit Vehicle for Verification
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </PageContainer>
      </main>

      <Footer />
    </div>
  );
}
