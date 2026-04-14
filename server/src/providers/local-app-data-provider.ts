import { demoPosterRecords } from "../data/demo-content";
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

export function createLocalAppDataProvider(database: LocalDatabase) {
  return {
    async generateWorkspace(input: { generation: WorkspaceGenerationInput; user: AuthenticatedUser }): Promise<ProviderResult<WorkspaceGenerationResponse>> {
      if (input.user.kind !== "local") {
        throw new Error("本地兜底链路只支持 local JWT 用户");
      }

      const poster = demoPosterRecords.find((entry) => entry.id === input.generation.posterId) ?? null;

      if (!poster) {
        throw new Error("参考海报不存在");
      }

      const results = buildWorkspaceResults({
        generation: input.generation,
        poster,
        userId: input.user.id
      });

      const record = database.createGenerationRecord({
        mode: input.generation.mode,
        outputCount: results.length,
        posterId: poster.id,
        prompt: input.generation.prompt,
        sourceOrigin: input.generation.sourceOrigin ?? "workspace",
        status: "succeeded",
        userId: input.user.id
      });

      if (input.generation.mode === "draw") {
        const firstModule = input.generation.selectedModules[0] ?? null;
        database.createGenerationDrawInput({
          aspectRatioValue: firstModule ? poster.attributes.ratio : null,
          characterValue: firstModule ? poster.attributes.character : null,
          compositionValue: firstModule ? poster.attributes.composition : null,
          generationId: record.id,
          moodValue: firstModule ? poster.attributes.mood : null,
          selectedModules: input.generation.selectedModules,
          styleValue: firstModule ? poster.attributes.style : null,
          toneValue: firstModule ? poster.attributes.tone : null,
          weights: input.generation.moduleWeights
        });
      }

      results.forEach((result, index) => {
        database.createGenerationOutput({
          generationId: record.id,
          height: 1600,
          imageUrl: result.imageUrl,
          outputOrder: index,
          summary: result.summary,
          title: result.title,
          width: 1200
        });
      });

      return {
        data: {
          insight:
            input.generation.mode === "chat"
              ? `我把参考海报《${poster.title}》的题材气质拆成了新的叙事方向，建议优先强化“${poster.attributes.mood}”与“${poster.attributes.composition}”。`
              : `AI Draw 已根据你选中的模块生成首轮占位结果。当前重点保留“${poster.attributes.style}”和“${poster.attributes.tone}”的视觉语言。`,
          results,
          source: "local-db",
          task: {
            appliedModules: input.generation.selectedModules,
            id: record.id,
            mode: input.generation.mode,
            moduleWeights: input.generation.moduleWeights,
            posterId: poster.id,
            posterTitle: poster.title,
            prompt: input.generation.prompt,
            status: "succeeded",
            submittedAt: record.createdAt
          }
        },
        source: "local-db"
      };
    },
    async getHistoryRecord(input: { historyId: string; user: AuthenticatedUser }): Promise<ProviderResult<HistoryRecordDetail | null>> {
      if (input.user.kind !== "local") {
        return {
          data: null,
          source: "local-db"
        };
      }

      return {
        data: database.getGenerationRecord({
          generationId: input.historyId,
          userId: input.user.id
        }),
        source: "local-db"
      };
    },
    async getHistoryRecords(user: AuthenticatedUser): Promise<ProviderResult<HistoryRecord[]>> {
      if (user.kind !== "local") {
        return {
          data: [],
          source: "local-db"
        };
      }

      return {
        data: database.getHistoryRecords(user.id),
        source: "local-db"
      };
    },
    async getPosterById(id: string): Promise<ProviderResult<PosterRecord | null>> {
      return {
        data: demoPosterRecords.find((poster) => poster.id === id) ?? null,
        source: "local-demo"
      };
    },
    async getPosters(): Promise<ProviderResult<PosterRecord[]>> {
      return {
        data: demoPosterRecords,
        source: "local-demo"
      };
    },
    async getProfile(user: AuthenticatedUser): Promise<ProviderResult<UserProfileRecord>> {
      if (user.kind !== "local") {
        throw new Error("本地兜底链路只支持 local JWT 用户");
      }

      const localUser = database.getUserById(user.id);

      if (!localUser) {
        throw new Error("用户不存在");
      }

      return {
        data: {
          createdAt: localUser.createdAt,
          displayName: localUser.name,
          email: localUser.email,
          id: localUser.id,
          name: localUser.name
        },
        source: "local-db"
      };
    },
    async getUserSettings(user: AuthenticatedUser): Promise<ProviderResult<UserSettingsRecord>> {
      if (user.kind !== "local") {
        throw new Error("本地兜底链路只支持 local JWT 用户");
      }

      const localUser = database.getUserById(user.id);

      if (!localUser) {
        throw new Error("用户不存在");
      }

      return {
        data: database.ensureUserSettings(localUser),
        source: "local-db"
      };
    },
    async updateUserSettings(input: {
      settings: UserSettingsInput;
      user: AuthenticatedUser;
    }): Promise<ProviderResult<UserSettingsRecord>> {
      if (input.user.kind !== "local") {
        throw new Error("本地兜底链路只支持 local JWT 用户");
      }

      return {
        data: database.updateUserSettings(input.user.id, input.settings),
        source: "local-db"
      };
    }
  };
}

function buildWorkspaceResults(input: {
  generation: WorkspaceGenerationInput;
  poster: PosterRecord;
  userId: number;
}) {
  const posterPool = [input.poster, ...demoPosterRecords.filter((poster) => poster.id !== input.poster.id)].slice(0, 4);

  const appliedModulesText =
    input.generation.mode === "draw"
      ? input.generation.selectedModules.length > 0
        ? `已融合 ${input.generation.selectedModules.length} 个模块：${input.generation.selectedModules.join("、")}`
        : "当前以参考海报整体风格为主导"
      : `围绕《${input.poster.title}》的叙事气质生成新的创意方向`;

  return posterPool.map((poster, index) => ({
    id: `result-${input.generation.mode}-${input.poster.id}-${input.userId}-${index + 1}`,
    imageUrl: poster.imageUrl,
    summary:
      index === 0
        ? `${appliedModulesText}，优先输出一版更贴近参考海报气质的电影海报。`
        : index === 1
          ? `在保留原始世界观的前提下，增强 ${input.poster.genre} 题材的商业传播感。`
          : index === 2
            ? `作为第三版探索输出，尝试拉开角色和场景的戏剧张力，提高提案差异化。`
            : `第四版会进一步压缩无效元素，强化画面的传播性和主视觉记忆点。`,
    title: `${input.poster.title} - ${input.generation.mode === "chat" ? "对话提案" : "参数方案"} ${index + 1}`
  }));
}
