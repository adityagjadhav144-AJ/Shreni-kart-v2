import React from "react";
import { Mic, MicOff, Sparkles, Volume2 } from "lucide-react";
import { useShreni } from "@/context/ShreniContext";
import { cn } from "@/lib/utils";
import { unlockMobileAudioAndSpeech } from "@/lib/shreni-assistant";

export function ShreniVoiceOrb({
  variant = "floating",
  className,
}: {
  variant?: "floating" | "inline";
  className?: string;
}) {
  const {
    status,
    isActivated,
    audioLevel,
    liveTranscript,
    startListening,
    stopListening,
    triggerWakeWordManually,
    setAssistantPanelOpen,
  } = useShreni();

  function handleClick() {
    unlockMobileAudioAndSpeech();
    if (status === "active_listening" || status === "wake_listening") {
      stopListening();
    } else {
      setAssistantPanelOpen(true);
      void startListening("active");
    }
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex flex-col items-center", className)}>
        <div className="relative">
          {/* Animated pulse rings */}
          {status === "active_listening" || status === "wake_listening" ? (
            <div
              className="absolute -inset-3 rounded-full bg-amber-500/20 animate-ping opacity-75"
              style={{
                transform: `scale(${1 + (audioLevel / 100) * 0.5})`,
              }}
            />
          ) : null}

          <button
            type="button"
            onClick={handleClick}
            className={cn(
              "tap relative flex size-28 items-center justify-center rounded-full shadow-float transition-all",
              status === "speaking"
                ? "bg-gradient-to-tr from-amber-600 to-orange-500 text-white animate-pulse"
                : status === "active_listening"
                ? "bg-gradient-warm text-primary-foreground ring-4 ring-amber-400/70 scale-105"
                : status === "wake_listening"
                ? "bg-gradient-warm text-primary-foreground border-2 border-amber-300"
                : "bg-card text-primary border border-border hover:border-amber-400"
            )}
            aria-label="Activate Shreni AI"
          >
            {status === "speaking" ? (
              <Volume2 className="size-12 animate-bounce" />
            ) : status === "processing" ? (
              <Sparkles className="size-12 animate-spin text-amber-200" />
            ) : status === "active_listening" ? (
              <div className="flex flex-col items-center">
                <Mic className="size-10 animate-pulse text-white" strokeWidth={2.2} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-100">Listening</span>
              </div>
            ) : (
              <Mic className="size-12" strokeWidth={1.8} />
            )}
          </button>
        </div>

        {/* Live speech preview if user is speaking */}
        {liveTranscript ? (
          <div className="mt-3 max-w-xs rounded-xl bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 text-xs font-medium text-amber-950 animate-pulse">
            “{liveTranscript}”
          </div>
        ) : null}

        <div className="mt-3 text-center">
          <p className="font-display text-base font-semibold text-foreground">
            {status === "speaking"
              ? "Shreni is speaking…"
              : status === "processing"
              ? "Understanding craft…"
              : status === "active_listening"
              ? "Listening now — speak your craft request"
              : status === "wake_listening"
              ? "Listening for “Namaste Shreni”…"
              : "Tap microphone to speak"}
          </p>
          <div className="mt-2.5 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setAssistantPanelOpen(true);
                void startListening("active");
              }}
              className="tap inline-flex items-center gap-1.5 rounded-full bg-gradient-warm px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:opacity-95"
            >
              <Mic className="size-3.5" />
              Tap to Speak
            </button>
            <button
              type="button"
              onClick={triggerWakeWordManually}
              className="tap inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3.5 py-1.5 text-xs font-bold text-amber-900 border border-amber-500/30 hover:bg-amber-500/25"
            >
              <Sparkles className="size-3 text-amber-700" />
              Say “Namaste Shreni”
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Floating trigger on any screen
  return (
    <div
      className={cn(
        "pointer-events-none fixed bottom-24 z-40 flex w-full max-w-[430px] justify-end px-4",
        className
      )}
    >
      <button
        type="button"
        onClick={() => {
          unlockMobileAudioAndSpeech();
          setAssistantPanelOpen(true);
          void startListening("active");
        }}
        className={cn(
          "pointer-events-auto tap group flex items-center gap-2 rounded-full px-4 py-2.5 shadow-float transition-all",
          status === "active_listening" || isActivated
            ? "bg-gradient-warm text-white ring-2 ring-amber-300"
            : "bg-card/95 text-foreground border border-amber-300/60 backdrop-blur hover:border-amber-400"
        )}
      >
        <span className="relative flex size-6 items-center justify-center">
          <span
            className={cn(
              "absolute size-full rounded-full bg-amber-500/30",
              status !== "idle" && "animate-ping"
            )}
          />
          {status === "speaking" ? (
            <Volume2 className="size-4 text-amber-600" />
          ) : status === "processing" ? (
            <Sparkles className="size-4 animate-spin text-amber-600" />
          ) : (
            <Mic className={cn("size-4", status === "active_listening" ? "text-white" : "text-amber-600")} />
          )}
        </span>
        <div className="flex flex-col text-left">
          <span className="text-xs font-bold leading-tight">Shreni AI</span>
          <span className="text-[10px] text-muted-foreground leading-tight">
            {status === "active_listening"
              ? "Listening…"
              : status === "wake_listening"
              ? "Say “Namaste Shreni”"
              : status === "speaking"
              ? "Speaking…"
              : "Say “Namaste Shreni”"}
          </span>
        </div>
      </button>
    </div>
  );
}
