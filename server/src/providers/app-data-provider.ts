import type {
  AuthenticatedUser,
  HistoryRecord,
  HistoryRecordDetail,
  PosterRecord,
  ProviderResult,
  UserProfileRecord,
  UserSettingsInput,
  UserSettingsRecord,
  WorkspaceAssetRecordInput,
  WorkspaceAssetRecordResponse,
  WorkspaceGenerationInput,
  WorkspaceGenerationResponse
} from "../domain/app-data.js";
import type { LocalDatabase } from "../lib/local-database.js";
import type { AicanapiImageGeneratorConfig } from "../services/aicanapi-image-generator.js";
import { createLocalAppDataProvider } from "./local-app-data-provider.js";
import { createSupabaseAppDataProvider } from "./supabase-app-data-provider.js";

export type AppDataProvider = {
  generateWorkspace: (input: { generation: WorkspaceGenerationInput; user: AuthenticatedUser }) => Promise<ProviderResult<WorkspaceGenerationResponse>>;
  getHistoryRecord: (input: { historyId: string; user: AuthenticatedUser }) => Promise<ProviderResult<HistoryRecordDetail | null>>;
  getHistoryRecords: (user: AuthenticatedUser) => Promise<ProviderResult<HistoryRecord[]>>;
  getPosterById: (id: string) => Promise<ProviderResult<PosterRecord | null>>;
  getPosters: () => Promise<ProviderResult<PosterRecord[]>>;
  getProfile: (user: AuthenticatedUser) => Promise<ProviderResult<UserProfileRecord>>;
  getUserSettings: (user: AuthenticatedUser) => Promise<ProviderResult<UserSettingsRecord>>;
  recordWorkspaceAsset: (input: { asset: WorkspaceAssetRecordInput; user: AuthenticatedUser }) => Promise<ProviderResult<WorkspaceAssetRecordResponse>>;
  updateUserSettings: (input: { settings: UserSettingsInput; user: AuthenticatedUser }) => Promise<ProviderResult<UserSettingsRecord>>;
};

type CreateAppDataProviderInput = {
  imageGeneratorConfig: AicanapiImageGeneratorConfig;
  database: LocalDatabase;
  supabaseServiceRoleKey: string;
  supabaseUrl: string;
};

export function createAppDataProvider(input: CreateAppDataProviderInput): AppDataProvider {
  const localProvider = createLocalAppDataProvider({
    database: input.database,
    imageGeneratorConfig: input.imageGeneratorConfig
  });

  if (!input.supabaseUrl || !input.supabaseServiceRoleKey) {
    return localProvider;
  }

  return createSupabaseAppDataProvider({
    fallback: localProvider,
    imageGeneratorConfig: input.imageGeneratorConfig,
    supabaseServiceRoleKey: input.supabaseServiceRoleKey,
    supabaseUrl: input.supabaseUrl
  });
}
