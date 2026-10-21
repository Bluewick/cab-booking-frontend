import React from 'react';
import { AlertTriangle, UserX, ShieldAlert } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';

/**
 * Obsidian Geist Driver Verification Revoke Modal
 * Warns administrator before stripping driver authorization and forcing them offline
 */
export default function DriverRevokeModal({
  isOpen,
  onClose,
  driver,
  onConfirm,
  loading = false,
}) {
  if (!driver) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Revoke Driver Verification"
      description="Immediately suspend operational permissions for this driver."
      size="md"
    >
      <div className="flex flex-col gap-5 pt-1">
        {/* Warning Callout */}
        <div className="flex items-start gap-3 p-3.5 rounded-[10px] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] text-xs text-[#F87171]">
          <ShieldAlert className="size-5 shrink-0 text-[#EF4444] mt-0.5" />
          <div className="flex flex-col gap-1 leading-relaxed">
            <span className="font-semibold text-[#FAFAFA]">Critical Compliance Action</span>
            <span>
              Revoking authorization will automatically set this driver to <strong>Offline</strong>, disconnect any active ride dispatch sessions, and emit a real-time suspension notification.
            </span>
          </div>
        </div>

        {/* Driver Summary Card */}
        <div className="p-4 rounded-[10px] bg-[#0F0F12] border border-[#27272A] flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#A1A1AA]">Driver Name:</span>
            <span className="font-medium text-[#FAFAFA]">{driver.full_name || 'Unknown Driver'}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#A1A1AA]">License Plate:</span>
            <span className="font-mono font-medium text-[#FAFAFA] bg-[#141418] px-2 py-0.5 rounded border border-[#27272A]">
              {driver.plate_number || 'No plate'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#A1A1AA]">License Number:</span>
            <span className="font-mono text-[#FAFAFA]">{driver.license_number || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#A1A1AA]">Vehicle:</span>
            <span className="text-[#FAFAFA]">
              {driver.make} {driver.model} ({driver.color || 'Standard'})
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#27272A]/70">
          <Button
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="md"
            loading={loading}
            loadingText="Revoking..."
            icon={UserX}
            onClick={() => onConfirm(driver)}
          >
            Revoke Authorization
          </Button>
        </div>
      </div>
    </Modal>
  );
}
