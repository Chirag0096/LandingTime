import React, { useState } from 'react';
import { useCookingSession } from '../../context/CookingSessionContext';
import { SUBSTITUTION_OPTIONS } from '../../data/mockKitchenData';
import { apiClient } from '../../api/client';
import {
  X,
  Volume2,
  CheckCircle2,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Layers,
  ChefHat,
  Droplets,
  Milk,
  RotateCcw,
  SlidersHorizontal,
  Loader2,
  Search,
} from 'lucide-react';

export const PantrySubstitutionModal: React.FC = () => {
  const {
    isSubstitutionModalOpen,
    closeSubstitutionModal,
    appliedSubstitutionId,
    applySubstitution,
    restoreOriginalIngredient,
    formattedTargetTime,
  } = useCookingSession();

  const [activeSubId, setActiveSubId] = useState<string>('sub-milk-butter');
  const [showAlternativeSelector, setShowAlternativeSelector] = useState<boolean>(false);

  // Gemini AI Dynamic Substitution State
  const [customQuery, setCustomQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiCustomSub, setAiCustomSub] = useState<any | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  if (!isSubstitutionModalOpen) return null;

  const currentOption =
    SUBSTITUTION_OPTIONS.find((opt) => opt.id === activeSubId) || SUBSTITUTION_OPTIONS[0];

  const handleApply = () => {
    if (aiCustomSub) {
      applySubstitution(aiCustomSub.id, aiCustomSub.missingIngredient + ' Swap (' + (aiCustomSub.replacementIngredients[0]?.name || 'Substitute') + ')');
    } else {
      applySubstitution(currentOption.id, currentOption.name);
    }
  };

  const handleQueryGemini = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;
    setIsAiLoading(true);
    setAiError(null);
    try {
      const res = await apiClient.generateAiSubstitution(customQuery, 'Pan Gravy & Asparagus', 'Deglaze & Simmer');
      setAiCustomSub(res);
    } catch (err: any) {
      setAiError(err.message || 'Failed to generate AI substitute');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="substitution-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#202124]/30 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="w-full max-w-[1280px] max-h-[90vh] bg-white border border-[#E5E5DF] rounded-3xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] flex flex-col relative my-auto overflow-hidden">
        {/* ================= MODAL HEADER (PINNED) ================= */}
        <div className="relative z-10 flex items-start justify-between p-4 sm:px-6 sm:py-3.5 border-b border-[#E5E5DF] shrink-0 bg-white">
          <div className="flex flex-col space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#3D8065]">
                <span className="w-2 h-2 rounded-full bg-[#3D8065] inline-block"></span>
                LIVE COOK SESSION · RECIPE RECOVERY
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] text-[11px] font-bold tracking-wider uppercase inline-flex items-center gap-1 shadow-xs">
                <AlertCircle className="w-3 h-3 text-[#D97706]" />
                HEAVY CREAM MISSING
              </span>
            </div>
            <h1 id="substitution-dialog-title" className="font-['Epilogue'] text-xl sm:text-2xl font-extrabold tracking-tight text-[#202124]">
              Missing an ingredient?
            </h1>
            <p className="text-[#737780] text-xs max-w-2xl leading-relaxed">
              Let's find a practical kitchen pantry substitute and keep dinner synchronization completely frictionless.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 ml-3">
            <div className="hidden sm:flex items-center gap-1.5 bg-[#F8F8F5] border border-[#E5E5DF] px-3 py-1 rounded-full shadow-xs">
              <Volume2 className="w-3.5 h-3.5 text-[#3D8065]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#737780]">
                VOICE ASSISTANT READY
              </span>
            </div>
            <button
              onClick={closeSubstitutionModal}
              aria-label="Close substitution modal"
              className="w-8 h-8 rounded-full bg-[#F8F8F5] hover:bg-[#F1F0E9] text-[#737780] hover:text-[#202124] border border-[#E5E5DF] flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================= MODAL MAIN CONTENT (SCROLLABLE) ================= */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 p-4 sm:p-5 overflow-y-auto">
          {/* LEFT COLUMN: Problem Context & Recommended Swap */}
          <div className="lg:col-span-6 flex flex-col space-y-3.5">
            {/* Card 1: Missing Ingredient Context Bar */}
            <div className="bg-[#F8F8F5] border border-[#E5E5DF] rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#D97706] shrink-0">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] block">
                      AFFECTED RECIPE
                    </span>
                    <span className="font-['Epilogue'] text-sm sm:text-base font-bold text-[#202124]">
                      Creamy Pan Gravy <span className="text-xs font-normal text-[#737780]">(Side & Finishing Sauce)</span>
                    </span>
                  </div>
                </div>

                <button
                  onClick={restoreOriginalIngredient}
                  className="text-[#3D8065] hover:text-[#336C55] text-[11px] font-bold tracking-wider uppercase transition-colors flex items-center gap-1 cursor-pointer hover:underline shrink-0"
                >
                  <span>FOUND IT</span>
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#E5E5DF]/70 text-xs">
                <span className="text-[#737780]">Missing item:</span>
                <span className="font-semibold text-[#202124]">Heavy Whipping Cream</span>
                <span className="font-mono font-bold text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded border border-[#FDE68A] text-[11px]">
                  1/3 cup (80ml)
                </span>
              </div>
            </div>

            {/* Card 2: Recommended Substitute Hero Card */}
            <div className="bg-white border-2 border-[#3D8065]/40 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between flex-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#3D8065]"></div>

              <div className="flex flex-col space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#3D8065]" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#265442]">
                      BEST MATCH · PANTRY COMPATIBLE
                    </span>
                  </div>
                  <span className="px-3 py-0.5 rounded-full bg-[#EBF4F0] border border-[#C4DDD3] text-[#3D8065] text-xs font-bold">
                    {currentOption.flavorMatch}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <h2 className="font-['Epilogue'] text-xl sm:text-2xl font-extrabold text-[#202124] tracking-tight">
                    {currentOption.name}
                  </h2>
                  <span className="text-[11px] font-semibold text-[#737780] uppercase tracking-wider">
                    {currentOption.subtitle}
                  </span>
                </div>

                {/* Measurement Breakdown Pills */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {currentOption.ingredients.map((ing, idx) => (
                    <div
                      key={idx}
                      className="bg-[#F8F8F5] border border-[#E5E5DF] p-3 rounded-xl flex items-center gap-3"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[#EBF4F0] border border-[#C4DDD3] flex items-center justify-center text-[#3D8065] shrink-0">
                        {idx === 0 ? <Droplets className="w-4 h-4" /> : <Milk className="w-4 h-4" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-['Epilogue'] text-base font-bold text-[#202124]">
                          {ing.amount}
                        </span>
                        <span className="text-xs text-[#737780] font-medium leading-tight">
                          {ing.item} <span className="text-[10px] text-[#9CA3AF]">({ing.role})</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-[#737780] leading-relaxed pt-1">
                  {currentOption.culinaryExplanation}
                </p>
              </div>

              {/* Alternative Options Selector Accordion */}
              <div className="pt-4 mt-2 border-t border-[#E5E5DF]">
                <button
                  onClick={() => setShowAlternativeSelector((prev) => !prev)}
                  className="w-full flex items-center justify-between text-[#202124] hover:text-[#3D8065] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-[#3D8065]" />
                    <span>View other options (Evaporated Milk, Greek Yogurt)</span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#737780] uppercase">
                    Zero allergen change
                  </span>
                </button>

                {showAlternativeSelector && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-2 border-t border-[#E5E5DF]/60 animate-in fade-in duration-150">
                    {SUBSTITUTION_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setActiveSubId(opt.id);
                          setAiCustomSub(null);
                        }}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                          activeSubId === opt.id && !aiCustomSub
                            ? 'bg-[#EBF4F0] border-[#3D8065] font-bold text-[#202124]'
                            : 'bg-[#F8F8F5] border-[#E5E5DF] text-[#737780] hover:bg-white'
                        }`}
                      >
                        <span className="block font-semibold text-[#202124] truncate">{opt.name}</span>
                        <span className="text-[10px] text-[#3D8065]">{opt.flavorMatch}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Dynamic Gemini AI Custom Ingredient Box */}
                <form onSubmit={handleQueryGemini} className="mt-3 pt-3 border-t border-[#E5E5DF] flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-[#737780] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#3D8065]" />
                    <span>Ask Gemini 2.5 Flash for Any Other Ingredient:</span>
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customQuery}
                      onChange={(e) => setCustomQuery(e.target.value)}
                      placeholder="e.g. Buttermilk, White Wine, Mirin, Shallots..."
                      className="flex-1 h-9 px-3 rounded-xl bg-[#F8F8F5] border border-[#E5E5DF] text-xs text-[#202124] focus:outline-none focus:bg-white focus:border-[#3D8065]"
                    />
                    <button
                      type="submit"
                      disabled={isAiLoading || !customQuery.trim()}
                      className="px-3 py-1.5 rounded-xl bg-[#3D8065] text-white text-xs font-bold hover:bg-[#336C55] disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                    >
                      {isAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>Ask AI</span>
                    </button>
                  </div>
                  {aiError && <p className="text-[11px] text-[#EF4444]">{aiError}</p>}
                  {aiCustomSub && (
                    <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-xs flex flex-col gap-1 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#166534]">
                          {aiCustomSub.substituteName || aiCustomSub.replacementIngredients[0]?.name || 'AI Alternative'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#DCFCE7] text-[#166534]">
                          {aiCustomSub.flavorMatchPercentage || 95}% Match · Gemini AI
                        </span>
                      </div>
                      <p className="text-[11px] text-[#374151] leading-relaxed">{aiCustomSub.preparationChanges}</p>
                      <div className="flex items-center justify-between pt-1 border-t border-[#BBF7D0]/60 text-[10px] text-[#15803D] font-mono">
                        <span>Simmer Adjustment: {aiCustomSub.durationAdjustmentSeconds > 0 ? `+${aiCustomSub.durationAdjustmentSeconds}s` : `${aiCustomSub.durationAdjustmentSeconds}s`}</span>
                        <span className="font-semibold uppercase text-[#166534]">Ready to apply</span>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Culinary Adaptation & Timing Matrix */}
          <div className="lg:col-span-6 flex flex-col space-y-3">
            {/* Card 3: How to Adjust the Step */}
            <div className="bg-[#F8F8F5] border border-[#E5E5DF] rounded-2xl p-4 shadow-xs flex flex-col">
              <div className="flex items-center justify-between pb-2.5">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-[#737780]" />
                  <span className="text-xs font-extrabold uppercase tracking-widest text-[#202124]">
                    HOW TO ADJUST THE STEP
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] text-[11px] font-bold tracking-wider uppercase">
                  <Clock className="w-3 h-3" />
                  <span>+2 MIN SIMMER EXTENSION</span>
                </div>
              </div>

              {/* Ordered Recipe Adjustments */}
              <div className="flex flex-col space-y-2">
                {currentOption.stepAdjustments.map((step) => (
                  <div
                    key={step.stepNumber}
                    className="flex items-start gap-3 bg-white border border-[#E5E5DF] p-2.5 sm:p-3 rounded-xl"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#EBF4F0] border border-[#C4DDD3] text-[#265442] text-xs font-bold flex items-center justify-center shrink-0">
                      {step.stepNumber}
                    </span>
                    <p className="text-xs text-[#202124] leading-snug">
                      <strong className="font-bold text-[#202124]">{step.title}:</strong>{' '}
                      {step.detail}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-2 pt-1 text-[#737780] text-xs">
                <AlertCircle className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
                <span className="text-[11px]">Monitor sauce bubbling; remove early if desired spoon-coating density is reached.</span>
              </div>
            </div>

            {/* Card 4: Timing Engine Impact & Timeline Visualizer */}
            <div className="bg-white border border-[#E5E5DF] rounded-2xl p-4 shadow-xs flex flex-col min-h-fit">
              <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#3D8065]" />
                  <span className="text-xs font-extrabold uppercase tracking-widest text-[#202124]">
                    IMPACT ON DINNER TIMING
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#EBF4F0] border border-[#C4DDD3] text-[#3D8065] text-[10px] font-bold uppercase tracking-wider">
                  FEASIBILITY RECHECKED · SYNC SAFE
                </span>
              </div>

              {/* Metric Telemetry Cards */}
              <div className="grid grid-cols-3 gap-2.5 my-1.5">
                <div className="bg-[#F8F8F5] border border-[#E5E5DF] p-2.5 rounded-xl flex flex-col min-h-[68px] justify-between">
                  <span className="text-[9px] font-bold tracking-wider text-[#9CA3AF] uppercase">
                    PAN GRAVY DURATION
                  </span>
                  <span className="font-['Epilogue'] text-sm sm:text-base font-bold text-[#D97706] leading-tight">
                    {currentOption.timeImpact.durationText}
                  </span>
                  <span className="text-[10px] text-[#737780] leading-tight">Absorbed in buffer</span>
                </div>

                <div className="bg-[#F8F8F5] border border-[#E5E5DF] p-2.5 rounded-xl flex flex-col min-h-[68px] justify-between">
                  <span className="text-[9px] font-bold tracking-wider text-[#9CA3AF] uppercase">
                    STOVETOP BURNER #2
                  </span>
                  <span className="font-['Epilogue'] text-sm sm:text-base font-bold text-[#202124] leading-tight">
                    {currentOption.timeImpact.burnerText}
                  </span>
                  <span className="text-[10px] text-[#3D8065] font-semibold leading-tight">No contention</span>
                </div>

                <div className="bg-[#F8F8F5] border border-[#E5E5DF] p-2.5 rounded-xl flex flex-col min-h-[68px] justify-between">
                  <span className="text-[9px] font-bold tracking-wider text-[#9CA3AF] uppercase">
                    TARGET LANDING
                  </span>
                  <span className="font-['Epilogue'] text-sm sm:text-base font-bold text-[#3D8065] leading-tight">
                    {formattedTargetTime} FIXED
                  </span>
                  <span className="text-[10px] text-[#3D8065] font-semibold leading-tight">0 min net delay</span>
                </div>
              </div>

              {/* Synchronized Rail Visualizer Graphic */}
              <div className="w-full bg-[#F8F8F5] border border-[#E5E5DF] rounded-xl p-2.5 sm:p-3 flex flex-col space-y-1.5 mt-1">
                <div className="flex justify-between items-center text-[#737780] text-[11px] font-mono font-medium">
                  <span>6:51 PM (NOW)</span>
                  <span>7:05 PM</span>
                  <span>7:15 PM</span>
                  <span>7:25 PM</span>
                  <span className="text-[#3D8065] font-bold">{formattedTargetTime} (TARGET)</span>
                </div>

                <div className="relative w-full h-14 bg-white border border-[#E5E5DF] rounded-lg overflow-hidden flex flex-col justify-center px-2.5 space-y-1">
                  {/* Track A: Chicken rest */}
                  <div className="relative w-full h-4 flex items-center">
                    <div className="absolute left-[20%] w-[70%] h-full bg-[#F1F0E9] rounded flex items-center px-2 text-[#202124] text-[10px] font-medium">
                      <span className="truncate">Roast Chicken Resting Window (15m Cushion)</span>
                    </div>
                  </div>

                  {/* Track B: Gravy extension */}
                  <div className="relative w-full h-4 flex items-center">
                    <div className="absolute left-[45%] w-[25%] h-full bg-[#F1F0E9] rounded flex items-center px-2 text-[#737780] text-[10px]">
                      <span className="truncate">Original (8m)</span>
                    </div>
                    <div className="absolute left-[45%] w-[34%] h-full bg-[#FEF3C7] border border-[#FDE68A] rounded flex items-center justify-between px-2 text-[#D97706] text-[10px] font-bold shadow-xs">
                      <span className="truncate">Proposed Gravy (+2m = 10m Simmer)</span>
                      <Clock className="w-2.5 h-2.5 text-[#D97706]" />
                    </div>
                    <div className="absolute right-[10%] top-0 bottom-0 w-0.5 bg-[#3D8065]"></div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 pt-0.5 text-[#3D8065] text-[11px] font-medium">
                  <Sparkles className="w-3 h-3 text-[#3D8065]" />
                  <span>{currentOption.timeImpact.note}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= MODAL FOOTER (PINNED) ================= */}
        <div className="relative z-10 p-3 sm:px-6 sm:py-3 border-t border-[#E5E5DF] flex flex-col md:flex-row items-center justify-between gap-3 shrink-0 bg-[#FAF9F5]">
          {/* Left: Voice prompt */}
          <div className="flex items-center gap-3.5 max-w-xl w-full md:w-auto">
            <div className="w-11 h-11 rounded-2xl bg-[#EBF4F0] border border-[#C4DDD3] text-[#3D8065] flex items-center justify-center shrink-0 shadow-xs">
              <Volume2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <div className="bg-[#F8F8F5] border border-[#E5E5DF] rounded-2xl rounded-tl-xs px-3.5 py-1.5 text-xs text-[#202124] italic">
                "I have a milk-and-butter alternative ready. Would you like me to update the gravy and confirm the schedule?"
              </div>
              <span className="text-[11px] text-[#737780] mt-0.5 pl-1">
                Hands messy? Say <strong className="text-[#3D8065] font-bold">"Apply substitute"</strong> or tap the action button.
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
            <button
              onClick={closeSubstitutionModal}
              className="h-12 px-5 rounded-2xl text-[#737780] hover:text-[#202124] hover:bg-[#F8F8F5] font-bold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={() => setShowAlternativeSelector((prev) => !prev)}
              className="h-12 px-5 rounded-2xl bg-[#F8F8F5] hover:bg-[#F1F0E9] text-[#202124] border border-[#E5E5DF] font-bold text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#737780]" />
              <span>Choose Another Option</span>
            </button>

            <div className="flex flex-col items-end">
              <button
                onClick={handleApply}
                className="h-12 sm:h-13 px-6 sm:px-8 rounded-2xl bg-[#3D8065] hover:bg-[#336C55] text-white font-['Epilogue'] text-xs sm:text-sm font-bold tracking-wide transition-all shadow-md hover:shadow-lg active:scale-[0.99] flex items-center gap-2.5 cursor-pointer"
              >
                <span>APPLY SUBSTITUTE & UPDATE PLAN</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <span className="text-[10px] text-[#9CA3AF] mt-1">
                Updates Burner #2 timer, adjusts step instructions, and maintains sync
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
