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
  WorkspaceAssetRecordInput,
  WorkspaceAssetRecordResponse,
  WorkspaceGenerationInput,
  WorkspaceGenerationResponse
} from "../domain/app-data";
import type { LocalDatabase } from "../lib/local-database";
import { generateWorkspaceImages, type AicanapiImageGeneratorConfig } from "../services/aicanapi-image-generator";

type CreateLocalAppDataProviderInput = {
  database: LocalDatabase;
  imageGeneratorConfig: AicanapiImageGeneratorConfig;
};

export function createLocalAppDataProvider({ database, imageGeneratorConfig }: CreateLocalAppDataProviderInput) {
  return {
    async generateWorkspace(input: { generation: WorkspaceGenerationInput; user: AuthenticatedUser }): Promise<ProviderResult<WorkspaceGenerationResponse>> {
      if (input.user.kind !== "local") {
        throw new Error("本地兜底链路只支持 local JWT 用户");
      }

      const poster = demoPosterRecords.find((entry) => entry.id === input.generation.posterId) ?? buildFallbackPoster(input.generation.posterId, input.generation.prompt);

      const generated = await generateWorkspaceImages({
        config: imageGeneratorConfig,
        generation: input.generation,
        poster
      });
      const results = generated.results;

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
          height: generated.height,
          imageUrl: result.imageUrl,
          outputOrder: index,
          summary: result.summary,
          thumbnailUrl: resolvePreviewThumbnailUrl(result.imageUrl),
          title: result.title,
          width: generated.width
        });
      });

      return {
        data: {
          insight: generated.insight,
          results,
          source: "local-db",
          task: {
            appliedModules: input.generation.selectedModules,
            id: record.id,
            modelId: input.generation.modelId,
            mode: input.generation.mode,
            moduleWeights: input.generation.moduleWeights,
            posterId: poster.id,
            posterTitle: poster.title,
            prompt: input.generation.prompt,
            ratioId: input.generation.ratioId,
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
    async recordWorkspaceAsset(input: { asset: WorkspaceAssetRecordInput; user: AuthenticatedUser }): Promise<ProviderResult<WorkspaceAssetRecordResponse>> {
      if (input.user.kind !== "local") {
        throw new Error("本地兜底链路只支持 local JWT 用户");
      }

      const poster = demoPosterRecords.find((entry) => entry.id === input.asset.posterId) ?? buildFallbackPoster(input.asset.posterId, input.asset.prompt ?? "");

      const record = database.createGenerationRecord({
        mode: input.asset.mode,
        outputCount: 0,
        posterId: poster.id,
        prompt: input.asset.prompt?.trim() || buildWorkspaceAssetPrompt(input.asset, poster),
        sourceOrigin: input.asset.sourceOrigin ?? input.asset.action,
        status: "waiting",
        userId: input.user.id
      });

      return {
        data: {
          record,
          source: "local-db"
        },
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

function buildWorkspaceAssetPrompt(input: WorkspaceAssetRecordInput, poster: PosterRecord) {
  const modeLabel = input.mode === "chat" ? "AI Chat" : "AI Draw";
  const originText = input.action === "library_use" ? "从海报库" : "从生成工作区";

  return `${originText}将《${poster.title}》作为 ${modeLabel} 参考资产加入工作区。`;
}

function resolvePreviewThumbnailUrl(imageUrl: string) {
  return imageUrl.startsWith("data:") ? null : imageUrl;
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

function buildFallbackPoster(id: string, prompt: string): PosterRecord {
  return {
    id: id || "free-prompt",
    title: prompt.substring(0, 30) || "Free Prompt",
    summary: prompt || "User-defined free prompt generation without a reference poster.",
    genre: "剧情",
    year: new Date().getFullYear().toString(),
    region: "global",
    imageUrl: "",
    layout: "tall",
    tags: [],
    description: "Auto-generated fallback poster for free prompt mode.",
    attributes: {
      character: "自由创作",
      composition: "居中",
      mood: "自由",
      ratio: "2:3",
      style: "写实",
      tone: "自然"
    }
  };
}
