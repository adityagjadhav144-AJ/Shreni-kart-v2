import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { brokeredPreviewStorage } from './previewAuthStorage';

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }

    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

// Local mock storage for demo / offline operation without Supabase credentials
const LOCAL_SESSION_KEY = 'kalakart_mock_session';
const LOCAL_PROFILE_KEY = 'kalakart_mock_profile';

const defaultMockProfile = {
  id: "artisan-demo-user-1",
  full_name: "Meera Devi",
  mobile: "9876543210",
  email: "9876543210@artisan.craftlink.app",
  preferred_language: "en",
  artisan_name: "Meera Terracotta Crafts",
  craft_category: "Pottery",
  experience_years: 12,
  village: "Bishnupur",
  district: "Bankura",
  state: "West Bengal",
  profile_complete: true,
  verification_status: "verified",
  verification_method: "Demo Aadhaar e-KYC",
  verified_at: new Date().toISOString(),
};

function getMockProfile() {
  try {
    const saved = localStorage.getItem(LOCAL_PROFILE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  return defaultMockProfile;
}

function saveMockProfile(profile: any) {
  try {
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // fallback
  }
}

function getMockSession() {
  try {
    const saved = localStorage.getItem(LOCAL_SESSION_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  return null;
}

function saveMockSession(session: any) {
  try {
    if (session) {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    }
  } catch {
    // fallback
  }
}

// Subscribers for mock auth state changes
const authSubscribers = new Set<(event: string, session: any) => void>();

function notifyAuthChange(event: string, session: any) {
  saveMockSession(session);
  for (const sub of authSubscribers) {
    try {
      sub(event, session);
    } catch (err) {
      console.error(err);
    }
  }
}

function createMockSupabaseClient(): any {
  console.info('[Supabase] Operating in local prototype mode. Database and Auth running locally.');

  return {
    auth: {
      async getSession() {
        return { data: { session: getMockSession() }, error: null };
      },
      async getUser() {
        const session = getMockSession();
        return { data: { user: session?.user ?? null }, error: null };
      },
      onAuthStateChange(callback: (event: string, session: any) => void) {
        authSubscribers.add(callback);
        // Dispatch current session asynchronously
        setTimeout(() => callback('INITIAL_SESSION', getMockSession()), 0);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                authSubscribers.delete(callback);
              },
            },
          },
        };
      },
      async signInWithPassword({ email, password }: any) {
        const profile = getMockProfile();
        const session = {
          user: { id: profile.id, email: email || profile.email },
          access_token: 'mock-access-token',
        };
        notifyAuthChange('SIGNED_IN', session);
        return { data: { user: session.user, session }, error: null };
      },
      async verifyOtp({ token_hash, type }: any) {
        const profile = getMockProfile();
        const session = {
          user: { id: profile.id, email: profile.email },
          access_token: 'mock-access-token',
        };
        notifyAuthChange('SIGNED_IN', session);
        return { data: { user: session.user, session }, error: null };
      },
      async signUp({ email, password, options }: any) {
        const profile = {
          ...defaultMockProfile,
          id: 'user-' + Date.now().toString(36),
          email,
          ...(options?.data || {}),
        };
        saveMockProfile(profile);
        const session = {
          user: { id: profile.id, email },
          access_token: 'mock-access-token',
        };
        notifyAuthChange('SIGNED_IN', session);
        return { data: { user: session.user, session }, error: null };
      },
      async signOut() {
        notifyAuthChange('SIGNED_OUT', null);
        return { error: null };
      },
    },
    from(table: string) {
      return {
        select(_cols?: string) {
          return {
            eq(col: string, val: any) {
              return {
                async maybeSingle() {
                  if (table === 'profiles') {
                    const prof = getMockProfile();
                    return { data: prof, error: null };
                  }
                  return { data: null, error: null };
                },
                async single() {
                  if (table === 'profiles') {
                    const prof = getMockProfile();
                    return { data: prof, error: null };
                  }
                  return { data: null, error: null };
                },
              };
            },
            async maybeSingle() {
              if (table === 'profiles') {
                return { data: getMockProfile(), error: null };
              }
              return { data: null, error: null };
            },
          };
        },
        update(values: any) {
          return {
            eq(col: string, val: any) {
              if (table === 'profiles') {
                const current = getMockProfile();
                const updated = { ...current, ...values };
                saveMockProfile(updated);
                return Promise.resolve({ data: updated, error: null });
              }
              return Promise.resolve({ data: values, error: null });
            },
          };
        },
        insert(records: any) {
          return Promise.resolve({ data: records, error: null });
        },
      };
    },
  };
}

function createSupabaseClient() {
  const SUPABASE_URL = import.meta.env['VITE_SUPABASE_URL'] || (typeof process !== 'undefined' ? process.env?.['SUPABASE_URL'] : undefined);
  const SUPABASE_PUBLISHABLE_KEY = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || (typeof process !== 'undefined' ? process.env?.['SUPABASE_PUBLISHABLE_KEY'] : undefined);

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return createMockSupabaseClient();
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
    },
    auth: {
      storage: brokeredPreviewStorage(),
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: any;

export const supabase = new Proxy({} as any, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
