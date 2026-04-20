import { startTransition, useEffect, useState, type ReactNode } from "react";
import { AuthContext } from "./auth-context";
import { clearSavedToken, getSavedToken, loginRequest, registerRequest, saveToken } from "../lib/api";
import { getSupabaseClient, mapSupabaseSession, type AuthIdentity } from "../lib/supabase-auth";

export type AuthStatus = "loading" | "guest" | "authenticated";

export type CurrentUser = AuthIdentity;

type AuthProviderProps = {
  children: ReactNode;
};

function normalizeApiUser(user: { createdAt?: string; email: string; id: number | string; name: string }): CurrentUser {
  return {
    createdAt: user.createdAt ?? new Date().toISOString(),
    email: user.email,
    id: String(user.id),
    name: user.name
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const supabaseClient = getSupabaseClient();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [token, setToken] = useState(() => (supabaseClient ? "" : getSavedToken()));
  const [user, setUser] = useState<CurrentUser | null>(null);

  async function refreshProfile(nextToken = token) {
    if (!nextToken) {
      return;
    }

    const profile = await loginRequest.getProfile(nextToken);
    setUser(normalizeApiUser(profile.user));
    setStatus("authenticated");
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setStatus("loading");

      if (!supabaseClient) {
        const savedToken = getSavedToken();

        if (!savedToken) {
          setToken("");
          setUser(null);
          setStatus("guest");
          return;
        }

        try {
          const profile = await loginRequest.getProfile(savedToken);

          if (cancelled) {
            return;
          }

          setToken(savedToken);
          setUser(normalizeApiUser(profile.user));
          setStatus("authenticated");
        } catch {
          if (cancelled) {
            return;
          }

          clearSavedToken();
          setToken("");
          setUser(null);
          setStatus("guest");
        }

        return;
      }

      try {
        const { data } = await supabaseClient.auth.getSession();

        if (cancelled) {
          return;
        }

        const sessionToken = data.session?.access_token ?? "";
        const sessionUser = mapSupabaseSession(data.session);

        if (sessionUser && sessionToken) {
          setToken(sessionToken);
          setStatus("authenticated");

          try {
            const profile = await loginRequest.getProfile(sessionToken);

            if (cancelled) {
              return;
            }

            setUser(normalizeApiUser(profile.user));
          } catch {
            if (cancelled) {
              return;
            }

            setUser(sessionUser);
          }

          return;
        }

        setToken("");
        setUser(null);
        setStatus("guest");
      } catch {
        if (cancelled) {
          return;
        }

        setToken("");
        setUser(null);
        setStatus("guest");
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [supabaseClient]);

  useEffect(() => {
    if (!supabaseClient) {
      return;
    }

    const { data: subscription } = supabaseClient.auth.onAuthStateChange((event, session) => {
      const sessionToken = session?.access_token ?? "";

      if (event === "SIGNED_OUT") {
        clearSavedToken();
        setToken("");
        setUser(null);
        setStatus("guest");
        return;
      }

      const nextUser = mapSupabaseSession(session);

      if (nextUser) {
        setToken(sessionToken);
        setUser(nextUser);
        setStatus("authenticated");
        return;
      }

      setToken("");
      setUser(null);
      setStatus("guest");
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [supabaseClient]);

  async function login(email: string, password: string) {
    if (!supabaseClient) {
      const data = await loginRequest.login({ email, password });
      saveToken(data.token);

      startTransition(() => {
        setToken(data.token);
      });

      const normalizedUser = normalizeApiUser({
        createdAt: data.user.createdAt,
        email: data.user.email,
        id: data.user.id,
        name: data.user.name
      });

      setUser(normalizedUser);
      setStatus("authenticated");
      return normalizedUser;
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
      throw error;
    }

    const nextUser = mapSupabaseSession(data.session);
    const nextToken = data.session?.access_token ?? "";

    if (!nextUser || !nextToken) {
      throw new Error("Supabase sign-in succeeded, but no session information was returned.");
    }

    setToken(nextToken);
    setUser(nextUser);
    setStatus("authenticated");

    try {
      const profile = await loginRequest.getProfile(nextToken);
      const normalizedUser = normalizeApiUser(profile.user);
      setUser(normalizedUser);
      return normalizedUser;
    } catch {
      return nextUser;
    }
  }

  async function register(name: string, email: string, password: string) {
    if (!supabaseClient) {
      const data = await registerRequest.register({ name, email, password });
      saveToken(data.token);

      startTransition(() => {
        setToken(data.token);
      });

      const normalizedUser = normalizeApiUser({
        createdAt: data.user.createdAt,
        email: data.user.email,
        id: data.user.id,
        name: data.user.name
      });

      setUser(normalizedUser);
      setStatus("authenticated");
      return normalizedUser;
    }

    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name,
          name
        }
      }
    });

    if (error) {
      throw error;
    }

    let session = data.session;

    if (!session) {
      const signInResult = await supabaseClient.auth.signInWithPassword({ email, password });

      if (signInResult.error) {
        throw signInResult.error;
      }

      session = signInResult.data.session;
    }

    const nextUser = mapSupabaseSession(session);
    const nextToken = session?.access_token ?? "";

    if (!nextUser || !nextToken) {
      throw new Error("Supabase registration succeeded, but no session information was returned.");
    }

    setToken(nextToken);
    setUser(nextUser);
    setStatus("authenticated");

    try {
      const profile = await loginRequest.getProfile(nextToken);
      const normalizedUser = normalizeApiUser(profile.user);
      setUser(normalizedUser);
      return normalizedUser;
    } catch {
      return nextUser;
    }
  }

  function logout() {
    if (supabaseClient) {
      void supabaseClient.auth.signOut();
    }

    clearSavedToken();
    setToken("");
    setUser(null);
    setStatus("guest");
  }

  return (
    <AuthContext.Provider
      value={{
        login,
        logout,
        refreshProfile,
        register,
        status,
        token,
        user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
