import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { AuthenticatedUser } from "../domain/app-data.js";
import { verifyToken } from "../lib/token.js";

export type AuthRequest = Request & {
  authUser?: AuthenticatedUser;
};

export function getAuthUser(req: Request) {
  return (req as AuthRequest).authUser;
}

export function createAuthMiddleware(input: {
  jwtSecret: string;
  supabaseServiceRoleKey: string;
  supabaseUrl: string;
}): RequestHandler {
  const supabase =
    input.supabaseUrl && input.supabaseServiceRoleKey
      ? createClient(input.supabaseUrl, input.supabaseServiceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })
      : null;

  return function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      res.status(401).json({ message: "缺少登录令牌" });
      return;
    }

    const token = authorization.slice(7);

    void resolveAuthUser({ jwtSecret: input.jwtSecret, supabase, token })
      .then((authUser) => {
        if (!authUser) {
          res.status(401).json({ message: "登录令牌无效或已过期" });
          return;
        }

        (req as AuthRequest).authUser = authUser;
        next();
      })
      .catch((error: unknown) => {
        console.error(error);
        res.status(401).json({ message: "登录令牌无效或已过期" });
      });
  };
}

async function resolveAuthUser(input: {
  jwtSecret: string;
  supabase: SupabaseClient | null;
  token: string;
}): Promise<AuthenticatedUser | null> {
  if (input.supabase) {
    const { data, error } = await input.supabase.auth.getUser(input.token);

    if (!error && data.user) {
      return normalizeSupabaseUser(data.user);
    }
  }

  try {
    const payload = verifyToken(input.token, input.jwtSecret);
    return {
      createdAt: new Date().toISOString(),
      email: "",
      id: payload.userId,
      kind: "local",
      name: ""
    };
  } catch {
    return null;
  }
}

function normalizeSupabaseUser(user: { created_at?: string; email?: string | null; id: string; user_metadata?: Record<string, unknown> | null }) {
  const email = user.email ?? "";
  const metadata = user.user_metadata ?? {};
  const displayName =
    typeof metadata.display_name === "string" && metadata.display_name.trim().length > 0
      ? metadata.display_name.trim()
      : typeof metadata.name === "string" && metadata.name.trim().length > 0
        ? metadata.name.trim()
        : normalizeNameFromEmail(email);

  return {
    createdAt: user.created_at ?? new Date().toISOString(),
    email,
    id: user.id,
    kind: "supabase" as const,
    name: displayName
  };
}

function normalizeNameFromEmail(email: string) {
  const localPart = email.split("@")[0] ?? "";
  return localPart.trim().length > 0 ? localPart : "MoviePainter User";
}
