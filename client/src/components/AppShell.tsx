import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

const navigationItems = [
  { label: "生成工作区", path: "/workspace?mode=chat" },
  { label: "海报库", path: "/library" },
  { label: "历史记录", path: "/history" },
  { label: "个人设置", path: "/settings" }
];

export function AppShell() {
  const { logout, user } = useAuth();
  const location = useLocation();
  const isWorkspace = location.pathname === "/workspace";
  const isCinematicShell =
    location.pathname === "/workspace" || location.pathname === "/library" || location.pathname.startsWith("/history");
  useCinematicSwipeHistoryLock(isCinematicShell);

  const shellClassName = isCinematicShell
    ? "cinematic-shell-gesture-lock relative min-h-screen overflow-x-hidden bg-[#0d0e0d] text-neutral-100"
    : "min-h-screen bg-[radial-gradient(circle_at_top,rgba(75,167,255,0.14),transparent_28%),linear-gradient(180deg,#f8f6f1_0%,#efe8dd_100%)] text-slate-950";

  const workspaceNavigationItems = [
    { label: "Library", path: "/library" },
    { label: "Workspace", path: "/workspace?mode=chat" },
    { label: "Assets", path: "/history" }
  ];

  if (isCinematicShell) {
    return (
      <div className={shellClassName}>
        <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_top_right,rgba(46,50,53,0.62)_0%,rgba(13,14,13,0.72)_42%,rgba(4,7,7,0.98)_100%)]" />
        <div className="workspace-film-grain pointer-events-none fixed inset-0 z-0" />
        <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle,transparent_0%,rgba(0,0,0,0.46)_100%)]" />
        <div className="workspace-nav-veil pointer-events-none fixed top-0 right-0 left-0 z-40 h-20" />

        <header className="fixed top-0 right-0 left-0 z-50 bg-transparent">
          <div className="grid h-20 grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 sm:px-8">
            <NavLink
              to="/workspace?mode=chat"
              className="font-[var(--font-display)] text-2xl font-bold tracking-[-0.055em] text-neutral-100 transition hover:text-white"
            >
              MoviePainter
            </NavLink>

            <nav className="hidden items-center justify-center gap-10 md:flex">
              {workspaceNavigationItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `relative text-sm font-semibold transition ${
                      isActive ? "text-neutral-100" : "text-neutral-500 hover:text-neutral-100"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {item.label}
                      {isActive ? (
                        <span className="absolute -bottom-2 left-0 h-[2px] w-full bg-gradient-to-r from-[#ffb4aa] to-[#e50914]" />
                      ) : null}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center justify-end">
              <AvatarMenu
                displayName={user?.name ?? "MoviePainter User"}
                email={user?.email}
                onLogout={logout}
                tone="dark"
              />
            </div>
          </div>
        </header>

        <main className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-32 pb-24">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className={shellClassName}>
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

          <div className="flex items-center justify-end">
            <AvatarMenu
              displayName={user?.name ?? "MoviePainter User"}
              email={user?.email}
              onLogout={logout}
              tone="light"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-6 sm:px-8 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}

function useCinematicSwipeHistoryLock(active: boolean) {
  useEffect(() => {
    if (!active) {
      return;
    }

    const edgeWidth = 56;
    const horizontalThreshold = 12;
    let gestureStartedAtEdge = false;
    let startX = 0;
    let startY = 0;

    function handleTouchStart(event: TouchEvent) {
      if (event.touches.length !== 1) {
        gestureStartedAtEdge = false;
        return;
      }

      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      gestureStartedAtEdge = startX <= edgeWidth || startX >= window.innerWidth - edgeWidth;
    }

    function handleTouchMove(event: TouchEvent) {
      if (!gestureStartedAtEdge || event.touches.length !== 1) {
        return;
      }

      const touch = event.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      const isHorizontalSwipe = Math.abs(deltaX) > horizontalThreshold && Math.abs(deltaX) > Math.abs(deltaY) * 1.2;

      if (isHorizontalSwipe && event.cancelable) {
        event.preventDefault();
      }
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [active]);
}

function AvatarMenu({
  displayName,
  email,
  onLogout,
  tone
}: {
  displayName: string;
  email?: string;
  onLogout: () => void;
  tone: "dark" | "light";
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const initials = getAvatarInitials(displayName, email);
  const isDark = tone === "dark";

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const buttonClassName = isDark
    ? "border-white/10 bg-white/6 text-neutral-100 shadow-[0_16px_34px_rgba(0,0,0,0.28)] hover:border-white/20 hover:bg-white/10"
    : "border-slate-900/10 bg-slate-950 text-white shadow-[0_16px_34px_rgba(15,23,42,0.18)] hover:bg-slate-800";
  const panelClassName = isDark
    ? "border-white/10 bg-[#181918]/96 text-neutral-100 shadow-[0_24px_70px_rgba(0,0,0,0.38)]"
    : "border-slate-900/8 bg-white/96 text-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.16)]";
  const eyebrowClassName = isDark ? "text-neutral-500" : "text-slate-400";
  const itemClassName = isDark
    ? "text-neutral-300 hover:bg-white/8 hover:text-white"
    : "text-slate-700 hover:bg-slate-950/6 hover:text-slate-950";
  const logoutClassName = isDark
    ? "text-[#ffb4aa] hover:bg-[#ffb4aa]/10 hover:text-[#ffdad5]"
    : "text-rose-700 hover:bg-rose-50 hover:text-rose-900";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="打开用户菜单"
        onClick={() => setOpen((current) => !current)}
        className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border text-sm font-bold tracking-[0.12em] uppercase transition ${buttonClassName}`}
      >
        {initials}
      </button>

      {open ? (
        <div
          role="menu"
          className={`absolute right-0 z-[70] mt-3 w-56 overflow-hidden rounded-lg border p-2 backdrop-blur-xl ${panelClassName}`}
        >
          <div className="px-3 py-3">
            <p className={`text-[10px] font-bold tracking-[0.24em] uppercase ${eyebrowClassName}`}>Current User</p>
            <p className="mt-1 truncate text-sm font-semibold">{displayName}</p>
            {email ? <p className={`mt-1 truncate text-xs ${eyebrowClassName}`}>{email}</p> : null}
          </div>

          <div className={isDark ? "h-px bg-white/8" : "h-px bg-slate-900/8"} />

          <Link
            role="menuitem"
            to="/settings"
            onClick={() => setOpen(false)}
            className={`mt-2 flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-semibold transition ${itemClassName}`}
          >
            设置
            <span aria-hidden="true">›</span>
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className={`mt-1 flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2.5 text-left text-sm font-semibold transition ${logoutClassName}`}
          >
            退出登录
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function getAvatarInitials(displayName: string, email?: string) {
  const source = displayName.trim() || email?.split("@")[0]?.trim() || "MP";
  const asciiParts = source.match(/[a-zA-Z0-9]+/g);

  if (asciiParts && asciiParts.length > 0) {
    return asciiParts
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}
