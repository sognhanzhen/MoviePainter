import { createClient, type Session, type SupabaseClient, type User } from "@supabase/supabase-js";
import { runtimeConfig } from "./runtime-config";

const SUPABASE_URL = runtimeConfig.supabaseUrl;
const SUPABASE_PUBLISHABLE_KEY = runtimeConfig.supabasePublishableKey || runtimeConfig.supabaseAnonKey;

let supabaseClient: SupabaseClient | null = null;

export type AuthIdentity = {
  createdAt: string;
  email: string;
  id: string;
  name: string;
};

export function hasSupabaseAuthConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

export function getSupabaseClient() {
  if (!hasSupabaseAuthConfig()) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        storageKey: "moviepainter-supabase-auth"
      }
    });
  }

  return supabaseClient;
}

export function mapSupabaseUser(user: User): AuthIdentity {
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const name =
    typeof metadata?.name === "string" && metadata.name.trim()
      ? metadata.name.trim()
      : typeof metadata?.display_name === "string" && metadata.display_name.trim()
        ? metadata.display_name.trim()
        : user.email?.split("@")[0] ?? "MoviePainter User";

  return {
    createdAt: user.created_at ?? new Date().toISOString(),
    email: user.email ?? "",
    id: user.id,
    name
  };
}

export function mapSupabaseSession(session: Session | null): AuthIdentity | null {
  return session?.user ? mapSupabaseUser(session.user) : null;
}
