import { demoHistoryRecords, demoPosterRecords } from "./demo-content";
import type { PosterRecord, WorkspaceMode } from "../domain/app-data";

const adminUsers = [
  {
    email: "ops@moviepainter.ai",
    id: "user-admin-001",
    lastActiveAt: "2026-04-10 14:25",
    name: "内容运营负责人",
    role: "admin",
    status: "active"
  },
  {
    email: "editor@moviepainter.ai",
    id: "user-editor-002",
    lastActiveAt: "2026-04-10 13:40",
    name: "海报编辑",
    role: "editor",
    status: "active"
  },
  {
    email: "tagger@moviepainter.ai",
    id: "user-editor-003",
    lastActiveAt: "2026-04-09 20:18",
    name: "标签策展",
    role: "editor",
    status: "invited"
  },
  {
    email: "member@moviepainter.ai",
    id: "user-member-004",
    lastActiveAt: "2026-04-10 12:05",
    name: "内部测试用户",
    role: "user",
    status: "active"
  }
] as const;

export function createAdminDashboardResponse() {
  const tagItems = Array.from(new Set(demoPosterRecords.flatMap((poster) => poster.tags))).map((tag, index) => ({
    group: inferTagGroup(tag),
    id: `tag-${index + 1}`,
    name: tag,
    status: index % 5 === 0 ? "draft" : "active",
    usageCount: demoPosterRecords.filter((poster) => poster.tags.includes(tag)).length
  }));

  const posters = demoPosterRecords.map((poster, index) => ({
    coverImageUrl: poster.imageUrl,
    genre: poster.genre,
    id: poster.id,
    recommended: index % 2 === 0,
    region: poster.region,
    status: index % 4 === 0 ? "draft" : "published",
    title: poster.title,
    updatedAt: `2026-04-${String(10 - (index % 4)).padStart(2, "0")} ${String(10 + index).padStart(2, "0")}:30`
  }));

  const recommendations = demoPosterRecords.slice(0, 4).map((poster, index) => ({
    id: `recommend-${index + 1}`,
    posterId: poster.id,
    slot: ["landing_hero", "library_top_pick", "workspace_inspiration", "editorial_focus"][index] ?? "custom_slot",
    status: index === 0 ? "online" : index === 1 ? "scheduled" : "draft",
    title: `${poster.title} 推荐位`,
    updatedAt: `2026-04-${String(10 - index).padStart(2, "0")} 09:15`
  }));

  return {
    dashboard: {
      posters,
      recommendations,
      summary: {
        activeUsers: adminUsers.filter((user) => user.status === "active").length,
        curatedPosters: demoPosterRecords.length,
        pendingReviews: posters.filter((poster) => poster.status === "draft").length,
        recommendations: recommendations.length,
        tags: tagItems.length
      },
      tags: tagItems,
      users: adminUsers
    },
    source: "local-demo" as const
  };
}

export function createWorkspaceGenerationResponse(input: {
  mode: WorkspaceMode;
  moduleWeights: Record<string, number>;
  poster: PosterRecord;
  prompt: string;
  selectedModules: string[];
  userId: number;
}) {
  const posterPool = [
    input.poster,
    ...demoPosterRecords.filter((poster) => poster.id !== input.poster.id)
  ].slice(0, 4);

  const appliedModulesText =
    input.mode === "draw"
      ? input.selectedModules.length > 0
        ? `已融合 ${input.selectedModules.length} 个模块：${input.selectedModules.join("、")}`
        : "当前以参考海报整体风格为主导"
      : `围绕《${input.poster.title}》的叙事气质生成新的创意方向`;

  return {
    insight:
      input.mode === "chat"
        ? `我把参考海报《${input.poster.title}》的题材气质拆成了新的叙事方向，建议优先强化“${input.poster.attributes.mood}”与“${input.poster.attributes.composition}”。`
        : `AI Draw 已根据你选中的模块生成首轮占位结果。当前重点保留“${input.poster.attributes.style}”和“${input.poster.attributes.tone}”的视觉语言。`,
    results: posterPool.map((poster, index) => ({
      id: `result-${input.mode}-${input.poster.id}-${index + 1}`,
      imageUrl: poster.imageUrl,
      summary:
        index === 0
          ? `${appliedModulesText}，优先输出一版更贴近参考海报气质的电影海报。`
          : index === 1
            ? `在保留原始世界观的前提下，增强 ${input.poster.genre} 题材的商业传播感。`
            : index === 2
              ? `作为第三版探索输出，尝试拉开角色和场景的戏剧张力，提高提案差异化。`
              : `第四版会进一步压缩无效元素，强化画面的传播性和主视觉记忆点。`,
      title: `${input.poster.title} - ${input.mode === "chat" ? "对话提案" : "参数方案"} ${index + 1}`
    })),
    source: "local-demo" as const,
    task: {
      appliedModules: input.selectedModules,
      id: `task-${input.userId}-${Date.now()}`,
      mode: input.mode,
      moduleWeights: input.moduleWeights,
      posterId: input.poster.id,
      posterTitle: input.poster.title,
      prompt: input.prompt,
      status: "succeeded" as const,
      submittedAt: new Date().toISOString()
    }
  };
}

function inferTagGroup(tag: string) {
  const lowerTag = tag.toLowerCase();

  if (lowerTag.includes("neo") || lowerTag.includes("romance") || lowerTag.includes("fantasy")) {
    return "风格";
  }

  if (lowerTag.includes("rain") || lowerTag.includes("dust") || lowerTag.includes("晨光")) {
    return "氛围";
  }

  if (lowerTag.includes("wide") || lowerTag.includes("reflection") || lowerTag.includes("set")) {
    return "构图";
  }

  return "主题";
}
