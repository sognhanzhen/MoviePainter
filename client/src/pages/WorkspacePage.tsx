import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { PosterDetailModal } from "../components/PosterDetailModal";
import { PosterMosaicCard } from "../components/PosterMosaicCard";
import type {
  AppDataSource,
  HistoryRecord,
  HistoryRecordDetail,
  PosterRecord,
  WorkspaceGeneratedResult,
  WorkspaceGenerationProgressEvent,
  WorkspaceGenerationResponse,
  WorkspaceMode
} from "../data/posters";
import { usePosterCatalog } from "../hooks/usePosterCatalog";
import { buildAiDrawPrompt } from "../lib/ai-draw-prompt";
import { appDataRequest, workspaceRequest } from "../lib/api";
import {
  getCachedHistoryRecord,
  getCachedHistoryRecords,
  saveGeneratedHistorySnapshot,
  saveHistoryRecordsSnapshot
} from "../lib/history-cache";
import { recordWorkspaceAssetUse } from "../lib/workspace-assets";

const drawModules = [
  { key: "shotScale", label: "人物景别" },
  { key: "characterPosition", label: "人物位置" },
  { key: "event", label: "事件" },
  { key: "era", label: "年代" },
  { key: "scene", label: "场景" },
  { key: "style", label: "风格" },
  { key: "atmosphere", label: "氛围" },
  { key: "tone", label: "色调" },
  { key: "composition", label: "构图" }
] as const;

type DrawModuleKey = (typeof drawModules)[number]["key"];

type DrawOption = {
  description: string;
  label: string;
  value: string;
};

const drawParameterOptions = {
  atmosphere: [
    { label: "选择氛围", value: "all", description: "暂不限制氛围。" },
    { label: "温馨", value: "warm", description: "柔和亲密，降低冲突感。" },
    { label: "孤寂", value: "lonely", description: "突出空旷、沉默和人物隔离感。" },
    { label: "悬疑", value: "suspense", description: "保留未解问题和视觉紧张。" },
    { label: "热血", value: "passionate", description: "强化行动力、速度和情绪爆发。" },
    { label: "史诗", value: "epic", description: "扩大世界观尺度与命运感。" },
    { label: "浪漫", value: "romantic", description: "强调关系、凝视和柔性光线。" },
    { label: "压抑", value: "depressed", description: "低饱和、高压力、呼吸感收紧。" },
    { label: "神秘", value: "mysterious", description: "保留未知符号和仪式感。" },
    { label: "搞笑", value: "comic", description: "更轻盈夸张，降低危险感。" },
    { label: "怀旧", value: "nostalgic", description: "旧影像、回忆和时间痕迹。" },
    { label: "宁静", value: "quiet", description: "稳定、留白、低冲突。" },
    { label: "压迫", value: "oppressive", description: "强压力、巨大体量或心理压迫。" },
    { label: "诡异", value: "eerie", description: "不安、错位、异样的静默。" },
    { label: "清新", value: "fresh", description: "明亮、干净、轻呼吸感。" },
    { label: "肃穆", value: "solemn", description: "庄重、克制、仪式化。" },
    { label: "奢靡", value: "luxurious", description: "华丽材质、灯光与欲望感。" },
    { label: "自由", value: "free", description: "开放空间和舒展姿态。" },
    { label: "阴森", value: "gloomy", description: "暗处、寒意和危险预兆。" },
    { label: "青春", value: "youthful", description: "明快、成长感、群体活力。" },
    { label: "禅意", value: "zen", description: "极简、静观、东方留白。" }
  ],
  characterPosition: [
    { label: "选择人物位置", value: "all", description: "暂不限制人物位置。" },
    { label: "左侧", value: "left", description: "人物在画面左侧，右侧保留叙事空间。" },
    { label: "右侧", value: "right", description: "人物在画面右侧，左侧形成视觉对照。" },
    { label: "上方", value: "top", description: "人物或面部占据上方区域。" },
    { label: "下方", value: "bottom", description: "人物位于底部或前景低位。" },
    { label: "中间", value: "center", description: "人物成为中心视觉锚点。" }
  ],
  composition: [
    { label: "选择构图", value: "all", description: "暂不限制构图。" },
    { label: "中心对称构图", value: "center-symmetry", description: "主视觉居中，左右稳定对称。" },
    { label: "三分法构图", value: "rule-of-thirds", description: "主体落在三分线或交点。" },
    { label: "对角线构图", value: "diagonal", description: "用斜线制造运动和张力。" },
    { label: "框架式构图", value: "frame-within-frame", description: "门、窗、物体形成二级框架。" },
    { label: "引导线构图", value: "leading-lines", description: "道路、光线或建筑线条引导视线。" },
    { label: "满版型构图", value: "full-bleed", description: "画面被主体和信息强占满。" },
    { label: "留白型构图", value: "negative-space", description: "用空白强化情绪和尺度。" },
    { label: "上下分割构图", value: "top-bottom-split", description: "上下两块视觉叙事形成对照。" },
    { label: "左右分割构图", value: "left-right-split", description: "左右两块视觉叙事形成对照。" },
    { label: "特写面部构图", value: "face-closeup", description: "面部成为主要海报入口。" },
    { label: "俯视构图", value: "overhead", description: "从上方向下观察，建立秩序感。" },
    { label: "仰视构图", value: "low-angle", description: "从下往上看，放大压迫或英雄感。" },
    { label: "剪影构图", value: "silhouette", description: "人物以轮廓和逆光为主。" },
    { label: "倾斜构图", value: "dutch-angle", description: "画面倾斜，制造不稳定。" },
    { label: "倒影构图", value: "reflection", description: "用镜面、水面或玻璃制造双重叙事。" }
  ],
  era: [
    { label: "选择年代", value: "all", description: "暂不限制年代。" },
    { label: "现代", value: "modern", description: "现代都市或现实语境。" },
    { label: "古代", value: "ancient", description: "古典服饰、建筑和器物。" },
    { label: "民国", value: "republic", description: "民国服饰、建筑和旧上海气质。" },
    { label: "当代", value: "contemporary", description: "当下生活、服化道和空间。" },
    { label: "八十年代", value: "1980s", description: "八十年代质感、服饰和媒介痕迹。" },
    { label: "九十年代", value: "1990s", description: "九十年代影像与街景语汇。" },
    { label: "千禧", value: "millennium", description: "Y2K、数码早期和千禧审美。" },
    { label: "未来", value: "future", description: "科幻未来、技术和未知文明。" },
    { label: "中世纪", value: "medieval", description: "城堡、盔甲、宗教或封建语境。" },
    { label: "罗马", value: "rome", description: "古罗马建筑、服饰和权力结构。" },
    { label: "战国", value: "warring-states", description: "战国器物、甲胄和历史张力。" },
    { label: "盛唐", value: "tang", description: "盛唐华丽、宫廷和开放气质。" },
    { label: "武侠", value: "wuxia", description: "江湖、侠客、刀剑和山水。" },
    { label: "仙侠", value: "xianxia", description: "仙门、灵气、法术和东方奇幻。" },
    { label: "西部", value: "western", description: "荒野、枪手、尘土和边境感。" },
    { label: "工业", value: "industrial", description: "工厂、机械、金属和劳动空间。" },
    { label: "冷战", value: "cold-war", description: "间谍、核阴影和冷峻政治氛围。" },
    { label: "昭和", value: "showa", description: "昭和日本街景、招牌和胶片感。" },
    { label: "史前", value: "prehistoric", description: "原始自然、部落或远古生态。" }
  ],
  scene: [
    { label: "选择场景", value: "all", description: "暂不限制场景。" },
    { label: "城市", value: "city", description: "城市建筑、街道或天际线。" },
    { label: "校园", value: "campus", description: "教学楼、操场、青春空间。" },
    { label: "医院", value: "hospital", description: "病房、走廊、医疗空间。" },
    { label: "警局", value: "police-station", description: "审讯、档案、制度空间。" },
    { label: "法庭", value: "court", description: "审判、席位和秩序感。" },
    { label: "太空", value: "space", description: "宇宙、飞船或天体背景。" },
    { label: "深海", value: "deep-sea", description: "水下、幽暗和未知生态。" },
    { label: "沙漠", value: "desert", description: "沙丘、热浪和空旷地平线。" },
    { label: "森林", value: "forest", description: "树影、自然和遮蔽感。" },
    { label: "雪地", value: "snowfield", description: "冰雪、冷光和荒寒。" },
    { label: "战场", value: "battlefield", description: "冲突现场、烟尘和残骸。" },
    { label: "废墟", value: "ruins", description: "破败建筑、末日和遗迹感。" },
    { label: "宫廷", value: "palace", description: "权力空间、礼制和华丽陈设。" },
    { label: "江湖", value: "jianghu", description: "客栈、山林、刀剑与漂泊。" },
    { label: "公路", value: "road", description: "道路、车辆和旅程感。" },
    { label: "列车", value: "train", description: "车厢、站台或铁路运动。" },
    { label: "岛屿", value: "island", description: "海岸、孤立和边界感。" },
    { label: "小镇", value: "town", description: "地方生活、人际关系和低密度空间。" },
    { label: "公寓", value: "apartment", description: "室内生活空间和私密关系。" },
    { label: "草原", value: "grassland", description: "开阔草地、地平线和风。" },
    { label: "土房子", value: "earth-house", description: "乡土建筑和粗粝质地。" }
  ],
  shotScale: [
    { label: "选择人物景别", value: "all", description: "暂不限制人物景别。" },
    { label: "大远景", value: "extreme-long-shot", description: "人物极小，环境尺度主导。" },
    { label: "远景", value: "long-shot", description: "人物完整但环境仍占主导。" },
    { label: "全景", value: "full-shot", description: "完整人物与主要环境并重。" },
    { label: "中全景", value: "medium-full-shot", description: "人物从膝部或大半身进入画面。" },
    { label: "中景", value: "medium-shot", description: "人物半身或腰部以上，适合叙事入口。" },
    { label: "中近景", value: "medium-close-up", description: "胸像或肩部以上，强化表情。" },
    { label: "近景", value: "close-up", description: "脸部和细节主导情绪。" },
    { label: "特写", value: "extreme-close-up", description: "局部细节成为主视觉。" }
  ],
  style: [
    { label: "选择风格", value: "all", description: "暂不限制风格。" },
    { label: "写实", value: "realistic", description: "真实摄影和电影剧照质感。" },
    { label: "极简", value: "minimal", description: "少元素、高概括、强符号。" },
    { label: "胶片", value: "film", description: "颗粒、冲印和模拟影像感。" },
    { label: "赛博", value: "cyberpunk", description: "霓虹、科技、城市夜色。" },
    { label: "水墨", value: "ink", description: "东方笔墨、留白和墨色层次。" },
    { label: "手绘", value: "hand-drawn", description: "插画笔触和人工绘制感。" },
    { label: "油画", value: "oil-painting", description: "厚涂、油彩和古典质地。" },
    { label: "素描", value: "sketch", description: "线条、明暗和草图质感。" },
    { label: "动漫", value: "anime", description: "动画角色与分镜感。" },
    { label: "港风", value: "hong-kong", description: "港片海报、霓虹和复古商业感。" },
    { label: "超现实", value: "surreal", description: "现实元素错置，制造梦境和寓言感。" }
  ],
  tone: [
    { label: "选择色调", value: "all", description: "暂不限制色调。" },
    { label: "青橙", value: "teal-orange", description: "青色阴影和橙色高光的电影感。" },
    { label: "黑白", value: "black-white", description: "去色、强明暗和经典影像感。" },
    { label: "日系", value: "japanese", description: "清淡、柔和、低反差。" },
    { label: "暖黄", value: "warm-yellow", description: "暖色光、怀旧和亲密感。" },
    { label: "冷蓝", value: "cold-blue", description: "冷调夜色、科技或疏离感。" },
    { label: "黑金", value: "black-gold", description: "黑场和金色高光，偏高级商业感。" },
    { label: "森系", value: "forest", description: "绿色、自然和柔软光线。" },
    { label: "霓虹", value: "neon", description: "高亮彩色灯管和夜间城市感。" },
    { label: "蓝调", value: "blue-tone", description: "整体偏蓝，忧郁或冷静。" },
    { label: "暖调", value: "warm-tone", description: "整体偏暖，亲密或复古。" },
    { label: "冷调", value: "cool-tone", description: "整体偏冷，理性或疏离。" },
    { label: "暗调", value: "dark-tone", description: "低明度、深阴影和强氛围。" },
    { label: "红黑", value: "red-black", description: "红色冲突和黑色压迫。" },
    { label: "高饱和", value: "high-saturation", description: "强色彩、强视觉冲击。" },
    { label: "莫兰迪", value: "morandi", description: "灰调、柔和、低饱和高级感。" },
    { label: "暖黄褪色", value: "faded-warm-yellow", description: "旧照片式暖黄和褪色质感。" }
  ]
} satisfies Record<Exclude<DrawModuleKey, "event">, DrawOption[]>;

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
    description: "Balanced square poster and gallery tiles.",
    id: "1:1",
    label: "1:1"
  },
  {
    description: "Wide cinematic key art and landscape frames.",
    id: "16:9",
    label: "16:9"
  },
  {
    description: "Vertical covers and mobile-first poster layouts.",
    id: "9:16",
    label: "9:16"
  },
  {
    description: "Classic landscape frame with more vertical room.",
    id: "4:3",
    label: "4:3"
  },
  {
    description: "Portrait poster crop with a compact theatrical feel.",
    id: "3:4",
    label: "3:4"
  }
] as const;

