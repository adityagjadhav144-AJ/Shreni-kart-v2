import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Camera,
  CheckCircle2,
  Compass,
  Headphones,
  Languages,
  Mic,
  Search,
  Shield,
  Sparkles,
  Volume2,
} from "lucide-react";
import { Phone, ScreenHeader } from "@/components/kk/shell";
import { ShreniVoiceOrb } from "@/components/shreni/ShreniVoiceOrb";
import { useShreni } from "@/context/ShreniContext";

export const Route = createFileRoute("/_authenticated/voice")({
  head: () => ({
    meta: [
      { title: "Shreni AI — Voice Assistant for ShreniKart Artisans" },
      {
        name: "description",
        content:
          "Shreni AI is your multilingual voice assistant. Say 'Namaste Shreni' to navigate pages, capture craft photos, check live market prices, and list products in Shreni Bazaar.",
      },
      { property: "og:title", content: "Shreni AI — Voice Assistant" },
      {
        property: "og:description",
        content:
          "Say 'Namaste Shreni' to navigate, onboard products with camera, and conduct market research.",
      },
    ],
  }),
  component: ShreniVoiceStudio,
});

function ShreniVoiceStudio() {
  const navigate = useNavigate();
  const {
    status,
    isActivated,
    flowStep,
    audioLevel,
    startWakeWordEngine,
    triggerWakeWordManually,
    sendUserMessage,
    setAssistantPanelOpen,
  } = useShreni();

  useEffect(() => {
    // Auto-arm wake word engine if not active
    if (status === "idle") {
      void startWakeWordEngine();
    }
  }, []);

  return (
    <Phone withNav>
      <ScreenHeader
        title="Shreni AI Studio"
        subtitle="Voice Assistant & Craft Onboarding"
      />

      <div className="flex flex-col items-center px-5 py-6 text-center">
        {/* Wake Word Status Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-900">
          <span className="relative flex size-2">
            <span className="absolute size-full rounded-full bg-amber-600 animate-ping opacity-75" />
            <span className="size-2 rounded-full bg-amber-600" />
          </span>
          Wake Word: <span className="font-bold">“Namaste Shreni”</span>
        </div>

        {/* Central Shreni Voice Orb */}
        <div className="mt-8 mb-4">
          <ShreniVoiceOrb variant="inline" />
        </div>

        {/* Audio / Echo Cancellation Tech Badge */}
        <div className="mt-2 flex items-center justify-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Shield className="size-3 text-emerald-600" /> Echo Cancellation ON
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <Languages className="size-3 text-primary" /> Multilingual Support
          </span>
        </div>

        {/* 5-Step Product Onboarding Showcase Card */}
        <div className="rise mt-6 w-full rounded-3xl bg-card p-5 text-left shadow-soft border border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h3 className="font-display text-sm font-bold text-foreground">
                Product Onboarding Sequence
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setAssistantPanelOpen(true);
                void sendUserMessage("I want to add a product to Shreni Bazaar");
              }}
              className="rounded-full bg-gradient-warm px-3 py-1 text-[11px] font-bold text-white shadow-sm hover:opacity-90"
            >
              Start Flow
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-900">
                1
              </span>
              <div>
                <p className="text-xs font-bold text-foreground">Image First</p>
                <p className="text-[11px] text-muted-foreground">
                  Shreni triggers camera immediately to photograph the craft item.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-900">
                2
              </span>
              <div>
                <p className="text-xs font-bold text-foreground">Analyze & Interview</p>
                <p className="text-[11px] text-muted-foreground">
                  Identifies object and asks up to 10 conversational crafting questions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-900">
                3
              </span>
              <div>
                <p className="text-xs font-bold text-foreground">Materials & Valuation</p>
                <p className="text-[11px] text-muted-foreground">
                  Captures raw materials and expected selling price from artisan.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-900">
                4
              </span>
              <div>
                <p className="text-xs font-bold text-foreground">Market Research</p>
                <p className="text-[11px] text-muted-foreground">
                  Uses Google Search grounding to find live market prices for similar handmade goods.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-900">
                5
              </span>
              <div>
                <p className="text-xs font-bold text-foreground">Confirmation & Publish</p>
                <p className="text-[11px] text-muted-foreground">
                  Asks final approval, then calls <code className="text-[10px] bg-muted px-1 rounded">add_to_bazaar</code> to upload.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Function Calling & Voice Commands Cheat Sheet */}
        <div className="mt-5 w-full rounded-3xl bg-secondary/50 p-4 text-left border border-border/40">
          <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
            <Compass className="size-3.5 text-primary" /> Tap or Speak Any Command:
          </p>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li
              className="flex items-center justify-between p-1.5 rounded-xl hover:bg-card hover:text-foreground cursor-pointer transition-colors"
              onClick={() => {
                setAssistantPanelOpen(true);
                void sendUserMessage("Take me to profile");
              }}
            >
              <span>“Take me to profile”</span>
              <span className="text-[10px] text-primary font-mono">navigate_page</span>
            </li>
            <li
              className="flex items-center justify-between p-1.5 rounded-xl hover:bg-card hover:text-foreground cursor-pointer transition-colors"
              onClick={() => {
                setAssistantPanelOpen(true);
                void sendUserMessage("Go to orders");
              }}
            >
              <span>“Go to orders”</span>
              <span className="text-[10px] text-primary font-mono">navigate_page</span>
            </li>
            <li
              className="flex items-center justify-between p-1.5 rounded-xl hover:bg-card hover:text-foreground cursor-pointer transition-colors"
              onClick={() => {
                setAssistantPanelOpen(true);
                void sendUserMessage("I want to add a product to Shreni Bazaar");
              }}
            >
              <span>“Add a product to Bazaar”</span>
              <span className="text-[10px] text-primary font-mono">trigger_camera</span>
            </li>
            <li
              className="flex items-center justify-between p-1.5 rounded-xl hover:bg-card hover:text-foreground cursor-pointer transition-colors"
              onClick={() => {
                setAssistantPanelOpen(true);
                void sendUserMessage("What is the market price for brass statues?");
              }}
            >
              <span>“What is market price for brass statues?”</span>
              <span className="text-[10px] text-primary font-mono">google_search</span>
            </li>
          </ul>
        </div>
      </div>
    </Phone>
  );
}
