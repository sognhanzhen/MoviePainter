import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import type { WorkspaceMode } from "../data/posters";
import { DEFAULT_LANGUAGE, normalizeLanguage, type Language } from "../i18n/messages";
import { useI18n } from "../i18n/useI18n";
import { appDataRequest } from "../lib/api";

export function SettingsPage() {
  const { refreshProfile, status, token, user } = useAuth();
  const { language: activeLanguage, setLanguage: setActiveLanguage, t } = useI18n();
  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(activeLanguage);
  const [defaultMode, setDefaultMode] = useState<WorkspaceMode>("chat");
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [message, setMessage] = useState(() => t("settings.loading"));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      setLoading(true);
      setMessage(t("settings.loading"));

      try {
        const response = await appDataRequest.getSettings(token);

        if (cancelled) {
          return;
        }

        setDisplayName(response.settings.displayName);
        const nextLanguage = normalizeLanguage(response.settings.language);
        setSelectedLanguage(nextLanguage);
        setActiveLanguage(nextLanguage);
        setDefaultMode(response.settings.preferredDefaultMode);
        setNotificationEnabled(response.settings.notificationEnabled);
        setMessage(t("common.settingsLoaded", { source: response.source }));
      } catch (error) {
        if (cancelled) {
          return;
        }

        setDisplayName(user?.name ?? "");
        setSelectedLanguage(DEFAULT_LANGUAGE);
        setDefaultMode("chat");
        setNotificationEnabled(true);
        setMessage(error instanceof Error ? `${error.message}. ${t("settings.fallbackLoaded")}` : t("settings.fallbackLoaded"));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (!token) {
      if (status === "authenticated") {
        setDisplayName(user?.name ?? "");
        setSelectedLanguage(activeLanguage);
        setDefaultMode("chat");
        setNotificationEnabled(true);
        setMessage(t("settings.localSessionFallback"));
        setLoading(false);
      }
      return;
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, [status, token, user?.name]);

  useEffect(() => {
    setSelectedLanguage(activeLanguage);
  }, [activeLanguage]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(t("settings.saving"));

    try {
      const response = await appDataRequest.updateSettings(token, {
        displayName: displayName.trim(),
        language: selectedLanguage,
        notificationEnabled,
        preferredDefaultMode: defaultMode
      });

      setDisplayName(response.settings.displayName);
      const nextLanguage = normalizeLanguage(response.settings.language);
      setSelectedLanguage(nextLanguage);
      setActiveLanguage(nextLanguage);
      setDefaultMode(response.settings.preferredDefaultMode);
      setNotificationEnabled(response.settings.notificationEnabled);
      await refreshProfile().catch(() => undefined);
      setMessage(t("common.settingsSaved", { source: response.source, updatedAt: response.settings.updatedAt }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("settings.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <aside className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-lg shadow-slate-950/6 backdrop-blur">
        <p className="text-xs tracking-[0.3em] text-sky-700 uppercase">{t("settings.profile")}</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-950">{t("settings.title")}</h2>
        <div className="mt-6 rounded-[1.6rem] border border-slate-900/8 bg-slate-50 p-5">
          <p className="text-[11px] tracking-[0.24em] text-slate-400 uppercase">{t("avatar.currentUser")}</p>
          <p className="mt-3 text-xl font-semibold text-slate-950">{user?.name}</p>
          <p className="mt-2 text-sm text-slate-600">{user?.email}</p>
          <p className="mt-5 text-sm leading-7 text-slate-600">
            {t("settings.description")}
          </p>
        </div>
      </aside>

      <form
        className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-lg shadow-slate-950/6 backdrop-blur"
        onSubmit={handleSubmit}
      >
        <p className="text-xs tracking-[0.3em] text-slate-400 uppercase">Preferences</p>
        <div className="mt-5 grid gap-5">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-500">{t("settings.displayName")}</span>
            <input
              className="w-full rounded-[1.25rem] border border-slate-900/10 bg-slate-50 px-4 py-3.5 text-slate-950 outline-none transition focus:border-sky-400"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-500">{t("settings.defaultMode")}</span>
            <select
              className="w-full rounded-[1.25rem] border border-slate-900/10 bg-slate-50 px-4 py-3.5 text-slate-950 outline-none transition focus:border-sky-400"
              value={defaultMode}
              onChange={(event) => setDefaultMode(event.target.value as WorkspaceMode)}
            >
              <option value="chat">AI Chat</option>
              <option value="draw">AI Draw</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-500">{t("settings.languagePreference")}</span>
            <select
              className="w-full rounded-[1.25rem] border border-slate-900/10 bg-slate-50 px-4 py-3.5 text-slate-950 outline-none transition focus:border-sky-400"
              value={selectedLanguage}
              onChange={(event) => {
                const nextLanguage = normalizeLanguage(event.target.value);
                setSelectedLanguage(nextLanguage);
                setActiveLanguage(nextLanguage);
              }}
            >
              <option value="en-US">English</option>
              <option value="zh-CN">简体中文</option>
            </select>
          </label>

          <label className="flex items-center justify-between rounded-[1.25rem] border border-slate-900/8 bg-slate-50 px-4 py-3.5">
            <span className="text-sm text-slate-600">{t("settings.notifications")}</span>
            <input
              checked={notificationEnabled}
              className="h-5 w-5 accent-slate-950"
              type="checkbox"
              onChange={(event) => setNotificationEnabled(event.target.checked)}
            />
          </label>

          <button
            type="submit"
            disabled={loading || saving || !token}
            className="rounded-[1.35rem] bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {saving ? t("settings.saving") : t("settings.save")}
          </button>
        </div>

        <p className="mt-5 rounded-[1.25rem] border border-slate-900/8 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
          {message}
        </p>
      </form>
    </section>
  );
}
