/**
 * Shreni AI Client-Side Orchestrator
 * Supports:
 * - HTML5 navigator.mediaDevices with echoCancellation: true
 * - Lightweight client-side wake-word engine ("Namaste Shreni")
 * - Hardware speaker bleed / echo prevention
 * - Tool calls: navigate_page, trigger_camera, add_to_bazaar
 * - Text-to-Speech (TTS) voice synthesis
 */

export interface ShreniMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  timestamp: string;
  toolCall?: {
    name: string;
    args: Record<string, any>;
  };
  image?: string;
  searchGrounded?: boolean;
}

export type ShreniStatus =
  | "idle"
  | "wake_listening" // lightweight listening for "Namaste Shreni"
  | "active_listening" // listening to user craft request
  | "processing" // calling Gemini / AI
  | "speaking"; // assistant voice output

export class EchoDetector {
  /**
   * Checks if user transcription is just the device speaker bleed repeating the assistant's speech
   */
  static isBleed(userText: string, lastSpokenText: string): boolean {
    if (!lastSpokenText || !userText) return false;
    const normalize = (str: string) =>
      str
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, "")
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 2);

    const userWords = normalize(userText);
    const spokenWords = new Set(normalize(lastSpokenText));

    if (userWords.length < 3) return false;
    let overlap = 0;
    for (const w of userWords) {
      if (spokenWords.has(w)) overlap++;
    }
    const ratio = overlap / userWords.length;
    return ratio >= 0.7;
  }
}

let hasUnlockedMobileAudio = false;

/**
 * Primes mobile browser AudioContext & SpeechSynthesis on user touch gesture.
 * Required for iOS Safari and mobile Chrome where background audio is locked until first tap.
 */
export function unlockMobileAudioAndSpeech() {
  if (hasUnlockedMobileAudio || typeof window === "undefined") return;
  hasUnlockedMobileAudio = true;

  if ("speechSynthesis" in window) {
    try {
      window.speechSynthesis.resume();
      const silentUtterance = new SpeechSynthesisUtterance(" ");
      silentUtterance.volume = 0.01;
      silentUtterance.rate = 10;
      window.speechSynthesis.speak(silentUtterance);
    } catch {}
  }

  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (AudioCtx) {
    try {
      const dummyCtx = new AudioCtx();
      if (dummyCtx.state === "suspended") {
        void dummyCtx.resume();
      }
    } catch {}
  }
}

export function speakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  targetLang?: string
): SpeechSynthesisUtterance | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;

  try {
    window.speechSynthesis.resume();
  } catch {}

  // Strip Markdown markers and brackets for natural conversational speech
  const cleanSpeech = text
    .replace(/[#*_`~]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n+/g, ". ")
    .trim();

  if (!cleanSpeech) return null;

  const utterance = new SpeechSynthesisUtterance(cleanSpeech);
  utterance.rate = 0.95; // Warm, measured pace
  utterance.pitch = 1.05; // Friendly, encouraging tone

  // Detect script/language
  let detectedLang = targetLang || "en-IN";
  if (/[\u0900-\u097F]/.test(text)) {
    detectedLang = "hi-IN";
  } else if (/[\u0980-\u09FF]/.test(text)) {
    detectedLang = "bn-IN";
  } else if (/[\u0B80-\u0BFF]/.test(text)) {
    detectedLang = "ta-IN";
  } else if (/[\u0C00-\u0C7F]/.test(text)) {
    detectedLang = "te-IN";
  } else if (/[\u0A80-\u0AFF]/.test(text)) {
    detectedLang = "gu-IN";
  } else if (/[\u0C80-\u0CFF]/.test(text)) {
    detectedLang = "kn-IN";
  } else if (/[\u0D00-\u0D7F]/.test(text)) {
    detectedLang = "ml-IN";
  }
  utterance.lang = detectedLang;

  const applyVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return;
    const langPrefix = detectedLang.split("-")[0];
    const matchedVoice =
      voices.find((v) => v.lang.toLowerCase() === detectedLang.toLowerCase()) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(langPrefix)) ||
      voices.find(
        (v) =>
          v.lang.includes("en-IN") ||
          v.lang.includes("hi-IN") ||
          v.name.toLowerCase().includes("india") ||
          v.name.toLowerCase().includes("hindi")
      );

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
  };

  applyVoice();
  if (typeof window.speechSynthesis.onvoiceschanged !== "undefined") {
    window.speechSynthesis.onvoiceschanged = applyVoice;
  }

  let ended = false;
  const safeEnd = () => {
    if (!ended) {
      ended = true;
      if (onEnd) onEnd();
    }
  };

  utterance.onstart = () => {
    if (onStart) onStart();
  };
  utterance.onend = safeEnd;
  utterance.onerror = () => {
    safeEnd();
  };

  // Safe queuing for iOS Safari and Android Chrome
  try {
    window.speechSynthesis.cancel();
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        safeEnd();
      }
    }, 40);
  } catch {
    safeEnd();
  }

  return utterance;
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

