import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  EchoDetector,
  type ShreniMessage,
  type ShreniStatus,
  speakText,
  stopSpeaking,
  unlockMobileAudioAndSpeech,
  generateClientFallbackResponse,
} from "@/lib/shreni-assistant";

interface ShreniContextType {
  status: ShreniStatus;
  isActivated: boolean;
  messages: ShreniMessage[];
  lastSpokenText: string;
  liveTranscript: string;
  flowStep: number;
  cameraOpen: boolean;
  currentCraftPhoto: string | null;
  assistantPanelOpen: boolean;
  audioLevel: number;
  isSpeechSupported: boolean;
  micPermissionState: "prompt" | "granted" | "denied" | "unsupported";
  startListening: (mode?: "active" | "wake") => Promise<void>;
  startWakeWordEngine: () => Promise<void>;
  stopListening: () => void;
  triggerWakeWordManually: () => void;
  sendUserMessage: (text: string, image?: string) => Promise<void>;
  onPhotoCaptured: (imageDataUrl: string) => void;
  closeCamera: () => void;
  setAssistantPanelOpen: (open: boolean) => void;
  resetConversation: () => void;
}

const ShreniContext = createContext<ShreniContextType | null>(null);

const INDIAN_SPEECH_LOCALES: Record<string, string> = {
  hi: "hi-IN",
  mr: "mr-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  te: "te-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
  or: "or-IN",
  as: "as-IN",
  ur: "ur-IN",
  en: "en-IN",
};

