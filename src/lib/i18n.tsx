import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Check, Globe, Search, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type Lang =
  | "en"
  | "hi"
  | "mr"
  | "bn"
  | "te"
  | "ta"
  | "gu"
  | "kn"
  | "ml"
  | "pa"
  | "or"
  | "as"
  | "ur"
  | "sa"
  | "mai"
  | "bho"
  | "gom"
  | "doi"
  | "sd"
  | "ks"
  | "ne"
  | "mni-Mtei"
  | "brx"
  | "sat";

export interface IndianLanguage {
  code: Lang;
  label: string;
  native: string;
  region: string;
  popular?: boolean;
}

export const INDIAN_LANGUAGES: IndianLanguage[] = [
  { code: "hi", label: "Hindi", native: "हिंदी", region: "All India / North & Central", popular: true },
  { code: "en", label: "English", native: "English", region: "All India / Global", popular: true },
  { code: "mr", label: "Marathi", native: "मराठी", region: "Maharashtra", popular: true },
  { code: "bn", label: "Bengali", native: "বাংলা", region: "West Bengal, Tripura", popular: true },
  { code: "te", label: "Telugu", native: "తెలుగు", region: "Andhra Pradesh, Telangana", popular: true },
  { code: "ta", label: "Tamil", native: "தமிழ்", region: "Tamil Nadu, Puducherry", popular: true },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી", region: "Gujarat", popular: true },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ", region: "Karnataka", popular: true },
  { code: "ml", label: "Malayalam", native: "മലയാളം", region: "Kerala", popular: true },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ", region: "Punjab", popular: true },
  { code: "or", label: "Odia", native: "ଓଡ଼ିଆ", region: "Odisha" },
  { code: "as", label: "Assamese", native: "অসমীয়া", region: "Assam" },
  { code: "ur", label: "Urdu", native: "اردو", region: "Pan-India, Telangana, J&K" },
  { code: "sa", label: "Sanskrit", native: "संस्कृतम्", region: "Classical Heritage" },
  { code: "mai", label: "Maithili", native: "मैथिली", region: "Bihar, Mithila" },
  { code: "bho", label: "Bhojpuri", native: "भोजपुरी", region: "Bihar, Eastern UP" },
  { code: "gom", label: "Konkani", native: "कोंकणी", region: "Goa, Coastal Karnataka & Maharashtra" },
  { code: "doi", label: "Dogri", native: "डोगरी", region: "Jammu & Kashmir, Himachal" },
  { code: "sd", label: "Sindhi", native: "سنڌي / सिंधी", region: "Gujarat, Rajasthan, Maharashtra" },
  { code: "ks", label: "Kashmiri", native: "کٲشُر / कश्मीरी", region: "Kashmir Valley" },
  { code: "ne", label: "Nepali", native: "नेपाली", region: "Sikkim, North Bengal, Assam" },
  { code: "mni-Mtei", label: "Manipuri", native: "মৈতৈলোন্", region: "Manipur" },
  { code: "brx", label: "Bodo", native: "बड़ो", region: "Bodoland, Assam" },
  { code: "sat", label: "Santali", native: "ᱥᱟᱱᱛᱟᱲᱤ", region: "Jharkhand, Bengal, Odisha" },
];

/** Backward-compatible list of language options */
export const languageOptions = INDIAN_LANGUAGES.map((l) => ({
  code: l.code,
  label: l.label,
  native: l.native,
}));

type Dict = Record<string, string>;