/**
 * Resilient offline-ready / Vercel fallback AI generator.
 * If backend serverless or network is momentarily unavailable, Shreni AI still responds
 * with instant voice feedback and executes requested actions (navigation, camera, etc.).
 */
export function generateClientFallbackResponse(
  userText: string,
  preferredLang: string = "en"
): {
  text: string;
  functionCalls?: Array<{ name: string; args: Record<string, any>; id?: string }>;
} {
  const lower = (userText || "").toLowerCase().trim();

  // Navigation commands
  if (lower.includes("order") || lower.includes("ऑर्डर")) {
    return {
      text: preferredLang === "hi"
        ? "नमस्ते! मैं आपको आपके ऑर्डर्स पेज पर ले जा रही हूँ।"
        : "Namaste! Taking you to your orders page now.",
      functionCalls: [{ name: "navigate_page", args: { destination: "orders" } }],
    };
  }

  if (lower.includes("bazaar") || lower.includes("बाजार") || lower.includes("products") || lower.includes("सामान")) {
    return {
      text: preferredLang === "hi"
        ? "नमस्ते! चलिए Shreni Bazaar खोलते हैं।"
        : "Taking you to Shreni Bazaar now.",
      functionCalls: [{ name: "navigate_page", args: { destination: "dashboard" } }],
    };
  }

  if (lower.includes("add product") || lower.includes("list craft") || lower.includes("नया सामान") || lower.includes("जोड़ना")) {
    return {
      text: preferredLang === "hi"
        ? "नमस्ते! आइए आपकी हस्तकला का नया उत्पाद जोड़ते हैं।"
        : "Let's list your handcrafted creation on Shreni Bazaar.",
      functionCalls: [{ name: "navigate_page", args: { destination: "add-product" } }],
    };
  }

  if (lower.includes("camera") || lower.includes("photo") || lower.includes("फोटो") || lower.includes("तस्वीर")) {
    return {
      text: preferredLang === "hi"
        ? "कैमरा चालू हो रहा है! अपनी हस्तकला को अच्छी रोशनी में रखें।"
        : "Activating your camera now! Position your handcrafted piece in natural light.",
      functionCalls: [{ name: "trigger_camera", args: {} }],
    };
  }

  if (lower.includes("profile") || lower.includes("account") || lower.includes("खाता")) {
    return {
      text: preferredLang === "hi"
        ? "मैं आपको आपकी प्रोफ़ाइल पर ले जा रही हूँ।"
        : "Opening your artisan profile.",
      functionCalls: [{ name: "navigate_page", args: { destination: "profile" } }],
    };
  }

  if (lower.includes("vishwakarma") || lower.includes("scheme") || lower.includes("विश्वकर्मा") || lower.includes("योजना")) {
    return {
      text: preferredLang === "hi"
        ? "PM विश्वकर्मा योजना के तहत कारीगरों को ₹15,000 की टूलकिट प्रोत्साहन राशि, 5% की रियायती ब्याज दर पर ₹3 लाख तक का बिना गारंटी ऋण (Collateral-Free Loan), और निःशुल्क कौशल प्रशिक्षण प्रदान किया जाता है। क्या आप अपना पंजीकरण देखना चाहते हैं?"
        : "Under the PM Vishwakarma scheme, traditional artisans receive a ₹15,000 modern toolkit grant, collateral-free enterprise loans up to ₹3 Lakh at 5% concessional interest, and certified skill training with daily stipends. Would you like to check verification?",
    };
  }

  // Wake word greeting ("Namaste Shreni")
  if (
    lower.includes("namaste") ||
    lower.includes("namaskar") ||
    lower.includes("shreni") ||
    lower.includes("नमस्ते") ||
    lower.includes("नमस्कार") ||
    lower.includes("श्रेणी") ||
    lower === ""
  ) {
    return {
      text: preferredLang === "hi"
        ? "नमस्ते! मैं श्रेणी एआई हूँ, आपकी हस्तकला सहायिका। आप मुझसे अपने उत्पाद का बाजार भाव, नई लिस्टिंग, ऑर्डर्स या सरकारी योजनाओं के बारे में कुछ भी पूछ सकते हैं। आप क्या करना चाहते हैं?"
        : "Namaste! I am Shreni AI, your craft companion. You can ask me to list new crafts, check fair market rates, navigate to orders, or explore PM Vishwakarma benefits. How can I support your craft today?",
    };
  }

  // General craft inquiry fallback
  return {
    text: preferredLang === "hi"
      ? `मैंने आपका अनुरोध सुना: "${userText}"। मैं आपकी सहायता करने के लिए तैयार हूँ। आप मुझे अपने उत्पाद की फोटो दिखा सकते हैं या 'बाज़ार' और 'ऑर्डर्स' पर जाने के लिए कह सकते हैं।`
      : `I heard your craft request: "${userText}". I am ready to help! You can ask me to check market prices, photograph your item, or navigate your store.`,
  };
}
