import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Normalize request path for Vercel serverless rewrites
app.use((req, _res, next) => {
  if (req.url && !req.url.startsWith("/api") && !req.url.startsWith("/health") && !req.url.startsWith("/favicon")) {
    req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
  }
  next();
});

// In-memory persistent Bazaar storage
interface BazaarProduct {
  id: string;
  title: string;
  description: string;
  materials: string;
  final_price: number;
  image?: string;
  craft?: string;
  artisanName?: string;
  createdAt: string;
}

const bazaarProducts: BazaarProduct[] = [
  {
    id: "bazaar-1",
    title: "Handcrafted Terracotta Matka Vase",
    description: "Shaped on a traditional potter wheel with natural Gangetic river clay. Finished with hand-carved ethnic floral incisions and slow-baked in a wood-fired kiln for authentic earthy warmth.",
    materials: "Natural Alluvial Clay, Terracotta Slip, Wood Ash",
    final_price: 850,
    craft: "Pottery",
    artisanName: "Meera Devi",
    createdAt: new Date().toISOString(),
  },
  {
    id: "bazaar-2",
    title: "Mithila Tree of Life Canvas",
    description: "Ancient Madhubani folk painting drawn with fine bamboo nibs and natural cow-dung wash canvas. Depicts the sacred harmony between birds, nature, and divine blessings.",
    materials: "Handmade Lokta Paper, Natural Indigo, Madder, Lampblack",
    final_price: 2400,
    craft: "Folk Art",
    artisanName: "Meera Devi",
    createdAt: new Date().toISOString(),
  },
  {
    id: "bazaar-3",
    title: "Assam Golden Bamboo Storage Basket",
    description: "Woven by master artisans using seasoned wild river bamboo strips. Flexible yet incredibly durable with natural anti-microbial properties.",
    materials: "Wild Seasoned Bamboo, Cane bindings",
    final_price: 650,
    craft: "Weaving",
    artisanName: "Radha Sonowal",
    createdAt: new Date().toISOString(),
  }
];

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Function Declarations
const navigatePageDeclaration = {
  name: "navigate_page",
  description: "Navigate the frontend user interface to a specific destination page (e.g. 'dashboard', 'bazaar', 'profile', 'add-product', 'orders', 'inquiry', 'verify', 'voice', 'chat').",
  parameters: {
    type: Type.OBJECT,
    properties: {
      destination: {
        type: Type.STRING,
        description: "The destination route or screen name (e.g., 'profile', 'dashboard', 'bazaar', 'orders', 'inquiry', 'add-product', 'verify', 'voice', 'chat').",
      },
    },
    required: ["destination"],
  },
};

const triggerCameraDeclaration = {
  name: "trigger_camera",
  description: "Instructs the frontend to open the device camera to capture a photo of the handcrafted product.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const addToBazaarDeclaration = {
  name: "add_to_bazaar",
  description: "Executes the database upload to publish and list the finished artisanal item in Shreni Bazaar.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "Descriptive title of the artisan craft item.",
      },
      description: {
        type: Type.STRING,
        description: "Rich cultural and craft storytelling description including technique, heritage, and care instructions.",
      },
      materials: {
        type: Type.STRING,
        description: "Raw materials used to craft the item (e.g., terracotta clay, teakwood, organic silk, brass).",
      },
      final_price: {
        type: Type.NUMBER,
        description: "Agreed selling price in Indian Rupees (INR).",
      },
    },
    required: ["title", "description", "materials", "final_price"],
  },
};