const en: Dict = {
  brand: "ShreniKart",
  tagline: "Shreni Bazaar • From your craft to the world.",
  login: "Login",
  register: "Register as Artisan",
  registerShort: "Register",
  continue: "Continue",
  back: "Back",
  cancel: "Cancel",
  logout: "Logout",
  profile: "Profile",
  secureSimple: "Secure & Simple",
  multilingual: "Multilingual (24 Indian Languages)",
  designedForArtisans: "Designed for Artisans",
  welcomeBack: "Welcome Back 👋",
  mobile: "Mobile Number",
  password: "Password",
  continueWithOtp: "Continue with OTP",
  forgotPassword: "Forgot Password?",
  noAccount: "Don't have an account? Register",
  haveAccount: "Already have an account? Login",
  basicInfo: "Basic Information",
  fullName: "Full Name",
  email: "Email Address (optional)",
  state: "State",
  district: "District",
  preferredLanguage: "Preferred Language",
  artisanInfo: "Artisan Profile Information",
  artisanName: "Artisan / Business Name",
  craftCategory: "Craft Category",
  experience: "Years of Experience",
  village: "Village / Town",
  verifyIdentity: "Verify Your Identity",
  verificationStatus: "Verification Status",
  verifyLater: "Verify Later",
  startVerification: "Start Verification",
  verified: "Identity Verified",
  verifiedArtisan: "Verified Artisan",
  demoMode: "Demo Mode",
  useVoice: "Use Voice",
  errName: "Please enter your full name.",
  errMobile: "Please enter a valid 10-digit mobile number.",
  errLanguage: "Please select your preferred language.",
  errPassword: "Password must be at least 6 characters.",
  errGeneric: "Something went wrong. Please try again.",
  errService: "Verification service is temporarily unavailable.",
  errSession: "Your session has expired. Please login again.",
  okLogin: "Logged in successfully.",
  okRegister: "Your artisan account has been created successfully.",
};

const hi: Dict = {
  ...en,
  tagline: "आपकी कारीगरी, पूरी दुनिया तक।",
  login: "लॉग इन",
  register: "कारीगर के रूप में रजिस्टर करें",
  registerShort: "रजिस्टर",
  continue: "आगे बढ़ें",
  back: "पीछे",
  cancel: "रद्द करें",
  logout: "लॉग आउट",
  profile: "प्रोफ़ाइल",
  secureSimple: "सुरक्षित और आसान",
  multilingual: "बहुभाषी (24 भारतीय भाषाएँ)",
  designedForArtisans: "कारीगरों के लिए बना",
  welcomeBack: "वापसी पर स्वागत है 👋",
  mobile: "मोबाइल नंबर",
  password: "पासवर्ड",
  continueWithOtp: "OTP से आगे बढ़ें",
  forgotPassword: "पासवर्ड भूल गए?",
  noAccount: "खाता नहीं है? रजिस्टर करें",
  haveAccount: "पहले से खाता है? लॉग इन करें",
  basicInfo: "बुनियादी जानकारी",
  fullName: "पूरा नाम",
  email: "ईमेल (वैकल्पिक)",
  state: "राज्य",
  district: "ज़िला",
  preferredLanguage: "पसंदीदा भाषा",
  artisanInfo: "कारीगर प्रोफ़ाइल जानकारी",
  artisanName: "कारीगर / व्यवसाय का नाम",
  craftCategory: "शिल्प श्रेणी",
  experience: "अनुभव (वर्ष)",
  village: "गाँव / कस्बा",
  verifyIdentity: "अपनी पहचान सत्यापित करें",
  verificationStatus: "सत्यापन स्थिति",
  verifyLater: "बाद में करें",
  startVerification: "सत्यापन शुरू करें",
  verified: "पहचान सत्यापित",
  verifiedArtisan: "सत्यापित कारीगर",
  demoMode: "डेमो मोड",
  useVoice: "आवाज़ का उपयोग करें",
  errName: "कृपया अपना पूरा नाम भरें।",
  errMobile: "कृपया सही 10 अंकों का मोबाइल नंबर भरें।",
  errLanguage: "कृपया अपनी भाषा चुनें।",
  errPassword: "पासवर्ड कम से कम 6 अक्षर का होना चाहिए।",
  errGeneric: "कुछ गड़बड़ हो गई। कृपया फिर कोशिश करें।",
  errService: "सत्यापन सेवा अभी उपलब्ध नहीं है।",
  errSession: "आपका सत्र समाप्त हो गया। कृपया फिर लॉग इन करें।",
  okLogin: "सफलतापूर्वक लॉग इन हुआ।",
  okRegister: "आपका कारीगर खाता बन गया है।",
};

