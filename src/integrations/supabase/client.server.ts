import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

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

    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }

    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function createMockAdminClient(): any {
  return {
    from(_table: string) {
      return {
        select(_cols?: string) {
          return {
            eq(_col: string, _val: any) {
              return {
                async maybeSingle() {
                  return { data: { id: "artisan-demo-user-1" }, error: null };
                },
              };
            },
          };
        },
      };
    },
    auth: {
      admin: {
        async generateLink(_params: any) {
          return {
            data: {
              properties: {
                hashed_token: "mock-demo-token-hash",
              },
            },
            error: null,
          };
        },
      },
    },
  };
}

function createSupabaseAdminClient() {
  const SUPABASE_URL = typeof process !== 'undefined' ? process.env?.['SUPABASE_URL'] : undefined;
  const SUPABASE_SERVICE_ROLE_KEY = typeof process !== 'undefined' ? process.env?.['SUPABASE_SERVICE_ROLE_KEY'] : undefined;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return createMockAdminClient();
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_SERVICE_ROLE_KEY),
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let _supabaseAdmin: any;

export const supabaseAdmin = new Proxy({} as any, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  },
});
