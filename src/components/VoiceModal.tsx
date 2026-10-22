import React, { useState, useEffect, useRef } from 'react';
import { useCookingSession } from '../context/CookingSessionContext';
import { Mic, X, Send, Volume2, Sparkles, MicOff, VolumeX } from 'lucide-react';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({ isOpen, onClose }) => {
  const { voiceTranscript, handleVoiceCommand } = useCookingSession();
  const [customInput, setCustomInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechMuted, setSpeechMuted] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API availability
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setCustomInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('[WebSpeech] Recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Speak assistant response aloud using Web Speech Synthesis TTS
  useEffect(() => {
    if (isOpen && voiceTranscript && !speechMuted && 'speechSynthesis' in window) {
      // Remove surrounding quotes for clean speech
      const cleanText = voiceTranscript.replace(/^["“]|["”]$/g, '');
      window.speechSynthesis.cancel(); // Stop prior speech
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, [voiceTranscript, isOpen, speechMuted]);

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

  const toggleMicListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (err: any) {
        console.warn('[WebSpeech] Start error:', err.message);
      }
    }
  };

  const handleCommandClick = (cmd: string) => {
    setIsListening(true);
    setTimeout(() => {
      handleVoiceCommand(cmd);
      setIsListening(false);
    }, 300);
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
            <button
              onClick={toggleMicListening}
              title={speechSupported ? (isListening ? 'Stop listening' : 'Start microphone') : 'Microphone unsupported'}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-[#EF4444] border-[#DC2626] text-white animate-pulse shadow-md ring-4 ring-[#EF4444]/20'
                  : 'bg-[#F0F9FF] border-[#BAE6FD] text-[#0284C7] hover:bg-[#E0F2FE]'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <div>
              <span className="text-[10px] font-bold tracking-widest text-[#0284C7] uppercase block flex items-center gap-1.5">
                HANDS-FREE KITCHEN
                {speechSupported && (
                  <span className="px-1.5 py-0.2 rounded bg-[#E0F2FE] text-[#0369A1] text-[9px] font-mono">
                    LIVE MIC READY
                  </span>
                )}
              </span>
              <h3 id="voice-modal-title" className="font-['Epilogue'] font-bold text-base text-[#202124]">
                {isListening ? 'Listening to your voice...' : 'Voice Assistant'}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSpeechMuted(!speechMuted)}
              aria-label={speechMuted ? 'Unmute voice' : 'Mute voice'}
              title={speechMuted ? 'Unmute voice' : 'Mute voice'}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                speechMuted
                  ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#EF4444]'
                  : 'bg-[#F8F8F5] border-[#E5E5DF] text-[#737780] hover:text-[#202124]'
              }`}
            >
              {speechMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              aria-label="Close voice dialog"
              className="w-8 h-8 rounded-full bg-[#F8F8F5] hover:bg-[#F1F0E9] text-[#737780] hover:text-[#202124] flex items-center justify-center transition-colors border border-[#E5E5DF]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Assistant Response Bubble */}
        <div className="p-4 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-white border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] shrink-0 mt-0.5 shadow-xs">
            <Volume2 className="w-4 h-4" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#0284C7] uppercase tracking-wider flex items-center gap-2">
              LANDING TIME ASSISTANT
              {!speechMuted && (
                <span className="text-[9px] text-[#0284C7]/70 font-mono">🔊 Spoken Aloud</span>
              )}
            </span>
            <p className="text-xs sm:text-sm text-[#202124] italic leading-relaxed">
              {voiceTranscript}
            </p>
          </div>
        </div>

        {/* Quick Voice Suggestions */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold text-[#737780] uppercase tracking-wider">
            Tap to test voice directive:
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

        {/* Real Mic & Custom Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t border-[#E5E5DF]/70">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder={
              speechSupported
                ? 'Speak into microphone or type query...'
                : 'Type a voice query (e.g. pause timers)...'
            }
            className="flex-1 h-11 px-3.5 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF] text-xs sm:text-sm text-[#202124] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D8065]/20 focus:bg-white"
          />
          {speechSupported && (
            <button
              type="button"
              onClick={toggleMicListening}
              className={`h-11 px-3.5 rounded-xl border flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-[#EF4444] text-white border-[#DC2626] animate-pulse'
                  : 'bg-[#F8F8F5] text-[#737780] hover:text-[#202124] border-[#E5E5DF]'
              }`}
              title="Toggle Live Microphone"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
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
          {speechSupported
            ? 'Real-time Web Speech recognition & speech synthesis enabled. Say or type commands.'
            : 'Calibrated for residential noise suppression. Tap any chip to command.'}
        </p>
      </div>
    </div>
  );
};