const mr: Dict = {
  ...en,
  tagline: "तुमच्या कलेपासून जगापर्यंत.",
  login: "लॉग इन",
  register: "कारागीर म्हणून नोंदणी करा",
  registerShort: "नोंदणी",
  continue: "पुढे चला",
  back: "मागे",
  cancel: "रद्द करा",
  logout: "लॉग आउट",
  profile: "प्रोफाइल",
  secureSimple: "सुरक्षित आणि सोपे",
  multilingual: "बहुभाषिक (24 भारतीय भाषा)",
  designedForArtisans: "कारागिरांसाठी बनवलेले",
  welcomeBack: "पुन्हा स्वागत आहे 👋",
  mobile: "मोबाइल नंबर",
  password: "पासवर्ड",
  continueWithOtp: "OTP ने पुढे जा",
  forgotPassword: "पासवर्ड विसरलात?",
  noAccount: "खाते नाही? नोंदणी करा",
  haveAccount: "आधीच खाते आहे? लॉग इन करा",
  basicInfo: "मूलभूत माहिती",
  fullName: "पूर्ण नाव",
  email: "ईमेल (ऐच्छिक)",
  state: "राज्य",
  district: "जिल्हा",
  preferredLanguage: "पसंतीची भाषा",
  artisanInfo: "कारागीर प्रोफाइल माहिती",
  artisanName: "कारागीर / व्यवसायाचे नाव",
  craftCategory: "कलेचा प्रकार",
  experience: "अनुभव (वर्षे)",
  village: "गाव / शहर",
  verifyIdentity: "तुमची ओळख पडताळा",
  verificationStatus: "पडताळणी स्थिती",
  verifyLater: "नंतर करा",
  startVerification: "पडताळणी सुरू करा",
  verified: "ओळख पडताळली",
  verifiedArtisan: "पडताळलेला कारागीर",
  demoMode: "डेमो मोड",
  useVoice: "आवाज वापरा",
  errName: "कृपया तुमचे पूर्ण नाव लिहा.",
  errMobile: "कृपया योग्य 10 अंकी मोबाइल नंबर लिहा.",
  errLanguage: "कृपया तुमची भाषा निवडा.",
  errPassword: "पासवर्ड किमान 6 अक्षरांचा हवा.",
  errGeneric: "काहीतरी चूक झाली. पुन्हा प्रयत्न करा.",
  errService: "पडताळणी सेवा सध्या उपलब्ध नाही.",
  errSession: "सत्र संपले आहे. पुन्हा लॉग इन करा.",
  okLogin: "यशस्वीरित्या लॉग इन झाले.",
  okRegister: "तुमचे कारागीर खाते तयार झाले आहे.",
};

const dicts: Record<string, Dict> = { en, hi, mr };

const STORAGE_KEY = "craftlink.lang";

/**
 * Programmatically and silently applies translation to the entire page DOM
 * using Google Translate's translation pipeline with zero visible attribution or chrome.
 */
