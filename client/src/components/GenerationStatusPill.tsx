import type { HistoryStatus } from "../data/posters";

type GenerationStatusPillProps = {
  status: HistoryStatus;
};

const statusClassMap = {
  failed: "bg-rose-100 text-rose-900",
  running: "bg-amber-100 text-amber-900",
  succeeded: "bg-emerald-100 text-emerald-900",
  waiting: "bg-slate-200 text-slate-700"
} satisfies Record<GenerationStatusPillProps["status"], string>;

const statusLabelMap = {
  failed: "失败",
  running: "生成中",
  succeeded: "已完成",
  waiting: "待处理"
} satisfies Record<GenerationStatusPillProps["status"], string>;

export function GenerationStatusPill({ status }: GenerationStatusPillProps) {
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusClassMap[status]}`}>
      {statusLabelMap[status]}
    </span>
  );
}