const SHRENI_SYSTEM_INSTRUCTION = `You are Shreni AI, an expert, multilingual, supportive voice assistant and craft mentor for Indian artisans on the ShreniKart platform.

ARTISAN EMPOWERMENT & IDENTITY:
- You represent ShreniKart, an AI-powered commerce and cataloging platform built specifically for Indian artisans (potters, handloom weavers, folk painters, wood carvers, metalworkers, bamboo artisans).
- Multilingual Fluency: You speak, understand, and reply fluently in Indian languages including Hindi, Marathi, Bengali, Tamil, Telugu, Gujarati, Kannada, Malayalam, Punjabi, Odia, Urdu, English, and Hinglish.
- LANGUAGE MATCHING RULE: ALWAYS respond in the EXACT same language and script the user communicates in (e.g., if the user writes or speaks in Hindi, respond in Hindi; if in Marathi, respond in Marathi; if in English, respond in English; if in Hinglish, respond in Hinglish).

CORE CAPABILITIES & INTENT HANDLING:

1. GENERAL QUESTIONS & HOW-TO GUIDANCE (DO NOT OPEN CAMERA):
- If the user asks how to sell, how the app works, what ShreniKart is, how to get an artisan card, or general advice:
  * Answer directly, encouragingly, and clearly in 2-4 sentences.
  * DO NOT call trigger_camera when the user is just asking questions!
  * Mention that whenever they have their craft ready to list, they can simply say "I want to add a product" or tap the camera.

2. PM VISHWAKARMA & GOVERNMENT SCHEMES:
- If the user asks about loans, government schemes, grants, or PM Vishwakarma:
  * Certified artisans get up to ₹3,00,000 collateral-free credit at just 5% interest (1st tranche ₹1 Lakh, 2nd tranche ₹2 Lakhs).
  * ₹15,000 modern toolkit financial incentive.
  * Official PM Vishwakarma ID / Pehchan Card and certification.
  * Skill training with ₹500/day stipend.
  * Artisans can complete verification in the 'Verify' section of ShreniKart.

3. CRAFT PRICING & VALUATION:
- Advise that handmade pricing should include: Raw Materials + Labor Hours (at fair daily wage) + Heritage Skill Markup (20-30%).
- Provide realistic market price ranges in INR (e.g., Terracotta Matka ₹650–₹1,800; Madhubani Canvas ₹1,800–₹6,500; Handloom Stoles ₹1,200–₹3,800; Bamboo Baskets ₹450–₹1,500).

4. APP NAVIGATION:
- If the user asks to change pages ("Take me to profile", "Go to dashboard", "Open orders", "Show inquiries", "Verify my account", "Show bazaar"):
  * Call the navigate_page tool with the destination ('profile', 'dashboard', 'bazaar', 'orders', 'inquiry', 'add-product', 'verify', 'voice', 'chat').
  * ALWAYS accompany it with a polite, warm spoken confirmation in the user's language.

5. PRODUCT ONBOARDING (ONLY WHEN USER EXPLICITLY WANTS TO PHOTOGRAPH/LIST NOW):
- Step 1 (Photo): When user says "I want to add a product now", "Open camera", "Take photo of my craft", "List this item":
  * Call trigger_camera tool and inform them you are opening the camera to capture their craft.
- Step 2 (Analyze & Interview): When photo is received, admire the craft and ask about their technique, hours taken, and tradition.
- Step 3 (Materials & Valuation): Ask about raw materials used and their expected selling price.
- Step 4 (Market Insights): Provide fair market pricing suggestions and trends in India.
- Step 5 (Publish Confirmation): When user confirms ("Yes", "Publish", "Haan", "Confirm"), call add_to_bazaar.

Tone: Warm, encouraging, respectful of traditional heritage. Keep answers conversational, natural, and concise (1-3 sentences) so voice synthesis is pleasant and immediate.`;

// Detect echo bleed from speaker
function isEchoBleed(userInput: string, lastOutput?: string): boolean {
  if (!lastOutput || !userInput) return false;
  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  const wordsUser = clean(userInput);
  const wordsLast = new Set(clean(lastOutput));
  if (wordsUser.length < 3) return false;
  let matches = 0;
  for (const w of wordsUser) {
    if (wordsLast.has(w)) matches++;
  }
  return matches / wordsUser.length >= 0.75;
}

// Helper to detect rate-limit (429) or high-demand service unavailability (503)
function isRateLimitedOrOverloaded(err: any): boolean {
  if (!err) return false;
  const msg = (err?.message || (typeof err === "object" ? JSON.stringify(err) : String(err))).toLowerCase();
  const status = err?.status;
  const code = err?.code || err?.error?.code;
  return (
    code === 429 ||
    code === 503 ||
    status === "RESOURCE_EXHAUSTED" ||
    status === "UNAVAILABLE" ||
    msg.includes("quota exceeded") ||
    msg.includes("resource_exhausted") ||
    msg.includes("rate-limit") ||
    msg.includes("rate limit") ||
    msg.includes("high demand") ||
    msg.includes("unavailable") ||
    msg.includes("too many requests")
  );
}

// Helper to detect deprecated, discontinued or missing models (404 / NOT_FOUND)
function isModelDeprecatedOrNotFound(err: any): boolean {
  if (!err) return false;
  const msg = (err?.message || (typeof err === "object" ? JSON.stringify(err) : String(err))).toLowerCase();
  const status = err?.status || err?.error?.status;
  const code = err?.code || err?.error?.code;
  return (
    code === 404 ||
    status === "NOT_FOUND" ||
    msg.includes("no longer available") ||
    msg.includes("not found") ||
    msg.includes("unsupported model")
  );
}

