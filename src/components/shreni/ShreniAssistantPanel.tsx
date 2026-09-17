import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  ChevronDown,
  Compass,
  CornerDownLeft,
  Mic,
  MicOff,
  RotateCcw,
  Search,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import { useShreni } from "@/context/ShreniContext";
import { stopSpeaking } from "@/lib/shreni-assistant";
import { cn } from "@/lib/utils";

export function ShreniAssistantPanel() {
  const {
    assistantPanelOpen,
    setAssistantPanelOpen,
    status,
    messages,
    flowStep,
    currentCraftPhoto,
    audioLevel,
    liveTranscript,
    isSpeechSupported,
    micPermissionState,
    startListening,
    stopListening,
    sendUserMessage,
    resetConversation,
    triggerWakeWordManually,
  } = useShreni();

  const [inputVal, setInputVal] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (assistantPanelOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, assistantPanelOpen]);

  if (!assistantPanelOpen) return null;

  function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!inputVal.trim()) return;
    const text = inputVal.trim();
    setInputVal("");
    void sendUserMessage(text);
  }

  const steps = [
    { num: 1, title: "Photo" },
    { num: 2, title: "Interview" },
    { num: 3, title: "Materials" },
    { num: 4, title: "Market" },
    { num: 5, title: "Bazaar" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm">
      <div className="relative flex h-[85vh] w-full max-w-[430px] flex-col rounded-t-3xl sm:rounded-3xl bg-card shadow-2xl border border-border/70 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 bg-secondary/50 px-5 py-3.5 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <div className="relative flex size-8 items-center justify-center rounded-full bg-gradient-warm text-white shadow-sm">
              <Sparkles className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-display text-base font-bold text-foreground">
                  Shreni AI
                </h2>
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-500/30">
                  Artisan Voice
                </span>
                <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 border border-indigo-500/25 flex items-center gap-0.5">
                  <Sparkles className="size-2.5" /> Gemini
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Supportive · Multilingual · Powered by Gemini
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={resetConversation}
              title="Reset conversation"
              className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <RotateCcw className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setAssistantPanelOpen(false)}
              className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <ChevronDown className="size-5" />
            </button>
          </div>
        </div>

        {/* Product Onboarding Stepper (visible when flow is active) */}
        {flowStep > 0 ? (
          <div className="border-b border-border/40 bg-amber-500/5 px-4 py-2.5">
            <div className="flex items-center justify-between">
              {steps.map((s) => {
                const isActive = flowStep === s.num;
                const isDone = flowStep > s.num;
                return (
                  <div key={s.num} className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-[10px] font-bold transition-all",
                        isDone
                          ? "bg-emerald-600 text-white"
                          : isActive
                          ? "bg-amber-600 text-white ring-2 ring-amber-300"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isDone ? "✓" : s.num}
                    </div>
                    <span className="mt-0.5 text-[9px] font-medium text-muted-foreground">
                      {s.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[85%]",
                  isUser ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl p-3.5 text-sm shadow-soft whitespace-pre-wrap leading-relaxed",
                    isUser
                      ? "bg-gradient-warm text-primary-foreground rounded-tr-xs"
                      : "bg-secondary text-secondary-foreground rounded-tl-xs border border-border/50"
                  )}
                >
                  {msg.image ? (
                    <img
                      src={msg.image}
                      alt="Craft submission"
                      className="mb-2 max-h-40 w-full rounded-xl object-cover border border-white/20"
                    />
                  ) : null}
                  {msg.text}
                  {msg.searchGrounded ? (
                    <div className="mt-2 flex items-center gap-1 border-t border-border/30 pt-1.5 text-[10px] text-amber-800">
                      <Search className="size-3" /> Grounded with Live Handicraft Market Insights
                    </div>
                  ) : null}
                </div>
                <span className="mt-1 px-1 text-[10px] text-muted-foreground">
                  {msg.timestamp}
                </span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex gap-1.5 overflow-x-auto px-4 py-2 border-t border-border/40 bg-card">
          <button
            type="button"
            onClick={() => void sendUserMessage("How do I sell my crafts on ShreniKart?")}
            className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-500/20"
          >
            💡 How to Sell Crafts
          </button>
          <button
            type="button"
            onClick={() => void sendUserMessage("Tell me about the PM Vishwakarma Scheme")}
            className="shrink-0 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-900 hover:bg-indigo-500/20"
          >
            🏛️ PM Vishwakarma Scheme
          </button>
          <button
            type="button"
            onClick={() => void sendUserMessage("I want to add a product to Shreni Bazaar")}
            className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-500/20"
          >
            📸 Add Product
          </button>
          <button
            type="button"
            onClick={() => void sendUserMessage("Research market price for handmade crafts")}
            className="shrink-0 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-foreground hover:bg-secondary/80"
          >
            📊 Market Valuation
          </button>
          <button
            type="button"
            onClick={() => void sendUserMessage("Show my orders")}
            className="shrink-0 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-foreground hover:bg-secondary/80"
          >
            📦 My Orders
          </button>
          <button
            type="button"
            onClick={() => void sendUserMessage("Take me to profile")}
            className="shrink-0 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-foreground hover:bg-secondary/80"
          >
            👤 My Profile
          </button>
          <button
            type="button"
            onClick={() => void sendUserMessage("How can I verify my artisan account?")}
            className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-900 hover:bg-emerald-500/20"
          >
            🛡️ Artisan KYC / Verify
          </button>
        </div>

        {/* Voice & Input Controls */}
        <div className="border-t border-border/60 bg-secondary/30 p-3.5">
          {/* Real-time speech transcript or active listening state */}
          {liveTranscript ? (
            <div className="mb-2.5 flex items-center justify-between rounded-xl bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 text-xs text-amber-950 animate-pulse">
              <div className="flex items-center gap-2 truncate">
                <Mic className="size-3.5 text-amber-700 shrink-0" />
                <span className="truncate font-medium">“{liveTranscript}”</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const query = liveTranscript;
                  void sendUserMessage(query);
                }}
                className="ml-2 shrink-0 rounded-lg bg-gradient-warm px-2 py-0.5 text-[10px] font-bold text-white shadow-xs"
              >
                Send
              </button>
            </div>
          ) : status === "active_listening" ? (
            <div className="mb-2.5 flex items-center justify-between rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2">
                  <span className="absolute size-full rounded-full bg-amber-600 animate-ping opacity-75" />
                  <span className="size-2 rounded-full bg-amber-600" />
                </span>
                <span>Listening… Speak in Hindi, Marathi, or English</span>
              </div>
              {/* Audio level meter bars */}
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((bar) => (
                  <span
                    key={bar}
                    className="w-1 rounded-full bg-amber-600 transition-all duration-75"
                    style={{
                      height: `${Math.max(4, (audioLevel / 100) * 16 * (bar / 3))}px`,
                    }}
                  />
                ))}
              </div>
            </div>
          ) : micPermissionState === "denied" ? (
            <div className="mb-2 rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-1.5 text-[11px] text-destructive">
              Microphone permission is blocked in browser settings. You can type or tap quick chips below!
            </div>
          ) : null}

          <form onSubmit={handleSend} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (status === "speaking") {
                  stopSpeaking();
                  void startListening("active");
                } else if (status === "active_listening" || status === "wake_listening") {
                  stopListening();
                } else {
                  void startListening("active");
                }
              }}
              className={cn(
                "relative flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-all",
                status === "speaking"
                  ? "bg-amber-600 text-white animate-pulse"
                  : status === "active_listening"
                  ? "bg-gradient-warm text-white ring-4 ring-amber-400/80 scale-105"
                  : status === "wake_listening"
                  ? "bg-gradient-warm text-white ring-2 ring-amber-400"
                  : "bg-card text-primary border border-border hover:border-amber-400"
              )}
              title={
                status === "speaking"
                  ? "Stop speaking"
                  : status === "active_listening"
                  ? "Stop listening"
                  : "Tap to speak"
              }
            >
              {status === "speaking" ? (
                <Volume2 className="size-5" />
              ) : status === "active_listening" ? (
                <Mic className="size-5 animate-pulse text-white" />
              ) : (
                <Mic className="size-5" />
              )}
            </button>

            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={
                status === "active_listening"
                  ? "Listening to voice… (or type here)"
                  : "Speak or type message…"
              }
              className="flex-1 rounded-2xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />

            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-warm text-white shadow-card transition-opacity disabled:opacity-40"
            >
              <CornerDownLeft className="size-5" />
            </button>
          </form>

          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground px-1">
            <span>
              {status === "active_listening"
                ? "🎙️ Mic active (echo cancelled)"
                : status === "wake_listening"
                ? "👂 Listening for 'Namaste Shreni'"
                : status === "speaking"
                ? "🔊 Shreni speaking"
                : "💡 Tap mic or say 'Namaste Shreni'"}
            </span>
            <button
              type="button"
              onClick={triggerWakeWordManually}
              className="font-bold text-primary hover:underline"
            >
              Say “Namaste Shreni”
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
