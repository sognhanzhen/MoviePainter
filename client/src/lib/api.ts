import type {
  AdminDashboardRecord,
  AppDataSource,
  HistoryRecord,
  HistoryRecordDetail,
  PosterRecord,
  UserSettingsInput,
  UserSettingsRecord,
  WorkspaceGenerationResponse
} from "../data/posters";
import { runtimeConfig } from "./runtime-config";

const API_BASE_URL = runtimeConfig.apiBaseUrl;
const TOKEN_KEY = "moviepainter-token";

type ApiError = {
  message?: string;
};

type AuthResponse = {
  token: string;
  user: {
    createdAt?: string;
    id: number | string;
    email: string;
    name: string;
  };
};

type ProfileResponse = {
  source?: AppDataSource;
  user: {
    id: number | string;
    email: string;
    name: string;
    createdAt: string;
  };
};

type PostersResponse = {
  posters: PosterRecord[];
  source: AppDataSource;
};

type PosterResponse = {
  poster: PosterRecord;
  source: AppDataSource;
};

type HistoryResponse = {
  records: HistoryRecord[];
  source: AppDataSource;
};

type HistoryRecordResponse = {
  record: HistoryRecordDetail;
  source: AppDataSource;
};

type SettingsResponse = {
  settings: UserSettingsRecord;
  source: AppDataSource;
};

type AdminDashboardResponse = {
  dashboard: AdminDashboardRecord;
  source: AppDataSource;
};

type RequestOptions = RequestInit & {
  token?: string;
};

async function request<T>(path: string, options?: RequestOptions): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options?.headers ?? {})
    },
    ...options
  });

  const data = (await response.json().catch(() => ({}))) as ApiError;

  if (!response.ok) {
    throw new Error(data.message ?? "Request failed");
  }

  return data as T;
}

export function getSavedToken() {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearSavedToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export const loginRequest = {
  async getProfile(token: string) {
    return request<ProfileResponse>("/profile", {
      token
    });
  },
  async login(payload: { email: string; password: string }) {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
};

export const registerRequest = {
  async register(payload: { email: string; name: string; password: string }) {
    return request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }
};

export const appDataRequest = {
  async getHistory(token: string) {
    return request<HistoryResponse>("/history", {
      token
    });
  },
  async getHistoryRecord(token: string, historyId: string) {
    return request<HistoryRecordResponse>(`/history/${historyId}`, {
      token
    });
  },
  async getPoster(token: string, posterId: string) {
    return request<PosterResponse>(`/library/posters/${posterId}`, {
      token
    });
  },
  async getPosters(token: string) {
    return request<PostersResponse>("/library/posters", {
      token
    });
  },
  async getSettings(token: string) {
    return request<SettingsResponse>("/settings", {
      token
    });
  },
  async updateSettings(token: string, payload: UserSettingsInput) {
    return request<SettingsResponse>("/settings", {
      body: JSON.stringify(payload),
      method: "PATCH",
      token
    });
  }
};

export const workspaceRequest = {
  async generate(
    token: string,
    payload: {
      mode: "chat" | "draw";
      moduleWeights: Record<string, number>;
      posterId: string;
      prompt: string;
      sourceOrigin?: string;
      selectedModules: string[];
    }
  ) {
    return request<WorkspaceGenerationResponse>("/workspace/generate", {
      body: JSON.stringify(payload),
      method: "POST",
      token
    });
  }
};

export const adminRequest = {
  async getDashboard(token: string) {
    return request<AdminDashboardResponse>("/admin/dashboard", {
      token
    });
  }
};