export function ShreniProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<ShreniStatus>("idle");
  const [isActivated, setIsActivated] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [micPermissionState, setMicPermissionState] = useState<
    "prompt" | "granted" | "denied" | "unsupported"
  >("prompt");

  const [messages, setMessages] = useState<ShreniMessage[]>([
    {
      id: "initial-msg",
      role: "assistant",
      text: "Namaste! I am Shreni AI, your craft assistant. Say 'Namaste Shreni' or tap the microphone to ask anything about selling crafts, market rates, or artisan schemes in your language.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [lastSpokenText, setLastSpokenText] = useState("");
  const [flowStep, setFlowStep] = useState(0);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [currentCraftPhoto, setCurrentCraftPhoto] = useState<string | null>(null);
  const [craftContext, setCraftContext] = useState<Record<string, any>>({});
  const [assistantPanelOpen, setAssistantPanelOpen] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Stable state refs to eliminate all closure bugs
  const statusRef = useRef<ShreniStatus>("idle");
  const isActivatedRef = useRef(false);
  const lastSpokenTextRef = useRef("");
  const activeModeRef = useRef<"wake" | "active">("active");
  const shouldListenRef = useRef(false);
  const silenceTimerRef = useRef<any>(null);

  const recognitionRef = useRef<any>(null);
  const isRecognitionRunningRef = useRef(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const updateStatus = (newStatus: ShreniStatus) => {
    statusRef.current = newStatus;
    setStatus(newStatus);
  };

  const updateActivated = (act: boolean) => {
    isActivatedRef.current = act;
    setIsActivated(act);
  };

  const updateLastSpoken = (txt: string) => {
    lastSpokenTextRef.current = txt;
    setLastSpokenText(txt);
  };

  // Helper to match "Namaste Shreni" and all phonetic/multilingual variants on mobile and desktop
  function matchWakeWord(text: string): { matched: boolean; remainder: string } {
    if (!text || !text.trim()) return { matched: false, remainder: "" };

    // Strip punctuation into spaces, keep Indic Unicode scripts and alphanumeric
    const normalized = text
      .toLowerCase()
      .replace(/[^\w\s\u0900-\u0D7F]/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!normalized) return { matched: false, remainder: "" };

    // 1. English / Hinglish wake patterns
    // Common mobile speech recognition transcriptions for Indian speakers:
    const engPatterns = [
      /\b(?:namaste|namaskar|namashkar|namaskaar|namasthe|pranam|hello|hey|hi|ok|listen|suno)\s+(?:shreni|sreni|shrenee|shreney|shrene|shreena|shree|shreee|sheni|sherni|sherani|sharni|shaini|shani|shreya|shrey|shaili|chreni|sreny)\b/i,
      /\b(?:shreni|sreni|shrenee|shreney|shrene|shreena|sherani)\b/i,
    ];

    // 2. Indic script wake patterns (Devanagari, Bengali, Gujarati, Tamil, Telugu, Kannada, Malayalam)
    const indicPatterns = [
      // Devanagari (Hindi, Marathi): (नमस्ते|नमस्कार|प्रणाम|हेलो|हाय|हे|सुनो) + (श्रेणी|श्रेनी|शरेणी|शरणी|श्रेणि|श्रेनि|श्रीनी|श्रीणी)
      /(?:नमस्ते|नमस्कार|प्रणाम|हेलो|हाय|हे|सुनो)?\s*(?:श्रेणी|श्रेनी|शरेणी|शरणी|श्रेणि|श्रेनि|श्रीनी|श्रीणी)/i,
      // Bengali
      /(?:নমস্কার|নমস্তে)?\s*(?:শ্রেণি|শ্রেণী)/i,
      // Gujarati
      /(?:નમસ્તે|નમસ્કાર)?\s*(?:શ્રેણી|શ્રેની)/i,
      // Tamil
      /(?:வணக்கம்)?\s*(?:ஸ்ரேணி|ஷ்ரேணி)/i,
      // Telugu
      /(?:నమస్తే|నమస్కారం)?\s*శ్రేణి/i,
      // Kannada
      /(?:ನಮಸ್ಕಾರ|ನಮಸ್ತೆ)?\s*ಶ್ರೇಣಿ/i,
      // Malayalam
      /(?:നമസ്കാരം|നമസ്തേ)?\s*ശ്രേണി/i,
    ];

    for (const pattern of [...engPatterns, ...indicPatterns]) {
      const match = normalized.match(pattern);
      if (match) {
        const matchedPhrase = match[0];
        const matchIndex = normalized.indexOf(matchedPhrase);
        const remainder = normalized.slice(matchIndex + matchedPhrase.length).trim();
        return { matched: true, remainder };
      }
    }

    // 3. Standalone greeting when addressing the assistant: "Namaste", "Namaskar", "नमस्ते", "नमस्कार"
    const standaloneGreeting = /^(?:namaste|namaskar|namashkar|नमस्ते|नमस्कार)\b/i.exec(normalized);
    if (standaloneGreeting) {
      const remainder = normalized.slice(standaloneGreeting[0].length).trim();
      return { matched: true, remainder };
    }

    return { matched: false, remainder: "" };
  }

  // Check initial browser speech recognition support and auto-start continuous wake word listening
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRec =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRec) {
        setIsSpeechSupported(false);
        setMicPermissionState("unsupported");
        return;
      }
    }

    // 1. Automatically start continuous wake-word listening
    console.log("[Shreni AI] Initializing continuous wake-word listening on app startup...");
    void startListening("wake");

    // 2. Register mobile user interaction triggers:
    // Primes mobile SpeechSynthesis/AudioContext and ensures listening is active
    const handleUserInteraction = () => {
      unlockMobileAudioAndSpeech();
      if (
        !isRecognitionRunningRef.current &&
        statusRef.current !== "speaking" &&
        statusRef.current !== "processing"
      ) {
        console.log("[Shreni AI] User interaction detected: unlocking audio and starting wake listener");
        void startListening("wake");
      }
    };

    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        if (
          !isRecognitionRunningRef.current &&
          statusRef.current !== "speaking" &&
          statusRef.current !== "processing"
        ) {
          console.log("[Shreni AI] App returned to foreground: resuming wake-word listener");
          void startListening("wake");
        }
      }
    };

    window.addEventListener("click", handleUserInteraction, { passive: true });
    window.addEventListener("touchstart", handleUserInteraction, { passive: true });
    window.addEventListener("pointerdown", handleUserInteraction, { passive: true });
    window.addEventListener("keydown", handleUserInteraction, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("touchstart", handleUserInteraction);
      window.removeEventListener("pointerdown", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Hardware Microphone with echoCancellation: true
  async function initHardwareAudio(): Promise<MediaStream | null> {
    try {
      if (mediaStreamRef.current && mediaStreamRef.current.active) {
        return mediaStreamRef.current;
      }
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
        } catch {
          // Fallback to basic audio constraint if enhanced constraints fail
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        mediaStreamRef.current = stream;
        setMicPermissionState("granted");

        // Visualizer audio level
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          if (!audioContextRef.current || audioContextRef.current.state === "closed") {
            audioContextRef.current = new AudioContextClass();
          }
          if (audioContextRef.current.state === "suspended") {
            await audioContextRef.current.resume();
          }
          const analyser = audioContextRef.current.createAnalyser();
          analyser.fftSize = 64;
          const source = audioContextRef.current.createMediaStreamSource(stream);
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

          const checkLevel = () => {
            if (analyserRef.current && shouldListenRef.current) {
              analyserRef.current.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
              const avg = sum / dataArray.length;
              setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
              animFrameRef.current = requestAnimationFrame(checkLevel);
            } else {
              setAudioLevel(0);
            }
          };
          checkLevel();
        }
        return stream;
      }
    } catch (err: any) {
      console.warn("[Shreni Hardware Mic] Media stream access:", err);
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        setMicPermissionState("denied");
      }
    }
    return null;
  }

  // Universal Speech Recognition Controller
  async function startListening(mode: "active" | "wake" = "active") {
    shouldListenRef.current = true;
    activeModeRef.current = mode;
    updateStatus(mode === "wake" ? "wake_listening" : "active_listening");
    setLiveTranscript("");

    // Only initialize hardware mic audio analyser in active mode to prevent mic collision on mobile devices
    if (mode === "active") {
      void initHardwareAudio().catch(() => {});
    }

    const SpeechRec =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRec) {
      setIsSpeechSupported(false);
      setMicPermissionState("unsupported");
      return;
    }

    setIsSpeechSupported(true);

    // If already running in the requested mode, avoid duplicate startup
    if (recognitionRef.current && isRecognitionRunningRef.current && activeModeRef.current === mode) {
      return;
    }

    // Clean up existing instance before recreating
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
      isRecognitionRunningRef.current = false;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      const currentSavedLang =
        (typeof window !== "undefined" &&
          (window.localStorage.getItem("craftlink.lang") ||
            window.localStorage.getItem("shreni-language"))) ||
        "en";
      recognition.lang = INDIAN_SPEECH_LOCALES[currentSavedLang] || "en-IN";

      recognition.onstart = () => {
        isRecognitionRunningRef.current = true;
        setMicPermissionState("granted");
        console.log(
          "[Shreni Speech] Active listening session started. Mode:",
          activeModeRef.current,
          "lang:",
          recognition.lang
        );
        updateStatus(activeModeRef.current === "wake" ? "wake_listening" : "active_listening");
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        let currentInterim = "";
        const allTranscripts: string[] = [];

        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          const text = item[0]?.transcript || "";
          allTranscripts.push(text);
          if (i >= event.resultIndex) {
            if (item.isFinal) {
              finalTranscript += text + " ";
            } else {
              currentInterim += text + " ";
            }
          }
        }

        const fullSession = allTranscripts.join(" ").trim();
        const heardText = (finalTranscript || currentInterim || fullSession).trim();
        if (heardText) {
          setLiveTranscript(heardText);
        }

        // 1. Check for "Namaste Shreni" and phonetic/Indic variants across all transcript streams
        const wakeCandidates = [heardText, currentInterim.trim(), finalTranscript.trim(), fullSession];
        let wakeMatch: { matched: boolean; remainder: string } = { matched: false, remainder: "" };

        for (const candidate of wakeCandidates) {
          if (!candidate) continue;
          const res = matchWakeWord(candidate);
          if (res.matched) {
            wakeMatch = res;
            break;
          }
        }

        if (wakeMatch.matched) {
          console.log("[Shreni Wake Word Triggered!]", {
            heard: heardText,
            remainder: wakeMatch.remainder,
          });
          updateActivated(true);
          activeModeRef.current = "active";
          setAssistantPanelOpen(true);
          setLiveTranscript("");
          toast.success("Namaste Shreni! Listening to you...", { id: "shreni-wake" });

          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

          const remainder = wakeMatch.remainder.trim();
          if (remainder.length > 2) {
            console.log("[Direct Request following wake word]:", remainder);
            void handleIncomingInput(remainder);
          } else {
            void handleIncomingInput("Namaste Shreni");
          }
          return;
        }

        // Hardware speaker bleed / Echo cancellation (only applies to non-wake words)
        if (EchoDetector.isBleed(heardText, lastSpokenTextRef.current)) {
          console.log("[Echo Prevention] Hardware bleed ignored:", heardText);
          return;
        }

        const lower = heardText.toLowerCase();

        // 2. Direct craft commands in background wake mode even without explicit wake-word
        const directCommandPatterns = [
          /\b(?:take me to|go to|open|show)\s+(?:profile|orders|bazaar|camera|dashboard|inquiry|products)\b/i,
          /\b(?:add|publish|list)\s+(?:product|craft|item|bazaar)\b/i,
          /\b(?:market price|price for|pricing)\b/i,
          /(?:ऑर्डर|ऑर्डर्स|प्रोफाइल|खाता|सत्यापन|कैमरा|बाजार|सामान|विश्वकर्मा)/i,
          /(?:kholo|dikhao|dakhva|bechna|bhav|kimat)/i,
        ];

        if (activeModeRef.current === "wake" && directCommandPatterns.some((p) => p.test(lower))) {
          console.log("[Direct Craft Command in Background]:", heardText);
          updateActivated(true);
          activeModeRef.current = "active";
          setAssistantPanelOpen(true);
          setLiveTranscript("");
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          void handleIncomingInput(heardText);
          return;
        }

        // 3. In Active Listening mode, capture user craft request
        if (activeModeRef.current === "active") {
          if (finalTranscript.trim().length > 0) {
            const query = finalTranscript.trim();
            console.log("[Shreni Speech Final]", query);
            setLiveTranscript("");
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            void handleIncomingInput(query);
          } else if (currentInterim.trim().length > 1) {
            // Auto-submit after user pauses speaking
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              if (activeModeRef.current === "active" && currentInterim.trim().length > 1) {
                console.log("[Shreni Speech Auto-Send]", currentInterim.trim());
                const query = currentInterim.trim();
                setLiveTranscript("");
                void handleIncomingInput(query);
              }
            }, 1200);
          }
        }
      };

      recognition.onerror = (e: any) => {
        console.warn("[Recognition Error Event]", e.error);
        isRecognitionRunningRef.current = false;
        if (e.error === "not-allowed") {
          // On mobile, not-allowed prior to user interaction is standard browser policy.
          // Do not mark permanent denial — user interaction will unlock it.
          setMicPermissionState("prompt");
        } else if (e.error === "service-not-allowed" || e.error === "network") {
          // Mobile Chrome service reset: schedule a quick restart
          setTimeout(() => {
            if (shouldListenRef.current && statusRef.current !== "speaking" && statusRef.current !== "processing") {
              void startListening(activeModeRef.current);
            }
          }, 600);
        }
      };

      recognition.onend = () => {
        isRecognitionRunningRef.current = false;
        // Clean old reference so subsequent call doesn't throw InvalidStateError
        if (recognitionRef.current === recognition) {
          recognitionRef.current = null;
        }
        console.log(
          "[Recognition onend] shouldListen:",
          shouldListenRef.current,
          "status:",
          statusRef.current
        );
        if (
          shouldListenRef.current &&
          statusRef.current !== "speaking" &&
          statusRef.current !== "processing"
        ) {
          // Restart clean instance with 300ms pause for mobile audio HAL
          setTimeout(() => {
            if (
              shouldListenRef.current &&
              !isRecognitionRunningRef.current &&
              statusRef.current !== "speaking" &&
              statusRef.current !== "processing"
            ) {
              void startListening(activeModeRef.current);
            }
          }, 300);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (startErr) {
      console.warn("[Recognition Start Error]", startErr);
    }
  }

  async function startWakeWordEngine() {
    return startListening("wake");
  }

  function stopListening() {
    shouldListenRef.current = false;
    isRecognitionRunningRef.current = false;
    updateStatus("idle");
    stopSpeaking();
    setLiveTranscript("");
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setAudioLevel(0);
  }

  // Manually trigger "Namaste Shreni" (starts listening + initiates greeting)
  function triggerWakeWordManually() {
    updateActivated(true);
    setAssistantPanelOpen(true);
    void startListening("active");
    void handleIncomingInput("Namaste Shreni");
  }

  // Central message dispatcher to /api/shreni/assistant
  async function handleIncomingInput(userText: string, image?: string) {
    if (!userText && !image) return;

    // Check echo cancellation
    if (EchoDetector.isBleed(userText, lastSpokenTextRef.current)) {
      console.log("[Shreni Client] Ignored speaker bleed:", userText);
      return;
    }

    const newMsg: ShreniMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      text: userText,
      image,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMsg]);
    updateStatus("processing");

    // Pause recognition while processing
    if (recognitionRef.current && isRecognitionRunningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      isRecognitionRunningRef.current = false;
    }

    try {
      const currentSavedLang =
        (typeof window !== "undefined" &&
          (window.localStorage.getItem("craftlink.lang") ||
            window.localStorage.getItem("shreni-language"))) ||
        "en";

      // 7-second timeout for serverless responses on cellular mobile
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      let data: any = null;
      try {
        const res = await fetch("/api/shreni/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            message: userText,
            image,
            lastAssistantOutput: lastSpokenTextRef.current,
            activated: true,
            flowStep,
            craftContext,
            preferredLang: currentSavedLang,
            history: messages.map((m) => ({ role: m.role, text: m.text })),
          }),
        });

        clearTimeout(timeoutId);
        if (res.ok) {
          data = await res.json();
        } else {
          console.warn("[Shreni API non-200 response, activating client fallback]", res.status);
        }
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        console.warn("[Shreni API fetch timeout or offline, activating client fallback]", fetchErr);
      }

      // If backend was unreachable, timed out, or returned an error, seamlessly use client fallback
      if (!data || !data.text) {
        data = generateClientFallbackResponse(userText, currentSavedLang);
      }

      if (data.echoIgnored) {
        updateStatus(shouldListenRef.current ? "active_listening" : "idle");
        return;
      }

      updateActivated(true);
      if (typeof data.flowStep === "number") {
        setFlowStep(data.flowStep);
      }
      if (data.craftContext) {
        setCraftContext(data.craftContext);
      }

      const replyText = data.text || "";
      const botMsg: ShreniMessage = {
        id: `ast-${Date.now()}`,
        role: "assistant",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        searchGrounded: !!data.searchMetadata,
      };

      setMessages((prev) => [...prev, botMsg]);
      updateLastSpoken(replyText);

      // Execute any function calls
      if (Array.isArray(data.functionCalls) && data.functionCalls.length > 0) {
        for (const call of data.functionCalls) {
          await executeToolCall(call.name, call.args);
        }
      }

      // Voice output
      if (replyText) {
        updateStatus("speaking");
        if (recognitionRef.current && isRecognitionRunningRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {}
          isRecognitionRunningRef.current = false;
        }

        speakText(
          replyText,
          () => {
            updateStatus("speaking");
            if (recognitionRef.current && isRecognitionRunningRef.current) {
              try {
                recognitionRef.current.stop();
              } catch {}
              isRecognitionRunningRef.current = false;
            }
          },
          () => {
            // After Shreni speaks, resume active listening for user's next command!
            shouldListenRef.current = true;
            activeModeRef.current = "active";
            updateStatus("active_listening");
            setTimeout(() => {
              if (statusRef.current !== "speaking" && !isRecognitionRunningRef.current) {
                void startListening("active");
              }
            }, 250);
          },
          currentSavedLang
        );
      } else {
        shouldListenRef.current = true;
        activeModeRef.current = "active";
        updateStatus("active_listening");
        setTimeout(() => {
          if (!isRecognitionRunningRef.current) {
            void startListening("active");
          }
        }, 200);
      }
    } catch (unexpectedErr: any) {
      console.error("[Shreni API error]", unexpectedErr);
      const fallback = generateClientFallbackResponse(userText, "en");
      updateStatus("speaking");
      speakText(fallback.text);
    }
  }

  // Execute Function Calling Schemas
  async function executeToolCall(toolName: string, args: Record<string, any>) {
    console.log(`[Shreni Tool Call] ${toolName}`, args);

    if (toolName === "navigate_page") {
      const dest = (args?.destination || "").toLowerCase().trim();
      let targetPath = "/dashboard";
      if (dest.includes("profile") || dest.includes("account")) targetPath = "/profile";
      else if (dest.includes("order")) targetPath = "/orders";
      else if (dest.includes("inquiry") || dest.includes("chat")) targetPath = "/inquiry";
      else if (dest.includes("verify") || dest.includes("aadhaar") || dest.includes("kyc"))
        targetPath = "/verify";
      else if (dest.includes("add") || dest.includes("bazaar") || dest.includes("new product"))
        targetPath = "/add-product";
      else if (dest.includes("voice")) targetPath = "/voice";
      else if (dest.includes("dashboard") || dest.includes("home") || dest.includes("product"))
        targetPath = "/dashboard";

      toast.info(`Navigating to ${dest}...`);
      void navigate({ to: targetPath as any });
    } else if (toolName === "trigger_camera") {
      toast.success("Camera activated for your handcrafted item!");
      setCameraOpen(true);
    } else if (toolName === "add_to_bazaar") {
      try {
        const payload = {
          title: args.title,
          description: args.description,
          materials: args.materials,
          final_price: Number(args.final_price),
          image: currentCraftPhoto || "/assets/p-vase.jpg",
        };

        const res = await fetch("/api/shreni/add-to-bazaar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const saved = await res.json();
        if (saved.success) {
          toast.success(`"${args.title}" successfully published to Shreni Bazaar!`);
          const existing = JSON.parse(localStorage.getItem("shrenikart_user_products") || "[]");
          existing.unshift(saved.product);
          localStorage.setItem("shrenikart_user_products", JSON.stringify(existing));
          setFlowStep(0);
          setCurrentCraftPhoto(null);
          setCraftContext({});
          setTimeout(() => {
            void navigate({ to: "/dashboard" });
          }, 1500);
        }
      } catch (e) {
        console.error("[Add to Bazaar Error]", e);
        toast.error("Failed to add craft to Bazaar.");
      }
    }
  }

  // Handle Photo Captured from camera
  function onPhotoCaptured(imageDataUrl: string) {
    setCurrentCraftPhoto(imageDataUrl);
    setCameraOpen(false);
    toast.success("Craft photo captured! Analyzing with Shreni AI...");
    void handleIncomingInput("I have photographed my handcrafted creation.", imageDataUrl);
  }

  function closeCamera() {
    setCameraOpen(false);
  }

  function resetConversation() {
    stopSpeaking();
    updateActivated(false);
    setFlowStep(0);
    setCraftContext({});
    setCurrentCraftPhoto(null);
    setLiveTranscript("");
    setMessages([
      {
        id: `initial-${Date.now()}`,
        role: "assistant",
        text: "Namaste! I am Shreni AI. Say 'Namaste Shreni' or tap the microphone to start in your preferred language.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    stopListening();
  }

  return (
    <ShreniContext.Provider
      value={{
        status,
        isActivated,
        messages,
        lastSpokenText,
        liveTranscript,
        flowStep,
        cameraOpen,
        currentCraftPhoto,
        assistantPanelOpen,
        audioLevel,
        isSpeechSupported,
        micPermissionState,
        startListening,
        startWakeWordEngine,
        stopListening,
        triggerWakeWordManually,
        sendUserMessage: handleIncomingInput,
        onPhotoCaptured,
        closeCamera,
        setAssistantPanelOpen,
        resetConversation,
      }}
    >
      {children}
    </ShreniContext.Provider>
  );
}

export function useShreni() {
  const ctx = useContext(ShreniContext);
  if (!ctx) {
    throw new Error("useShreni must be used within a ShreniProvider");
  }
  return ctx;
}
