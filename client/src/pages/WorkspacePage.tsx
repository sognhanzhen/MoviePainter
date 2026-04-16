import { type ReactNode, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { PosterDetailModal } from "../components/PosterDetailModal";
import { PosterMosaicCard } from "../components/PosterMosaicCard";
import type {
  AppDataSource,
  PosterRecord,
  WorkspaceGeneratedResult,
  WorkspaceGenerationResponse,
  WorkspaceMode
} from "../data/posters";
import { usePosterCatalog } from "../hooks/usePosterCatalog";
import { appDataRequest, workspaceRequest } from "../lib/api";
import { saveGeneratedHistorySnapshot } from "../lib/history-cache";
import { recordWorkspaceAssetUse } from "../lib/workspace-assets";

const drawModules = [
  { key: "character", label: "角色" },
  { key: "style", label: "风格" },
  { key: "mood", label: "氛围" },
  { key: "tone", label: "色调" },
  { key: "composition", label: "构图" },
  { key: "ratio", label: "比例" }
] as const;

const chatModelOptions = [
  {
    description: "High-quality poster generation for characters, lighting, and cinematic scenes.",
    id: "doubao-seedance-5",
    label: "Doubao Seedance 5.0"
  },
  {
    description: "Faster draft exploration for composition and style direction.",
    id: "nano-banana-2",
    label: "Nano Banana 2"
  },
  {
    description: "Photorealistic style generation using Qwen Wanxiang 2.7 Pro model.",
    id: "wan2.7-image-pro",
    label: "Qwen Wanxiang 2.7 Pro"
  }
] as const;

const chatRatioOptions = [
  {
    description: "Wide cinematic key art and landscape frames.",
    id: "16:9",
    label: "16:9"
  },
  {
    description: "Vertical covers and mobile-first poster layouts.",
    id: "9:16",
    label: "9:16"
  }
] as const;

type DrawModuleState = Record<
  (typeof drawModules)[number]["key"],
  {
    enabled: boolean;
    importedValue: string;
    selectedForImport: boolean;
    weight: number;
  }
>;

type ReferenceImageState = {
  name: string;
  url: string;
};

type ChatGenerationRecord = {
  createdAt: string;
  id: string;
  insight: string;
  modelId: string;
  posterTitle: string;
  prompt: string;
  ratioId: string;
  referenceImageName: string;
  referenceImageUrl: string;
  results: WorkspaceGeneratedResult[];
  source: AppDataSource;
  status: "failed" | "submitting" | "succeeded";
  templatePosterId: string | null;
  templatePosterTitle: string | null;
};

const initialDrawState: DrawModuleState = {
  character: { enabled: true, importedValue: "", selectedForImport: false, weight: 72 },
  style: { enabled: true, importedValue: "", selectedForImport: false, weight: 84 },
  mood: { enabled: true, importedValue: "", selectedForImport: false, weight: 68 },
  tone: { enabled: false, importedValue: "", selectedForImport: false, weight: 56 },
  composition: { enabled: true, importedValue: "", selectedForImport: false, weight: 79 },
  ratio: { enabled: false, importedValue: "", selectedForImport: false, weight: 40 }
};

export function WorkspacePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [chatDraft, setChatDraft] = useState("");
  const [selectedModelId, setSelectedModelId] = useState<(typeof chatModelOptions)[number]["id"]>(chatModelOptions[0].id);
  const [selectedRatioId, setSelectedRatioId] = useState<(typeof chatRatioOptions)[number]["id"]>(chatRatioOptions[0].id);
  const [chatNotice, setChatNotice] = useState("上传参考图，或者从下方海报墙把模板 prompt 注入当前生成器。");
  const [referenceImage, setReferenceImage] = useState<ReferenceImageState | null>(null);
  const [chatGenerationDeck, setChatGenerationDeck] = useState<ChatGenerationRecord[]>([]);
  const [activeChatGenerationId, setActiveChatGenerationId] = useState("");
  const [isGenerationPanelOpen, setIsGenerationPanelOpen] = useState(false);
  const [hasScrolledPastMainComposer, setHasScrolledPastMainComposer] = useState(false);
  const [isFloatingComposerExpanded, setIsFloatingComposerExpanded] = useState(false);
  const [isFloatingComposerMounted, setIsFloatingComposerMounted] = useState(false);
  const [isFloatingComposerClosing, setIsFloatingComposerClosing] = useState(false);
  const [isMainComposerVisible, setIsMainComposerVisible] = useState(true);
  const [drawState, setDrawState] = useState<DrawModuleState>(initialDrawState);
  const [drawMessage, setDrawMessage] = useState("选择一个或多个模块后，AI 会根据当前参考海报识别参数并灌入。");
  const [drawGenerationState, setDrawGenerationState] = useState<"failed" | "idle" | "submitting" | "succeeded">("idle");
  const [drawGenerationMessage, setDrawGenerationMessage] = useState("先选择参考海报，再从当前模式发起生成。");
  const [latestDrawGeneration, setLatestDrawGeneration] = useState<WorkspaceGenerationResponse | null>(null);
  const [workspacePosterModal, setWorkspacePosterModal] = useState<PosterRecord | null>(null);
  const [workspacePosterSelectingMode, setWorkspacePosterSelectingMode] = useState(false);
  const mainComposerRef = useRef<HTMLDivElement | null>(null);
  const floatingComposerRef = useRef<HTMLDivElement | null>(null);
  const { error, loading, posters, source } = usePosterCatalog(token);
  const mode = searchParams.get("mode") === "draw" ? "draw" : "chat";
  const selectedPoster = posters.find((poster) => poster.id === searchParams.get("posterId")) ?? null;
  const pendingChatRecord = chatGenerationDeck.find((item) => item.status === "submitting") ?? null;
  const latestChatRecord = chatGenerationDeck[0] ?? null;
  const activeChatRecord = getActiveChatRecord(chatGenerationDeck, activeChatGenerationId);
  const panelRecord = activeChatRecord ?? latestChatRecord;
  const shouldShowFloatingComposer = mode === "chat" && !isGenerationPanelOpen && hasScrolledPastMainComposer;
  const shouldRenderFloatingComposer = shouldShowFloatingComposer || isFloatingComposerMounted;
  const floatingComposerPreviewText =
    chatDraft.trim() ||
    (selectedPoster ? `Continue from ${selectedPoster.title}` : "Describe the movie poster you want to create.");

  useEffect(() => {
    if (!token || searchParams.has("mode")) {
      return;
    }

    let cancelled = false;

    async function hydrateDefaultMode() {
      try {
        const response = await appDataRequest.getSettings(token);

        if (cancelled || searchParams.has("mode")) {
          return;
        }

        const nextParams = new URLSearchParams(searchParams);
        nextParams.set("mode", response.settings.preferredDefaultMode);
        setSearchParams(nextParams);
      } catch {
        if (cancelled || searchParams.has("mode")) {
          return;
        }

        const nextParams = new URLSearchParams(searchParams);
        nextParams.set("mode", "chat");
        setSearchParams(nextParams);
      }
    }

    void hydrateDefaultMode();

    return () => {
      cancelled = true;
    };
  }, [searchParams, setSearchParams, token]);

  useEffect(() => {
    setDrawState((current) =>
      Object.fromEntries(
        Object.entries(current).map(([key, moduleState]) => [
          key,
          {
            ...moduleState,
            importedValue: "",
            selectedForImport: false
          }
        ])
      ) as DrawModuleState
    );
    setDrawMessage("选择一个或多个模块后，AI 会根据当前参考海报识别参数并灌入。");
  }, [selectedPoster?.id]);

  useEffect(() => {
    setLatestDrawGeneration(null);
    setDrawGenerationState("idle");
    setDrawGenerationMessage(
      selectedPoster
        ? `当前已挂载参考海报《${selectedPoster.title}》，可以开始 ${mode === "chat" ? "AI Chat" : "AI Draw"} 生成。`
        : "先选择参考海报，再从当前模式发起生成。"
    );
  }, [mode, selectedPoster?.id]);

  useEffect(() => {
    if (mode !== "chat") {
      setIsGenerationPanelOpen(false);
      setHasScrolledPastMainComposer(false);
      setIsFloatingComposerExpanded(false);
      setIsMainComposerVisible(true);
      return;
    }

    let frameId = 0;

    const updateVisibility = () => {
      frameId = 0;

      const node = mainComposerRef.current;

      if (!node) {
        return;
      }

      const rect = node.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
      const isPastComposer = rect.bottom <= 0;

      setIsMainComposerVisible(isVisible);
      setHasScrolledPastMainComposer(isPastComposer);
    };

    const scheduleVisibilityUpdate = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(updateVisibility);
    };

    scheduleVisibilityUpdate();
    window.addEventListener("scroll", scheduleVisibilityUpdate, { passive: true });
    window.addEventListener("resize", scheduleVisibilityUpdate);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener("scroll", scheduleVisibilityUpdate);
      window.removeEventListener("resize", scheduleVisibilityUpdate);
    };
  }, [mode]);

  useEffect(() => {
    if (shouldShowFloatingComposer) {
      setIsFloatingComposerMounted(true);
      setIsFloatingComposerClosing(false);
      return;
    }

    setIsFloatingComposerExpanded(false);

    if (!isFloatingComposerMounted) {
      return;
    }

    setIsFloatingComposerClosing(true);

    const timeoutId = window.setTimeout(() => {
      setIsFloatingComposerMounted(false);
      setIsFloatingComposerClosing(false);
    }, 240);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isFloatingComposerMounted, shouldShowFloatingComposer]);

  useEffect(() => {
    if (!shouldRenderFloatingComposer) {
      setIsFloatingComposerExpanded(false);
    }
  }, [shouldRenderFloatingComposer]);

  useEffect(() => {
    if (!isFloatingComposerExpanded || !shouldShowFloatingComposer) {
      return;
    }

    let previousScrollY = window.scrollY;
    let frameId = 0;

    function handleScroll() {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;

        const nextScrollY = window.scrollY;

        if (Math.abs(nextScrollY - previousScrollY) > 4) {
          setIsFloatingComposerExpanded(false);
          return;
        }

        previousScrollY = nextScrollY;
      });
    }

    function handlePointerDown(event: PointerEvent) {
      if (!floatingComposerRef.current?.contains(event.target as Node)) {
        setIsFloatingComposerExpanded(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsFloatingComposerExpanded(false);
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFloatingComposerExpanded, shouldRenderFloatingComposer]);

  useEffect(() => {
    if (!isGenerationPanelOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isGenerationPanelOpen]);

  function updateMode(nextMode: WorkspaceMode) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("mode", nextMode);
    setSearchParams(nextParams);
  }

  function attachPoster(posterId: string, sourceOrigin = "workspace_inspiration", nextMode?: WorkspaceMode) {
    const nextParams = new URLSearchParams(searchParams);
    if (nextMode) {
      nextParams.set("mode", nextMode);
    }
    nextParams.set("posterId", posterId);
    nextParams.set("source", sourceOrigin);
    setSearchParams(nextParams);
  }

  function openWorkspacePoster(poster: PosterRecord) {
    setWorkspacePosterModal(poster);
    setWorkspacePosterSelectingMode(false);
  }

  async function handleWorkspacePosterUse(nextMode: WorkspaceMode) {
    if (!workspacePosterModal) {
      return;
    }

    if (!workspacePosterSelectingMode) {
      setWorkspacePosterSelectingMode(true);
      return;
    }

    await recordWorkspaceAssetUse({
      action: "workspace_use",
      mode: nextMode,
      poster: workspacePosterModal,
      sourceOrigin: "workspace_inspiration",
      token
    });

    if (nextMode === "chat") {
      applyPosterTemplate(workspacePosterModal, nextMode);
    } else {
      attachPoster(workspacePosterModal.id, "workspace_inspiration", nextMode);
    }

    setWorkspacePosterModal(null);
    setWorkspacePosterSelectingMode(false);
  }

  function toggleDrawImportSelection(moduleKey: keyof DrawModuleState) {
    setDrawState((current) => ({
      ...current,
      [moduleKey]: {
        ...current[moduleKey],
        selectedForImport: !current[moduleKey].selectedForImport
      }
    }));
  }

  function toggleDrawModule(moduleKey: keyof DrawModuleState) {
    setDrawState((current) => ({
      ...current,
      [moduleKey]: {
        ...current[moduleKey],
        enabled: !current[moduleKey].enabled
      }
    }));
  }

  function updateDrawWeight(moduleKey: keyof DrawModuleState, weight: number) {
    setDrawState((current) => ({
      ...current,
      [moduleKey]: {
        ...current[moduleKey],
        weight
      }
    }));
  }

  function applyReferenceToDrawModules() {
    if (!selectedPoster) {
      setDrawMessage("请先从下方灵感区选择一张海报作为 AI Draw 的参考对象。");
      return;
    }

    const selectedModuleKeys = getSelectedImportModuleKeys(drawState);

    if (selectedModuleKeys.length === 0) {
      setDrawMessage("至少选择一个模块，AI 才能开始识别并写入对应参数。");
      return;
    }

    setDrawState((current) => ({
      ...current,
      ...Object.fromEntries(
        selectedModuleKeys.map((moduleKey) => [
          moduleKey,
          {
            ...current[moduleKey],
            importedValue: selectedPoster.attributes[moduleKey]
          }
        ])
      )
    }));
    setDrawMessage(`AI 已从《${selectedPoster.title}》识别并写入 ${selectedModuleKeys.length} 个模块参数。`);
  }

  async function handleReferenceImageChange(file: File | null) {
    if (!file) {
      return;
    }

    try {
      const url = await readFileAsDataUrl(file);

      setReferenceImage({
        name: file.name,
        url
      });
      setChatNotice("参考图已挂入当前生成器，生成时会沿用这张图片。");
    } catch (error) {
      setChatNotice(error instanceof Error ? error.message : "图片读取失败，请重新上传。");
    }
  }

  function hydrateComposerFromRecord(record: ChatGenerationRecord) {
    setChatDraft(record.prompt);
    setSelectedModelId(record.modelId as (typeof chatModelOptions)[number]["id"]);
    setSelectedRatioId(record.ratioId as (typeof chatRatioOptions)[number]["id"]);
    setReferenceImage(
      record.referenceImageUrl
        ? {
            name: record.referenceImageName,
            url: record.referenceImageUrl
          }
        : null
    );

    if (record.templatePosterId) {
      attachPoster(record.templatePosterId);
    }
  }

  function applyPosterTemplate(poster: PosterRecord, nextMode: WorkspaceMode = "chat") {
    attachPoster(poster.id, "workspace_inspiration", nextMode);
    setChatDraft(buildTemplatePrompt(poster));
    setSelectedRatioId(resolveRatioOptionId(poster.attributes.ratio));
    setChatNotice(
      isMainComposerVisible
        ? `《${poster.title}》的模板 prompt 已注入上方对话框。`
        : `《${poster.title}》的模板 prompt 已注入底部小型对话框。`
    );
  }

  async function submitChatGeneration() {
    const prompt = chatDraft.trim();
    const posterForRequest = selectedPoster ?? posters[0] ?? { id: "free-prompt", title: "Free Prompt" };

    if (!token) {
      setChatNotice("当前登录会话已恢复，但后端令牌暂不可用，无法发起生成。");
      return;
    }

    if (prompt.length < 2) {
      setChatNotice("请输入 prompt 后再开始生成。");
      return;
    }

    const requestId = `chat-${Date.now()}`;

    const nextRecord: ChatGenerationRecord = {
      createdAt: new Date().toISOString(),
      id: requestId,
      insight: "正在解析提示词、参考图与镜头语气。",
      modelId: selectedModelId,
      posterTitle: posterForRequest.title,
      prompt,
      ratioId: selectedRatioId,
      referenceImageName: referenceImage?.name ?? "",
      referenceImageUrl: referenceImage?.url ?? "",
      results: [],
      source,
      status: "submitting",
      templatePosterId: selectedPoster?.id ?? null,
      templatePosterTitle: selectedPoster?.title ?? null
    };

    setChatGenerationDeck((current) => [nextRecord, ...current]);
    setActiveChatGenerationId(requestId);
    setIsGenerationPanelOpen(true);
    setChatNotice("最新任务已经推到前景生图面板，上一轮结果会折叠到历史面板。");

    try {
      const response = await workspaceRequest.generate(token, {
        mode: "chat",
        modelId: selectedModelId,
        moduleWeights: {},
        posterId: posterForRequest.id,
        prompt,
        ratioId: selectedRatioId,
        sourceOrigin: searchParams.get("source") ?? "workspace",
        selectedModules: []
      });

      setChatGenerationDeck((current) =>
        current.map((record) =>
          record.id === requestId
            ? {
                ...record,
                createdAt: response.task.submittedAt,
                insight: response.insight,
                posterTitle: response.task.posterTitle,
                results: response.results,
                source: response.source,
                status: "succeeded"
              }
            : record
        )
      );
      saveGeneratedHistorySnapshot(response);
      setChatNotice("生图已完成，你可以在面板里继续改 prompt 再生成下一轮。");
      navigate(`/history/${response.task.id}`);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "AI Chat 生成失败，请稍后再试。";

      setChatGenerationDeck((current) =>
        current.map((record) =>
          record.id === requestId
            ? {
                ...record,
                insight: message,
                status: "failed"
              }
            : record
        )
      );
      setChatNotice(message);
    }
  }

  async function submitDrawGeneration() {
    if (!selectedPoster) {
      setDrawGenerationState("failed");
      setDrawGenerationMessage("请先选择参考海报，再开始 AI Draw 生成。");
      return;
    }

    if (!token) {
      setDrawGenerationState("failed");
      setDrawGenerationMessage("当前登录会话已恢复，但后端令牌暂不可用，无法发起生成。");
      return;
    }

    const selectedModules = getReadyDrawModuleKeys(drawState);

    if (selectedModules.length === 0) {
      setDrawGenerationState("failed");
      setDrawGenerationMessage("请先导入至少一个启用中的 AI Draw 参数模块，再开始生成。");
      return;
    }

    setDrawGenerationState("submitting");
    setDrawGenerationMessage("AI Draw 正在生成 4 张图，等待模型返回。");

    try {
      const response = await workspaceRequest.generate(token, {
        mode: "draw",
        modelId: "nano-banana-2",
        moduleWeights: Object.fromEntries(
          selectedModules.map((moduleKey) => [moduleKey, drawState[moduleKey].weight])
        ),
        posterId: selectedPoster.id,
        prompt: buildDrawPrompt(selectedPoster, drawState),
        ratioId: resolveRatioOptionId(selectedPoster.attributes.ratio),
        sourceOrigin: searchParams.get("source") ?? "workspace",
        selectedModules
      });

      setLatestDrawGeneration(response);
      setDrawGenerationState("succeeded");
      setDrawGenerationMessage(`AI Draw 已返回 ${response.results.length} 个真实结果。`);
      saveGeneratedHistorySnapshot(response);
      navigate(`/history/${response.task.id}`);
    } catch (requestError) {
      setDrawGenerationState("failed");
      setDrawGenerationMessage(requestError instanceof Error ? requestError.message : "AI Draw 生成失败，请稍后再试。");
    }
  }

  function openGenerationPanel(recordId?: string) {
    const targetRecord = chatGenerationDeck.find((item) => item.id === recordId) ?? panelRecord;

    if (!targetRecord) {
      return;
    }

    setActiveChatGenerationId(targetRecord.id);
    hydrateComposerFromRecord(targetRecord);
    setIsGenerationPanelOpen(true);
  }

  function closeGenerationPanel() {
    if (panelRecord) {
      hydrateComposerFromRecord(panelRecord);
    }

    setIsGenerationPanelOpen(false);
  }

  function browseHistory(direction: "newer" | "older") {
    if (!panelRecord || panelRecord.status === "submitting") {
      return;
    }

    const currentIndex = chatGenerationDeck.findIndex((item) => item.id === panelRecord.id);
    const targetIndex = direction === "newer" ? currentIndex - 1 : currentIndex + 1;
    const targetRecord = chatGenerationDeck[targetIndex];

    if (!targetRecord) {
      return;
    }

    setActiveChatGenerationId(targetRecord.id);
    hydrateComposerFromRecord(targetRecord);
  }

  const activeIndex = panelRecord ? chatGenerationDeck.findIndex((item) => item.id === panelRecord.id) : -1;
  const canViewNewer = activeIndex > 0 && panelRecord?.status !== "submitting";
  const canViewOlder = activeIndex >= 0 && activeIndex < chatGenerationDeck.length - 1 && panelRecord?.status !== "submitting";

  function clearSelectedPoster() {
    if (searchParams.has("posterId")) {
      setSearchParams((prev) => {
        prev.delete("posterId");
        return prev;
      }, { replace: true });
    }
  }

  return (
    <section className="space-y-16">
      <header className="mx-auto max-w-4xl text-center">
        <ModeTitlePicker mode={mode} onSelect={updateMode} />
      </header>

      {error ? (
        <p className="mx-auto max-w-4xl rounded-lg border border-[#ffb4aa]/28 bg-[#311615]/72 px-4 py-3 text-sm leading-6 text-[#ffdad5] shadow-[0_20px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          {error}
        </p>
      ) : null}

      {mode === "chat" ? (
        <section ref={mainComposerRef} className="mx-auto max-w-4xl">
          <ChatComposer
            attachedPoster={selectedPoster}
              onRemoveAttachedPoster={clearSelectedPoster}
              notice={chatNotice}
            onPromptChange={setChatDraft}
            onReferenceImageChange={handleReferenceImageChange}
            onRemoveReferenceImage={() => setReferenceImage(null)}
            onSubmit={submitChatGeneration}
            onSelectModel={setSelectedModelId}
            onSelectRatio={setSelectedRatioId}
            prompt={chatDraft}
            referenceImage={referenceImage}
            selectedModelId={selectedModelId}
            selectedRatioId={selectedRatioId}
            submitLabel={pendingChatRecord ? "生成中..." : "开始生图"}
            uploadInputId="workspace-chat-main-upload"
            variant="main"
          />
        </section>
      ) : null}

      {mode === "draw" ? (
        <section className="rounded-lg border border-white/6 bg-[#181918]/68 p-6 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.62)] backdrop-blur-2xl sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="rounded-lg border border-white/6 bg-[#0f1110]/72 p-5">
              {loading ? (
                <div className="min-h-[420px] animate-pulse rounded-lg bg-white/8" />
              ) : (
                <DrawWorkspace
                  applyReferenceToDrawModules={applyReferenceToDrawModules}
                  drawMessage={drawMessage}
                  drawState={drawState}
                  isSubmitting={drawGenerationState === "submitting"}
                  onGenerate={submitDrawGeneration}
                  selectedPoster={selectedPoster}
                  toggleDrawImportSelection={toggleDrawImportSelection}
                  toggleDrawModule={toggleDrawModule}
                  updateDrawWeight={updateDrawWeight}
                />
              )}
            </div>

            <aside className="space-y-4 rounded-lg border border-white/6 bg-[#111211]/76 p-5 shadow-sm">
              <p className="text-xs tracking-[0.3em] text-neutral-500 uppercase">Current Reference</p>
              {selectedPoster ? (
                <PosterMosaicCard poster={selectedPoster} onClick={() => openWorkspacePoster(selectedPoster)} selected showMeta={false} />
              ) : (
                <div className="rounded-lg border border-dashed border-white/12 bg-white/5 p-6 text-sm leading-7 text-neutral-400">
                  当前还没有参考海报。你可以从下方灵感区选择一张海报，把它注入当前模式。
                </div>
              )}

              <div className="rounded-lg border border-white/6 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs tracking-[0.24em] text-neutral-500 uppercase">Generation State</p>
                    <h3 className="mt-2 text-lg font-semibold text-white">AI Draw 生成链路</h3>
                  </div>
                  <GenerationStateBadge state={drawGenerationState} />
                </div>

                <p className="mt-4 text-sm leading-6 text-neutral-400">{drawGenerationMessage}</p>

                {latestDrawGeneration ? (
                  <div className="mt-4 rounded-lg border border-white/6 bg-[#0d0e0d] p-4">
                    <p className="text-xs tracking-[0.22em] text-[#ffb4aa] uppercase">Latest Task</p>
                    <p className="mt-2 text-sm font-semibold text-white">{latestDrawGeneration.task.posterTitle}</p>
                    <p className="mt-2 text-sm leading-6 text-neutral-400">{latestDrawGeneration.insight}</p>
                  </div>
                ) : null}
              </div>
            </aside>
          </div>

          <section className="mt-6 rounded-lg border border-white/6 bg-[#0f1110]/72 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs tracking-[0.3em] text-neutral-500 uppercase">Latest Outputs</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">当前生成结果区</h3>
              </div>
              <p className="max-w-xl text-sm leading-6 text-neutral-500">生成完成后会进入历史资产。</p>
            </div>

            {drawGenerationState === "idle" ? (
              <div className="mt-5 rounded-lg border border-dashed border-white/12 bg-white/5 p-6 text-sm leading-7 text-neutral-400">
                还没有发起生成。你可以在上方 AI Draw 工作区里开始生成，结果会展示在这里。
              </div>
            ) : drawGenerationState === "submitting" ? (
              <div className="mt-5 grid gap-4 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex h-[280px] flex-col items-center justify-center rounded-lg border border-white/8 bg-white/6">
                    <GenerationSpinner sizeClassName="h-8 w-8" />
                    <p className="mt-4 text-sm font-semibold text-neutral-300">生成图 {index + 1}</p>
                  </div>
                ))}
              </div>
            ) : latestDrawGeneration ? (
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {latestDrawGeneration.results.map((result) => (
                  <article
                    key={result.id}
                    className="overflow-hidden rounded-lg border border-white/8 bg-[#181918] shadow-lg shadow-black/20"
                  >
                    <div className="relative h-[260px]">
                      <img src={result.imageUrl} alt={result.title} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/78 via-slate-950/10 to-transparent" />
                      <div className="absolute right-4 bottom-4 left-4 text-white">
                        <p className="text-[11px] tracking-[0.26em] text-sky-200 uppercase">AI Draw</p>
                        <h4 className="mt-2 text-xl font-semibold">{result.title}</h4>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm leading-6 text-neutral-400">{result.summary}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-lg border border-[#ffb4aa]/24 bg-[#311615]/72 p-6 text-sm leading-7 text-[#ffdad5]">
                当前生成没有返回结果。你可以调整参数后再试一次。
              </div>
            )}
          </section>
        </section>
      ) : null}

      <section>
        <div>
          <div className="mb-8 flex items-end justify-between gap-6">
            <div className="text-left">
              <h3 className="font-[var(--font-ui)] text-2xl font-extrabold tracking-normal text-white">
                Recent Interpretations
              </h3>
              <div className="mt-3 h-[2px] w-12 bg-gradient-to-r from-[#ffb4aa] to-[#e50914]" />
            </div>
            <button
              type="button"
              onClick={() => navigate("/library")}
              className="cursor-pointer pb-1 font-[var(--font-ui)] text-[10px] font-extrabold tracking-[0.24em] text-neutral-500 uppercase transition hover:text-[#ffb4aa]"
            >
              View All Gallery
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-[3/4] animate-pulse rounded-lg bg-white/8"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {posters.map((poster) => (
                <PosterMosaicCard
                  key={poster.id}
                  poster={poster}
                  selected={selectedPoster?.id === poster.id}
                  showMeta={false}
                  onClick={() => openWorkspacePoster(poster)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {shouldRenderFloatingComposer ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-3">
          <div
            ref={floatingComposerRef}
            data-testid={isFloatingComposerExpanded ? "floating-chat-composer-expanded" : "floating-chat-composer-wrap"}
            className={`pointer-events-auto w-full ${isFloatingComposerExpanded ? "max-w-4xl" : "max-w-[760px]"}`}
          >
            {isFloatingComposerExpanded ? (
              <ChatComposer
                attachedPoster={selectedPoster}
              onRemoveAttachedPoster={clearSelectedPoster}
                notice={chatNotice}
                onPromptChange={setChatDraft}
                onReferenceImageChange={handleReferenceImageChange}
                onRemoveReferenceImage={() => setReferenceImage(null)}
                onSubmit={submitChatGeneration}
                onSelectModel={setSelectedModelId}
                onSelectRatio={setSelectedRatioId}
                prompt={chatDraft}
                referenceImage={referenceImage}
                selectedModelId={selectedModelId}
                selectedRatioId={selectedRatioId}
                submitLabel={pendingChatRecord ? "生成中..." : "开始生图"}
                uploadInputId="workspace-chat-floating-upload"
                variant="floating"
              />
            ) : (
              <div
                data-testid="floating-chat-composer-collapsed"
                className={`${
                  isFloatingComposerClosing ? "workspace-floating-composer-pop-out" : "workspace-floating-composer-pop"
                } flex min-h-14 items-center gap-3 overflow-hidden rounded-lg border border-white/6 bg-[#181918]/72 px-4 py-3 text-neutral-100 shadow-[0_24px_58px_rgba(0,0,0,0.46)] backdrop-blur-2xl`}
              >
                <button
                  type="button"
                  onClick={() => setIsFloatingComposerExpanded(true)}
                  className="min-w-0 flex-1 cursor-pointer truncate text-left text-sm font-light leading-6 text-neutral-400 transition hover:text-neutral-100"
                  aria-label="展开子对话框"
                >
                  {floatingComposerPreviewText}
                </button>
                <button
                  type="button"
                  onClick={submitChatGeneration}
                  aria-label={pendingChatRecord ? "生成中..." : "开始生图"}
                  className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-neutral-100 text-xl font-semibold text-black shadow-xl transition hover:scale-105 hover:bg-white active:scale-95"
                >
                  ↑
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {mode === "chat" && isGenerationPanelOpen && panelRecord ? (
        <GenerationDeckPanel
          activeIndex={activeIndex}
          canViewNewer={canViewNewer}
          canViewOlder={canViewOlder}
          historyCount={chatGenerationDeck.length}
          onBrowseHistory={browseHistory}
          onClose={closeGenerationPanel}
          panelRecord={panelRecord}
        >
          <ChatComposer
            attachedPoster={posters.find(p => p.id === panelRecord.templatePosterId) ?? selectedPoster}
              onRemoveAttachedPoster={clearSelectedPoster}
              notice={panelRecord.status === "submitting" ? "这轮正在生成，你可以先准备下一轮 prompt。" : chatNotice}
            onPromptChange={setChatDraft}
            onReferenceImageChange={handleReferenceImageChange}
            onRemoveReferenceImage={() => setReferenceImage(null)}
            onSubmit={submitChatGeneration}
            onSelectModel={setSelectedModelId}
            onSelectRatio={setSelectedRatioId}
            prompt={chatDraft}
            referenceImage={referenceImage}
            selectedModelId={selectedModelId}
            selectedRatioId={selectedRatioId}
            submitLabel={pendingChatRecord ? "生成中..." : "用当前配置继续生成"}
            uploadInputId="workspace-chat-panel-upload"
            variant="panel"
          />
        </GenerationDeckPanel>
      ) : null}

      {workspacePosterModal ? (
        <PosterDetailModal
          poster={workspacePosterModal}
          selectingMode={workspacePosterSelectingMode}
          onClose={() => {
            setWorkspacePosterModal(null);
            setWorkspacePosterSelectingMode(false);
          }}
          onSelectMode={handleWorkspacePosterUse}
        />
      ) : null}
    </section>
  );
}

function ChatComposer({
  attachedPoster,
  compact = false,
  notice,
  onOpenPanel,
  onPromptChange,
  onReferenceImageChange,
  onRemoveAttachedPoster,
  onRemoveReferenceImage,
  onSelectModel,
  onSelectRatio,
  onSubmit,
  panelRecord,
  prompt,
  referenceImage,
  selectedModelId,
  selectedRatioId,
  submitLabel,
  uploadInputId,
  variant
}: {
  attachedPoster?: Pick<PosterRecord, "imageUrl" | "title"> | null;
  compact?: boolean;
  notice: string;
  onOpenPanel?: () => void;
  onPromptChange: (value: string) => void;
  onReferenceImageChange: (file: File | null) => void;
  onRemoveAttachedPoster?: () => void;
  onRemoveReferenceImage: () => void;
  onSelectModel: (modelId: (typeof chatModelOptions)[number]["id"]) => void;
  onSelectRatio: (ratioId: (typeof chatRatioOptions)[number]["id"]) => void;
  onSubmit: () => void;
  panelRecord?: ChatGenerationRecord | null;
  prompt: string;
  referenceImage: ReferenceImageState | null;
  selectedModelId: (typeof chatModelOptions)[number]["id"];
  selectedRatioId: (typeof chatRatioOptions)[number]["id"];
  submitLabel: string;
  uploadInputId: string;
  variant: "floating" | "main" | "panel";
}) {
  const isDockedComposer = variant === "main" || variant === "floating" || variant === "panel";
  const [openDropdown, setOpenDropdown] = useState<null | "model" | "ratio">(null);
  const composerRef = useRef<HTMLDivElement | null>(null);
  const isMainComposer = variant === "main";
  const isFloatingComposer = variant === "floating";
  const isDarkComposer = isMainComposer || isFloatingComposer;
  const isPanelComposer = variant === "panel";
  const outerClassName =
    isPanelComposer
      ? "rounded-[1.65rem] bg-white/78 text-slate-950 shadow-[0_14px_38px_rgba(8,12,20,0.08)] backdrop-blur-sm"
      : isDarkComposer
        ? "overflow-hidden rounded-lg border border-white/6 bg-[#181918]/48 text-neutral-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.62)] backdrop-blur-2xl"
        : "rounded-[2rem] border border-slate-900/10 bg-[#f7f2e8]/96 text-slate-950 shadow-[0_28px_90px_rgba(8,12,20,0.2)] backdrop-blur-xl";
  const inputShellClass = isPanelComposer
    ? "rounded-[1.35rem] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
    : isDockedComposer
      ? "rounded-[1.45rem] border border-slate-900/10 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
      : "rounded-[1.35rem] border border-slate-900/10 bg-white";
  const textareaClass = isPanelComposer
    ? "min-h-[102px] bg-transparent text-slate-950 placeholder:text-slate-400"
    : isDockedComposer
      ? "min-h-[124px] bg-transparent text-slate-950 placeholder:text-slate-400"
      : "min-h-[132px] bg-transparent text-slate-950 placeholder:text-slate-400";
  const dockHeightClass = isPanelComposer ? "min-h-[72px]" : compact ? "min-h-[84px]" : "min-h-[118px]";
  const uploadCardSizeClass = isPanelComposer ? "h-[8.5rem] w-[5rem]" : compact ? "h-24 w-[4.9rem]" : "h-28 w-[5.9rem]";

  useEffect(() => {
    if (!openDropdown) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!composerRef.current?.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [openDropdown]);

  if (isPanelComposer) {
    return (
      <div ref={composerRef} className={outerClassName}>
        <div className="grid grid-cols-[76px_minmax(0,1fr)] items-stretch gap-3 rounded-[1.65rem] bg-white px-3 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="flex items-start justify-center pt-0.5">
            {referenceImage ? (
              <div
                className={`relative overflow-hidden rounded-[1rem] border border-slate-900/6 bg-white shadow-[0_10px_26px_rgba(15,23,42,0.06)] ${uploadCardSizeClass} ${
                  isDockedComposer ? "-rotate-[8deg]" : ""
                }`}
              >
                <img src={referenceImage.url} alt={referenceImage.name} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={onRemoveReferenceImage}
                  className="absolute top-2 right-2 cursor-pointer rounded-full bg-slate-950/82 px-2 py-1 text-[11px] font-semibold text-white"
                  aria-label="清除上传图片"
                >
                  ×
                </button>
              </div>
            ) : (
              <label
                htmlFor={uploadInputId}
                aria-label="上传图片"
                className={`flex cursor-pointer items-center justify-center rounded-[1rem] border border-slate-900/6 bg-white text-center shadow-[0_10px_26px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-slate-900/14 ${
                  isDockedComposer ? "-rotate-[8deg]" : ""
                } ${uploadCardSizeClass}`}
              >
                <span className="text-[2rem] font-light leading-none text-slate-700">+</span>
                <span className="sr-only">上传图片</span>
              </label>
            )}

            <input
              id={uploadInputId}
              hidden
              accept="image/*"
              type="file"
              onChange={(event) => {
                void onReferenceImageChange(event.target.files?.[0] ?? null);
                event.currentTarget.value = "";
              }}
            />
          </div>

          <div className="relative min-w-0">
            <div className="relative min-h-[122px] rounded-[1.3rem] bg-transparent">
              <textarea
                className="min-h-[122px] w-full resize-none border-0 bg-transparent px-3 py-2.5 pr-3 pb-14 text-sm leading-[1.6] text-slate-950 outline-none placeholder:text-slate-400"
                placeholder="请描述你想生成的图片"
                value={prompt}
                onChange={(event) => onPromptChange(event.target.value)}
              />
              <div className="absolute right-0 bottom-0 left-0 flex items-center justify-between gap-3 px-3 pb-1">
                <div className="flex min-w-0 items-center gap-2">
                  <div className="relative">
                    <DropdownButton
                      compact
                      isOpen={openDropdown === "model"}
                      label="Model"
                      value={formatModelLabel(selectedModelId)}
                      onToggle={() => setOpenDropdown((current) => (current === "model" ? null : "model"))}
                    />
                    {openDropdown === "model" ? (
                      <DropdownPanel
                        bodyClassName="max-h-[11.5rem]"
                        className="left-0 w-[min(30rem,calc(100vw-8rem))]"
                        placement="up"
                      >
                        {chatModelOptions.map((option) => (
                          <DropdownOption
                            key={option.id}
                            description={option.description}
                            label={option.label}
                            selected={selectedModelId === option.id}
                            onClick={() => {
                              onSelectModel(option.id);
                              setOpenDropdown(null);
                            }}
                          />
                        ))}
                      </DropdownPanel>
                    ) : null}
                  </div>
                  <div className="relative">
                    <DropdownButton
                      compact
                      isOpen={openDropdown === "ratio"}
                      label="Ratio"
                      value={formatRatioLabel(selectedRatioId)}
                      onToggle={() => setOpenDropdown((current) => (current === "ratio" ? null : "ratio"))}
                    />
                    {openDropdown === "ratio" ? (
                      <DropdownPanel
                        bodyClassName="max-h-[9rem]"
                        className="left-0 w-[min(22rem,calc(100vw-8rem))]"
                        placement="up"
                      >
                        {chatRatioOptions.map((option) => (
                          <DropdownOption
                            key={option.id}
                            description={option.description}
                            label={option.label}
                            selected={selectedRatioId === option.id}
                            onClick={() => {
                              onSelectRatio(option.id);
                              setOpenDropdown(null);
                            }}
                          />
                        ))}
                      </DropdownPanel>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onSubmit}
                  aria-label={submitLabel}
                  className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-950 text-xl font-semibold text-white transition hover:bg-slate-800"
                >
                  ↑
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  if (isDarkComposer) {
    return (
      <div ref={composerRef} className={outerClassName}>
        <div className="px-6 pt-7 pb-4 sm:px-8 sm:pt-8">
          {referenceImage || attachedPoster ? (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {referenceImage ? (
                <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/6 px-2 py-1.5 text-xs font-semibold text-neutral-300">
                  <img src={referenceImage.url} alt={referenceImage.name} className="h-8 w-8 rounded-md object-cover" />
                  <span className="max-w-[10rem] truncate">{referenceImage.name}</span>
                  <button
                    type="button"
                    onClick={onRemoveReferenceImage}
                    className="ml-1 cursor-pointer text-neutral-500 transition hover:text-white"
                    aria-label="清除上传图片"
                  >
                    ×
                  </button>
                </div>
              ) : null}
              {attachedPoster ? (
                <div className="flex items-center gap-2 rounded-lg border border-[#ffb4aa]/18 bg-[#ffb4aa]/10 px-2 py-1.5 text-xs font-semibold text-[#ffdad5]">
                  <img src={attachedPoster.imageUrl} alt={attachedPoster.title} className="h-8 w-8 rounded-md object-cover" />
                  <span className="max-w-[10rem] truncate">{attachedPoster.title}</span>
                  {onRemoveAttachedPoster && (
                    <button
                      type="button"
                      onClick={onRemoveAttachedPoster}
                      className="ml-1 cursor-pointer rounded px-1.5 py-0.5 text-[#ffb4aa]/70 transition hover:bg-[#ffb4aa]/20 hover:text-[#ffdad5]"
                      aria-label="Remove attached poster"
                    >
                      ×
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          <textarea
            className="min-h-[140px] w-full resize-none border-0 bg-transparent text-xl leading-relaxed font-light text-neutral-100 outline-none placeholder:text-neutral-700"
            placeholder="A lone wanderer stands at the edge of a neon-drenched futuristic canyon, cinematic lighting, 8k resolution, film grain..."
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <label
              htmlFor={uploadInputId}
              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-white/7 px-4 text-xs font-bold tracking-[0.14em] text-neutral-300 uppercase transition hover:bg-white/12 hover:text-white"
            >
              <span aria-hidden="true" className="text-sm leading-none">▣</span>
              Reference
            </label>
            <input
              id={uploadInputId}
              hidden
              accept="image/*"
              type="file"
              onChange={(event) => {
                void onReferenceImageChange(event.target.files?.[0] ?? null);
                event.currentTarget.value = "";
              }}
            />

            <div className="mx-2 hidden h-6 w-px bg-white/10 sm:block" />

            <div className="relative">
              <DropdownButton
                isOpen={openDropdown === "model"}
                label="Model"
                tone="dark"
                value={formatModelLabel(selectedModelId)}
                onToggle={() => setOpenDropdown((current) => (current === "model" ? null : "model"))}
              />
              {openDropdown === "model" ? (
                <DropdownPanel bodyClassName="max-h-[12rem]" className="left-0 w-[min(30rem,calc(100vw-6rem))]" placement="up" tone="dark">
                  {chatModelOptions.map((option) => (
                    <DropdownOption
                      key={option.id}
                      description={option.description}
                      label={option.label}
                      selected={selectedModelId === option.id}
                      tone="dark"
                      onClick={() => {
                        onSelectModel(option.id);
                        setOpenDropdown(null);
                      }}
                    />
                  ))}
                </DropdownPanel>
              ) : null}
            </div>

            <div className="relative">
              <DropdownButton
                isOpen={openDropdown === "ratio"}
                label="Ratio"
                tone="dark"
                value={formatRatioLabel(selectedRatioId)}
                onToggle={() => setOpenDropdown((current) => (current === "ratio" ? null : "ratio"))}
              />
              {openDropdown === "ratio" ? (
                <DropdownPanel bodyClassName="max-h-[10rem]" className="left-0 w-[min(22rem,calc(100vw-6rem))]" placement="up" tone="dark">
                  {chatRatioOptions.map((option) => (
                    <DropdownOption
                      key={option.id}
                      description={option.description}
                      label={option.label}
                      selected={selectedRatioId === option.id}
                      tone="dark"
                      onClick={() => {
                        onSelectRatio(option.id);
                        setOpenDropdown(null);
                      }}
                    />
                  ))}
                </DropdownPanel>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={onSubmit}
            aria-label={submitLabel}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center self-end rounded-full bg-neutral-100 text-xl font-semibold text-black shadow-xl transition hover:scale-105 hover:bg-white active:scale-95 sm:self-auto"
          >
            ↑
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={composerRef} className={`${outerClassName} ${compact ? "rounded-[1.7rem]" : ""}`}>
      {compact && panelRecord ? (
        <button
          type="button"
          onClick={onOpenPanel}
          className="flex w-full cursor-pointer items-center justify-between gap-3 border-b border-slate-900/8 px-4 py-3 text-left transition hover:bg-white/30"
        >
          <div className="min-w-0">
            <p className="text-[11px] tracking-[0.26em] text-slate-400 uppercase">当前生图状态</p>
            <div className="mt-1 flex items-center gap-2">
              {panelRecord.status === "submitting" ? <GenerationSpinner sizeClassName="h-4 w-4" /> : null}
              <p className="truncate text-sm font-semibold text-slate-950">
                {panelRecord.status === "submitting" ? "生成中" : "打开生图面板"}
              </p>
            </div>
          </div>
          <DeckStatusPill status={panelRecord.status} />
        </button>
      ) : null}

      <div
        className={`px-4 py-4 sm:px-5 sm:py-5 ${compact ? "px-3.5 py-3.5 sm:px-4 sm:py-4" : ""} ${
          isPanelComposer ? "px-0 py-0" : ""
        }`}
      >
        <div className={`grid gap-2.5 ${compact || isPanelComposer ? "grid-cols-[82px_1fr]" : "lg:grid-cols-[92px_1fr]"}`}>
          <div className="flex flex-col items-center justify-start gap-2">
            {referenceImage ? (
              <div
                className={`relative overflow-hidden rounded-[1rem] border border-slate-900/6 bg-white shadow-[0_10px_26px_rgba(15,23,42,0.06)] ${uploadCardSizeClass} ${
                  isDockedComposer ? "-rotate-[8deg]" : ""
                }`}
              >
                <img src={referenceImage.url} alt={referenceImage.name} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={onRemoveReferenceImage}
                  className="absolute top-2 right-2 cursor-pointer rounded-full bg-slate-950/82 px-2 py-1 text-[11px] font-semibold text-white"
                >
                  清除
                </button>
              </div>
            ) : (
              <label
                htmlFor={uploadInputId}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-[1rem] border border-slate-900/6 bg-white text-center shadow-[0_10px_26px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-slate-900/14 ${
                  isDockedComposer ? "-rotate-[8deg]" : ""
                } ${uploadCardSizeClass}`}
              >
                <span className="text-2xl font-light text-slate-700">+</span>
                <p className="mt-1 text-sm font-semibold text-slate-900">上传图片</p>
              </label>
            )}

            <input
              id={uploadInputId}
              hidden
              accept="image/*"
              type="file"
              onChange={(event) => {
                void onReferenceImageChange(event.target.files?.[0] ?? null);
                event.currentTarget.value = "";
              }}
            />

            {attachedPoster && isDockedComposer && !isPanelComposer ? (
              <div className="mt-2 flex max-w-[12rem] items-center gap-1.5 rounded-full bg-slate-900/10 py-1 pl-2 pr-1 text-[11px] font-semibold text-slate-800 shadow-sm backdrop-blur">
                <img src={attachedPoster.imageUrl} alt={attachedPoster.title} className="h-4 w-4 shrink-0 rounded object-cover shadow-sm" />
                <span className="truncate">{attachedPoster.title}</span>
                {onRemoveAttachedPoster && (
                  <button
                    type="button"
                    onClick={onRemoveAttachedPoster}
                    className="ml-0.5 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-slate-900/10 text-[10px] text-slate-500 transition hover:bg-rose-500 hover:text-white"
                    aria-label="Remove attached poster"
                  >
                    ×
                  </button>
                )}
              </div>
            ) : null}
          </div>

          <div className="space-y-2.5">
            <div className={inputShellClass}>
              <textarea
                className={`w-full resize-none border-0 px-4 py-3 text-sm leading-[1.65] outline-none ${dockHeightClass} ${textareaClass}`}
                placeholder="上传参考图、输入文字或 @ 主体，描述你想生成的海报。"
                value={prompt}
                onChange={(event) => onPromptChange(event.target.value)}
              />
            </div>

            <div className="relative">
              <div
                className={`flex flex-col gap-2.5 ${isPanelComposer ? "pt-1.5" : "border-t border-slate-900/8 pt-2.5"} ${
                  compact ? "" : "lg:flex-row lg:items-end lg:justify-between"
                }`}
              >
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <DropdownButton
                      isOpen={openDropdown === "model"}
                      label="Model"
                      value={formatModelLabel(selectedModelId)}
                      onToggle={() => setOpenDropdown((current) => (current === "model" ? null : "model"))}
                    />
                    {openDropdown === "model" ? (
                      <DropdownPanel
                        bodyClassName={isPanelComposer ? "max-h-[11.5rem]" : "max-h-[12rem]"}
                        className="left-0 w-[min(30rem,calc(100vw-6rem))]"
                        placement="up"
                      >
                        {chatModelOptions.map((option) => (
                          <DropdownOption
                            key={option.id}
                            description={option.description}
                            label={option.label}
                            selected={selectedModelId === option.id}
                            onClick={() => {
                              onSelectModel(option.id);
                              setOpenDropdown(null);
                            }}
                          />
                        ))}
                      </DropdownPanel>
                    ) : null}
                  </div>
                  <div className="relative">
                    <DropdownButton
                      isOpen={openDropdown === "ratio"}
                      label="Ratio"
                      value={formatRatioLabel(selectedRatioId)}
                      onToggle={() => setOpenDropdown((current) => (current === "ratio" ? null : "ratio"))}
                    />
                    {openDropdown === "ratio" ? (
                      <DropdownPanel
                        bodyClassName={isPanelComposer ? "max-h-[9rem]" : "max-h-[10rem]"}
                        className="left-0 w-[min(22rem,calc(100vw-6rem))]"
                        placement="up"
                      >
                        {chatRatioOptions.map((option) => (
                          <DropdownOption
                            key={option.id}
                            description={option.description}
                            label={option.label}
                            selected={selectedRatioId === option.id}
                            onClick={() => {
                              onSelectRatio(option.id);
                              setOpenDropdown(null);
                            }}
                          />
                        ))}
                      </DropdownPanel>
                    ) : null}
                  </div>
                </div>

                {isDockedComposer ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end">
                    {!isPanelComposer ? <p className="min-w-0 flex-1 text-sm leading-6 text-slate-500">{notice}</p> : null}
                    <button
                      type="button"
                      onClick={onSubmit}
                      aria-label={submitLabel}
                      className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-950 text-xl font-semibold text-white transition hover:bg-slate-800"
                    >
                      ↑
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onSubmit}
                    className="cursor-pointer rounded-[1.15rem] bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    {submitLabel}
                  </button>
                )}
              </div>

            </div>

            {!isDockedComposer ? (
              <p className="rounded-[1.05rem] border border-slate-900/8 bg-white/72 px-3.5 py-3 text-sm leading-6 text-slate-600">
                {notice}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function AmbientTaskRail({
  activeRecord,
  historyCount
}: {
  activeRecord: ChatGenerationRecord | null;
  historyCount: number;
}) {
  return (
    <aside className="space-y-4">
      <div className="rounded-[1.8rem] border border-white/12 bg-white/8 p-5 shadow-[0_20px_60px_rgba(4,8,15,0.18)] backdrop-blur-sm">
        <p className="text-xs tracking-[0.3em] text-slate-300 uppercase">Panel Stack</p>
        <h4 className="mt-3 font-[var(--font-editorial)] text-3xl leading-none text-white">前景生图堆栈</h4>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          最新任务会浮到最上层，上一轮自动折叠到历史层。滚动离开主对话框后，底部小型对话框会继续锚定在页面底部中央。
        </p>
      </div>

      <div className="rounded-[1.8rem] border border-white/12 bg-[#0d1824] p-5 shadow-[0_20px_60px_rgba(4,8,15,0.18)]">
        {activeRecord ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.26em] text-slate-300 uppercase">Latest Surface</p>
                <h5 className="mt-2 text-lg font-semibold text-white">{activeRecord.posterTitle}</h5>
              </div>
              <DeckStatusPill status={activeRecord.status} />
            </div>

            <div className="overflow-hidden rounded-[1.35rem] bg-slate-950">
              {activeRecord.results[0] ? (
                <div className="relative aspect-[3/4]">
                  <img src={activeRecord.results[0].imageUrl} alt={activeRecord.results[0].title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/14 to-transparent" />
                  <div className="absolute right-4 bottom-4 left-4">
                    <p className="text-[11px] tracking-[0.26em] text-sky-200 uppercase">{formatRatioLabel(activeRecord.ratioId)}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{activeRecord.results[0].title}</p>
                  </div>
                </div>
              ) : (
                <div className="aspect-[3/4] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5">
                  <div className="flex h-full flex-col justify-between rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
                    <div>
                      <p className="text-xs tracking-[0.24em] text-slate-400 uppercase">生成预览</p>
                      <p className="mt-3 text-sm leading-6 text-slate-300">
                        {activeRecord.status === "submitting" ? "正在生成 4 张图，等待模型返回。" : activeRecord.insight}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 rounded-[1rem] border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200">
                      {activeRecord.status === "submitting" ? <GenerationSpinner sizeClassName="h-5 w-5" /> : null}
                      <span>{activeRecord.status === "submitting" ? "生成中" : statusTextMap[activeRecord.status]}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatChip label="历史层数" value={`${historyCount}`} />
              <StatChip label="当前模型" value={formatModelLabel(activeRecord.modelId)} />
              <StatChip label="当前比例" value={formatRatioLabel(activeRecord.ratioId)} />
              <StatChip label="当前状态" value={statusTextMap[activeRecord.status]} />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-[1.35rem] border border-dashed border-white/12 bg-white/4 p-5">
              <p className="text-xs tracking-[0.24em] text-slate-300 uppercase">尚未生成</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                第一次点击“开始生图”后，结果面板会从这里的背景舞台前方浮起，历史会开始叠层。
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatChip label="主入口" value="上方对话框" />
              <StatChip label="离开视口" value="底部小对话框" />
              <StatChip label="模板注入" value="使用模板" />
              <StatChip label="历史浏览" value="右侧上下箭头" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function DropdownButton({
  compact = false,
  isOpen,
  label,
  onToggle,
  tone = "light",
  value
}: {
  compact?: boolean;
  isOpen: boolean;
  label: string;
  onToggle: () => void;
  tone?: "dark" | "light";
  value: string;
}) {
  const darkIdleClass = "bg-white/7 text-neutral-300 hover:bg-white/12 hover:text-white";
  const darkOpenClass = "bg-white/12 text-white shadow-[0_16px_32px_rgba(0,0,0,0.22)]";
  const lightIdleClass = "border-slate-900/10 bg-white text-slate-700 hover:border-slate-900/18 hover:bg-slate-50";
  const lightOpenClass = "border-slate-900 bg-slate-950 text-white shadow-[0_16px_32px_rgba(15,23,42,0.18)]";
  const toneClass = tone === "dark" ? (isOpen ? darkOpenClass : darkIdleClass) : isOpen ? lightOpenClass : lightIdleClass;
  const labelClass =
    tone === "dark"
      ? "text-xs font-bold tracking-[0.14em] text-neutral-300 uppercase"
      : isOpen
        ? "text-white/72"
        : "text-slate-400";
  const valueClass = tone === "dark" ? "truncate text-right text-xs font-bold tracking-normal text-neutral-300 normal-case" : "truncate text-right";
  const arrowClass = tone === "dark" ? "text-neutral-500" : isOpen ? "text-white/72" : "text-slate-400";
  const buttonSizeClass =
    tone === "dark"
      ? `h-9 rounded-lg px-4 text-xs font-bold ${compact ? "min-w-[8.75rem]" : "min-w-[10rem]"}`
      : `h-11 rounded-[1rem] border px-3.5 text-sm font-semibold ${compact ? "min-w-[8.75rem]" : "min-w-[10rem]"}`;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex max-w-full cursor-pointer items-center justify-between gap-2 transition ${buttonSizeClass} ${toneClass}`}
    >
      <span className={labelClass}>{label}</span>
      <span className={valueClass}>{value}</span>
      <span className={`text-xs transition ${isOpen ? "rotate-180" : ""} ${arrowClass}`}>▾</span>
    </button>
  );
}

function DropdownPanel({
  bodyClassName = "",
  children,
  className = "",
  maxHeightClass = "max-h-[22rem]",
  placement = "down",
  tone = "light",
  title
}: {
  bodyClassName?: string;
  children: ReactNode;
  className?: string;
  maxHeightClass?: string;
  placement?: "down" | "up";
  tone?: "dark" | "light";
  title?: string;
}) {
  const placementClass =
    placement === "up"
      ? `bottom-full left-0 ${tone === "dark" ? "mb-3" : "mb-0"} origin-bottom-left`
      : `top-full left-0 ${tone === "dark" ? "mt-3" : "mt-2"} origin-top-left`;
  const panelClass =
    tone === "dark"
      ? "rounded-lg border-white/10 bg-[#181918]/96 text-neutral-100 shadow-none backdrop-blur-xl"
      : "rounded-[1.45rem] border-slate-900/10 bg-white text-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.18)]";
  const titleClass = tone === "dark" ? "border-white/8 text-neutral-300" : "border-slate-900/8 text-slate-900";
  const panelPaddingClass = tone === "dark" ? "p-2" : "";
  const bodyPaddingClass = tone === "dark" ? "" : "p-2";

  return (
    <div
      className={`absolute z-30 overflow-hidden border ${panelPaddingClass} ${panelClass} ${placementClass} ${className}`}
    >
      {title ? (
        <div className={`border-b px-3 py-3 ${titleClass}`}>
          <p className="text-xs font-semibold">{title}</p>
        </div>
      ) : null}
      <div className={`overflow-y-auto ${bodyPaddingClass} ${bodyClassName || maxHeightClass}`}>{children}</div>
    </div>
  );
}

function DropdownOption({
  description,
  label,
  onClick,
  selected,
  tone = "light"
}: {
  description: string;
  label: string;
  onClick: () => void;
  selected: boolean;
  tone?: "dark" | "light";
}) {
  const optionClass =
    tone === "dark"
      ? selected
        ? "bg-white/8 text-white"
        : "text-neutral-300 hover:bg-white/8 hover:text-white"
      : selected
        ? "bg-slate-950 text-white"
        : "text-slate-900 hover:bg-slate-50";
  const descriptionClass =
    tone === "dark"
      ? selected
        ? "text-neutral-400"
        : "text-neutral-500"
      : selected
        ? "text-white/72"
        : "text-slate-500";
  const checkClass =
    tone === "dark"
      ? selected
        ? "text-[#ffb4aa]"
        : "text-transparent"
      : selected
        ? "text-white"
        : "text-transparent";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full cursor-pointer items-start justify-between gap-4 rounded-md px-3 py-2.5 text-left text-sm font-semibold transition ${optionClass}`}
    >
      <div className="space-y-1">
        <p className="text-sm leading-5 font-semibold">{label}</p>
        <p className={`text-xs leading-5 ${descriptionClass}`}>{description}</p>
      </div>
      <span className={`mt-0.5 text-sm font-semibold ${checkClass}`}>✓</span>
    </button>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.1rem] border border-white/10 bg-white/6 px-3.5 py-3">
      <p className="text-[11px] tracking-[0.24em] text-slate-300 uppercase">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function GenerationSpinner({
  sizeClassName = "h-6 w-6",
  tone = "dark"
}: {
  sizeClassName?: string;
  tone?: "dark" | "light";
}) {
  const colorClass = tone === "light" ? "border-white/25 border-t-white" : "border-slate-300 border-t-slate-950";

  return <span aria-hidden="true" className={`inline-block animate-spin rounded-full border-2 ${colorClass} ${sizeClassName}`} />;
}

function GenerationDeckPanel({
  activeIndex,
  canViewNewer,
  canViewOlder,
  children,
  historyCount,
  onBrowseHistory,
  onClose,
  panelRecord
}: {
  activeIndex: number;
  canViewNewer: boolean;
  canViewOlder: boolean;
  children: ReactNode;
  historyCount: number;
  onBrowseHistory: (direction: "newer" | "older") => void;
  onClose: () => void;
  panelRecord: ChatGenerationRecord;
}) {
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-[rgba(3,7,12,0.58)] backdrop-blur-[18px]" />

      <div className="relative flex h-full items-center justify-center px-4 py-6 sm:px-8">
        <div className="relative w-[min(79vw,1480px)] max-w-[1480px] max-sm:w-[96vw]">
          <div className="absolute top-0 -right-18 z-20 hidden w-14 flex-col items-center gap-4 xl:flex">
            <button
              type="button"
              onClick={onClose}
              className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-slate-900/10 bg-white/92 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(15,23,42,0.14)] transition hover:bg-white"
              aria-label="退出 / 返回"
            >
              ×
            </button>
          </div>

          <div className="absolute top-1/2 -right-18 z-20 hidden -translate-y-1/2 w-14 flex-col items-center gap-4 xl:flex">
            <HistoryArrowButton disabled={!canViewNewer} direction="up" onClick={() => onBrowseHistory("newer")} />
            <HistoryArrowButton disabled={!canViewOlder} direction="down" onClick={() => onBrowseHistory("older")} />
            <p className="text-sm font-semibold text-white/92">
              {activeIndex + 1} / {historyCount}
            </p>
          </div>

          <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#efe7d9] shadow-[0_36px_120px_rgba(2,6,10,0.45)]">
            <div className="px-4 pt-5 pb-0.5 sm:px-5 sm:pt-[1.375rem] sm:pb-0.5">
              <GenerationPreviewSurface record={panelRecord} />
            </div>

            <PromptOverviewStrip
              modelId={panelRecord.modelId}
              prompt={panelRecord.prompt}
              ratioId={panelRecord.ratioId}
            />

            <div className="px-4 pt-0.5 pb-4 sm:px-5 sm:pt-1 sm:pb-5">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GenerationPreviewSurface({ record }: { record: ChatGenerationRecord }) {
  const displayResults = buildDisplayResults(record);

  return (
    <div className="overflow-hidden">
      <div className="grid w-full grid-cols-4 gap-[1mm]">
        {displayResults.map((result, index) => (
          <GenerationImageCard
            key={result.id}
            index={index}
            record={record}
            result={result}
          />
        ))}
      </div>
    </div>
  );
}

function GenerationImageCard({
  index,
  record,
  result
}: {
  index: number;
  record: ChatGenerationRecord;
  result: WorkspaceGeneratedResult;
}) {
  if (record.status === "submitting") {
    return (
      <article className="relative w-full overflow-hidden rounded-[0.9rem] bg-slate-950 aspect-[3/4]">
        <img src={result.imageUrl} alt={result.title} className="h-full w-full object-cover blur-[14px] scale-[1.04]" />
        <div className="absolute inset-0 bg-slate-950/36" />
        <div className="absolute top-3 left-3 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {formatGenerationImageIndex(index)}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-[1.35rem] bg-slate-950/74 px-6 py-5 text-center backdrop-blur-sm">
            <div className="flex justify-center">
              <GenerationSpinner sizeClassName="h-9 w-9" tone="light" />
            </div>
            <p className="mt-4 text-xs tracking-[0.24em] text-slate-300 uppercase">生成中</p>
            <p className="mt-2 text-sm font-semibold text-white">等待模型返回</p>
          </div>
        </div>
      </article>
    );
  }

  if (record.status === "failed") {
    return (
      <article className="relative w-full overflow-hidden rounded-[0.9rem] bg-rose-50 aspect-[3/4]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,113,133,0.14),transparent_58%)]" />
        <div className="relative flex h-full flex-col justify-between p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-900">
              {formatGenerationImageIndex(index)}
            </div>
            <p className="text-xs tracking-[0.24em] text-rose-700 uppercase">生成失败</p>
          </div>
          <p className="text-sm leading-6 text-rose-900">{record.insight}</p>
        </div>
      </article>
    );
  }

  return (
    <article className="group relative w-full overflow-hidden rounded-[0.9rem] bg-slate-950 shadow-[0_18px_40px_rgba(6,12,18,0.14)] aspect-[3/4]">
      <img src={result.imageUrl} alt={result.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.01]" />
      <div className="absolute top-3 left-3 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
        {formatGenerationImageIndex(index)}
      </div>
      <div className="pointer-events-none absolute right-3 bottom-3 left-3 translate-y-3 opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
        <a
          href={result.imageUrl}
          target="_blank"
          rel="noreferrer"
          download
          className="pointer-events-auto inline-flex w-full items-center justify-center rounded-[1rem] bg-white/92 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition hover:bg-white"
        >
          下载
        </a>
      </div>
    </article>
  );
}

function buildDisplayResults(record: ChatGenerationRecord) {
  if (record.results.length >= 4) {
    return record.results.slice(0, 4);
  }

  const seedResult =
    record.results[0] ??
    ({
      id: `${record.id}-seed`,
      imageUrl: record.referenceImageUrl || "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
      summary: record.insight,
      title: `${record.posterTitle} - 结果 1`
    } satisfies WorkspaceGeneratedResult);

  return Array.from({ length: 4 }, (_, index) => {
    const existing = record.results[index];

    if (existing) {
      return existing;
    }

    return {
      ...seedResult,
      id: `${seedResult.id}-fallback-${index + 1}`,
      title: `${record.posterTitle} - 结果 ${index + 1}`
    };
  });
}

function PromptOverviewStrip({
  modelId,
  prompt,
  ratioId
}: {
  modelId: string;
  prompt: string;
  ratioId: string;
}) {
  return (
    <div className="px-4 py-1.5 sm:px-5 sm:py-2">
      <div className="flex flex-col gap-1 text-[11px] leading-5 text-slate-400">
        <div className="relative max-w-full">
          <div className="group/prompt inline-block max-w-full align-top">
            <p className="max-w-full cursor-default truncate text-[11px] leading-5 text-slate-500">{prompt}</p>
            <div className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 w-[min(42rem,calc(100vw-10rem))] translate-y-2 rounded-[1rem] border border-slate-900/8 bg-white/95 px-4 py-3 text-[12px] leading-6 text-slate-700 opacity-0 shadow-[0_18px_40px_rgba(15,23,42,0.14)] transition duration-200 group-hover/prompt:pointer-events-auto group-hover/prompt:translate-y-0 group-hover/prompt:opacity-100">
              {prompt}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] leading-4 text-slate-400">
          <span>模型 {formatModelLabel(modelId)}</span>
          <span>比例 {formatRatioLabel(ratioId)}</span>
        </div>
      </div>
    </div>
  );
}

function ModeTitlePicker({
  mode,
  onSelect
}: {
  mode: WorkspaceMode;
  onSelect: (mode: WorkspaceMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  const label = mode === "chat" ? "AI Chat" : "AI Draw";
  const alternateModes = (["chat", "draw"] as WorkspaceMode[]).filter((item) => item !== mode);

  return (
    <div className="flex justify-center text-center">
      <h1 className="inline-flex items-baseline whitespace-nowrap font-[var(--font-ui)] text-[1.45rem] leading-none font-extrabold tracking-normal text-white sm:text-4xl md:text-5xl">
        <span>Start Creating With&nbsp;</span>
        <span ref={rootRef} className="relative inline-flex align-baseline">
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="inline-flex cursor-pointer items-center leading-none tracking-normal transition"
          >
            <span className="bg-gradient-to-r from-[#ffb4aa] to-[#e50914] bg-clip-text text-transparent">
              {label}
            </span>
            <span className="ml-1 inline-flex text-[0.34em] leading-none text-[#FFB4AA]/80">⌄</span>
          </button>

          {open ? (
            <span className="absolute top-full left-0 z-30 mt-[calc((4rem-1em)/2)] min-w-[11rem] py-0 text-left leading-none drop-shadow-[0_22px_50px_rgba(0,0,0,0.52)]">
              {alternateModes.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                  className="block w-full cursor-pointer px-0 py-0 text-left font-[var(--font-ui)] leading-none font-extrabold tracking-normal transition"
                >
                  <span className="whitespace-nowrap bg-gradient-to-r from-[#ffb4aa] to-[#e50914] bg-clip-text text-transparent">
                    {item === "chat" ? "AI Chat" : "AI Draw"}
                  </span>
                </button>
              ))}
            </span>
          ) : null}
        </span>
      </h1>
    </div>
  );
}

function HistoryArrowButton({
  direction,
  disabled,
  onClick
}: {
  direction: "down" | "up";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-slate-900/10 bg-white text-lg font-semibold text-slate-950 shadow-[0_18px_40px_rgba(15,23,42,0.14)] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
    >
      {direction === "up" ? "↑" : "↓"}
    </button>
  );
}

function DrawWorkspace({
  applyReferenceToDrawModules,
  drawMessage,
  drawState,
  isSubmitting,
  onGenerate,
  selectedPoster,
  toggleDrawImportSelection,
  toggleDrawModule,
  updateDrawWeight
}: {
  applyReferenceToDrawModules: () => void;
  drawMessage: string;
  drawState: DrawModuleState;
  isSubmitting: boolean;
  onGenerate: () => void;
  selectedPoster: PosterRecord | null;
  toggleDrawImportSelection: (moduleKey: keyof DrawModuleState) => void;
  toggleDrawModule: (moduleKey: keyof DrawModuleState) => void;
  updateDrawWeight: (moduleKey: keyof DrawModuleState, weight: number) => void;
}) {
  const selectedModuleLabels = drawModules
    .filter((module) => drawState[module.key].selectedForImport)
    .map((module) => module.label);
  const readyModuleLabels = drawModules
    .filter((module) => drawState[module.key].enabled && Boolean(drawState[module.key].importedValue))
    .map((module) => module.label);

  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs tracking-[0.26em] text-[#ffb4aa] uppercase">AI Draw Mode</p>
        <h3 className="mt-2 text-2xl font-semibold text-white">六模块参数工作区</h3>
        <p className="mt-2 text-sm leading-6 text-neutral-400">
          参考海报会先作为占位插入工作区，再由用户多选六个参数模块，触发 AI 识别并把结果灌入对应模块，最后提交生成占位结果。
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-white/12 bg-white/5 p-4">
        {selectedPoster ? (
          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div className="overflow-hidden rounded-lg bg-slate-950">
              {imgFailed ? (
                <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-[#2a1a2e] via-[#1a1a2e] to-[#0d1117] p-4 text-center">
                  <span className="text-4xl">🎬</span>
                  <p className="mt-3 font-[var(--font-display)] text-lg font-bold leading-tight text-white/80">{selectedPoster.title}</p>
                </div>
              ) : (
                <img
                  src={selectedPoster.imageUrl}
                  alt={selectedPoster.title}
                  className="h-full w-full object-cover"
                  onError={() => setImgFailed(true)}
                />
              )}
            </div>
            <div>
              <p className="text-xs tracking-[0.24em] text-[#ffb4aa] uppercase">Reference Inserted</p>
              <h4 className="mt-2 text-xl font-semibold text-white">{selectedPoster.title}</h4>
              <p className="mt-2 text-sm leading-6 text-neutral-400">{selectedPoster.description}</p>
              <p className="mt-4 rounded-lg border border-[#ffb4aa]/18 bg-[#ffb4aa]/10 px-4 py-3 text-sm leading-6 text-[#ffdad5]">
                {drawMessage}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-7 text-neutral-400">
            当前还没有进入 AI Draw 的参考海报。你可以从海报库页通过 Use -&gt; AI Draw 进入，或者直接点击本页下方灵感区海报。
          </p>
        )}
      </div>

      <div className="rounded-lg border border-white/6 bg-white/5 p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs tracking-[0.24em] text-neutral-500 uppercase">Parameter Injection</p>
            <h4 className="mt-2 text-lg font-semibold text-white">选择要从参考海报提取的模块</h4>
          </div>

          <button
            type="button"
            onClick={applyReferenceToDrawModules}
            className="cursor-pointer rounded-lg bg-neutral-100 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white"
          >
            识别并灌入所选模块
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {drawModules.map((module) => {
            const moduleState = drawState[module.key];

            return (
              <button
                key={module.key}
                type="button"
                onClick={() => toggleDrawImportSelection(module.key)}
                className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition ${
                  moduleState.selectedForImport
                    ? "bg-[#e50914] text-white"
                    : "border border-white/8 bg-white/6 text-neutral-400 hover:border-[#ffb4aa]/38 hover:text-white"
                }`}
              >
                {module.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-3 rounded-lg border border-white/6 bg-[#0d0e0d]/72 p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs tracking-[0.22em] text-neutral-500 uppercase">Injection Queue</p>
            <p className="mt-2 text-sm leading-6 text-neutral-300">
              {selectedModuleLabels.length > 0 ? selectedModuleLabels.join(" / ") : "当前还没有选择要识别的模块"}
            </p>
          </div>
          <div>
            <p className="text-xs tracking-[0.22em] text-neutral-500 uppercase">Ready For Generate</p>
            <p className="mt-2 text-sm leading-6 text-neutral-300">
              {readyModuleLabels.length > 0 ? readyModuleLabels.join(" / ") : "先识别并启用至少一个模块"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {drawModules.map((module) => {
          const moduleState = drawState[module.key];
          const posterValue = moduleState.importedValue || "等待 AI 识别并写入参数";

          return (
            <article key={module.key} className="rounded-lg border border-white/6 bg-white/5 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs tracking-[0.24em] text-neutral-500 uppercase">{module.label}</p>
                  <p className="mt-2 text-sm leading-6 text-neutral-300">{posterValue}</p>
                  {moduleState.selectedForImport ? (
                    <p className="mt-2 text-xs tracking-[0.22em] text-[#ffb4aa] uppercase">已加入识别队列</p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => toggleDrawModule(module.key)}
                  className={`cursor-pointer rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    moduleState.enabled
                      ? "bg-neutral-100 text-black"
                      : "border border-white/8 bg-white/6 text-neutral-500"
                  }`}
                >
                  {moduleState.enabled ? "已启用" : "未启用"}
                </button>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-xs tracking-[0.22em] text-neutral-500 uppercase">
                  <span>Weight</span>
                  <span>{moduleState.weight}%</span>
                </div>
                <input
                  className="mt-3 w-full accent-[#ffb4aa]"
                  max={100}
                  min={0}
                  type="range"
                  value={moduleState.weight}
                  onChange={(event) => updateDrawWeight(module.key, Number(event.target.value))}
                />
              </div>
            </article>
          );
        })}
      </div>

      <div className="rounded-lg border border-white/6 bg-white/5 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs tracking-[0.24em] text-neutral-500 uppercase">Generate</p>
            <h4 className="mt-2 text-lg font-semibold text-white">提交 AI Draw 占位生成</h4>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onGenerate}
            className="cursor-pointer rounded-lg bg-neutral-100 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "生成中..." : "开始生成"}
          </button>
        </div>
      </div>
    </div>
  );
}

function getActiveChatRecord(records: ChatGenerationRecord[], activeId: string) {
  if (records.length === 0) {
    return null;
  }

  return records.find((item) => item.id === activeId) ?? records[0];
}

function getSelectedImportModuleKeys(drawState: DrawModuleState) {
  return drawModules.filter((module) => drawState[module.key].selectedForImport).map((module) => module.key);
}

function getReadyDrawModuleKeys(drawState: DrawModuleState) {
  return drawModules
    .filter((module) => drawState[module.key].enabled && Boolean(drawState[module.key].importedValue))
    .map((module) => module.key);
}

function buildDrawPrompt(selectedPoster: PosterRecord, drawState: DrawModuleState) {
  const selectedModules = getReadyDrawModuleKeys(drawState).map((moduleKey) => {
    const module = drawModules.find((item) => item.key === moduleKey);
    const moduleState = drawState[moduleKey];

    return `${module?.label ?? moduleKey}:${moduleState.importedValue}(${moduleState.weight}%)`;
  });

  return `请基于《${selectedPoster.title}》生成电影海报，占位参考参数为 ${selectedModules.join("；")}。`;
}

function buildTemplatePrompt(poster: PosterRecord) {
  return `请基于《${poster.title}》的${poster.attributes.style}气质，保留${poster.attributes.mood}和${poster.attributes.composition}，生成一张新的电影海报，主画面比例使用${poster.attributes.ratio}，并重新设计片名字体与宣传语。`;
}

function resolveRatioOptionId(ratioLabel: string) {
  return chatRatioOptions.find((option) => ratioLabel.startsWith(option.id))?.id ?? chatRatioOptions[0].id;
}

function formatModelLabel(modelId: string) {
  return chatModelOptions.find((option) => option.id === modelId)?.label ?? modelId;
}

function formatRatioLabel(ratioId: string) {
  return chatRatioOptions.find((option) => option.id === ratioId)?.label ?? ratioId;
}

function formatGenerationImageIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}

async function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("图片读取失败"));
    };

    reader.onerror = () => {
      reject(new Error("图片读取失败"));
    };

    reader.readAsDataURL(file);
  });
}

const statusTextMap = {
  failed: "失败",
  submitting: "生成中",
  succeeded: "已完成"
} satisfies Record<ChatGenerationRecord["status"], string>;

function DeckStatusPill({ status }: { status: ChatGenerationRecord["status"] }) {
  const classNameMap = {
    failed: "bg-rose-100 text-rose-900",
    submitting: "bg-amber-100 text-amber-900",
    succeeded: "bg-emerald-100 text-emerald-900"
  } satisfies Record<ChatGenerationRecord["status"], string>;

  return <span className={`rounded-full px-3 py-1 text-sm font-semibold ${classNameMap[status]}`}>{statusTextMap[status]}</span>;
}

function GenerationStateBadge({
  state
}: {
  state: "failed" | "idle" | "submitting" | "succeeded";
}) {
  const labelMap = {
    failed: "失败",
    idle: "待开始",
    submitting: "生成中",
    succeeded: "已完成"
  };

  const classMap = {
    failed: "bg-rose-100 text-rose-900",
    idle: "bg-slate-200 text-slate-700",
    submitting: "bg-amber-100 text-amber-900",
    succeeded: "bg-emerald-100 text-emerald-900"
  };

  return <span className={`rounded-full px-3 py-1 text-sm font-semibold ${classMap[state]}`}>{labelMap[state]}</span>;
}
