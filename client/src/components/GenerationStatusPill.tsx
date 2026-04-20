import type { HistoryStatus } from "../data/posters";
import { useI18n } from "../i18n/useI18n";

type GenerationStatusPillProps = {
  status: HistoryStatus;
};

const statusClassMap = {
  failed: "bg-rose-100 text-rose-900",
  running: "bg-amber-100 text-amber-900",
  succeeded: "bg-emerald-100 text-emerald-900",
  waiting: "bg-slate-200 text-slate-700"
} satisfies Record<GenerationStatusPillProps["status"], string>;

export function GenerationStatusPill({ status }: GenerationStatusPillProps) {
  const { t } = useI18n();
  const statusLabelMap = {
    failed: t("generation.status.failed"),
    running: t("generation.status.running"),
    succeeded: t("generation.status.succeeded"),
    waiting: t("generation.status.waiting")
  } satisfies Record<GenerationStatusPillProps["status"], string>;

  return (
    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusClassMap[status]}`}>
      {statusLabelMap[status]}
    </span>
  );
}
