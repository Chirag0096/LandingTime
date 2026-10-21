import React, { useState } from 'react';
import { useCookingSession } from '../context/CookingSessionContext';
import { Mic, X, Send, Volume2, Sparkles, CheckCircle2 } from 'lucide-react';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({ isOpen, onClose }) => {
  const { voiceTranscript, handleVoiceCommand } = useCookingSession();
  const [customInput, setCustomInput] = useState('');
  const [isListening, setIsListening] = useState(false);

  if (!isOpen) return null;

  const quickCommands = [
    { label: 'What now?', query: 'What now?' },
    { label: 'Report a delay (+12m)', query: 'Report a delay of 12 minutes' },
    { label: 'Missing ingredient', query: 'I am missing heavy cream' },
    { label: 'Pause timers', query: 'Pause timers' },
    { label: 'Accept new plan', query: 'Accept new plan' },
    { label: 'Mark all plated', query: 'Mark all plated' },
    { label: 'Start another meal', query: 'Start another meal' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    handleVoiceCommand(customInput);
    setCustomInput('');
  };

  const handleCommandClick = (cmd: string) => {
    setIsListening(true);
    setTimeout(() => {
      handleVoiceCommand(cmd);
      setIsListening(false);
    }, 400);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202124]/30 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white border border-[#E5E5DF] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#E5E5DF]/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7]">
              <Mic className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-widest text-[#0284C7] uppercase block">
                HANDS-FREE KITCHEN
              </span>
              <h3 id="voice-modal-title" className="font-['Epilogue'] font-bold text-base text-[#202124]">
                Voice Assistant Simulation
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close voice dialog"
            className="w-8 h-8 rounded-full bg-[#F8F8F5] hover:bg-[#F1F0E9] text-[#737780] hover:text-[#202124] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Assistant Response Bubble */}
        <div className="p-4 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-white border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] shrink-0 mt-0.5 shadow-xs">
            <Volume2 className="w-4 h-4" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#0284C7] uppercase tracking-wider">
              LANDING TIME ASSISTANT
            </span>
            <p className="text-xs sm:text-sm text-[#202124] italic leading-relaxed">
              {voiceTranscript}
            </p>
          </div>
        </div>

        {/* Quick Voice Suggestions */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold text-[#737780] uppercase tracking-wider">
            Tap a simulated voice command:
          </span>
          <div className="flex flex-wrap gap-2">
            {quickCommands.map((cmd) => (
              <button
                key={cmd.label}
                onClick={() => handleCommandClick(cmd.query)}
                disabled={isListening}
                className="px-3 py-1.5 rounded-full bg-[#F8F8F5] hover:bg-[#F1F0E9] text-[#202124] border border-[#E5E5DF] text-xs font-medium transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3 text-[#3D8065]" />
                <span>"{cmd.label}"</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input */}
        <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t border-[#E5E5DF]/70">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Type a voice query (e.g. pause timers)..."
            className="flex-1 h-11 px-3.5 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF] text-xs sm:text-sm text-[#202124] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8065]/20 focus:bg-white"
          />
          <button
            type="submit"
            disabled={!customInput.trim()}
            className="h-11 px-4 rounded-xl bg-[#3D8065] hover:bg-[#336C55] text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 shadow-sm"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        <p className="text-[11px] text-[#9CA3AF] text-center">
          Calibrated for residential noise suppression. Tap any chip to simulate hands-free cooking.
        </p>
      </div>
    </div>
  );
};
