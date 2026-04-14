import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import type { WorkspaceMode } from "../data/posters";
import { appDataRequest } from "../lib/api";

export function SettingsPage() {
  const { refreshProfile, status, token, user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [language, setLanguage] = useState("zh-CN");
  const [defaultMode, setDefaultMode] = useState<WorkspaceMode>("chat");
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [message, setMessage] = useState("正在加载个人设置...");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      setLoading(true);
      setMessage("正在加载个人设置...");

      try {
        const response = await appDataRequest.getSettings(token);

        if (cancelled) {
          return;
        }

        setDisplayName(response.settings.displayName);
        setLanguage(response.settings.language);
        setDefaultMode(response.settings.preferredDefaultMode);
        setNotificationEnabled(response.settings.notificationEnabled);
        setMessage(`设置已从 ${response.source} 数据源加载。`);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setDisplayName(user?.name ?? "");
        setLanguage("zh-CN");
        setDefaultMode("chat");
        setNotificationEnabled(true);
        setMessage(error instanceof Error ? `${error.message}，当前先展示默认设置。` : "设置加载失败，当前先展示默认设置。");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (!token) {
      if (status === "authenticated") {
        setDisplayName(user?.name ?? "");
        setLanguage("zh-CN");
        setDefaultMode("chat");
        setNotificationEnabled(true);
        setMessage("当前仅恢复了登录会话，后端配置暂不可用，先展示本地默认设置。");
        setLoading(false);
      }
      return;
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, [status, token, user?.name]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("正在保存设置...");

    try {
      const response = await appDataRequest.updateSettings(token, {
        displayName: displayName.trim(),
        language,
        notificationEnabled,
        preferredDefaultMode: defaultMode
      });

      setDisplayName(response.settings.displayName);
      setLanguage(response.settings.language);
      setDefaultMode(response.settings.preferredDefaultMode);
      setNotificationEnabled(response.settings.notificationEnabled);
      await refreshProfile().catch(() => undefined);
      setMessage(`设置已保存到 ${response.source} 数据源。最近更新时间：${response.settings.updatedAt}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "设置保存失败，请稍后再试。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
      <aside className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-lg shadow-slate-950/6 backdrop-blur">
        <p className="text-xs tracking-[0.3em] text-sky-700 uppercase">Profile</p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-950">个人设置</h2>
        <div className="mt-6 rounded-[1.6rem] border border-slate-900/8 bg-slate-50 p-5">
          <p className="text-[11px] tracking-[0.24em] text-slate-400 uppercase">Current User</p>
          <p className="mt-3 text-xl font-semibold text-slate-950">{user?.name}</p>
          <p className="mt-2 text-sm text-slate-600">{user?.email}</p>
          <p className="mt-5 text-sm leading-7 text-slate-600">
            这里将承接用户基础资料、默认工作模式、语言和后续通知偏好等设置。
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
            <span className="mb-2 block text-sm text-slate-500">展示名称</span>
            <input
              className="w-full rounded-[1.25rem] border border-slate-900/10 bg-slate-50 px-4 py-3.5 text-slate-950 outline-none transition focus:border-sky-400"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-500">默认模式</span>
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
            <span className="mb-2 block text-sm text-slate-500">语言偏好</span>
            <select
              className="w-full rounded-[1.25rem] border border-slate-900/10 bg-slate-50 px-4 py-3.5 text-slate-950 outline-none transition focus:border-sky-400"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              <option value="zh-CN">简体中文</option>
              <option value="en-US">English</option>
            </select>
          </label>

          <label className="flex items-center justify-between rounded-[1.25rem] border border-slate-900/8 bg-slate-50 px-4 py-3.5">
            <span className="text-sm text-slate-600">开启通知提醒</span>
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
            {saving ? "保存中..." : "保存设置"}
          </button>
        </div>

        <p className="mt-5 rounded-[1.25rem] border border-slate-900/8 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
          {message}
        </p>
      </form>
    </section>
  );
}
