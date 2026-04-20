import type { HistoryRecord, PosterRecord, WorkspaceAssetAction, WorkspaceMode } from "../data/posters";
import { workspaceRequest } from "./api";
import { saveHistoryRecordSnapshot } from "./history-cache";

type RecordWorkspaceAssetUseInput = {
  action: WorkspaceAssetAction;
  mode: WorkspaceMode;
  poster: PosterRecord;
  sourceOrigin: string;
  token: string;
};

export async function recordWorkspaceAssetUse({
  action,
  mode,
  poster,
  sourceOrigin,
  token
}: RecordWorkspaceAssetUseInput) {
  const prompt = buildWorkspaceAssetPrompt({ action, mode, poster });

  if (token) {
    try {
      const response = await workspaceRequest.recordAsset(token, {
        action,
        mode,
        posterId: poster.id,
        prompt,
        sourceOrigin
      });

      saveHistoryRecordSnapshot(response.record, {
        insight: buildWorkspaceAssetInsight(response.record),
        source: response.source
      });

      return response.record;
    } catch {
      // Keep the UI flow available even if the backend is temporarily unreachable.
    }
  }

  const fallbackRecord = buildFallbackWorkspaceAssetRecord({
    mode,
    poster,
    prompt,
    sourceOrigin
  });

  saveHistoryRecordSnapshot(fallbackRecord, {
    insight: buildWorkspaceAssetInsight(fallbackRecord),
    source: "workspace-cache"
  });

  return fallbackRecord;
}

function buildFallbackWorkspaceAssetRecord(input: {
  mode: WorkspaceMode;
  poster: PosterRecord;
  prompt: string;
  sourceOrigin: string;
}): HistoryRecord {
  return {
    createdAt: new Date().toISOString(),
    id: `asset-${input.poster.id}-${Date.now()}`,
    mode: input.mode,
    outputs: 0,
    posterId: input.poster.id,
    prompt: input.prompt,
    sourceOrigin: input.sourceOrigin,
    status: "waiting"
  };
}

function buildWorkspaceAssetPrompt(input: {
  action: WorkspaceAssetAction;
  mode: WorkspaceMode;
  poster: PosterRecord;
}) {
  if (input.mode === "chat" && input.poster.promptPresets?.aiChat) {
    return input.poster.promptPresets.aiChat;
  }

  if (input.mode === "draw" && input.poster.promptPresets?.aiDraw.prompt) {
    return input.poster.promptPresets.aiDraw.prompt;
  }

  const modeLabel = input.mode === "chat" ? "AI Chat" : "AI Draw";
  const originText = input.action === "library_use" ? "the poster library" : "the generation workspace";

  return `Add ${input.poster.title} from ${originText} to the ${modeLabel} workspace as a reference asset.`;
}

function buildWorkspaceAssetInsight(record: HistoryRecord) {
  return `The reference poster is now in the ${record.mode === "chat" ? "AI Chat" : "AI Draw"} workspace and ready for the next generation.`;
}
