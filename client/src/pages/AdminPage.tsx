import { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import type {
  AdminDashboardRecord,
  AdminPosterItem,
  AdminRecommendationItem,
  AdminTagItem,
  AdminUserItem
} from "../data/posters";
import { posterRecords } from "../data/posters";
import { adminRequest } from "../lib/api";

const roleCycle: AdminUserItem["role"][] = ["admin", "editor", "user"];
const recommendationStatusCycle: AdminRecommendationItem["status"][] = ["online", "scheduled", "draft"];

type PosterDetailDraft = {
  character: string;
  composition: string;
  description: string;
  mood: string;
  ratio: string;
  style: string;
  summary: string;
  tone: string;
};

const emptyDetailDraft: PosterDetailDraft = {
  character: "",
  composition: "",
  description: "",
  mood: "",
  ratio: "",
  style: "",
  summary: "",
  tone: ""
};

export function AdminPage() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState<AdminDashboardRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("正在加载后台管理占位数据...");
  const [activePosterId, setActivePosterId] = useState("");
  const [detailDraft, setDetailDraft] = useState<PosterDetailDraft>(emptyDetailDraft);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setMessage("正在加载后台管理占位数据...");

      try {
        const response = await adminRequest.getDashboard(token);

        if (cancelled) {
          return;
        }

        const nextDashboard = syncDashboardSummary(response.dashboard);
        setDashboard(nextDashboard);
        setActivePosterId(nextDashboard.posters[0]?.id ?? "");
        setMessage(`后台模块已从 ${response.source} 数据源加载。当前版本为可操作占位管理台。`);
      } catch (error) {
        if (cancelled) {
          return;
        }

        const fallbackDashboard = createFallbackDashboard();
        setDashboard(fallbackDashboard);
        setActivePosterId(fallbackDashboard.posters[0]?.id ?? "");
        setMessage(
          error instanceof Error
            ? `${error.message}，当前先使用本地占位后台数据。`
            : "后台数据加载失败，当前先使用本地占位后台数据。"
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (!token) {
      return;
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!activePosterId) {
      setDetailDraft(emptyDetailDraft);
      return;
    }

    const activePoster = posterRecords.find((poster) => poster.id === activePosterId);

    if (!activePoster) {
      setDetailDraft(emptyDetailDraft);
      return;
    }

    setDetailDraft({
      character: activePoster.attributes.character,
      composition: activePoster.attributes.composition,
      description: activePoster.description,
      mood: activePoster.attributes.mood,
      ratio: activePoster.attributes.ratio,
      style: activePoster.attributes.style,
      summary: activePoster.summary,
      tone: activePoster.attributes.tone
    });
  }, [activePosterId]);

  const activePoster = dashboard?.posters.find((poster) => poster.id === activePosterId) ?? null;

  return (
    <section className="space-y-6">
      <header className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-lg shadow-slate-950/6 backdrop-blur">
        <p className="text-xs tracking-[0.3em] text-sky-700 uppercase">Admin Console</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-950">后台管理模块</h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          这里先把官方精选库、海报详情、参数标签、推荐位和用户管理的后台结构搭起来。当前动作允许硬编码占位，但界面、状态和操作反馈已经成型。
        </p>
        <p className="mt-4 rounded-[1.25rem] border border-slate-900/8 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
          {message}
        </p>
      </header>

      {loading || !dashboard ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-[1.8rem] border border-white/60 bg-white/75" />
          ))}
        </section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <SummaryCard label="官方海报" value={`${dashboard.summary.curatedPosters}`} />
            <SummaryCard label="参数标签" value={`${dashboard.summary.tags}`} />
            <SummaryCard label="推荐位" value={`${dashboard.summary.recommendations}`} />
            <SummaryCard label="活跃用户" value={`${dashboard.summary.activeUsers}`} />
            <SummaryCard label="待审核" value={`${dashboard.summary.pendingReviews}`} accent />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.06fr_0.94fr]">
            <article className="rounded-[2rem] border border-white/70 bg-white/92 p-6 shadow-lg shadow-slate-950/5 backdrop-blur">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs tracking-[0.3em] text-slate-400 uppercase">Curated Library</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">官方精选海报管理</h3>
                </div>
                <p className="max-w-md text-sm leading-6 text-slate-600">
                  先管理精选海报的发布状态、推荐状态和当前编辑项，再进入右侧详情面板维护具体文案与 AI Draw 维度。
                </p>
              </div>

              <div className="mt-5 grid gap-4">
                {dashboard.posters.map((poster) => (
                  <PosterAdminCard
                    key={poster.id}
                    active={poster.id === activePosterId}
                    poster={poster}
                    onSelect={() => setActivePosterId(poster.id)}
                    onTogglePublished={() => {
                      setDashboard((current) => {
                        if (!current) {
                          return current;
                        }

                        return syncDashboardSummary({
                          ...current,
                          posters: current.posters.map((item) =>
                            item.id === poster.id
                              ? { ...item, status: item.status === "published" ? "draft" : "published" }
                              : item
                          )
                        });
                      });
                      setMessage(`已切换《${poster.title}》的发布状态。当前为占位操作，尚未写入 Supabase。`);
                    }}
                    onToggleRecommended={() => {
                      setDashboard((current) => {
                        if (!current) {
                          return current;
                        }

                        return syncDashboardSummary({
                          ...current,
                          posters: current.posters.map((item) =>
                            item.id === poster.id ? { ...item, recommended: !item.recommended } : item
                          )
                        });
                      });
                      setMessage(`已切换《${poster.title}》的推荐状态。`);
                    }}
                  />
                ))}
              </div>
            </article>

            <article className="rounded-[2rem] border border-white/70 bg-white/92 p-6 shadow-lg shadow-slate-950/5 backdrop-blur">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs tracking-[0.3em] text-slate-400 uppercase">Poster Detail Editor</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">海报详情与参数维护</h3>
                </div>
                {activePoster ? <StatusBadge label={activePoster.status === "published" ? "已发布" : "草稿中"} tone={activePoster.status === "published" ? "dark" : "soft"} /> : null}
              </div>

              {activePoster ? (
                <>
                  <div className="mt-5 grid gap-4 md:grid-cols-[220px_1fr]">
                    <div className="overflow-hidden rounded-[1.6rem] bg-slate-950">
                      <img src={activePoster.coverImageUrl} alt={activePoster.title} className="h-full w-full object-cover" />
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-xs tracking-[0.24em] text-sky-700 uppercase">Current Poster</p>
                        <h4 className="mt-2 text-2xl font-semibold text-slate-950">{activePoster.title}</h4>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {activePoster.genre} / {activePoster.region} / 更新于 {activePoster.updatedAt}
                        </p>
                      </div>

                      <label className="block">
                        <span className="mb-2 block text-sm text-slate-500">摘要</span>
                        <textarea
                          className="min-h-[88px] w-full rounded-[1.25rem] border border-slate-900/10 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-950 outline-none transition focus:border-sky-400"
                          value={detailDraft.summary}
                          onChange={(event) => setDetailDraft((current) => ({ ...current, summary: event.target.value }))}
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-sm text-slate-500">详情描述</span>
                        <textarea
                          className="min-h-[108px] w-full rounded-[1.25rem] border border-slate-900/10 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-950 outline-none transition focus:border-sky-400"
                          value={detailDraft.description}
                          onChange={(event) =>
                            setDetailDraft((current) => ({ ...current, description: event.target.value }))
                          }
                        />
                      </label>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {([
                      ["character", "角色"],
                      ["style", "风格"],
                      ["mood", "氛围"],
                      ["tone", "色调"],
                      ["composition", "构图"],
                      ["ratio", "比例"]
                    ] as Array<[keyof PosterDetailDraft, string]>).map(([key, label]) => (
                      <label key={key} className="block">
                        <span className="mb-2 block text-sm text-slate-500">{label}</span>
                        <input
                          className="w-full rounded-[1.25rem] border border-slate-900/10 bg-slate-50 px-4 py-3.5 text-slate-950 outline-none transition focus:border-sky-400"
                          value={detailDraft[key]}
                          onChange={(event) => setDetailDraft((current) => ({ ...current, [key]: event.target.value }))}
                        />
                      </label>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setMessage(`《${activePoster.title}》的详情草稿已暂存到当前页面状态。`)}
                      className="rounded-[1.2rem] bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      保存详情草稿
                    </button>
                    <button
                      type="button"
                      onClick={() => setDetailDraft(emptyDetailDraft)}
                      className="rounded-[1.2rem] border border-slate-900/10 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-slate-950"
                    >
                      清空当前编辑
                    </button>
                  </div>
                </>
              ) : (
                <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-7 text-slate-500">
                  先从左侧选择一张海报，再进入详情维护面板。
                </div>
              )}
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <article className="rounded-[2rem] border border-white/70 bg-white/92 p-6 shadow-lg shadow-slate-950/5 backdrop-blur">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs tracking-[0.3em] text-slate-400 uppercase">Tag Management</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">参数标签管理</h3>
                </div>
                <p className="max-w-md text-sm leading-6 text-slate-600">
                  按风格、氛围、主题等维度维护标签集合，并给每个标签提供启用 / 草稿状态。
                </p>
              </div>

              <div className="mt-5 grid gap-3">
                {dashboard.tags.map((tag) => (
                  <TagAdminRow
                    key={tag.id}
                    tag={tag}
                    onToggle={() => {
                      setDashboard((current) => {
                        if (!current) {
                          return current;
                        }

                        return syncDashboardSummary({
                          ...current,
                          tags: current.tags.map((item) =>
                            item.id === tag.id
                              ? { ...item, status: item.status === "active" ? "draft" : "active" }
                              : item
                          )
                        });
                      });
                      setMessage(`标签“${tag.name}”状态已切换。`);
                    }}
                  />
                ))}
              </div>
            </article>

            <article className="rounded-[2rem] border border-white/70 bg-white/92 p-6 shadow-lg shadow-slate-950/5 backdrop-blur">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs tracking-[0.3em] text-slate-400 uppercase">Recommendation Slots</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">推荐内容管理</h3>
                </div>
                <p className="max-w-md text-sm leading-6 text-slate-600">
                  维护 landing、海报库、工作区等推荐位。当前先搭管理结构，推荐位切换为本地占位状态。
                </p>
              </div>

              <div className="mt-5 grid gap-4">
                {dashboard.recommendations.map((recommendation) => (
                  <RecommendationCard
                    key={recommendation.id}
                    posterTitle={dashboard.posters.find((poster) => poster.id === recommendation.posterId)?.title ?? "未绑定海报"}
                    recommendation={recommendation}
                    onAdvanceStatus={() => {
                      setDashboard((current) => {
                        if (!current) {
                          return current;
                        }

                        return syncDashboardSummary({
                          ...current,
                          recommendations: current.recommendations.map((item) =>
                            item.id === recommendation.id
                              ? {
                                  ...item,
                                  status: recommendationStatusCycle[(recommendationStatusCycle.indexOf(item.status) + 1) % recommendationStatusCycle.length]
                                }
                              : item
                          )
                        });
                      });
                      setMessage(`推荐位“${recommendation.title}”已切换到下一状态。`);
                    }}
                  />
                ))}
              </div>
            </article>
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/92 p-6 shadow-lg shadow-slate-950/5 backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs tracking-[0.3em] text-slate-400 uppercase">User Management</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">用户数据管理</h3>
              </div>
              <p className="max-w-md text-sm leading-6 text-slate-600">
                当前先提供角色、状态与最后活跃时间视图，后续再真正接入 Supabase 用户主数据和审核流。
              </p>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {dashboard.users.map((user) => (
                <UserAdminCard
                  key={user.id}
                  user={user}
                  onCycleRole={() => {
                    setDashboard((current) => {
                      if (!current) {
                        return current;
                      }

                      return syncDashboardSummary({
                        ...current,
                        users: current.users.map((item) =>
                          item.id === user.id
                            ? { ...item, role: roleCycle[(roleCycle.indexOf(item.role) + 1) % roleCycle.length] }
                            : item
                        )
                      });
                    });
                    setMessage(`用户 ${user.name} 的角色已切换。`);
                  }}
                  onToggleStatus={() => {
                    setDashboard((current) => {
                      if (!current) {
                        return current;
                      }

                      return syncDashboardSummary({
                        ...current,
                        users: current.users.map((item) =>
                          item.id === user.id
                            ? { ...item, status: item.status === "active" ? "invited" : "active" }
                            : item
                        )
                      });
                    });
                    setMessage(`用户 ${user.name} 的状态已切换。`);
                  }}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </section>
  );
}

function createFallbackDashboard(): AdminDashboardRecord {
  const posters: AdminPosterItem[] = posterRecords.map((poster, index) => ({
    coverImageUrl: poster.imageUrl,
    genre: poster.genre,
    id: poster.id,
    recommended: index % 2 === 0,
    region: poster.region,
    status: index % 3 === 0 ? "draft" : "published",
    title: poster.title,
    updatedAt: `2026-04-${String(10 - (index % 5)).padStart(2, "0")} 11:00`
  }));

  const tags: AdminTagItem[] = Array.from(new Set(posterRecords.flatMap((poster) => poster.tags))).map((tag, index) => ({
    group: index % 3 === 0 ? "风格" : index % 3 === 1 ? "氛围" : "主题",
    id: `fallback-tag-${index + 1}`,
    name: tag,
    status: index % 4 === 0 ? "draft" : "active",
    usageCount: posterRecords.filter((poster) => poster.tags.includes(tag)).length
  }));

  const recommendations: AdminRecommendationItem[] = posters.slice(0, 4).map((poster, index) => ({
    id: `fallback-rec-${index + 1}`,
    posterId: poster.id,
    slot: ["landing_hero", "library_top_pick", "workspace_inspiration", "editorial_focus"][index] ?? "custom_slot",
    status: index === 0 ? "online" : index === 1 ? "scheduled" : "draft",
    title: `${poster.title} 推荐位`,
    updatedAt: `2026-04-${String(10 - index).padStart(2, "0")} 09:00`
  }));

  const users: AdminUserItem[] = [
    {
      email: "ops@moviepainter.ai",
      id: "fallback-user-001",
      lastActiveAt: "2026-04-10 14:25",
      name: "内容运营负责人",
      role: "admin",
      status: "active"
    },
    {
      email: "editor@moviepainter.ai",
      id: "fallback-user-002",
      lastActiveAt: "2026-04-10 13:40",
      name: "海报编辑",
      role: "editor",
      status: "active"
    },
    {
      email: "member@moviepainter.ai",
      id: "fallback-user-003",
      lastActiveAt: "2026-04-09 21:18",
      name: "内部测试用户",
      role: "user",
      status: "invited"
    }
  ];

  return syncDashboardSummary({
    posters,
    recommendations,
    summary: {
      activeUsers: 0,
      curatedPosters: 0,
      pendingReviews: 0,
      recommendations: 0,
      tags: 0
    },
    tags,
    users
  });
}

function syncDashboardSummary(dashboard: AdminDashboardRecord): AdminDashboardRecord {
  return {
    ...dashboard,
    summary: {
      activeUsers: dashboard.users.filter((user) => user.status === "active").length,
      curatedPosters: dashboard.posters.length,
      pendingReviews: dashboard.posters.filter((poster) => poster.status === "draft").length,
      recommendations: dashboard.recommendations.length,
      tags: dashboard.tags.length
    }
  };
}

function SummaryCard({ accent = false, label, value }: { accent?: boolean; label: string; value: string }) {
  return (
    <article
      className={`rounded-[1.8rem] border p-5 shadow-lg shadow-slate-950/5 ${
        accent ? "border-sky-200 bg-sky-50" : "border-white/70 bg-white/92"
      }`}
    >
      <p className="text-xs tracking-[0.28em] text-slate-400 uppercase">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-slate-950">{value}</p>
    </article>
  );
}

function PosterAdminCard({
  active,
  onSelect,
  onTogglePublished,
  onToggleRecommended,
  poster
}: {
  active: boolean;
  onSelect: () => void;
  onTogglePublished: () => void;
  onToggleRecommended: () => void;
  poster: AdminPosterItem;
}) {
  return (
    <article
      className={`grid gap-4 rounded-[1.7rem] border p-4 shadow-sm transition md:grid-cols-[140px_1fr] ${
        active ? "border-sky-300 bg-sky-50/70" : "border-slate-900/8 bg-slate-50"
      }`}
    >
      <div className="overflow-hidden rounded-[1.3rem] bg-slate-950">
        <img src={poster.coverImageUrl} alt={poster.title} className="h-full w-full object-cover" />
      </div>

      <div className="flex flex-col justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-xl font-semibold text-slate-950">{poster.title}</h4>
            <StatusBadge label={poster.status === "published" ? "已发布" : "草稿"} tone={poster.status === "published" ? "dark" : "soft"} />
            {poster.recommended ? <StatusBadge label="推荐中" tone="sky" /> : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {poster.genre} / {poster.region} / 最后更新 {poster.updatedAt}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onSelect}
            className="rounded-[1rem] bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {active ? "当前编辑中" : "编辑详情"}
          </button>
          <button
            type="button"
            onClick={onTogglePublished}
            className="rounded-[1rem] border border-slate-900/10 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-slate-950"
          >
            切换发布状态
          </button>
          <button
            type="button"
            onClick={onToggleRecommended}
            className="rounded-[1rem] border border-slate-900/10 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-slate-950"
          >
            切换推荐状态
          </button>
        </div>
      </div>
    </article>
  );
}

function TagAdminRow({ onToggle, tag }: { onToggle: () => void; tag: AdminTagItem }) {
  return (
    <article className="flex flex-col gap-4 rounded-[1.4rem] border border-slate-900/8 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-lg font-semibold text-slate-950">{tag.name}</h4>
          <StatusBadge label={tag.group} tone="soft" />
          <StatusBadge label={tag.status === "active" ? "启用中" : "草稿"} tone={tag.status === "active" ? "dark" : "soft"} />
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">被 {tag.usageCount} 张海报引用，当前属于 {tag.group} 类标签。</p>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className="rounded-[1rem] border border-slate-900/10 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-slate-950"
      >
        切换状态
      </button>
    </article>
  );
}

function RecommendationCard({
  onAdvanceStatus,
  posterTitle,
  recommendation
}: {
  onAdvanceStatus: () => void;
  posterTitle: string;
  recommendation: AdminRecommendationItem;
}) {
  return (
    <article className="rounded-[1.5rem] border border-slate-900/8 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-lg font-semibold text-slate-950">{recommendation.title}</h4>
        <StatusBadge label={recommendation.status} tone={recommendation.status === "online" ? "sky" : recommendation.status === "scheduled" ? "soft" : "dark"} />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        推荐位：{recommendation.slot}
        <br />
        绑定海报：{posterTitle}
        <br />
        更新时间：{recommendation.updatedAt}
      </p>

      <button
        type="button"
        onClick={onAdvanceStatus}
        className="mt-4 rounded-[1rem] bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        切换推荐状态
      </button>
    </article>
  );
}

function UserAdminCard({
  onCycleRole,
  onToggleStatus,
  user
}: {
  onCycleRole: () => void;
  onToggleStatus: () => void;
  user: AdminUserItem;
}) {
  return (
    <article className="rounded-[1.5rem] border border-slate-900/8 bg-slate-50 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-xl font-semibold text-slate-950">{user.name}</h4>
        <StatusBadge label={user.role} tone="soft" />
        <StatusBadge label={user.status === "active" ? "活跃" : "邀请中"} tone={user.status === "active" ? "sky" : "dark"} />
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {user.email}
        <br />
        最后活跃：{user.lastActiveAt}
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onCycleRole}
          className="rounded-[1rem] bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          切换角色
        </button>
        <button
          type="button"
          onClick={onToggleStatus}
          className="rounded-[1rem] border border-slate-900/10 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-slate-950"
        >
          切换状态
        </button>
      </div>
    </article>
  );
}

function StatusBadge({
  label,
  tone
}: {
  label: string;
  tone: "dark" | "sky" | "soft";
}) {
  const toneClass =
    tone === "dark"
      ? "bg-slate-950 text-white"
      : tone === "sky"
        ? "bg-sky-100 text-sky-900"
        : "bg-slate-200 text-slate-700";

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClass}`}>{label}</span>;
}
