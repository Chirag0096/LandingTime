import React, { useEffect, useState } from 'react';
import { useCookingSession } from '../context/CookingSessionContext';
import { CheckCircle2, X, FastForward, Loader2 } from 'lucide-react';

export const VerificationOverlay: React.FC = () => {
  const { isVerificationModalOpen, closeVerificationModal, startLiveCooking, formattedTargetTime } =
    useCookingSession();
  const [step3Done, setStep3Done] = useState(false);

  useEffect(() => {
    if (isVerificationModalOpen) {
      setStep3Done(false);
      const timer = setTimeout(() => {
        setStep3Done(true);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [isVerificationModalOpen]);

  if (!isVerificationModalOpen) return null;

  const handleProceed = () => {
    closeVerificationModal();
    startLiveCooking();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="verification-dialog-title"
      className="fixed inset-0 z-50 bg-[#202124]/30 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white border border-[#E5E5DF] rounded-3xl p-6 sm:p-8 max-w-lg w-full flex flex-col gap-6 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3D8065] animate-ping"></span>
            <span className="text-xs font-bold tracking-widest text-[#3D8065] uppercase">
              SEQUENCE VERIFICATION
            </span>
          </div>
          <button
            onClick={closeVerificationModal}
            aria-label="Close verification dialog"
            className="text-[#737780] hover:text-[#202124] p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4">
          <div>
            <h3 id="verification-dialog-title" className="font-['Epilogue'] text-xl sm:text-2xl font-bold text-[#202124]">
              Aligning Cooking Trajectories
            </h3>
            <p className="text-xs sm:text-sm text-[#737780] mt-1">
              Checking burner allocations, thermal overlap, and landing timeline at{' '}
              <span className="font-semibold text-[#202124]">{formattedTargetTime}</span>...
            </p>
          </div>

          {/* Progress Verification Items */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF]">
              <span className="text-xs sm:text-sm text-[#202124] font-medium">
                1. Oven rack spacing & 425°F overlap
              </span>
              <CheckCircle2 className="w-5 h-5 text-[#3D8065] shrink-0" />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF]">
              <span className="text-xs sm:text-sm text-[#202124] font-medium">
                2. Stovetop burner conflict check
              </span>
              <CheckCircle2 className="w-5 h-5 text-[#3D8065] shrink-0" />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF]">
              <span className="text-xs sm:text-sm text-[#202124] font-medium">
                3. Voice prompt calibration
              </span>
              {step3Done ? (
                <CheckCircle2 className="w-5 h-5 text-[#3D8065] shrink-0 animate-in zoom-in-75 duration-200" />
              ) : (
                <Loader2 className="w-4 h-4 text-[#3D8065] animate-spin shrink-0" />
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={closeVerificationModal}
            className="px-5 py-2.5 rounded-xl bg-[#F8F8F5] hover:bg-[#F1F0E9] text-[#202124] text-xs font-semibold border border-[#E5E5DF] transition-colors"
          >
            Adjust Plan
          </button>
          <button
            onClick={handleProceed}
            className="px-6 py-2.5 rounded-xl bg-[#3D8065] hover:bg-[#336C55] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <span>Proceed to Active Kitchen Display</span>
            <FastForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