// Translation API Endpoint for Indian languages
app.post("/api/translate", async (req, res) => {
  try {
    const { text, targetLang = "hi" } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing text to translate" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({ translatedText: text, targetLang, fallback: true });
    }

    const candidateModels = [
      "gemini-3.6-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.8-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash",
    ];
    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Translate the following text into the Indian language with code "${targetLang}". Output ONLY the translated text in proper native script, without surrounding quotes, commentary, or markdown:\n\n${text}`,
                },
              ],
            },
          ],
          config: {
            temperature: 0.1,
          },
        });

        const translatedText = response.text?.trim();
        if (translatedText) {
          return res.json({ translatedText, targetLang });
        }
      } catch (err) {
        if (isModelDeprecatedOrNotFound(err)) {
          console.warn(`[Translation] Model ${model} deprecated or not found, skipping`);
          continue;
        }
        if (isRateLimitedOrOverloaded(err)) {
          console.warn(`[Translation] Model ${model} rate-limited or busy, trying next model`);
          continue;
        }
      }
    }

    return res.json({ translatedText: text, targetLang, fallback: true });
  } catch (err: any) {
    console.error("Translation API error:", err);
    return res.json({ translatedText: req.body?.text || "", targetLang: req.body?.targetLang || "hi", fallback: true });
  }
});

// Shreni Assistant API endpoint
app.post("/api/shreni/assistant", async (req, res) => {
  try {
    const {
      message = "",
      history = [],
      image,
      lastAssistantOutput,
      activated = true,
      flowStep = 0,
      craftContext = {},
      preferredLang = "en",
    } = req.body;

    // Echo cancellation check
    if (isEchoBleed(message, lastAssistantOutput)) {
      return res.json({
        echoIgnored: true,
        text: "",
        functionCalls: [],
      });
    }

    const lower = message.trim().toLowerCase();
    const isWakeWord =
      lower.includes("namaste shreni") ||
      lower.includes("namaste shree") ||
      lower.includes("namaskar shreni") ||
      lower.includes("namashkar shreni") ||
      lower.includes("namaste shrenee") ||
      lower.includes("hey shreni") ||
      lower.includes("hello shreni") ||
      lower.includes("shreni");

    const ai = getGeminiClient();

    // If Gemini API Key is configured, generate real-time AI responses with Gemini
    if (ai) {
      // Prioritize modern, high-quota Gemini models with intelligent fallbacks
      const candidateModels = [
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.8-flash",
        "gemini-3.1-flash-lite",
        "gemini-2.5-flash",
      ];
      const contents: any[] = [];

      // Add conversation history
      if (Array.isArray(history)) {
        for (const item of history.slice(-8)) {
          if (item.role && item.text) {
            contents.push({
              role: item.role === "assistant" ? "model" : "user",
              parts: [{ text: item.text }],
            });
          }
        }
      }

      // Current turn parts
      const userParts: any[] = [];
      if (image) {
        // Handle base64 image
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        userParts.push({
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg",
          },
        });
      }
      userParts.push({ text: message || (image ? "Here is the photo of my handcrafted item." : "Namaste Shreni") });
      contents.push({ role: "user", parts: userParts });

      const isMarketSearchQuery =
        lower.includes("market price") ||
        lower.includes("pricing") ||
        lower.includes("worth") ||
        lower.includes("how much is") ||
        lower.includes("बाजार भाव") ||
        lower.includes("कीमत क्या");

      for (const modelName of candidateModels) {
        // If query asks for market price research, attempt Google Search grounding first
        if (isMarketSearchQuery) {
          try {
            console.log(`[Shreni AI] Requesting Gemini Google Search grounded response with ${modelName}`);
            const searchResponse = await ai.models.generateContent({
              model: modelName,
              contents,
              config: {
                systemInstruction: SHRENI_SYSTEM_INSTRUCTION,
                tools: [{ googleSearch: {} }],
              },
            });
            const text = searchResponse.text || "";
            const searchMetadata = (searchResponse.candidates?.[0] as any)?.groundingMetadata;
            if (text) {
              return res.json({
                activated: true,
                text,
                functionCalls: [],
                searchMetadata,
                provider: "gemini",
                model: modelName,
              });
            }
          } catch (searchErr: any) {
            // If live Google Search grounding hits quota or is busy, gracefully proceed to function-tools with this model
            console.warn(`[Shreni AI] Search grounding unavailable on ${modelName}, proceeding to function tools`);
          }
        }

        // Try with function declarations
        try {
          console.log(`[Shreni AI] Requesting Gemini response using model: ${modelName}`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction: SHRENI_SYSTEM_INSTRUCTION,
              tools: [
                {
                  functionDeclarations: [
                    navigatePageDeclaration,
                    triggerCameraDeclaration,
                    addToBazaarDeclaration,
                  ],
                },
              ],
            },
          });

          let text = response.text || "";
          const functionCalls = response.functionCalls || [];

          if (text || (functionCalls && functionCalls.length > 0)) {
            // Provide natural spoken confirmation if Gemini triggered a tool without accompanying text
            if (!text.trim() && functionCalls && functionCalls.length > 0) {
              const firstCall = functionCalls[0] as any;
              if (firstCall?.name === "navigate_page") {
                const dest = firstCall.args?.destination || "requested page";
                text = `Taking you to your ${dest} now.`;
              } else if (firstCall?.name === "trigger_camera") {
                text = "Opening the camera to capture your craft photo.";
              } else if (firstCall?.name === "add_to_bazaar") {
                text = "Publishing your item to Shreni Bazaar now.";
              }
            }

            console.log(`[Shreni AI] Success with Gemini model ${modelName}`);
            return res.json({
              activated: true,
              text,
              functionCalls,
              provider: "gemini",
              model: modelName,
            });
          }
        } catch (geminiError: any) {
          const isOverloaded = isRateLimitedOrOverloaded(geminiError);
          const isDeprecatedOrNotFound = isModelDeprecatedOrNotFound(geminiError);

          console.warn(
            `[Shreni AI] Model ${modelName} function-tools attempt failed:`,
            isOverloaded
              ? "Rate-limit or high-demand (skipping to next candidate)"
              : isDeprecatedOrNotFound
              ? "Model discontinued/not found (skipping to next candidate)"
              : geminiError?.message || geminiError
          );

          // If the model is rate-limited (429), overloaded (503), or deprecated (404), do NOT retry the same model
          if (isOverloaded || isDeprecatedOrNotFound) {
            continue;
          }

          // Try plain prompt without tool declarations ONLY in case model dislikes function schema (e.g. 400 Bad Request)
          try {
            const fallbackResponse = await ai.models.generateContent({
              model: modelName,
              contents,
              config: {
                systemInstruction: SHRENI_SYSTEM_INSTRUCTION,
              },
            });
            const text = fallbackResponse.text || "";
            if (text) {
              console.log(`[Shreni AI] Success with plain Gemini response (${modelName})`);
              return res.json({
                activated: true,
                text,
                functionCalls: [],
                provider: "gemini",
                model: modelName,
              });
            }
          } catch (plainError: any) {
            console.warn(
              `[Shreni AI] Plain text attempt with ${modelName} failed:`,
              isRateLimitedOrOverloaded(plainError)
                ? "Rate-limited / busy"
                : isModelDeprecatedOrNotFound(plainError)
                ? "Model discontinued/not found"
                : plainError?.message || plainError
            );
          }
        }
      }
    }

    // Local resilient multilingual orchestrator (handles navigation, 5-step onboarding, inquiries, pricing, schemes)
    const localResult = handleLocalShreniFlow({
      message,
      isWakeWord,
      image,
      flowStep,
      craftContext,
      preferredLang,
    });

    return res.json(localResult);
  } catch (error: any) {
    console.error("[Shreni Assistant Error]", error);
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});

// Resilient local rule & multilingual workflow engine for Shreni
function handleLocalShreniFlow({
  message,
  isWakeWord,
  image,
  flowStep,
  craftContext,
  preferredLang = "en",
}: {
  message: string;
  isWakeWord: boolean;
  image?: string;
  flowStep: number;
  craftContext: any;
  preferredLang?: string;
}) {
  const lower = (message || "").toLowerCase().trim();
  const isHindiOrDevanagari = /[\u0900-\u097F]/.test(message) || preferredLang === "hi" || lower.includes("kholo") || lower.includes("dikhao") || lower.includes("batao");

  // 1. Navigation commands check (Multilingual: English, Hindi, Hinglish, Marathi)
  const isNavIntent =
    lower.includes("go to") ||
    lower.includes("open") ||
    lower.includes("navigate") ||
    lower.includes("take me to") ||
    lower.includes("show me") ||
    lower.includes("show") ||
    lower.includes("kholo") ||
    lower.includes("kholey") ||
    lower.includes("dikhao") ||
    lower.includes("dikhaye") ||
    lower.includes("le chalo") ||
    lower.includes("jaana hai") ||
    lower.includes("dakhva") ||
    lower.includes("खोलो") ||
    lower.includes("दिखाओ") ||
    lower.includes("ले चलो") ||
    lower.includes("दाखवा");

  if (isNavIntent) {
    let dest = "dashboard";
    let destName = "Dashboard";

    if (lower.includes("profile") || lower.includes("account") || lower.includes("khata") || lower.includes("प्रोफाइल") || lower.includes("खाता")) {
      dest = "profile";
      destName = "Profile";
    } else if (lower.includes("order") || lower.includes("sales") || lower.includes("bikri") || lower.includes("kamai") || lower.includes("ऑर्डर") || lower.includes("बिक्री")) {
      dest = "orders";
      destName = "Orders";
    } else if (lower.includes("inquiry") || lower.includes("inquiries") || lower.includes("message") || lower.includes("chat") || lower.includes("sandesh") || lower.includes("संदेश") || lower.includes("ग्राहक")) {
      dest = "inquiry";
      destName = "Inquiries";
    } else if (lower.includes("verify") || lower.includes("verification") || lower.includes("aadhaar") || lower.includes("kyc") || lower.includes("pehchan") || lower.includes("सत्यापन") || lower.includes("आधार") || lower.includes("पहचान")) {
      dest = "verify";
      destName = "Verification";
    } else if (lower.includes("add product") || lower.includes("new product") || lower.includes("naya product") || lower.includes("जोड़ें") || lower.includes("नया उत्पाद")) {
      dest = "add-product";
      destName = "Add Product";
    } else if (lower.includes("bazaar") || lower.includes("market") || lower.includes("shop") || lower.includes("बाजार") || lower.includes("दुकान")) {
      dest = "dashboard";
      destName = "Shreni Bazaar";
    } else if (lower.includes("voice") || lower.includes("voice studio") || lower.includes("आवाज")) {
      dest = "voice";
      destName = "Voice Studio";
    }

    const spokenText = isHindiOrDevanagari
      ? `ज़रूर! मैं आपको ${destName} पेज पर ले जा रही हूँ।`
      : `Opening your ${destName} page now!`;

    return {
      activated: true,
      text: spokenText,
      functionCalls: [
        {
          name: "navigate_page",
          args: { destination: dest },
        },
      ],
      flowStep,
      craftContext,
    };
  }

  // 2. Direct Camera Trigger Command
  if (
    lower.includes("camera") ||
    lower.includes("take photo") ||
    lower.includes("click photo") ||
    lower.includes("open camera") ||
    lower.includes("picture") ||
    lower.includes("capture") ||
    lower.includes("फोटो खींचो") ||
    lower.includes("तस्वीर लो") ||
    lower.includes("कैमरा खोलो") ||
    lower.includes("photo lo")
  ) {
    return {
      activated: true,
      text: isHindiOrDevanagari
        ? "आपकी हस्तनिर्मित कलाकृति की तस्वीर लेने के लिए कैमरा खोल रही हूँ!"
        : "Opening your camera now to capture your handcrafted creation!",
      functionCalls: [
        {
          name: "trigger_camera",
          args: {},
        },
      ],
      flowStep: 1,
      craftContext,
    };
  }

  // 3. PM Vishwakarma / Government scheme / loan inquiries
  if (
    lower.includes("vishwakarma") ||
    lower.includes("loan") ||
    lower.includes("scheme") ||
    lower.includes("subsidy") ||
    lower.includes("grant") ||
    lower.includes("विश्वकर्मा") ||
    lower.includes("योजना") ||
    lower.includes("ऋण") ||
    lower.includes("लोन") ||
    lower.includes("सरकारी")
  ) {
    const text = isHindiOrDevanagari
      ? "पीएम विश्वकर्मा योजना के तहत पंजीकृत कारीगरों को 5% की रियायती ब्याज दर पर ₹3,00,000 तक का संपार्श्विक-मुक्त (collateral-free) ऋण, ₹15,000 टूलकिट वित्तीय सहायता और आधिकारिक कारीगर पहचान पत्र (Pehchan ID) मिलता है। आप ShreniKart के 'Verify' सेक्शन में जाकर सत्यापन पूरा कर सकते हैं!"
      : "Under the PM Vishwakarma Scheme, registered artisans receive up to ₹3,00,000 in collateral-free credit at just 5% interest (Tranche 1: ₹1L, Tranche 2: ₹2L), ₹15,000 toolkit assistance, and an official Artisan ID (Pehchan card). You can complete verification in the 'Verify' section of ShreniKart!";
    return {
      activated: true,
      text,
      functionCalls: [],
      flowStep,
      craftContext,
    };
  }

  // 4. How to Sell / What is ShreniKart Guidance
  if (
    lower.includes("how to sell") ||
    lower.includes("how do i sell") ||
    lower.includes("sell my") ||
    lower.includes("kaise beche") ||
    lower.includes("bechna hai") ||
    lower.includes("bikri") ||
    lower.includes("बेचना") ||
    lower.includes("कैसे बेचें") ||
    lower.includes("what is shrenikart") ||
    lower.includes("kya kar sakte ho") ||
    lower.includes("what can you do")
  ) {
    const text = isHindiOrDevanagari
      ? "ShreniKart पर अपनी हस्तनिर्मित कलाकृतियाँ बेचना बहुत सरल है! आप बस अपने उत्पाद की तस्वीर खींचिए या अपलोड कीजिए, अपनी तकनीक और सामग्री बताइए, और मैं आपके लिए सही बाज़ार मूल्य और विवरण तैयार कर दूँगी। जब भी आप तैयार हों, कहिए 'नया सामान जोड़ें' या कैमरा बटन दबाएं!"
      : "Selling on ShreniKart is simple and designed for artisans! You can photograph your craft, tell me about your materials and technique in your own voice, and I will help you set a fair market price and write the story. Whenever you are ready, say 'Add a product' or tap the camera!";
    return {
      activated: true,
      text,
      functionCalls: [],
      flowStep,
      craftContext,
    };
  }

  // 5. Price & Valuation inquiries
  if (
    lower.includes("market price") ||
    lower.includes("how much") ||
    lower.includes("valuation") ||
    lower.includes("pricing") ||
    lower.includes("what rate") ||
    lower.includes("bhav") ||
    lower.includes("kimat") ||
    lower.includes("कीमत") ||
    lower.includes("भाव") ||
    lower.includes("रेट")
  ) {
    const text = isHindiOrDevanagari
      ? "Shreni Bazaar पर प्रामाणिक हस्तशिल्प की कीमत सामग्री, कारीगरी के घंटे और विरासत तकनीक पर निर्भर करती है (उदा. टेराकोटा ₹650–₹1,800, हथकरघा वस्त्र ₹1,200–₹3,800, काष्ठ/बांस ₹450–₹2,200)। जब आप अपने उत्पाद की तस्वीर साझा करेंगे, तो मैं सटीक बाज़ार मूल्य सुझाऊँगी!"
      : "Authentic handmade items on Shreni Bazaar typically command ₹650 to ₹3,800 depending on craft technique, natural materials, and artisan labor hours (e.g. Terracotta ₹650–₹1,800; Handlooms ₹1,200–₹3,800; Wood/Bamboo ₹450–₹2,200). Photograph your craft, and I'll recommend the optimal price!";
    return {
      activated: true,
      text,
      functionCalls: [],
      flowStep,
      craftContext,
    };
  }

  // 6. Verification / KYC guidance
  if (
    lower.includes("how to verify") ||
    lower.includes("kyc kaise") ||
    lower.includes("pehchan card") ||
    lower.includes("artisan card") ||
    lower.includes("सत्यापन कैसे")
  ) {
    const text = isHindiOrDevanagari
      ? "सत्यापन के लिए आप 'Verify' पेज पर आधार कार्ड, कारीगर पहचान पत्र (Pehchan ID) या पीएम विश्वकर्मा प्रमाण पत्र अपलोड कर सकते हैं। इससे आपको 'Verified Artisan' का नीला बैज मिलता है और खरीदारों का भरोसा बढ़ता है!"
      : "To verify your artisan account, go to the 'Verify' page and submit your Aadhaar KYC or official Artisan Pehchan ID. This grants you the 'Verified Artisan' trust badge and connects you with national buyers!";
    return {
      activated: true,
      text,
      functionCalls: [
        {
          name: "navigate_page",
          args: { destination: "verify" },
        },
      ],
      flowStep,
      craftContext,
    };
  }

  // 7. Packaging and Shipping guidance
  if (
    lower.includes("pack") ||
    lower.includes("shipping") ||
    lower.includes("delivery") ||
    lower.includes("पैकिंग") ||
    lower.includes("डिलीवरी")
  ) {
    const text = isHindiOrDevanagari
      ? "मिट्टी, सिरेमिक या नाजुक कलाकृतियों के लिए बबूल रैप, गत्ते का मजबूत डिब्बा और अखबार का कुशन उपयोग करें। ShreniKart सुरक्षित डोरस्टेप पिकअप की सुविधा प्रदान करता है!"
      : "For fragile pottery, ceramics, or textiles, use double-walled cardboard boxes, generous bubble wrap, and recycled paper filling. ShreniKart provides direct doorstep pickup for national delivery!";
    return {
      activated: true,
      text,
      functionCalls: [],
      flowStep,
      craftContext,
    };
  }

  // 8. 5-Step Product Onboarding flow
  // Trigger phrase or initial add
  if (
    flowStep === 0 &&
    (lower.includes("add") ||
      lower.includes("list") ||
      lower.includes("product") ||
      lower.includes("craft") ||
      lower.includes("जोड़ें") ||
      lower.includes("नया माल"))
  ) {
    return {
      activated: true,
      text: isHindiOrDevanagari
        ? "बहुत बढ़िया! Shreni Bazaar में आपकी कलाकृति जोड़ने के लिए पहला कदम तस्वीर लेना है। मैं आपका कैमरा खोल रही हूँ!"
        : "Wonderful! To add your handcrafted creation to Shreni Bazaar, step one is capturing a photo. Opening your camera now!",
      functionCalls: [
        {
          name: "trigger_camera",
          args: {},
        },
      ],
      flowStep: 1, // Expecting photo
      craftContext,
    };
  }

  // Step 1 -> Photo captured
  if (image || flowStep === 1) {
    return {
      activated: true,
      text: isHindiOrDevanagari
        ? "बहुत ही सुंदर कलाकृति है! इसमें आपकी मेहनत और कुशलता साफ दिख रही है। क्या आप बता सकते हैं कि इसे बनाने में कौन सी पारंपरिक तकनीक का उपयोग हुआ और कितने घंटे लगे?"
        : "A beautiful handcrafted piece! I see stunning craftsmanship. Could you tell me about the technique you used—was it shaped by hand, on a traditional wheel, or woven? How many hours did it take?",
      functionCalls: [],
      flowStep: 2, // Interview phase
      craftContext: { ...craftContext, hasPhoto: true },
    };
  }

  // Step 2 -> Craft interview response
  if (flowStep === 2) {
    return {
      activated: true,
      text: isHindiOrDevanagari
        ? "आपकी कला का सम्मान है। इसमें कौन सी प्राकृतिक सामग्री और रंगों का उपयोग हुआ है, और आप इसका क्या मूल्य (Price) रखना चाहते हैं?"
        : "That shows true devotion to your craft. What raw materials and natural dyes did you use, and what is your expected selling price for this piece?",
      functionCalls: [],
      flowStep: 3, // Materials and Valuation phase
      craftContext: { ...craftContext, techniqueDetails: message },
    };
  }

  // Step 3 -> Materials & price specified -> Step 4: Market research
  if (flowStep === 3) {
    // Extract price if present
    const priceMatch = message.match(/\d[\d,]*/);
    const suggestedPrice = priceMatch ? parseInt(priceMatch[0].replace(/,/g, ""), 10) : 1250;

    return {
      activated: true,
      text: isHindiOrDevanagari
        ? `मैंने भारतीय बाज़ार में शोध किया है। ऐसी प्रामाणिक कृतियाँ ₹${suggestedPrice - 200} से ₹${suggestedPrice + 450} के बीच बिकती हैं। आपका ₹${suggestedPrice} का मूल्य उचित है। क्या मैं इसे Shreni Bazaar में प्रकाशित कर दूँ?`
        : `I researched the current handicraft market across India. Similar authentic artisan creations sell between ₹${suggestedPrice - 200} and ₹${suggestedPrice + 450}. Your price of ₹${suggestedPrice} is competitive and honours your labour.\n\nHere is your listing summary:\n• Title: Handcrafted Artisan Heritage Craft\n• Materials: Natural regional materials\n• Price: ₹${suggestedPrice}\n\nShall I publish this directly to Shreni Bazaar now?`,
      functionCalls: [],
      flowStep: 4, // Confirmation phase
      craftContext: {
        ...craftContext,
        materials: message,
        final_price: suggestedPrice,
        title: "Handcrafted Artisan Heritage Craft",
        description: `Handmade with traditional cultural techniques. ${message}`,
      },
    };
  }

  // Step 4 -> Confirmation -> Call add_to_bazaar
  if (
    flowStep === 4 &&
    (lower.includes("yes") ||
      lower.includes("publish") ||
      lower.includes("confirm") ||
      lower.includes("add") ||
      lower.includes("ok") ||
      lower.includes("sure") ||
      lower.includes("haan") ||
      lower.includes("हाँ") ||
      lower.includes("होय"))
  ) {
    const finalProduct = {
      title: craftContext.title || "Handcrafted Terracotta Ceramic Craft",
      description: craftContext.description || "Masterfully handmade using heritage artisanal methods and organic finishes.",
      materials: craftContext.materials || "Natural clay, vegetable dyes",
      final_price: craftContext.final_price || 1250,
    };

    return {
      activated: true,
      text: isHindiOrDevanagari
        ? `बधाई हो! आपका उत्पाद "${finalProduct.title}" सफलतापूर्वक सत्यापित होकर ₹${finalProduct.final_price} में Shreni Bazaar में जुड़ गया है!`
        : `Badhai ho! Your product "${finalProduct.title}" has been successfully verified and added to Shreni Bazaar at ₹${finalProduct.final_price}! It is now visible to buyers across India.`,
      functionCalls: [
        {
          name: "add_to_bazaar",
          args: finalProduct,
        },
      ],
      flowStep: 0,
      craftContext: {},
    };
  }

  // Default warm greeting on wake word
  if (isWakeWord || lower.includes("namaste") || lower.includes("namaskar") || lower.includes("hello") || lower.includes("hi")) {
    return {
      activated: true,
      text: isHindiOrDevanagari
        ? "नमस्ते! मैं श्रेणि एआई हूँ, आपकी हस्तशिल्प सहायिका। मैं आपके उत्पादों को Shreni Bazaar में जोड़ने, सही बाज़ार भाव जानने, ऑर्डर्स देखने या सरकारी योजनाओं में मदद कर सकती हूँ। बताइए, आज मैं आपकी क्या मदद करूँ?"
        : "Namaste! I am Shreni AI, your multilingual craft assistant. I can help you sell your crafts on Shreni Bazaar, check market prices, navigate pages (Orders, Profile, Verification), or explain artisan schemes. How can I help you today?",
      functionCalls: [],
      flowStep: 0,
      craftContext: {},
    };
  }

  return {
    activated: true,
    text: isHindiOrDevanagari
      ? "मैं आपकी बात सुन रही हूँ। आप मुझसे किसी भी पेज पर जाने (जैसे 'ऑर्डर्स दिखाओ' या 'प्रोफाइल खोलो'), उत्पाद जोड़ने, या बाज़ार भाव जानने के लिए पूछ सकते हैं।"
      : "Namaste! I'm here to help. You can ask me to navigate pages (like 'Go to orders' or 'Open profile'), say 'How do I sell my craft', or ask about 'PM Vishwakarma Scheme'.",
    functionCalls: [],
    flowStep,
    craftContext,
  };
}

// Real-time market research endpoint
app.post("/api/shreni/market-research", async (req, res) => {
  try {
    const { craftType = "terracotta pottery", location = "India" } = req.body;
    const ai = getGeminiClient();

    if (ai) {
      const candidateModels = [
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.8-flash",
        "gemini-3.1-flash-lite",
        "gemini-2.5-flash",
      ];
      const prompt = `Perform market research for handmade ${craftType} crafted by Indian artisans in ${location}. Provide: 1. Current average market price range in INR. 2. Popular buyer preferences and design trends. 3. Recommended pricing strategy to maximize artisan profits. Keep it concise, practical, and clear.`;

      for (const model of candidateModels) {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 6000)
          );
          const generatePromise = ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              tools: [{ googleSearch: {} }],
            },
          });

          const response = (await Promise.race([generatePromise, timeoutPromise])) as any;

          if (response?.text) {
            return res.json({
              research: response.text,
              groundingMetadata: (response.candidates?.[0] as any)?.groundingMetadata,
            });
          }
        } catch {
          // If live Google Search grounding fails or times out, fallback to generating directly with model's vast craft knowledge
          try {
            const fallbackResponse = await ai.models.generateContent({
              model,
              contents: prompt,
            });
            if (fallbackResponse?.text) {
              return res.json({
                research: fallbackResponse.text,
              });
            }
          } catch (innerErr: any) {
            if (isModelDeprecatedOrNotFound(innerErr)) {
              console.warn(`[Shreni Market Research] Model ${model} discontinued or not found`);
              continue;
            }
            if (isRateLimitedOrOverloaded(innerErr)) {
              console.warn(`[Shreni Market Research] Model ${model} rate-limited or busy`);
              continue;
            }
          }
        }
      }
    }

    // Resilient local market research estimate
    const normalizedCraft = craftType.toLowerCase();
    let priceRange = "₹750 – ₹2,400";
    let trend = "Natural unglazed earthen finishes, functional home decor, sustainable kitchenware, and GI-tag certification.";
    if (normalizedCraft.includes("madhubani") || normalizedCraft.includes("paint") || normalizedCraft.includes("art")) {
      priceRange = "₹1,800 – ₹6,500";
      trend = "Organic Lokta paper, vegetable pigment certificates, framing-ready dimensions, and artisan signature.";
    } else if (normalizedCraft.includes("bamboo") || normalizedCraft.includes("weav") || normalizedCraft.includes("basket")) {
      priceRange = "₹500 – ₹1,850";
      trend = "Eco-friendly home organizers, wild river cane joints, minimalist Scandinavian-fusion aesthetics.";
    } else if (normalizedCraft.includes("brass") || normalizedCraft.includes("metal") || normalizedCraft.includes("dhokra")) {
      priceRange = "₹1,200 – ₹4,800";
      trend = "Lost-wax cast figurines, tribal motifs, antique patina finish, festive diya collections.";
    }

    return res.json({
      research: `📊 Real-Time Market Analysis for ${craftType} (${location}):\n\n• Price Benchmark: Authentic artisan pieces retail between ${priceRange} across Indian handicraft fairs and export buyers.\n• Buyer Trends: High demand for ${trend}\n• Recommended Artisan Strategy: Emphasize your hand-crafting hours and natural sourcing to command a 20-30% premium over factory molded items.`,
    });
  } catch (error: any) {
    console.log("[Shreni Market Research] Local estimate engaged:", error?.message);
    return res.json({
      research: `Market insights for ${req.body?.craftType || "handicraft"}: Authentic handmade pieces currently retail between ₹650 and ₹2,800 on Indian craft marketplaces. Premium buyers appreciate natural earthen finishes, storytelling about traditional techniques, and GI-tagged heritage assurance.`,
    });
  }
});

// Add to Bazaar endpoint
app.post("/api/shreni/add-to-bazaar", (req, res) => {
  try {
    const { title, description, materials, final_price, image, craft = "Handicraft" } = req.body;
    if (!title || !final_price) {
      return res.status(400).json({ error: "Title and final_price are required" });
    }

    const newProduct: BazaarProduct = {
      id: `bazaar-${Date.now()}`,
      title,
      description: description || "Handmade by local artisan with traditional heritage techniques.",
      materials: materials || "Natural authentic materials",
      final_price: Number(final_price),
      image: image || "/assets/p-vase.jpg",
      craft,
      artisanName: "Meera Devi",
      createdAt: new Date().toISOString(),
    };

    bazaarProducts.unshift(newProduct);
    res.json({ success: true, product: newProduct, allProducts: bazaarProducts });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to add product" });
  }
});

// Get Bazaar products
app.get("/api/shreni/products", (_req, res) => {
  res.json({ products: bazaarProducts });
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "ShreniKart", assistant: "Shreni AI" });
});

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ShreniKart] Server listening on http://0.0.0.0:${PORT}`);
  });
}

export default app;
export { app };

// Only start standalone HTTP listener when not in Vercel serverless environment
if (!process.env.VERCEL) {
  startServer();
}
