import type {
  AuthenticatedUser,
  HistoryRecord,
  HistoryRecordDetail,
  PosterRecord,
  ProviderResult,
  UserProfileRecord,
  UserSettingsInput,
  UserSettingsRecord,
  WorkspaceGenerationInput,
  WorkspaceGenerationResponse
} from "../domain/app-data";
import type { LocalDatabase } from "../lib/local-database";
import { createLocalAppDataProvider } from "./local-app-data-provider";
import { createSupabaseAppDataProvider } from "./supabase-app-data-provider";

export type AppDataProvider = {
  generateWorkspace: (input: { generation: WorkspaceGenerationInput; user: AuthenticatedUser }) => Promise<ProviderResult<WorkspaceGenerationResponse>>;
  getHistoryRecord: (input: { historyId: string; user: AuthenticatedUser }) => Promise<ProviderResult<HistoryRecordDetail | null>>;
  getHistoryRecords: (user: AuthenticatedUser) => Promise<ProviderResult<HistoryRecord[]>>;
  getPosterById: (id: string) => Promise<ProviderResult<PosterRecord | null>>;
  getPosters: () => Promise<ProviderResult<PosterRecord[]>>;
  getProfile: (user: AuthenticatedUser) => Promise<ProviderResult<UserProfileRecord>>;
  getUserSettings: (user: AuthenticatedUser) => Promise<ProviderResult<UserSettingsRecord>>;
  updateUserSettings: (input: { settings: UserSettingsInput; user: AuthenticatedUser }) => Promise<ProviderResult<UserSettingsRecord>>;
};

type CreateAppDataProviderInput = {
  database: LocalDatabase;
  supabaseServiceRoleKey: string;
  supabaseUrl: string;
};

export function createAppDataProvider(input: CreateAppDataProviderInput): AppDataProvider {
  const localProvider = createLocalAppDataProvider(input.database);

  if (!input.supabaseUrl || !input.supabaseServiceRoleKey) {
    return localProvider;
  }

  return createSupabaseAppDataProvider({
    fallback: localProvider,
    supabaseServiceRoleKey: input.supabaseServiceRoleKey,
    supabaseUrl: input.supabaseUrl
  });
}