export function applyStealthTranslation(targetCode: string) {
  if (typeof window === "undefined") return;

  try {
    const host = window.location.hostname;

    if (targetCode === "en") {
      // Clear translation cookies
      document.cookie = "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      document.cookie = `googtrans=; path=/; domain=${host}; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
      if (host.includes(".")) {
        document.cookie = `googtrans=; path=/; domain=.${host}; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
      }
    } else {
      // Set the active translation cookie format expected by the translation engine
      const cookieValue = `/en/${targetCode}`;
      document.cookie = `googtrans=${cookieValue}; path=/;`;
      document.cookie = `googtrans=${cookieValue}; path=/; domain=${host};`;
      if (host.includes(".")) {
        document.cookie = `googtrans=${cookieValue}; path=/; domain=.${host};`;
      }
    }

    // Trigger the hidden select element if available
    const applyToCombo = () => {
      const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
      if (select) {
        select.value = targetCode;
        select.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
      return false;
    };

    if (!applyToCombo()) {
      // Retry in intervals for up to 3 seconds until Google's script mounts the combo
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (applyToCombo() || attempts > 10) {
          clearInterval(interval);
        }
      }, 250);
    }
  } catch (err) {
    console.warn("Stealth translation dispatch:", err);
  }
}

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof en | string) => string;
  isModalOpen: boolean;
  openLanguageModal: () => void;
  closeLanguageModal: () => void;
  currentLanguage: IndianLanguage;
  isTranslating: boolean;
};

const I18nContext = createContext<Ctx>({
  lang: "en",
  setLang: () => {},
  t: (k) => en[k as string] ?? String(k),
  isModalOpen: false,
  openLanguageModal: () => {},
  closeLanguageModal: () => {},
  currentLanguage: INDIAN_LANGUAGES[0],
  isTranslating: false,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  // Restore saved language preference on mount
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (stored && INDIAN_LANGUAGES.some((l) => l.code === stored)) {
        setLangState(stored);
        applyStealthTranslation(stored);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    setIsTranslating(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
    applyStealthTranslation(l);
    setTimeout(() => {
      setIsTranslating(false);
    }, 600);
  }, []);

  const openLanguageModal = useCallback(() => setIsModalOpen(true), []);
  const closeLanguageModal = useCallback(() => setIsModalOpen(false), []);

  const currentLanguage = useMemo(
    () => INDIAN_LANGUAGES.find((l) => l.code === lang) || INDIAN_LANGUAGES[0],
    [lang]
  );

  const t = useCallback(
    (key: string) => {
      const currentDict = dicts[lang];
      if (currentDict && currentDict[key]) return currentDict[key];
      return en[key] ?? key;
    },
    [lang]
  );

  return (
    <I18nContext.Provider
      value={{
        lang,
        setLang,
        t,
        isModalOpen,
        openLanguageModal,
        closeLanguageModal,
        currentLanguage,
        isTranslating,
      }}
    >
      {children}
      <LanguageSelectorModal isOpen={isModalOpen} onClose={closeLanguageModal} />
      {/* Subtle feedback toast during language transition */}
      {isTranslating && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 rounded-full bg-stone-900/90 text-stone-100 px-4 py-1.5 text-xs font-semibold shadow-lg backdrop-blur flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
          <Globe className="size-3.5 text-amber-400 animate-spin" />
          <span>भाषा बदली जा रही है...</span>
        </div>
      )}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

/**
 * Compact, artisan-styled language switch widget.
 * Features quick selectors for popular choices and 1-tap access to all 24 Indian languages.
 */
export function LanguageSwitch({ className = "" }: { className?: string }) {
  const { lang, setLang, openLanguageModal, currentLanguage } = useI18n();

  // Pick 2 alternates different from current
  const quickPicks = useMemo(() => {
    return [
      { code: "en" as Lang, label: "Eng", native: "English" },
      { code: "hi" as Lang, label: "Hindi", native: "हिंदी" },
      { code: "mr" as Lang, label: "Marathi", native: "मराठी" },
    ];
  }, []);

  return (
    <div className={cn("inline-flex items-center gap-1 rounded-full bg-card/90 p-1 shadow-soft border border-border/40 backdrop-blur-sm", className)}>
      {/* Current Active Language Pill */}
      <button
        type="button"
        onClick={openLanguageModal}
        className="tap inline-flex items-center gap-1.5 rounded-full bg-gradient-warm px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-sm"
        title="Choose from 24 Indian languages"
      >
        <Globe className="size-3.5 shrink-0" />
        <span className="truncate max-w-[80px]">{currentLanguage.native}</span>
      </button>

      {/* Quick Switch Alternates */}
      {quickPicks
        .filter((p) => p.code !== lang)
        .slice(0, 2)
        .map((opt) => (
          <button
            key={opt.code}
            type="button"
            onClick={() => setLang(opt.code)}
            className="tap rounded-full px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            {opt.native}
          </button>
        ))}

      {/* All Indian Languages Button */}
      <button
        type="button"
        onClick={openLanguageModal}
        className="tap flex items-center gap-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 px-2.5 py-1 text-[11px] font-bold text-amber-900 dark:text-amber-200 transition-colors"
        aria-label="View all Indian languages"
      >
        <span>24 भाषाएँ</span>
      </button>
    </div>
  );
}

/**
 * Full Indian Languages Modal Sheet.
 * Displays all 24 Indian languages with native scripts, search filtering, and regions.
 * Completely custom and zero third-party branding.
 */
export function LanguageSelectorModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { lang, setLang } = useI18n();
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "popular">("all");

  const filteredLanguages = useMemo(() => {
    let list = INDIAN_LANGUAGES;
    if (selectedFilter === "popular") {
      list = list.filter((l) => l.popular);
    }
    if (!search.trim()) return list;

    const query = search.toLowerCase().trim();
    return list.filter(
      (l) =>
        l.label.toLowerCase().includes(query) ||
        l.native.toLowerCase().includes(query) ||
        l.region.toLowerCase().includes(query)
    );
  }, [search, selectedFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative flex flex-col w-full max-w-[430px] max-h-[85vh] rounded-t-3xl sm:rounded-3xl bg-card shadow-float border border-border/80 overflow-hidden animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-4 pb-3 border-b border-border/60 bg-gradient-to-r from-amber-900/10 via-amber-800/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-2xl bg-amber-500/20 text-amber-800 dark:text-amber-300">
                <Globe className="size-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-1.5">
                  भाषा चुनें • Select Language
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  24 भारतीय भाषाएँ • 24 Indian Languages Integrated
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="tap grid size-8 place-items-center rounded-full text-muted-foreground hover:text-foreground bg-muted/50"
              aria-label="Close"
            >
              <X className="size-4.5" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search language / भाषा खोजें (e.g. Marathi, தமிழ், हिंदी)..."
              className="w-full rounded-2xl border border-border bg-background/80 py-2.5 pl-9 pr-4 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          {/* Filter Chips */}
          <div className="mt-2.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedFilter("all")}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-semibold transition-colors",
                selectedFilter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              All (24)
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter("popular")}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-semibold transition-colors flex items-center gap-1",
                selectedFilter === "popular"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <Sparkles className="size-3" /> Popular
            </button>
          </div>
        </div>

        {/* Language Grid */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          <div className="grid grid-cols-2 gap-2">
            {filteredLanguages.map((l) => {
              const isSelected = lang === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    setLang(l.code);
                    onClose();
                  }}
                  className={cn(
                    "tap relative flex flex-col items-start rounded-2xl p-3 text-left transition-all border",
                    isSelected
                      ? "bg-primary/10 border-primary text-primary shadow-sm ring-1 ring-primary/30"
                      : "bg-muted/40 border-border/60 hover:bg-muted/70 text-foreground"
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-display text-base font-bold leading-none tracking-tight">
                      {l.native}
                    </span>
                    {isSelected ? (
                      <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3 stroke-[3]" />
                      </span>
                    ) : null}
                  </div>
                  <span className="mt-1 text-xs font-medium text-foreground/90">
                    {l.label}
                  </span>
                  <span className="mt-0.5 text-[10px] text-muted-foreground truncate w-full">
                    {l.region}
                  </span>
                </button>
              );
            })}
          </div>

          {filteredLanguages.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              <p className="text-sm">No language found for &quot;{search}&quot;</p>
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-2 text-xs font-semibold text-primary underline"
              >
                Clear search
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-muted/30 border-t border-border/50 text-center">
          <p className="text-[10px] text-muted-foreground">
            All text, craft descriptions, and assistant responses adapt instantly to your selected language.
          </p>
        </div>
      </div>
    </div>
  );
}
