/**
 * Universal Server Function adapter for client & server contexts.
 * Executes seamlessly in client-side Vite SPA and backend environments.
 */

export function createServerFn(_opts?: { method?: string }) {
  let validator: ((input: any) => any) | null = null;

  const builder = {
    middleware(_mws: any[]) {
      return builder;
    },
    inputValidator(v: (input: any) => any) {
      validator = v;
      return builder;
    },
    handler<R>(handlerFn: (args: { data: any; context: any }) => Promise<R>) {
      const fn = async (args?: any): Promise<R> => {
        let validatedData = args?.data;
        if (validator) {
          validatedData = validator(args?.data);
        }
        let supabaseClient: any = null;
        let userId = "artisan-demo-user-1";
        try {
          const { supabase } = await import("@/integrations/supabase/client");
          supabaseClient = supabase;
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user?.id) {
            userId = data.session.user.id;
          }
        } catch {
          // ignore error in non-supabase mode
        }
        const context = { supabase: supabaseClient, userId };
        return handlerFn({ data: validatedData, context });
      };
      return fn;
    },
  };

  return builder;
}

export function useServerFn<T = any, R = any>(fn: any): any {
  return fn;
}
