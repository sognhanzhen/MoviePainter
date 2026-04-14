export type AppDataSource = "local-db" | "local-demo" | "supabase";

export type WorkspaceMode = "chat" | "draw";

export type AuthenticatedUser =
  | {
      createdAt: string;
      email: string;
      id: number;
      kind: "local";
      name: string;
    }
  | {
      avatarUrl?: string | null;
      createdAt: string;
      email: string;
      id: string;
      kind: "supabase";
      name: string;
      role?: "user" | "editor" | "admin";
      status?: "active" | "invited" | "disabled";
    };

export type PosterRecord = {
  attributes: {
    character: string;
    composition: string;
    mood: string;
    ratio: string;
    style: string;
    tone: string;
  };
  description: string;
  genre: string;
  id: string;
  imageUrl: string;
  layout: "featured" | "square" | "tall" | "wide";
  region: string;
  summary: string;
  tags: string[];
  title: string;
  year: string;
};

export type HistoryRecord = {
  createdAt: string;
  id: string;
  mode: WorkspaceMode;
  outputs: number;
  sourceOrigin?: string;
  posterId: string;
  prompt: string;
  errorMessage?: string | null;
  status: "failed" | "running" | "succeeded" | "waiting";
};

export type HistoryOutputRecord = {
  createdAt: string;
  height?: number | null;
  id: string;
  imageUrl: string;
  outputOrder: number;
  summary: string | null;
  thumbnailUrl?: string | null;
  title: string | null;
  width?: number | null;
};

export type HistoryDrawInputRecord = {
  aspectRatioValue: string | null;
  characterValue: string | null;
  compositionValue: string | null;
  createdAt: string;
  generationId: string;
  id: string;
  moodValue: string | null;
  selectedModules: string[];
  styleValue: string | null;
  toneValue: string | null;
  updatedAt: string;
  weights: Record<string, number>;
};

export type HistoryRecordDetail = HistoryRecord & {
  drawInputs: HistoryDrawInputRecord | null;
  outputsDetail: HistoryOutputRecord[];
};

export type UserSettingsRecord = {
  displayName: string;
  language: string;
  notificationEnabled: boolean;
  preferredDefaultMode: WorkspaceMode;
  updatedAt: string;
};

export type UserSettingsInput = {
  displayName: string;
  language: string;
  notificationEnabled: boolean;
  preferredDefaultMode: WorkspaceMode;
};

export type UserProfileRecord = {
  avatarUrl?: string | null;
  createdAt: string;
  displayName: string;
  email: string;
  id: string | number;
  name: string;
  role?: "user" | "editor" | "admin";
  status?: "active" | "invited" | "disabled";
  updatedAt?: string;
};

export type WorkspaceGenerationInput = {
  mode: WorkspaceMode;
  moduleWeights: Record<string, number>;
  posterId: string;
  prompt: string;
  selectedModules: string[];
  sourceOrigin?: string;
};

export type WorkspaceGenerationTask = {
  appliedModules: string[];
  id: string;
  mode: WorkspaceMode;
  moduleWeights: Record<string, number>;
  posterId: string;
  posterTitle: string;
  prompt: string;
  status: "succeeded";
  submittedAt: string;
};

export type WorkspaceGeneratedResult = {
  id: string;
  imageUrl: string;
  summary: string;
  title: string;
};

export type WorkspaceGenerationResponse = {
  insight: string;
  results: WorkspaceGeneratedResult[];
  source: AppDataSource;
  task: WorkspaceGenerationTask;
};

export type ProviderResult<T> = {
  data: T;
  source: AppDataSource;
};
