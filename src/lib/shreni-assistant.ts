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

export function speakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  targetLang?: string
): SpeechSynthesisUtterance | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;

  window.speechSynthesis.cancel();
  // Strip Markdown markers for natural speech
  const cleanSpeech = text
    .replace(/[#*_`~]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n+/g, ". ");

  const utterance = new SpeechSynthesisUtterance(cleanSpeech);
  utterance.rate = 0.95; // Slightly measured, warm pace
  utterance.pitch = 1.05; // Warm, approachable tone

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

  // Select suitable voice (prefer native Indian voice matching language)
  const voices = window.speechSynthesis.getVoices();
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

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  utterance.onerror = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