type DrawModuleState = Record<
  DrawModuleKey,
  {
    enabled: boolean;
    importedValue: string;
    selectedForImport: boolean;
    selectedValue: string;
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
  mode: WorkspaceMode;
  modelId: string;
  posterTitle: string;
  prompt: string;
  progress: WorkspaceGenerationProgressEvent | null;
  ratioId: string;
  referenceImageName: string;
  referenceImageUrl: string;
  results: WorkspaceGeneratedResult[];
  source: AppDataSource;
  status: "draft" | "failed" | "submitting" | "succeeded";
  templatePosterId: string | null;
  templatePosterTitle: string | null;
};

const initialDrawState: DrawModuleState = {
  atmosphere: { enabled: true, importedValue: "", selectedForImport: false, selectedValue: "all", weight: 68 },
  characterPosition: { enabled: true, importedValue: "", selectedForImport: false, selectedValue: "all", weight: 70 },
  composition: { enabled: true, importedValue: "", selectedForImport: false, selectedValue: "all", weight: 79 },
  era: { enabled: true, importedValue: "", selectedForImport: false, selectedValue: "all", weight: 62 },
  event: { enabled: true, importedValue: "", selectedForImport: false, selectedValue: "custom", weight: 74 },
  scene: { enabled: true, importedValue: "", selectedForImport: false, selectedValue: "all", weight: 66 },
  shotScale: { enabled: true, importedValue: "", selectedForImport: false, selectedValue: "all", weight: 72 },
  style: { enabled: true, importedValue: "", selectedForImport: false, selectedValue: "all", weight: 84 },
  tone: { enabled: false, importedValue: "", selectedForImport: false, selectedValue: "all", weight: 56 }
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
  const [panelHistoryRecords, setPanelHistoryRecords] = useState<HistoryRecord[]>(() => filterGeneratedHistoryRecords(getCachedHistoryRecords()));
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
  const [drawGenerationProgress, setDrawGenerationProgress] = useState<WorkspaceGenerationProgressEvent | null>(null);
  const [latestDrawGeneration, setLatestDrawGeneration] = useState<WorkspaceGenerationResponse | null>(null);
  const [workspacePosterModal, setWorkspacePosterModal] = useState<PosterRecord | null>(null);
  const [workspacePosterSelectingMode, setWorkspacePosterSelectingMode] = useState(false);
  const mainComposerRef = useRef<HTMLDivElement | null>(null);
  const floatingComposerRef = useRef<HTMLDivElement | null>(null);
  const { error, loading, posters, source } = usePosterCatalog(token);
  const mode = searchParams.get("mode") === "draw" ? "draw" : "chat";
  const selectedPoster = posters.find((poster) => poster.id === searchParams.get("posterId")) ?? null;
  const pendingChatRecord = chatGenerationDeck.find((item) => item.mode === "chat" && item.status === "submitting") ?? null;
  const latestChatRecord = chatGenerationDeck.find((item) => item.mode === "chat") ?? null;
  const activeChatRecord = getActiveChatRecord(chatGenerationDeck, activeChatGenerationId);
  const panelRecord = activeChatRecord ?? latestChatRecord;
  const panelTimeline = buildPanelTimeline(chatGenerationDeck, panelHistoryRecords);
  const shouldShowFloatingComposer = mode === "chat" && !isGenerationPanelOpen && hasScrolledPastMainComposer;
  const shouldRenderFloatingComposer = shouldShowFloatingComposer || isFloatingComposerMounted;
  const floatingComposerPreviewText =
    chatDraft.trim() ||
    (selectedPoster ? `Continue from ${selectedPoster.title}` : "Describe the movie poster you want to create.");

  const resetDrawParameterState = useCallback(() => {
    setDrawState((current) =>
      drawModules.reduce((nextState, module) => {
        nextState[module.key] = {
          ...current[module.key],
          importedValue: "",
          selectedForImport: false,
          selectedValue: initialDrawState[module.key].selectedValue
        };

        return nextState;
      }, {} as DrawModuleState)
    );
    setDrawMessage("选择一个或多个模块后，AI 会根据当前参考海报识别参数并灌入。");
  }, []);

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
    let cancelled = false;

    setPanelHistoryRecords(filterGeneratedHistoryRecords(getCachedHistoryRecords()));

    async function loadPanelHistory() {
      if (!token) {
        return;
      }

      try {
        const response = await appDataRequest.getHistory(token);
        const mergedRecords = filterGeneratedHistoryRecords(saveHistoryRecordsSnapshot(response.records));

        if (!cancelled) {
          setPanelHistoryRecords(mergedRecords);
        }
      } catch {
        if (!cancelled) {
          setPanelHistoryRecords(filterGeneratedHistoryRecords(getCachedHistoryRecords()));
        }
      }
    }

    void loadPanelHistory();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (mode === "draw") {
      resetDrawParameterState();
    }
  }, [mode, resetDrawParameterState, selectedPoster?.id]);

  useEffect(() => {
    setLatestDrawGeneration(null);
    setDrawGenerationState("idle");
    setDrawGenerationProgress(null);
    setDrawGenerationMessage(
      selectedPoster
        ? `当前已挂载参考海报《${selectedPoster.title}》，可以开始 ${mode === "chat" ? "AI Chat" : "AI Draw"} 生成。`
        : "先选择参考海报，再从当前模式发起生成。"
    );
  }, [mode, selectedPoster?.id]);

  useEffect(() => {
    if (mode !== "chat") {
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

  function selectPanelMode(nextMode: WorkspaceMode) {
    updateMode(nextMode);
    setIsFloatingComposerExpanded(false);
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
      resetDrawParameterState();
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

  function updateDrawModuleSelection(moduleKey: DrawModuleKey, option: DrawOption) {
    setDrawState((current) => ({
      ...current,
      [moduleKey]: {
        ...current[moduleKey],
        enabled: option.value !== "all" || current[moduleKey].enabled,
        importedValue: option.value === "all" ? "" : option.label,
        selectedForImport: option.value !== "all",
        selectedValue: option.value
      }
    }));
    const moduleLabel = drawModules.find((module) => module.key === moduleKey)?.label ?? moduleKey;
    setDrawMessage(option.value === "all" ? `${moduleLabel} 参数已清空。` : `${option.label} 已写入 ${moduleLabel} 参数。`);
  }

  function updateDrawEvent(value: string) {
    const trimmedValue = value.trim();
    setDrawState((current) => ({
      ...current,
      event: {
        ...current.event,
        enabled: trimmedValue.length > 0 || current.event.enabled,
        importedValue: value,
        selectedForImport: trimmedValue.length > 0,
        selectedValue: "custom"
      }
    }));
    setDrawMessage(trimmedValue ? "事件已写入 AI Draw 参数。" : "事件参数已清空。");
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
            importedValue: resolvePosterDrawAttribute(selectedPoster, moduleKey)
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
    setChatDraft(poster.promptPresets?.aiChat ?? buildTemplatePrompt(poster));
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
      mode: "chat",
      modelId: selectedModelId,
      posterTitle: posterForRequest.title,
      prompt,
      progress: null,
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
      const response = await workspaceRequest.generateStream(
        token,
        {
          mode: "chat",
          modelId: selectedModelId,
          moduleWeights: {},
          posterId: posterForRequest.id,
          prompt,
          ratioId: selectedRatioId,
          sourceOrigin: searchParams.get("source") ?? "workspace",
          selectedModules: []
        },
        (progress) => {
          setChatGenerationDeck((current) =>
            current.map((record) =>
              record.id === requestId
                ? {
                    ...record,
                    insight: progress.message,
                    progress
                  }
                : record
            )
          );
        }
      );

      setChatGenerationDeck((current) =>
        current.map((record) =>
          record.id === requestId
            ? {
                ...record,
                createdAt: response.task.submittedAt,
                insight: response.insight,
                posterTitle: response.task.posterTitle,
                progress: record.progress,
                results: response.results,
                source: response.source,
                status: "succeeded"
              }
            : record
        )
      );
      void saveGeneratedHistorySnapshot(response).then(() => {
        setPanelHistoryRecords(filterGeneratedHistoryRecords(getCachedHistoryRecords()));
      });
      setChatNotice("生图已完成，结果已保留在当前生图面板中。");
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "AI Chat 生成失败，请稍后再试。";

      setChatGenerationDeck((current) =>
        current.map((record) =>
          record.id === requestId
            ? {
                ...record,
                insight: message,
                progress: {
                  message,
                  phase: "failed",
                  timestamp: new Date().toISOString()
                },
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
      openDrawGenerationPanelError("请先选择参考海报，再开始 AI Draw 生成。");
      return;
    }

    if (!token) {
      openDrawGenerationPanelError("当前登录会话已恢复，但后端令牌暂不可用，无法发起生成。");
      return;
    }

    const selectedModules = getReadyDrawModuleKeys(drawState);

    if (selectedModules.length === 0) {
      openDrawGenerationPanelError("请先导入至少一个启用中的 AI Draw 参数模块，再开始生成。", selectedPoster);
      return;
    }

    const requestId = `draw-${Date.now()}`;
    const drawPrompt = buildDrawPrompt(selectedPoster, drawState);
    const drawRatioId = resolveDrawRatioId(selectedPoster, drawState);
    const nextRecord: ChatGenerationRecord = {
      createdAt: new Date().toISOString(),
      id: requestId,
      insight: "正在解析 AI Draw 参数、参考海报与权重。",
      mode: "draw",
      modelId: selectedModelId,
      posterTitle: selectedPoster.title,
      prompt: drawPrompt,
      progress: null,
      ratioId: drawRatioId,
      referenceImageName: selectedPoster.title,
      referenceImageUrl: selectedPoster.imageUrl,
      results: [],
      source,
      status: "submitting",
      templatePosterId: selectedPoster.id,
      templatePosterTitle: selectedPoster.title
    };

    setChatGenerationDeck((current) => [nextRecord, ...current]);
    setActiveChatGenerationId(requestId);
    setIsGenerationPanelOpen(true);
    setDrawGenerationState("submitting");
    setDrawGenerationProgress(null);
    setDrawGenerationMessage("AI Draw 已提交到后端，等待模型返回真实进度。");

    try {
      const response = await workspaceRequest.generateStream(
        token,
        {
          mode: "draw",
          modelId: selectedModelId,
          moduleWeights: Object.fromEntries(
            selectedModules.map((moduleKey) => [moduleKey, drawState[moduleKey].weight])
          ),
          posterId: selectedPoster.id,
          prompt: drawPrompt,
          ratioId: drawRatioId,
          sourceOrigin: searchParams.get("source") ?? "workspace",
          selectedModules
        },
        (progress) => {
          setDrawGenerationProgress(progress);
          setDrawGenerationMessage(progress.message);
          setChatGenerationDeck((current) =>
            current.map((record) =>
              record.id === requestId
                ? {
                    ...record,
                    insight: progress.message,
                    progress
                  }
                : record
            )
          );
        }
      );

      setLatestDrawGeneration(response);
      setDrawGenerationState("succeeded");
      setDrawGenerationMessage(`AI Draw 已返回 ${response.results.length} 个真实结果。`);
      setChatGenerationDeck((current) =>
        current.map((record) =>
          record.id === requestId
            ? {
                ...record,
                createdAt: response.task.submittedAt,
                insight: response.insight,
                posterTitle: response.task.posterTitle,
                progress: record.progress,
                results: response.results,
                source: response.source,
                status: "succeeded"
              }
            : record
        )
      );
      void saveGeneratedHistorySnapshot(response).then(() => {
        setPanelHistoryRecords(filterGeneratedHistoryRecords(getCachedHistoryRecords()));
      });
    } catch (requestError) {
      setDrawGenerationState("failed");
      const message = requestError instanceof Error ? requestError.message : "AI Draw 生成失败，请稍后再试。";
      setDrawGenerationProgress({
        message,
        phase: "failed",
        timestamp: new Date().toISOString()
      });
      setDrawGenerationMessage(message);
      setChatGenerationDeck((current) =>
        current.map((record) =>
          record.id === requestId
            ? {
                ...record,
                insight: message,
                progress: {
                  message,
                  phase: "failed",
                  timestamp: new Date().toISOString()
                },
                status: "failed"
              }
            : record
        )
      );
    }
  }

  function openDrawGenerationPanelError(message: string, poster: PosterRecord | null = selectedPoster) {
    const requestId = `draw-error-${Date.now()}`;
    const nextRecord: ChatGenerationRecord = {
      createdAt: new Date().toISOString(),
      id: requestId,
      insight: message,
      mode: "draw",
      modelId: selectedModelId,
      posterTitle: poster?.title ?? "AI Draw",
      prompt: poster ? buildDrawComposerPreview(drawState) || poster.promptPresets?.aiDraw.prompt || message : message,
      progress: {
        message,
        phase: "failed",
        timestamp: new Date().toISOString()
      },
      ratioId: poster ? resolveDrawRatioId(poster, drawState) : selectedRatioId,
      referenceImageName: poster?.title ?? "",
      referenceImageUrl: poster?.imageUrl ?? "",
      results: [],
      source,
      status: "failed",
      templatePosterId: poster?.id ?? null,
      templatePosterTitle: poster?.title ?? null
    };

    setChatGenerationDeck((current) => [nextRecord, ...current]);
    setActiveChatGenerationId(requestId);
    setIsGenerationPanelOpen(true);
    setDrawGenerationState("failed");
    setDrawGenerationProgress(nextRecord.progress);
    setDrawGenerationMessage(message);
  }

  async function openGenerationPanel(recordId?: string) {
    const posterForPanel = selectedPoster ?? posters[0] ?? null;
    const latestHistoryItem = recordId || latestChatRecord || panelRecord ? null : panelTimeline[0] ?? null;
    const targetRecord =
      chatGenerationDeck.find((item) => item.id === recordId) ??
      panelRecord ??
      (latestHistoryItem ? await resolvePanelHistoryRecord(latestHistoryItem.id) : null) ??
      buildDraftGenerationRecord({
        chatDraft,
        modelId: selectedModelId,
        poster: posterForPanel,
        ratioId: selectedRatioId,
        referenceImage,
        source
      });

    if (!targetRecord) {
      return;
    }

    if (targetRecord.status === "draft" || latestHistoryItem) {
      setChatGenerationDeck((current) => (current.some((item) => item.id === targetRecord.id) ? current : [targetRecord, ...current]));
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

  async function resolvePanelHistoryRecord(historyId: string) {
    const existingRecord = chatGenerationDeck.find((item) => item.id === historyId);

    if (existingRecord) {
      return existingRecord;
    }

    const cachedRecord = getCachedHistoryRecord(historyId);

    if (cachedRecord) {
      return buildChatRecordFromCachedHistory(cachedRecord, {
        fallbackModelId: selectedModelId,
        fallbackRatioId: selectedRatioId,
        source
      });
    }

    if (!token) {
      setChatNotice("当前只能切换已缓存的历史任务，登录令牌不可用，无法加载远端历史详情。");
      return null;
    }

    try {
      const response = await appDataRequest.getHistoryRecord(token, historyId);
      return buildChatRecordFromHistoryDetail(response.record, {
        fallbackModelId: selectedModelId,
        fallbackRatioId: selectedRatioId,
        source: response.source
      });
    } catch (error) {
      setChatNotice(error instanceof Error ? error.message : "历史任务详情加载失败，请稍后再试。");
      return null;
    }
  }

  async function browseHistory(direction: "newer" | "older") {
    if (!panelRecord || panelRecord.status === "submitting") {
      return;
    }

    const currentIndex = panelTimeline.findIndex((item) => item.id === panelRecord.id);
    const targetIndex = direction === "newer" ? currentIndex - 1 : currentIndex + 1;
    const targetItem = panelTimeline[targetIndex];

    if (!targetItem) {
      return;
    }

    const targetRecord = await resolvePanelHistoryRecord(targetItem.id);

    if (!targetRecord) {
      return;
    }

    setChatGenerationDeck((current) => mergeChatGenerationDeck(current, [targetRecord]));
    setActiveChatGenerationId(targetRecord.id);
    hydrateComposerFromRecord(targetRecord);
  }

  const activeIndex = panelRecord ? panelTimeline.findIndex((item) => item.id === panelRecord.id) : -1;
  const canViewNewer = activeIndex > 0 && panelRecord?.status !== "submitting";
  const canViewOlder = activeIndex >= 0 && activeIndex < panelTimeline.length - 1 && panelRecord?.status !== "submitting";
  const isChatGenerationSubmitting = latestChatRecord?.status === "submitting" || pendingChatRecord?.status === "submitting";

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
            attachedPoster={null}
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
          <div className="mt-4 flex justify-start">
            <button
              type="button"
              onClick={() => {
                void openGenerationPanel(latestChatRecord?.id);
              }}
              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-white/7 px-4 font-[var(--font-ui)] text-xs font-bold tracking-[0.14em] text-neutral-300 uppercase transition hover:bg-white/12 hover:text-white"
            >
              <span aria-hidden="true" className="text-sm leading-none">▣</span>
              <span>Image Generation</span>
              {isChatGenerationSubmitting ? (
                <span className="inline-flex items-center gap-1.5 tracking-normal text-neutral-100 normal-case">
                  <GenerationSpinner sizeClassName="h-3.5 w-3.5" tone="light" />
                  <span className="text-xs font-bold">生成中</span>
                </span>
              ) : null}
            </button>
          </div>
        </section>
      ) : null}

      {mode === "draw" ? (
        <section className="mx-auto max-w-4xl">
          {loading ? (
            <div className="min-h-[258px] animate-pulse rounded-lg border border-white/6 bg-[#181918]/48 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.62)] backdrop-blur-2xl" />
          ) : (
            <DrawWorkspace
              drawState={drawState}
              isSubmitting={drawGenerationState === "submitting"}
              onGenerate={submitDrawGeneration}
              onChangeEvent={updateDrawEvent}
              onSelectDrawModuleOption={updateDrawModuleSelection}
              onSelectModel={setSelectedModelId}
              selectedPoster={selectedPoster}
              selectedModelId={selectedModelId}
            />
          )}
          {!loading ? (
            <GenerationProgressStrip
              message={drawGenerationMessage}
              progress={drawGenerationProgress}
              resultCount={latestDrawGeneration?.results.length ?? 0}
              state={drawGenerationState}
            />
          ) : null}
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
                attachedPoster={null}
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

      {isGenerationPanelOpen && panelRecord ? (
        <GenerationDeckPanel
          canViewNewer={canViewNewer}
          canViewOlder={canViewOlder}
          currentMode={mode}
          historyCount={panelTimeline.length}
          onBrowseHistory={browseHistory}
          onClose={closeGenerationPanel}
          onSelectMode={selectPanelMode}
          panelRecord={panelRecord}
        >
          {mode === "chat" ? (
            <ChatComposer
              attachedPoster={null}
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
          ) : (
            <DrawPanelComposer
              drawState={drawState}
              isSubmitting={drawGenerationState === "submitting"}
              onChangeEvent={updateDrawEvent}
              onGenerate={submitDrawGeneration}
              onSelectDrawModuleOption={updateDrawModuleSelection}
              onSelectModel={setSelectedModelId}
              selectedPoster={selectedPoster}
              selectedModelId={selectedModelId}
            />
          )}
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
      <div ref={composerRef} className="relative mx-auto w-full max-w-4xl overflow-visible rounded-lg border border-white/8 bg-[#181918]/72 text-white shadow-[0_24px_58px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
        <div className="relative z-0 px-5 pt-4 pb-3">
          <textarea
            className="min-h-[72px] w-full resize-none border-0 bg-transparent text-[15px] leading-7 font-light text-neutral-100 outline-none placeholder:text-neutral-600 focus:ring-0"
            placeholder="Modify prompt to refine generation..."
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
          />
        </div>

        <div className="relative z-20 flex items-center justify-between gap-3 border-t border-white/6 px-5 py-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <label
              htmlFor={uploadInputId}
              aria-label="上传图片"
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
            {referenceImage ? (
              <button
                type="button"
                onClick={onRemoveReferenceImage}
                className="max-w-[8rem] truncate rounded-md bg-white/8 px-2 py-1 text-[9px] font-bold tracking-[0.16em] text-neutral-300 uppercase transition hover:bg-white/12 hover:text-white"
                aria-label="清除上传图片"
              >
                {referenceImage.name}
              </button>
            ) : null}

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
                <DropdownPanel bodyClassName="max-h-[11.5rem]" className="left-0 w-[min(18rem,calc(100vw-8rem))]" placement="up" tone="dark">
                  {chatModelOptions.map((option) => (
                    <DropdownOption
                      key={option.id}
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
                <DropdownPanel bodyClassName="max-h-[12rem]" className="left-0 w-[min(10rem,calc(100vw-8rem))]" placement="up" tone="dark">
                  {chatRatioOptions.map((option) => (
                    <DropdownOption
                      key={option.id}
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
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-neutral-100 text-xl font-semibold text-black shadow-xl transition hover:scale-105 hover:bg-white active:scale-95"
          >
            ↑
          </button>
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
                <DropdownPanel bodyClassName="max-h-[12rem]" className="left-0 w-[min(18rem,calc(100vw-6rem))]" placement="up" tone="dark">
                  {chatModelOptions.map((option) => (
                    <DropdownOption
                      key={option.id}
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
                <DropdownPanel bodyClassName="max-h-[10rem]" className="left-0 w-[min(10rem,calc(100vw-6rem))]" placement="up" tone="dark">
                  {chatRatioOptions.map((option) => (
                    <DropdownOption
                      key={option.id}
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
                        className="left-0 w-[min(18rem,calc(100vw-6rem))]"
                        placement="up"
                      >
                        {chatModelOptions.map((option) => (
                          <DropdownOption
                            key={option.id}
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
                        className="left-0 w-[min(10rem,calc(100vw-6rem))]"
                        placement="up"
                      >
                        {chatRatioOptions.map((option) => (
                          <DropdownOption
                            key={option.id}
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

function DrawPanelComposer({
  drawState,
  isSubmitting,
  onChangeEvent,
  onGenerate,
  onSelectDrawModuleOption,
  onSelectModel,
  selectedPoster,
  selectedModelId
}: {
  drawState: DrawModuleState;
  isSubmitting: boolean;
  onChangeEvent: (value: string) => void;
  onGenerate: () => void;
  onSelectDrawModuleOption: (moduleKey: DrawModuleKey, option: DrawOption) => void;
  onSelectModel: (modelId: (typeof chatModelOptions)[number]["id"]) => void;
  selectedPoster: PosterRecord | null;
  selectedModelId: (typeof chatModelOptions)[number]["id"];
}) {
  const [openDropdown, setOpenDropdown] = useState<DrawModuleKey | "model" | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openDropdown) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!composerRef.current?.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenDropdown(null);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openDropdown]);

  return (
    <div ref={composerRef} className="relative mx-auto w-full max-w-4xl overflow-visible rounded-lg bg-[#181918]/72 text-neutral-100 shadow-[0_24px_58px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
      <div className="flex flex-col gap-4 px-5 pt-4 pb-3">
        <div className="grid min-w-0 grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {drawModules.map((module) => {
            const moduleState = drawState[module.key];
            const posterPresetValue = selectedPoster?.promptPresets?.aiDraw.dimensions[module.key] ?? "";
            const active = isDrawModuleActive(moduleState);
            const hasPendingPosterPreset = module.key !== "event" && Boolean(posterPresetValue) && !active;
            const value = module.key === "event"
              ? formatEventButtonValue(moduleState.importedValue)
              : moduleState.importedValue || posterPresetValue || formatDrawOptionLabel(module.key, moduleState.selectedValue);

            return (
              <div key={module.key} className="relative min-w-0">
                <DrawParameterButton
                  active={active}
                  isOpen={openDropdown === module.key}
                  label={module.label}
                  presetLoaded={hasPendingPosterPreset}
                  value={value}
                  onToggle={() => {
                    if (hasPendingPosterPreset) {
                      onSelectDrawModuleOption(module.key, {
                        description: "Use the reverse-engineered value from the selected poster.",
                        label: posterPresetValue,
                        value: `poster-${module.key}`
                      });
                      setOpenDropdown(null);
                      return;
                    }

                    setOpenDropdown((current) => (current === module.key ? null : module.key));
                  }}
                />
                {openDropdown === module.key ? (
                  <DrawDropdownPanel>
                    {module.key === "event" ? (
                      <EventParameterPanel value={moduleState.importedValue} onChange={onChangeEvent} />
                    ) : (
                      <>
                        {posterPresetValue ? (
                          <>
                            <DrawDropdownOption
                              label={`海报解析：${posterPresetValue}`}
                              selected={moduleState.importedValue === posterPresetValue}
                              onClick={() => {
                                onSelectDrawModuleOption(module.key, {
                                  description: "Use the reverse-engineered value from the selected poster.",
                                  label: posterPresetValue,
                                  value: `poster-${module.key}`
                                });
                                setOpenDropdown(null);
                              }}
                            />
                            <div className="my-1 h-px bg-white/8" />
                          </>
                        ) : null}
                        {drawParameterOptions[module.key].map((option) => (
                          <DrawDropdownOption
                            key={option.value}
                            label={option.label}
                            selected={moduleState.selectedValue === option.value}
                            onClick={() => {
                              onSelectDrawModuleOption(module.key, option);
                              setOpenDropdown(null);
                            }}
                          />
                        ))}
                      </>
                    )}
                  </DrawDropdownPanel>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/6 px-5 py-3">
        <div className="relative min-w-0 flex-1 sm:max-w-[20rem]">
          <DropdownButton
            fullWidth
            isOpen={openDropdown === "model"}
            label="Model"
            tone="dark"
            value={formatModelLabel(selectedModelId)}
            onToggle={() => setOpenDropdown((current) => (current === "model" ? null : "model"))}
          />
          {openDropdown === "model" ? (
            <DrawDropdownPanel>
              {chatModelOptions.map((option) => (
                <DrawDropdownOption
                  key={option.id}
                  label={option.label}
                  selected={selectedModelId === option.id}
                  onClick={() => {
                    onSelectModel(option.id);
                    setOpenDropdown(null);
                  }}
                />
              ))}
            </DrawDropdownPanel>
          ) : null}
        </div>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onGenerate}
          aria-label={isSubmitting ? "生成中" : "用当前 AI Draw 配置继续生成"}
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-neutral-100 text-xl font-semibold text-black shadow-xl transition hover:scale-105 hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? <GenerationSpinner sizeClassName="h-4 w-4" /> : "↑"}
        </button>
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
                        {activeRecord.status === "submitting" ? activeRecord.progress?.message ?? "等待后端返回真实生图进度。" : activeRecord.insight}
                      </p>
                      {activeRecord.progress ? (
                        <p className="mt-2 text-xs leading-5 text-slate-500">{formatProgressMeta(activeRecord.progress)}</p>
                      ) : null}
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
  fullWidth = false,
  isOpen,
  label,
  onToggle,
  tone = "light",
  value
}: {
  compact?: boolean;
  fullWidth?: boolean;
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
      className={`inline-flex max-w-full cursor-pointer items-center justify-between gap-2 transition ${fullWidth ? "w-full" : ""} ${buttonSizeClass} ${toneClass}`}
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
      className={`absolute z-[80] overflow-hidden border ${panelPaddingClass} ${panelClass} ${placementClass} ${className}`}
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
  label,
  onClick,
  selected,
  tone = "light"
}: {
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
      className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold transition ${optionClass}`}
    >
      <span className="truncate text-sm leading-5 font-semibold">{label}</span>
      <span className={`text-sm font-semibold ${checkClass}`}>✓</span>
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

function GenerationProgressStrip({
  message,
  progress,
  resultCount,
  state
}: {
  message: string;
  progress: WorkspaceGenerationProgressEvent | null;
  resultCount: number;
  state: "failed" | "idle" | "submitting" | "succeeded";
}) {
  if (state === "idle" && !progress) {
    return null;
  }

  return (
    <div className="mt-4 rounded-lg border border-white/8 bg-[#181918]/48 px-4 py-3 text-neutral-100 shadow-[0_18px_42px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.18em] text-neutral-500 uppercase">真实生图进度</p>
          <p className="mt-1 text-sm leading-6 text-neutral-200">{progress?.message ?? message}</p>
          {progress ? <p className="mt-1 text-xs leading-5 text-neutral-500">{formatProgressMeta(progress)}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {state === "submitting" ? <GenerationSpinner sizeClassName="h-5 w-5" tone="light" /> : null}
          <GenerationStateBadge state={state} />
          {state === "succeeded" ? <span className="text-sm font-semibold text-neutral-300">{resultCount} 张</span> : null}
        </div>
      </div>
    </div>
  );
}

function PanelModeSwitch({
  currentMode,
  onSelect
}: {
  currentMode: WorkspaceMode;
  onSelect: (mode: WorkspaceMode) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-[#1c1b1b]/82 p-1.5 shadow-[0_24px_70px_rgba(0,0,0,0.56)] backdrop-blur-2xl">
      {(["chat", "draw"] as WorkspaceMode[]).map((item) => {
        const active = currentMode === item;

        return (
          <button
            key={item}
            type="button"
            onClick={() => onSelect(item)}
            className={`h-9 min-w-[6.25rem] cursor-pointer rounded-lg px-3 text-xs font-extrabold tracking-[0.12em] uppercase transition ${
              active
                ? "bg-white text-slate-950"
                : "text-white/62 hover:bg-white/8 hover:text-white"
            }`}
          >
            {item === "chat" ? "AI Chat" : "AI Draw"}
          </button>
        );
      })}
    </div>
  );
}

function GenerationDeckPanel({
  canViewNewer,
  canViewOlder,
  children,
  currentMode,
  historyCount,
  onBrowseHistory,
  onClose,
  onSelectMode,
  panelRecord
}: {
  canViewNewer: boolean;
  canViewOlder: boolean;
  children: ReactNode;
  currentMode: WorkspaceMode;
  historyCount: number;
  onBrowseHistory: (direction: "newer" | "older") => void;
  onClose: () => void;
  onSelectMode: (mode: WorkspaceMode) => void;
  panelRecord: ChatGenerationRecord;
}) {
  const displayResults = buildDisplayResults(panelRecord);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [panelRecord.id, panelRecord.results.length]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-[#0b0c0c]/78 px-4 py-20 backdrop-blur-[18px]">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(32,31,31,0.88)_0%,rgba(10,10,10,0.96)_68%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,180,170,0.08),transparent_28%,rgba(229,9,20,0.08)_70%,transparent)]" />
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:4px_4px]" />

      <div className="relative z-10 flex h-full max-h-[calc(100vh-10rem)] w-full max-w-6xl items-center justify-center">
        <div className="relative flex h-[min(78vh,760px)] w-full flex-col overflow-visible">
          <div className="absolute top-0 left-[calc(100%+0.75rem)] z-[110] flex shrink-0 flex-col items-start gap-2">
            <div className="flex flex-col items-center gap-2 rounded-xl bg-[#1c1b1b]/82 p-1.5 shadow-[0_24px_70px_rgba(0,0,0,0.56)] backdrop-blur-2xl">
              <PanelIconButton label="关闭结果面板" onClick={onClose}>
                ×
              </PanelIconButton>

              {historyCount > 1 ? (
                <>
                  <TaskHistoryButton
                    disabled={!canViewOlder}
                    label="Previous Task"
                    symbol="↑"
                    onClick={() => onBrowseHistory("older")}
                  />
                  <TaskHistoryButton
                    disabled={!canViewNewer}
                    label="Next Task"
                    symbol="↓"
                    onClick={() => onBrowseHistory("newer")}
                  />
                </>
              ) : null}
            </div>
            <PanelModeSwitch currentMode={currentMode} onSelect={onSelectMode} />
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-[#1c1b1b]/82 shadow-[0_24px_70px_rgba(0,0,0,0.56)] backdrop-blur-2xl">
            <div className="relative flex min-h-0 flex-1 flex-col p-4 md:p-6">
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.16fr)_minmax(18rem,0.84fr)]">
                <div className="grid min-h-0 grid-cols-1 gap-1.5 xl:grid-cols-[minmax(16rem,1fr)_10.75rem]">
                  <GenerationPreviewSurface
                    activeImageIndex={activeImageIndex}
                    displayResults={displayResults}
                    record={panelRecord}
                  />

                  <GenerationSecondaryStack
                    activeImageIndex={activeImageIndex}
                    displayResults={displayResults}
                    record={panelRecord}
                    onSelectImage={setActiveImageIndex}
                  />
                </div>

                <div className="flex min-h-0 flex-col">
                  <GenerationTaskSidebar
                    modelId={panelRecord.modelId}
                    mode={panelRecord.mode}
                    prompt={panelRecord.prompt}
                    ratioId={panelRecord.ratioId}
                  />

                  <div className="mt-auto min-h-0">
                    {children}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GenerationPreviewSurface({
  activeImageIndex,
  displayResults,
  record
}: {
  activeImageIndex: number;
  displayResults: WorkspaceGeneratedResult[];
  record: ChatGenerationRecord;
}) {
  const mainResult = displayResults[activeImageIndex] ?? displayResults[0] ?? null;

  return (
    <div className="flex min-h-0 items-center justify-center">
      {mainResult ? (
        <GenerationVariationTile active index={activeImageIndex} record={record} result={mainResult} variant="main" />
      ) : (
        <GenerationThumbnailPlaceholder index={activeImageIndex} variant="main" />
      )}
    </div>
  );
}

function GenerationSecondaryStack({
  activeImageIndex,
  displayResults,
  record,
  onSelectImage
}: {
  activeImageIndex: number;
  displayResults: WorkspaceGeneratedResult[];
  record: ChatGenerationRecord;
  onSelectImage: (imageIndex: number) => void;
}) {
  const secondarySlots = Array.from({ length: 4 }, (_, imageIndex) => ({
    imageIndex,
    result: displayResults[imageIndex] ?? null
  }))
    .filter((slot) => slot.imageIndex !== activeImageIndex)
    .slice(0, 3);

  return (
    <div className="grid min-h-0 grid-cols-3 gap-1.5 xl:grid-cols-1 xl:grid-rows-3">
      {secondarySlots.map(({ imageIndex, result }) =>
        result ? (
          <GenerationVariationTile
            active={activeImageIndex === imageIndex}
            index={imageIndex}
            key={result.id}
            record={record}
            result={result}
            onSelect={() => onSelectImage(imageIndex)}
            variant="secondary"
          />
        ) : (
          <GenerationThumbnailPlaceholder index={imageIndex} key={`empty-${imageIndex}`} variant="secondary" />
        )
      )}
    </div>
  );
}

function GenerationVariationTile({
  active,
  index,
  onSelect,
  record,
  result,
  variant = "secondary"
}: {
  active: boolean;
  index: number;
  onSelect?: () => void;
  record: ChatGenerationRecord;
  result: WorkspaceGeneratedResult;
  variant?: "main" | "secondary";
}) {
  const sizeClassName =
    variant === "main"
      ? "mx-auto h-full max-h-full w-auto max-w-full max-xl:h-auto max-xl:w-full"
      : "w-full xl:mx-auto xl:h-full xl:w-auto xl:max-w-full";

  const interactiveClassName = onSelect ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#e50914]/50" : "";

  return (
    <article
      onClick={onSelect}
      onKeyDown={(event) => {
        if (!onSelect || (event.key !== "Enter" && event.key !== " ")) {
          return;
        }

        event.preventDefault();
        onSelect();
      }}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-label={onSelect ? `切换到第 ${index + 1} 张生成图` : undefined}
      className={`group relative aspect-[3/4] min-h-0 overflow-hidden rounded-[0.95rem] border bg-white/5 text-left ${sizeClassName} ${interactiveClassName} ${
        active
          ? "border-white/6"
          : "border-white/6 bg-white/5 opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0"
      }`}
    >
      {result.imageUrl ? (
        <img src={result.imageUrl} alt={result.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_58%),#080a0d]" />
      )}
      <div className="absolute top-2 left-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
        {formatGenerationImageIndex(index)}
      </div>
      {record.status !== "succeeded" ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/42">
          <div className="mx-4 max-w-[16rem] text-center">
            {record.status === "submitting" ? (
              <div className="flex justify-center">
                <GenerationSpinner sizeClassName="h-6 w-6" tone="light" />
              </div>
            ) : null}
            <p className="mt-3 text-[10px] font-bold tracking-[0.22em] text-slate-300 uppercase">
              {record.status === "failed" ? "Generation Failed" : "真实进度"}
            </p>
            <p className="mt-2 line-clamp-3 text-xs leading-5 font-semibold text-white">
              {record.status === "failed" ? record.insight : record.progress?.message ?? "等待后端返回真实生图进度"}
            </p>
          </div>
        </div>
      ) : null}
      {result.imageUrl ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/70 via-black/28 to-transparent px-3 pt-10 pb-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
          <a
            href={result.imageUrl}
            target="_blank"
            rel="noreferrer"
            download
            onClick={(event) => event.stopPropagation()}
            className="pointer-events-auto rounded-lg bg-gradient-to-r from-[#ffb4aa] to-[#e50914] px-9 py-3.5 font-[var(--font-ui)] text-base font-extrabold text-white shadow-[0_10px_30px_rgba(229,9,20,0.28)] transition hover:scale-[1.02] active:scale-95"
          >
            Download
          </a>
        </div>
      ) : null}
    </article>
  );
}

function GenerationThumbnailPlaceholder({
  index,
  variant = "secondary"
}: {
  index: number;
  variant?: "main" | "secondary";
}) {
  const sizeClassName =
    variant === "main"
      ? "mx-auto h-full max-h-full w-auto max-w-full max-xl:h-auto max-xl:w-full"
      : "w-full xl:mx-auto xl:h-full xl:w-auto xl:max-w-full";

  return (
    <div className={`relative aspect-[3/4] min-h-0 overflow-hidden rounded-[0.95rem] border border-white/6 bg-white/[0.025] ${sizeClassName}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.07),transparent_55%)]" />
      <span className="absolute top-2 left-2 rounded-full bg-black/42 px-2 py-0.5 text-[10px] font-bold text-white/42">
        {formatGenerationImageIndex(index)}
      </span>
    </div>
  );
}

function GenerationTaskSidebar({
  modelId,
  mode,
  prompt,
  ratioId
}: {
  modelId: string;
  mode: WorkspaceMode;
  prompt: string;
  ratioId: string;
}) {
  return (
    <aside className="px-1 py-2 text-neutral-100">
      <div className="space-y-4">
        <div>
          <p className="text-[10px] font-extrabold tracking-[0.24em] text-white/38 uppercase">Prompt</p>
          <p className="mt-2 max-h-28 overflow-y-auto pr-1 text-sm leading-6 text-white/80 italic">
            {prompt.trim() || "Describe the movie poster you want to create."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm leading-6 font-semibold text-white/82">
          <span>{formatWorkspaceModeLabel(mode)}</span>
          <span>{formatModelLabel(modelId)}</span>
          <span>{formatRatioLabel(ratioId)}</span>
        </div>
      </div>
    </aside>
  );
}

function PanelActionButton({
  children,
  disabled,
  onClick
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="hidden h-11 cursor-pointer items-center gap-2 rounded-[0.8rem] bg-white/5 px-5 text-xs font-extrabold tracking-[0.03em] text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45 sm:flex"
    >
      {children}
    </button>
  );
}

function PanelIconButton({
  children,
  label,
  onClick
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-white/8 text-xl leading-none text-white/70 transition hover:bg-white/14 hover:text-white"
    >
      {children}
    </button>
  );
}

function TaskHistoryButton({
  disabled,
  label,
  onClick,
  symbol
}: {
  disabled: boolean;
  label: string;
  onClick: () => void;
  symbol: string;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        aria-disabled={disabled}
        aria-label={label}
        onClick={(event) => {
          event.currentTarget.blur();

          if (!disabled) {
            onClick();
          }
        }}
        className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white/8 text-xl leading-none text-white/70 transition ${
          disabled
            ? "cursor-not-allowed opacity-30"
            : "cursor-pointer hover:bg-white/14 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#e50914]/45"
        }`}
      >
        {symbol}
      </button>
      <div className="pointer-events-none absolute top-1/2 right-full z-50 mr-3 -translate-y-1/2 rounded-lg bg-[#181918]/98 px-3 py-2 text-xs font-semibold whitespace-nowrap text-neutral-100 opacity-0 shadow-[0_18px_38px_rgba(0,0,0,0.34)] backdrop-blur-xl transition-opacity group-hover:opacity-100">
        {label}
      </div>
    </div>
  );
}

function buildDisplayResults(record: ChatGenerationRecord) {
  if (record.results.length > 0) {
    return record.results.slice(0, 4);
  }

  return [
    {
      id: `${record.id}-pending`,
      imageUrl: record.referenceImageUrl,
      summary: record.progress?.message ?? record.insight,
      title: `${record.posterTitle} - 生成中`
    }
  ];
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
    <div className="border-t border-white/5 py-4">
      <div className="flex flex-wrap gap-x-12 gap-y-4">
        <div className="flex max-w-xl min-w-[16rem] flex-1 flex-col gap-1">
          <span className="text-[10px] font-extrabold tracking-[0.22em] text-white/40 uppercase">Prompt</span>
          <p className="line-clamp-2 text-xs leading-relaxed text-white/82 italic">{prompt}</p>
        </div>

        <div className="flex flex-wrap gap-10">
          <GenerationMetaBlock label="Model" value={formatModelLabel(modelId)} />
          <GenerationMetaBlock label="Ratio" value={formatRatioLabel(ratioId)} />
          <GenerationMetaBlock label="Resolution" value={formatResolutionLabel(ratioId)} />
        </div>
      </div>
    </div>
  );
}

function GenerationMetaBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-extrabold tracking-[0.22em] text-white/40 uppercase">{label}</span>
      <span className="font-[var(--font-ui)] text-xs font-extrabold text-white">{value}</span>
    </div>
  );
}

function formatResolutionLabel(ratioId: string) {
  const resolutionByRatio: Record<string, string> = {
    "1:1": "2048 x 2048",
    "16:9": "2048 x 1152",
    "9:16": "1152 x 2048",
    "4:3": "2048 x 1536",
    "3:4": "1536 x 2048"
  };

  return resolutionByRatio[ratioId] ?? "Auto";
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
  drawState,
  isSubmitting,
  onChangeEvent,
  onGenerate,
  onSelectDrawModuleOption,
  onSelectModel,
  selectedPoster,
  selectedModelId
}: {
  drawState: DrawModuleState;
  isSubmitting: boolean;
  onChangeEvent: (value: string) => void;
  onGenerate: () => void;
  onSelectDrawModuleOption: (moduleKey: DrawModuleKey, option: DrawOption) => void;
  onSelectModel: (modelId: (typeof chatModelOptions)[number]["id"]) => void;
  selectedPoster: PosterRecord | null;
  selectedModelId: (typeof chatModelOptions)[number]["id"];
}) {
  const [openDropdown, setOpenDropdown] = useState<DrawModuleKey | "model" | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openDropdown) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!composerRef.current?.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenDropdown(null);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openDropdown]);

  return (
    <div ref={composerRef} className="overflow-visible rounded-lg bg-[#181918]/48 text-neutral-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.62)] backdrop-blur-2xl">
      <div className="flex min-h-[258px] flex-col justify-end gap-4 px-6 py-5 sm:px-8 sm:py-6">
        <div className="grid min-w-0 grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {drawModules.map((module) => {
            const moduleState = drawState[module.key];
            const posterPresetValue = selectedPoster?.promptPresets?.aiDraw.dimensions[module.key] ?? "";
            const active = isDrawModuleActive(moduleState);
            const hasPendingPosterPreset = module.key !== "event" && Boolean(posterPresetValue) && !active;
            const value = module.key === "event"
              ? formatEventButtonValue(moduleState.importedValue)
              : moduleState.importedValue || posterPresetValue || formatDrawOptionLabel(module.key, moduleState.selectedValue);

            return (
              <div key={module.key} className="relative min-w-0">
                <DrawParameterButton
                  active={active}
                  isOpen={openDropdown === module.key}
                  label={module.label}
                  presetLoaded={hasPendingPosterPreset}
                  value={value}
                  onToggle={() => {
                    if (hasPendingPosterPreset) {
                      onSelectDrawModuleOption(module.key, {
                        description: "Use the reverse-engineered value from the selected poster.",
                        label: posterPresetValue,
                        value: `poster-${module.key}`
                      });
                      setOpenDropdown(null);
                      return;
                    }

                    setOpenDropdown((current) => (current === module.key ? null : module.key));
                  }}
                />
                {openDropdown === module.key ? (
                  <DrawDropdownPanel>
                    {module.key === "event" ? (
                      <EventParameterPanel value={moduleState.importedValue} onChange={onChangeEvent} />
                    ) : (
                      <>
                        {posterPresetValue ? (
                          <>
                            <DrawDropdownOption
                              label={`海报解析：${posterPresetValue}`}
                              selected={moduleState.importedValue === posterPresetValue}
                              onClick={() => {
                                onSelectDrawModuleOption(module.key, {
                                  description: "Use the reverse-engineered value from the selected poster.",
                                  label: posterPresetValue,
                                  value: `poster-${module.key}`
                                });
                                setOpenDropdown(null);
                              }}
                            />
                            <div className="my-1 h-px bg-white/8" />
                          </>
                        ) : null}
                        {drawParameterOptions[module.key].map((option) => (
                          <DrawDropdownOption
                            key={option.value}
                            label={option.label}
                            selected={moduleState.selectedValue === option.value}
                            onClick={() => {
                              onSelectDrawModuleOption(module.key, option);
                              setOpenDropdown(null);
                            }}
                          />
                        ))}
                      </>
                    )}
                  </DrawDropdownPanel>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 pt-4">
          <div className="relative w-full sm:w-[20rem]">
            <DropdownButton
              fullWidth
              isOpen={openDropdown === "model"}
              label="Model"
              tone="dark"
              value={formatModelLabel(selectedModelId)}
              onToggle={() => setOpenDropdown((current) => (current === "model" ? null : "model"))}
            />
            {openDropdown === "model" ? (
              <DrawDropdownPanel>
                {chatModelOptions.map((option) => (
                  <DrawDropdownOption
                    key={option.id}
                    label={option.label}
                    selected={selectedModelId === option.id}
                    onClick={() => {
                      onSelectModel(option.id);
                      setOpenDropdown(null);
                    }}
                  />
                ))}
              </DrawDropdownPanel>
            ) : null}
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onGenerate}
            aria-label={isSubmitting ? "生成中" : "开始生图"}
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-neutral-100 text-xl font-semibold text-black shadow-xl transition hover:scale-105 hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}

function DrawParameterButton({
  active,
  isOpen,
  label,
  onToggle,
  presetLoaded,
  value
}: {
  active: boolean;
  isOpen: boolean;
  label: string;
  onToggle: () => void;
  presetLoaded: boolean;
  value: string;
}) {
  const buttonClassName = active
    ? "draw-parameter-selected text-neutral-100 hover:text-white"
    : presetLoaded
      ? "draw-parameter-preset text-neutral-100 hover:text-white"
    : isOpen
      ? "bg-white/12 text-white shadow-[0_16px_32px_rgba(0,0,0,0.22)]"
      : "bg-white/7 text-neutral-300 hover:bg-white/12 hover:text-white";
  const textClassName = active || presetLoaded ? "text-neutral-100" : "text-neutral-300";
  const arrowClassName = active || presetLoaded ? "text-[#ffb4aa]/72" : "text-neutral-500";

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex h-11 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-lg px-4 text-xs font-bold transition ${buttonClassName}`}
    >
      <span className={`min-w-0 shrink-0 truncate text-xs font-bold tracking-[0.14em] uppercase ${textClassName}`}>{label}</span>
      <span className={`min-w-0 truncate text-right text-xs font-bold tracking-normal normal-case ${textClassName}`}>{value}</span>
      <span className={`text-xs transition ${isOpen ? "rotate-180" : ""} ${arrowClassName}`}>▾</span>
    </button>
  );
}

function DrawDropdownPanel({ children }: { children: ReactNode }) {
  return (
    <div className="absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-lg bg-[#181918]/98 p-1.5 text-neutral-100 shadow-[0_18px_38px_rgba(0,0,0,0.34)] backdrop-blur-xl">
      <div className="max-h-[18rem] overflow-y-auto">{children}</div>
    </div>
  );
}

function DrawDropdownOption({
  label,
  onClick,
  selected
}: {
  label: string;
  onClick: () => void;
  selected: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-md px-3 text-left text-sm font-semibold transition ${
        selected ? "bg-white/8 text-white" : "text-neutral-300 hover:bg-white/8 hover:text-white"
      }`}
    >
      <span className="min-w-0 truncate">{label}</span>
      <span className={`shrink-0 text-sm font-semibold ${selected ? "text-[#ffb4aa]" : "text-transparent"}`}>✓</span>
    </button>
  );
}

function EventParameterPanel({
  onChange,
  value
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="rounded-md border border-white/8 bg-white/5 p-3">
      <p className="text-xs font-bold tracking-[0.14em] text-neutral-300 uppercase">自定义事件</p>
      <textarea
        className="mt-3 min-h-24 w-full resize-none rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm leading-6 text-white outline-none transition placeholder:text-neutral-600 focus:border-[#ffb4aa]/50"
        value={value}
        placeholder="例如：主角穿越草原寻找突然降临的未知飞行物"
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="mt-2 text-xs leading-5 text-neutral-500">事件由用户自填，不从参考海报自动提取。</p>
    </div>
  );
}

function getActiveChatRecord(records: ChatGenerationRecord[], activeId: string) {
  if (records.length === 0) {
    return null;
  }

  return records.find((item) => item.id === activeId) ?? records[0];
}

function buildPanelTimeline(chatRecords: ChatGenerationRecord[], historyRecords: HistoryRecord[]) {
  const merged = new Map<string, { createdAt: string; id: string; status?: string }>();

  for (const record of filterGeneratedHistoryRecords(historyRecords)) {
    merged.set(record.id, {
      createdAt: record.createdAt,
      id: record.id,
      status: record.status
    });
  }

  for (const record of chatRecords) {
    merged.set(record.id, {
      createdAt: record.createdAt,
      id: record.id,
      status: record.status
    });
  }

  return Array.from(merged.values()).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function filterGeneratedHistoryRecords(records: HistoryRecord[]) {
  return records.filter((record) => record.outputs > 0 && record.status === "succeeded");
}

function mergeChatGenerationDeck(current: ChatGenerationRecord[], incoming: ChatGenerationRecord[]) {
  const merged = new Map<string, ChatGenerationRecord>();

  for (const record of current) {
    merged.set(record.id, record);
  }

  for (const record of incoming) {
    merged.set(record.id, {
      ...merged.get(record.id),
      ...record
    });
  }

  return Array.from(merged.values()).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function buildChatRecordFromCachedHistory(
  cached: NonNullable<ReturnType<typeof getCachedHistoryRecord>>,
  options: {
    fallbackModelId: string;
    fallbackRatioId: string;
    source: AppDataSource;
  }
): ChatGenerationRecord {
  return {
    createdAt: cached.task.submittedAt,
    id: cached.task.id,
    insight: cached.insight,
    mode: cached.task.mode,
    modelId: cached.task.modelId ?? options.fallbackModelId,
    posterTitle: cached.task.posterTitle,
    prompt: cached.task.prompt,
    progress: null,
    ratioId: cached.task.ratioId ?? options.fallbackRatioId,
    referenceImageName: "",
    referenceImageUrl: "",
    results: cached.results,
    source: cached.source ?? options.source,
    status: "succeeded",
    templatePosterId: cached.task.posterId,
    templatePosterTitle: cached.task.posterTitle
  };
}

function buildChatRecordFromHistoryDetail(
  record: HistoryRecordDetail,
  options: {
    fallbackModelId: string;
    fallbackRatioId: string;
    source: AppDataSource;
  }
): ChatGenerationRecord {
  const results = [...record.outputsDetail]
    .sort((left, right) => left.outputOrder - right.outputOrder)
    .map((output) => ({
      id: output.id,
      imageUrl: output.imageUrl,
      summary: output.summary ?? "",
      title: output.title ?? `Generated image ${output.outputOrder + 1}`
    }));

  return {
    createdAt: record.createdAt,
    id: record.id,
    insight: record.errorMessage ?? "历史生图任务已载入。",
    mode: record.mode,
    modelId: options.fallbackModelId,
    posterTitle: record.previewTitle ?? "History Task",
    prompt: record.prompt,
    progress: null,
    ratioId: record.drawInputs?.aspectRatioValue ?? options.fallbackRatioId,
    referenceImageName: "",
    referenceImageUrl: "",
    results,
    source: options.source,
    status: record.status === "failed" ? "failed" : "succeeded",
    templatePosterId: record.posterId,
    templatePosterTitle: record.previewTitle ?? null
  };
}

function buildDraftGenerationRecord({
  chatDraft,
  modelId,
  poster,
  ratioId,
  referenceImage,
  source
}: {
  chatDraft: string;
  modelId: (typeof chatModelOptions)[number]["id"];
  poster: Pick<PosterRecord, "id" | "title"> | null;
  ratioId: (typeof chatRatioOptions)[number]["id"];
  referenceImage: ReferenceImageState | null;
  source: AppDataSource;
}): ChatGenerationRecord {
  return {
    createdAt: new Date().toISOString(),
    id: "chat-draft-panel",
    insight: "准备好 prompt 后即可从面板继续生成。",
    mode: "chat",
    modelId,
    posterTitle: poster?.title ?? "Free Prompt",
    prompt: chatDraft.trim() || "Describe the movie poster you want to create.",
    progress: null,
    ratioId,
    referenceImageName: referenceImage?.name ?? "",
    referenceImageUrl: referenceImage?.url ?? "",
    results: [],
    source,
    status: "draft",
    templatePosterId: poster?.id ?? null,
    templatePosterTitle: poster?.title ?? null
  };
}

function getSelectedImportModuleKeys(drawState: DrawModuleState) {
  return drawModules.filter((module) => drawState[module.key].selectedForImport).map((module) => module.key);
}

function getReadyDrawModuleKeys(drawState: DrawModuleState) {
  return drawModules
    .filter((module) => {
      const moduleState = drawState[module.key];

      return moduleState.enabled && moduleState.selectedForImport && Boolean(moduleState.importedValue.trim());
    })
    .map((module) => module.key);
}

function buildDrawPrompt(selectedPoster: PosterRecord, drawState: DrawModuleState) {
  const modules = getReadyDrawModuleKeys(drawState).map((moduleKey) => {
    const module = drawModules.find((item) => item.key === moduleKey);
    const moduleState = drawState[moduleKey];

    return {
      importedValue: moduleState.importedValue,
      key: moduleKey,
      label: module?.label ?? moduleKey,
      selectedValue: moduleState.selectedValue,
      weight: moduleState.weight
    };
  });

  return buildAiDrawPrompt({
    modules,
    posterTitle: selectedPoster.title
  });
}

function resolveDrawRatioId(selectedPoster: PosterRecord, drawState: DrawModuleState) {
  void drawState;

  return resolveRatioOptionId(selectedPoster.attributes.ratio);
}

function resolvePosterDrawAttribute(poster: PosterRecord, moduleKey: DrawModuleKey) {
  const presetValue = poster.promptPresets?.aiDraw.dimensions[moduleKey];

  if (presetValue) {
    return presetValue;
  }

  const attributeMap = {
    atmosphere: poster.attributes.mood,
    characterPosition: poster.attributes.composition,
    composition: poster.attributes.composition,
    era: `${poster.year}${poster.region ? ` / ${poster.region}` : ""}`,
    event: "",
    scene: poster.description,
    shotScale: poster.attributes.character,
    style: poster.attributes.style,
    tone: poster.attributes.tone
  } satisfies Record<DrawModuleKey, string>;

  return attributeMap[moduleKey];
}

function buildDrawComposerPreview(drawState: DrawModuleState) {
  const activeLines = drawModules
    .map((module) => {
      const moduleState = drawState[module.key];
      return moduleState.importedValue ? `${module.label}: ${moduleState.importedValue}` : "";
    })
    .filter(Boolean);

  if (activeLines.length === 0) {
    return "";
  }

  return activeLines.join("\n");
}

function isDrawModuleActive(moduleState: DrawModuleState[DrawModuleKey]) {
  return moduleState.selectedForImport && Boolean(moduleState.importedValue.trim());
}

function formatEventButtonValue(value: string) {
  return value.trim() ? value.trim() : "自填";
}

function formatDrawOptionLabel(moduleKey: Exclude<DrawModuleKey, "event">, value: string) {
  const option = drawParameterOptions[moduleKey].find((item) => item.value === value);
  return option && option.value !== "all" ? option.label : "选择";
}

function findOptionLabel(options: DrawOption[], value: string, fallback: string) {
  return options.find((option) => option.value === value)?.label ?? fallback;
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

function formatWorkspaceModeLabel(mode: WorkspaceMode) {
  return mode === "chat" ? "AI Chat" : "AI Draw";
}

function formatRatioLabel(ratioId: string) {
  return chatRatioOptions.find((option) => option.id === ratioId)?.label ?? ratioId;
}

function formatGenerationImageIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}

function formatProgressMeta(progress: WorkspaceGenerationProgressEvent) {
  const parts = [
    progress.modelLabel ?? "",
    progress.taskStatus ? `状态 ${progress.taskStatus}` : "",
    typeof progress.attempt === "number" ? `轮询 ${progress.attempt} 次` : "",
    typeof progress.imageCount === "number" && typeof progress.totalImages === "number"
      ? `图片 ${progress.imageCount}/${progress.totalImages}`
      : "",
    typeof progress.elapsedMs === "number" ? `耗时 ${Math.max(1, Math.round(progress.elapsedMs / 1000))} 秒` : ""
  ].filter(Boolean);

  return parts.join(" · ");
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
  draft: "待生成",
  failed: "失败",
  submitting: "生成中",
  succeeded: "已完成"
} satisfies Record<ChatGenerationRecord["status"], string>;

function DeckStatusPill({ compact = false, status }: { compact?: boolean; status: ChatGenerationRecord["status"] }) {
  const classNameMap = {
    draft: "bg-slate-100 text-slate-800",
    failed: "bg-rose-100 text-rose-900",
    submitting: "bg-amber-100 text-amber-900",
    succeeded: "bg-emerald-100 text-emerald-900"
  } satisfies Record<ChatGenerationRecord["status"], string>;

  const sizeClassName = compact ? "px-2.5 py-0.5 text-xs font-bold tracking-normal normal-case" : "px-3 py-1 text-sm font-semibold";

  return <span className={`rounded-full ${sizeClassName} ${classNameMap[status]}`}>{statusTextMap[status]}</span>;
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
