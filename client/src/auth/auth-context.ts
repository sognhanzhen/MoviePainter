import { createContext } from "react";
import type { AuthStatus, CurrentUser } from "./AuthProvider";

type AuthContextValue = {
  login: (email: string, password: string) => Promise<CurrentUser>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<CurrentUser>;
  status: AuthStatus;
  token: string;
  user: CurrentUser | null;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
