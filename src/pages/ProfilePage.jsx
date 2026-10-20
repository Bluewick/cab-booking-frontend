import React, { useState, useEffect } from 'react';
import { User, Phone, ShieldAlert, Plus, Trash2, Heart, Check, Edit2, Palette } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/common/Button';
import ThemeToggle from '../components/common/ThemeToggle';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Card from '../components/common/Card';
import Badge, { StatusPill } from '../components/common/Badge';
import Modal from '../components/common/Modal';
import Skeleton from '../components/feedback/Skeleton';
import useAuth from '../hooks/useAuth';
import useToast from '../hooks/useToast';
import userService from '../services/user.service';

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const toast = useToast();

  // Profile Edit State
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Emergency Contacts State
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [relationship, setRelationship] = useState('Family');
  const [addingContact, setAddingContact] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadEmergencyContacts() {
      try {
        const data = await userService.getEmergencyContacts();
        if (isMounted) setContacts(data || []);
      } catch (err) {
        toast.error(err.message || 'Could not load emergency contacts.');
      } finally {
        if (isMounted) setLoadingContacts(false);
      }
    }

    loadEmergencyContacts();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const handleStartEditing = () => {
    setFullName(user?.full_name || '');
    setPhoneNumber(user?.phone_number || '');
    setAvatarUrl(user?.avatar_url || '');
    setEditing(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      await updateProfile({
        full_name: fullName,
        phone_number: phoneNumber,
        avatar_url: avatarUrl || null,
      });
      toast.success('Your profile details have been updated.', 'Profile Saved');
      setEditing(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.', 'Error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!contactName || !contactPhone) {
      toast.warning('Please enter both contact name and phone number.');
      return;
    }

    try {
      setAddingContact(true);
      const newContact = await userService.addEmergencyContact({
        contact_name: contactName,
        phone_number: contactPhone,
        relationship,
      });
      setContacts((prev) => [...prev, newContact]);
      toast.success(`${contactName} added to emergency SOS contacts.`, 'Contact Saved');
      setContactName('');
      setContactPhone('');
      setRelationship('Family');
      setContactModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to add emergency contact.', 'Error');
    } finally {
      setAddingContact(false);
    }
  };

  const handleDeleteContact = async (id) => {
    try {
      setDeletingId(id);
      await userService.deleteEmergencyContact(id);
      setContacts((prev) => prev.filter((c) => c.id !== id));
      toast.info('Emergency contact removed.');
    } catch (err) {
      toast.error(err.message || 'Failed to remove contact.', 'Error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col font-sans">
      <Navbar user={user} onLogout={logout} isConnected={true} />

      <main className="flex-1 py-10">
        <PageContainer maxWidth="5xl">
          <div className="flex flex-col gap-8">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#27272A]">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA]">
                  Account & Safety Settings
                </h1>
                <p className="text-xs text-[#A1A1AA] mt-1">
                  Manage your passenger profile, verification credentials, and trusted SOS contacts
                </p>
              </div>

              <div className="flex items-center gap-2">
                <StatusPill status={user?.is_active ? 'online' : 'offline'} />
                <Badge variant="neutral">Role: {user?.role?.toUpperCase()}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Profile Card */}
              <Card level={1} className="md:col-span-1 flex flex-col items-center text-center p-6 gap-4">
                <div className="relative">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || 'Avatar'}
                      className="size-24 rounded-full object-cover border-2 border-[#27272A] shadow-lg"
                    />
                  ) : (
                    <div className="size-24 rounded-full bg-[#18181B] border-2 border-[#27272A] flex items-center justify-center text-2xl font-bold text-[#FAFAFA]">
                      {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="absolute bottom-1 right-1 size-4 rounded-full bg-[#10B981] border-2 border-[#0F0F12]" />
                </div>

                <div className="flex flex-col">
                  <h2 className="text-base font-semibold text-[#FAFAFA]">
                    {user?.full_name || 'UrbanCab User'}
                  </h2>
                  <span className="text-xs text-[#71717A] font-mono mt-0.5">
                    {user?.email}
                  </span>
                </div>

                <div className="w-full pt-4 border-t border-[#27272A] flex flex-col gap-2 text-left text-xs">
                  <div className="flex justify-between py-1 text-[#A1A1AA]">
                    <span>Account ID:</span>
                    <span className="font-mono text-[#FAFAFA] truncate max-w-[140px]">
                      {user?.id?.slice(0, 12)}...
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-[#A1A1AA]">
                    <span>Primary Phone:</span>
                    <span className="font-mono text-[#FAFAFA]">
                      {user?.phone_number || 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-[#A1A1AA]">
                    <span>Account Status:</span>
                    <span className="text-[#34D399]">Verified Active</span>
                  </div>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  fullWidth
                  onClick={logout}
                  className="mt-4"
                >
                  Sign Out
                </Button>
              </Card>

              {/* Right Column: Appearance & Theme, Edit Profile & Emergency Contacts */}
              <div className="md:col-span-2 flex flex-col gap-6">
                {/* Appearance & Interface Theme Settings */}
                <Card level={1} className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-[8px] bg-[rgba(59,130,246,0.14)] border border-[rgba(59,130,246,0.3)] flex items-center justify-center text-[#60A5FA]">
                        <Palette className="size-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[#FAFAFA]">
                          Appearance & Theme
                        </h3>
                        <p className="text-xs text-[#71717A]">
                          Switch between light, dark, or automatically sync with your device
                        </p>
                      </div>
                    </div>

                    <ThemeToggle variant="segmented" size="sm" showLabels={true} />
                  </div>

                  <div className="pt-1">
                    <ThemeToggle variant="cards" />
                  </div>
                </Card>

                {/* Profile Details Form */}
                <Card level={1} className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-[#FAFAFA]">
                        Personal Profile Details
                      </h3>
                      <p className="text-xs text-[#71717A]">
                        Your name and phone number shared with drivers during assigned rides
                      </p>
                    </div>

                    {!editing ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleStartEditing}
                        icon={Edit2}
                      >
                        Edit
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(false)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>

                  {editing ? (
                    <form onSubmit={handleSaveProfile} className="flex flex-col gap-3 pt-2">
                      <Input
                        label="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        icon={User}
                      />
                      <Input
                        label="Phone Number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                        icon={Phone}
                        placeholder="+919876543210"
                      />
                      <Input
                        label="Avatar Image URL (Optional)"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="https://..."
                      />

                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="md"
                          onClick={() => setEditing(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
                          size="md"
                          loading={savingProfile}
                          loadingText="Saving..."
                          icon={Check}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="p-3 bg-[#141418] rounded-[8px] border border-[#27272A]">
                        <span className="text-[11px] text-[#71717A] uppercase font-mono">Full Name</span>
                        <p className="text-sm font-medium text-[#FAFAFA] mt-0.5">{user?.full_name}</p>
                      </div>
                      <div className="p-3 bg-[#141418] rounded-[8px] border border-[#27272A]">
                        <span className="text-[11px] text-[#71717A] uppercase font-mono">Phone Number</span>
                        <p className="text-sm font-medium text-[#FAFAFA] font-mono mt-0.5">{user?.phone_number}</p>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Emergency Contacts Section (SOS Pre-requisite) */}
                <Card level={1} className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-[8px] bg-[rgba(239,68,68,0.14)] border border-[rgba(239,68,68,0.3)] flex items-center justify-center text-[#F87171]">
                        <ShieldAlert className="size-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[#FAFAFA]">
                          Trusted Emergency Contacts
                        </h3>
                        <p className="text-xs text-[#71717A]">
                          Instant SMS & live GPS dispatch alerts sent to these contacts if SOS is triggered
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setContactModalOpen(true)}
                      icon={Plus}
                    >
                      Add Contact
                    </Button>
                  </div>

                  {/* Contacts List */}
                  {loadingContacts ? (
                    <div className="flex flex-col gap-2 pt-2">
                      <Skeleton variant="rect" width="100%" height="48px" />
                      <Skeleton variant="rect" width="100%" height="48px" />
                    </div>
                  ) : contacts.length === 0 ? (
                    <div className="p-6 text-center rounded-[10px] bg-[#141418] border border-[#27272A]/70 flex flex-col items-center gap-2">
                      <Heart className="size-8 text-[#71717A]" />
                      <p className="text-xs text-[#A1A1AA]">
                        No emergency contacts registered yet.
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setContactModalOpen(true)}
                        className="mt-1"
                      >
                        Register Primary SOS Contact
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5 pt-2">
                      {contacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="flex items-center justify-between p-3.5 rounded-[10px] bg-[#141418] border border-[#27272A] hover:border-[#3F3F46] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-[#1C1C21] border border-[#27272A] flex items-center justify-center text-xs font-semibold text-[#FAFAFA]">
                              {contact.contact_name[0].toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-[#FAFAFA]">
                                  {contact.contact_name}
                                </span>
                                <Badge variant="warning" size="sm">
                                  {contact.relationship}
                                </Badge>
                              </div>
                              <span className="text-[11px] text-[#A1A1AA] font-mono mt-0.5">
                                {contact.phone_number}
                              </span>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={deletingId === contact.id}
                            loading={deletingId === contact.id}
                            onClick={() => handleDeleteContact(contact.id)}
                            title="Remove emergency contact"
                          >
                            <Trash2 className="size-4 text-[#71717A] hover:text-[#F87171]" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </PageContainer>
      </main>

      {/* Add Emergency Contact Modal */}
      <Modal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        title="Add Emergency SOS Contact"
        description="Register a trusted individual who will receive immediate distress notifications during emergencies."
        size="sm"
      >
        <form onSubmit={handleAddContact} className="flex flex-col gap-4">
          <Input
            label="Contact Full Name"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            required
            placeholder="e.g. Sarah Connor"
          />

          <Input
            label="Phone Number (with Country Code)"
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            required
            placeholder="+919876543299"
          />

          <Select
            label="Relationship"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            options={[
              { value: 'Parent', label: 'Parent' },
              { value: 'Spouse', label: 'Spouse / Partner' },
              { value: 'Sibling', label: 'Sister / Brother' },
              { value: 'Friend', label: 'Friend' },
              { value: 'Colleague', label: 'Colleague' },
              { value: 'Family', label: 'Other Family' },
            ]}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#27272A]/70">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setContactModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={addingContact}
              loadingText="Saving..."
              icon={Plus}
            >
              Add Contact
            </Button>
          </div>
        </form>
      </Modal>

      <Footer />
    </div>
  );
}
