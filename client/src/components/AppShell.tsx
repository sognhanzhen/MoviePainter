import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

const navigationItems = [
  { label: "生成工作区", path: "/workspace?mode=chat" },
  { label: "海报库", path: "/library" },
  { label: "历史记录", path: "/history" },
  { label: "个人设置", path: "/settings" }
];

export function AppShell() {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(75,167,255,0.14),transparent_28%),linear-gradient(180deg,#f8f6f1_0%,#efe8dd_100%)] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-900/8 bg-white/82 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold tracking-[0.22em] text-white uppercase">
              MP
            </div>
            <div>
              <p className="text-[11px] tracking-[0.32em] text-sky-700 uppercase">MoviePainter</p>
              <h1 className="text-lg font-semibold text-slate-950">AI Movie Poster Studio</h1>
            </div>
          </div>

          <nav className="hidden items-center gap-2 rounded-full border border-slate-900/8 bg-white/80 p-1.5 shadow-sm md:flex">
            {navigationItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-950/6 hover:text-slate-950"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-2xl border border-slate-900/8 bg-white px-4 py-2 text-right shadow-sm sm:block">
              <p className="text-xs tracking-[0.24em] text-slate-400 uppercase">当前用户</p>
              <p className="mt-1 text-sm font-medium text-slate-900">{user?.name ?? "MoviePainter User"}</p>
            </div>

            <button
              type="button"
              onClick={logout}
              className="rounded-2xl border border-slate-900/10 bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-6 sm:px-8 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
