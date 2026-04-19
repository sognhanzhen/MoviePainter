import { MouseEvent, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { AuthPanel, type AuthPanelMode } from "../components/AuthPanel";

const defaultWorkspacePath = "/workspace?mode=chat";

const portalCards = [
  {
    cta: "Open Vault",
    description: "Browse curated poster references, visual systems, and cinematic compositions.",
    href: "/library",
    title: "Movie Poster Library"
  },
  {
    cta: "Enter Lab",
    description: "Start from a line of dialogue, a reference frame, or a full poster direction.",
    href: defaultWorkspacePath,
    title: "Generation Workspace"
  },
  {
    cta: "Browse Assets",
    description: "Collect textures, grain overlays, poster presets, and reusable creative fragments.",
    href: "/history",
    title: "Assets"
  }
];

const accountCards = [
  {
    description: "Keep your creator profile, credit status, and production identity ready.",
    icon: "P",
    title: "Profile Details"
  },
  {
    description: "Track monthly render tokens and production priority across poster runs.",
    icon: "G",
    title: "Generation Credits"
  },
  {
    description: "Review session access, protected routes, and account security defaults.",
    icon: "S",
    title: "Security"
  },
  {
    description: "Prepare billing records and subscription tiers for studio-scale work.",
    icon: "B",
    title: "Billing"
  }
];

export function LandingPage() {
  const { status } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const primaryCtaHref = status === "authenticated" ? defaultWorkspacePath : "/";
  const [authPanel, setAuthPanel] = useState<{ mode: AuthPanelMode; redirectPath: string } | null>(null);

  function handleProtectedLink(event: MouseEvent<HTMLAnchorElement>, redirectPath: string, mode: AuthPanelMode = "login") {
    if (status !== "guest") {
      return;
    }

    event.preventDefault();
    setAuthPanel({ mode, redirectPath });
  }

  useEffect(() => {
    if (status === "authenticated") {
      setAuthPanel(null);
    }
  }, [status]);

  useEffect(() => {
    if (status !== "guest") {
      return;
    }

    const state = location.state;

    if (!state || typeof state !== "object" || !("from" in state)) {
      return;
    }

    const redirectPath = typeof state.from === "string" && state.from ? state.from : defaultWorkspacePath;
    const mode = "authMode" in state && state.authMode === "register" ? "register" : "login";

    setAuthPanel({ mode, redirectPath });
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate, status]);

  useEffect(() => {
    if (!authPanel) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAuthPanel(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [authPanel]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const particleCanvas = canvas;
    const particleContext = context;
    let frameId = 0;
    const particles = Array.from({ length: 110 }, () => createParticle());

    function resizeCanvas() {
      const parent = particleCanvas.parentElement;
      const width = parent?.clientWidth ?? window.innerWidth;
      const height = parent?.clientHeight ?? 520;
      const pixelRatio = window.devicePixelRatio || 1;

      particleCanvas.width = width * pixelRatio;
      particleCanvas.height = height * pixelRatio;
      particleCanvas.style.width = `${width}px`;
      particleCanvas.style.height = `${height}px`;
      particleContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    function draw() {
      const width = particleCanvas.clientWidth;
      const height = particleCanvas.clientHeight;

      particleContext.clearRect(0, 0, width, height);

      particles.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.opacity += particle.growing ? particle.fadeSpeed : -particle.fadeSpeed;

        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) particle.y = height;
        if (particle.y > height) particle.y = 0;
        if (particle.opacity >= 0.62) particle.growing = false;
        if (particle.opacity <= 0.1) particle.growing = true;

        particleContext.beginPath();
        particleContext.fillStyle = `rgba(255,255,255,${particle.opacity})`;
        particleContext.shadowBlur = 10;
        particleContext.shadowColor = "rgba(255,255,255,0.32)";
        particleContext.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        particleContext.fill();
        particleContext.shadowBlur = 0;
      });

      frameId = window.requestAnimationFrame(draw);
    }

    resizeCanvas();
    draw();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [status]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
        <div className="rounded-lg border border-white/10 bg-white/6 px-8 py-6 shadow-[0_30px_120px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
          Entering MoviePainter...
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#1a1a1a_0%,#0a0a0a_48%,#050505_100%)] text-white selection:bg-white/20 selection:text-white">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.035] [background-image:radial-gradient(circle_at_12%_24%,rgba(255,255,255,0.8)_0_0.5px,transparent_0.7px),radial-gradient(circle_at_72%_64%,rgba(255,255,255,0.52)_0_0.5px,transparent_0.7px)] [background-size:3px_3px,4px_4px]" />
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-28 right-[-12%] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(255,215,150,0.12)_0%,transparent_62%)] blur-[80px]" />
        <div className="absolute top-[42rem] left-[-14%] h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle,rgba(180,200,255,0.09)_0%,transparent_64%)] blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_18%,rgba(10,10,10,0.62)_74%,#0a0a0a_100%)]" />
      </div>

      <div className="workspace-nav-veil pointer-events-none fixed top-0 right-0 left-0 z-40 h-20" />
      <header className="fixed top-0 right-0 left-0 z-50 bg-transparent">
        <div className="grid h-20 grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 sm:px-8">
          <Link
            to="/"
            className="font-[var(--font-display)] text-2xl font-bold tracking-[-0.055em] text-neutral-100 transition hover:text-white"
          >
            MoviePainter
          </Link>

          <nav className="hidden items-center justify-center gap-10 md:flex">
            {portalCards.map((portal) => (
              <Link
                key={portal.title}
                to={portal.href}
                onClick={(event) => handleProtectedLink(event, portal.href)}
                className="relative text-sm font-semibold text-neutral-500 transition hover:text-neutral-100"
              >
                {portal.title === "Movie Poster Library" ? "Library" : portal.title === "Generation Workspace" ? "Workspace" : "Assets"}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-4">
            <Link
              to={status === "authenticated" ? "/settings" : "/"}
              onClick={(event) => handleProtectedLink(event, "/settings")}
              className="hidden rounded-lg border border-white/10 px-3 py-2 text-xs font-bold tracking-[0.18em] text-neutral-500 uppercase transition hover:border-white/22 hover:text-neutral-100 sm:inline-flex"
            >
              Account
            </Link>
            <Link
              to={status === "authenticated" ? "/settings" : "/"}
              onClick={(event) => handleProtectedLink(event, "/settings")}
              aria-label="Open account"
              className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/6 text-sm font-bold tracking-[0.12em] text-neutral-100 uppercase shadow-[0_16px_34px_rgba(0,0,0,0.28)] transition hover:border-white/20 hover:bg-white/10"
            >
              MP
            </Link>
          </div>
        </div>
      </header>

      <header className="relative z-10 flex min-h-[88vh] items-center justify-center overflow-hidden px-4 pt-24 text-center">
        <div className="mx-auto max-w-5xl">
          <h1 className="font-[var(--font-display)] text-5xl leading-[0.98] font-bold tracking-[-0.07em] text-white sm:text-7xl lg:text-8xl">
            Paint Your Vision
            <br />
            <span className="text-white/92 [text-shadow:0_0_26px_rgba(255,255,255,0.34)]">into the Frame</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/68 sm:text-xl">
            From storyboard to poster art, curate the cinematic language of your next production.
          </p>
          <div className="mt-10 flex items-center justify-center">
            <Link
              to={primaryCtaHref}
              onClick={(event) => handleProtectedLink(event, defaultWorkspacePath)}
              className="inline-flex h-12 min-w-[11rem] items-center justify-center rounded-lg bg-gradient-to-r from-[#ffb4aa] to-[#e50914] px-8 font-[var(--font-ui)] text-sm font-extrabold text-white shadow-[0_10px_30px_rgba(229,9,20,0.28)] transition hover:scale-[1.02] active:scale-95"
            >
              Start Creating
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-7xl px-6 py-24 sm:py-28">
          <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="mb-2 block font-[var(--font-display)] text-sm font-bold tracking-[0.2em] text-white/58 uppercase">
                Navigation
              </span>
              <h2 className="font-[var(--font-display)] text-4xl leading-tight font-bold tracking-[-0.045em] text-white md:text-5xl">
                Access Portals
              </h2>
            </div>
            <div className="hidden h-px flex-1 bg-white/10 md:block" />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {portalCards.map((portal) => (
              <Link
                key={portal.title}
                to={portal.href}
                onClick={(event) => handleProtectedLink(event, portal.href)}
                className="group relative flex aspect-[3/4] overflow-hidden rounded-lg border border-white/10 bg-white/5 p-8 transition duration-500 hover:scale-[1.02] hover:border-white/20 hover:bg-white/8"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/22 to-transparent" />
                <div className="relative z-10 mt-auto">
                  <h3 className="font-[var(--font-display)] text-2xl font-bold tracking-[-0.035em] text-white">
                    {portal.title}
                  </h3>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/68">{portal.description}</p>
                  <span className="mt-6 inline-flex items-center gap-2 font-[var(--font-display)] text-sm font-bold tracking-[0.16em] text-white uppercase transition-all group-hover:gap-4">
                    {portal.cta}
                    <span aria-hidden="true">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden bg-transparent pt-16 pb-16">
          <div className="pointer-events-none absolute inset-0 z-0">
            <canvas ref={canvasRef} className="h-full w-full" />
          </div>

          <div className="relative z-10 mx-auto mb-28 grid max-w-7xl grid-cols-1 gap-12 px-6 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <h2 className="font-[var(--font-display)] text-3xl font-bold tracking-[-0.035em] text-white">
                Account & Curation
              </h2>
              <p className="mt-5 leading-7 text-white/60">
                Manage your creative profile, production credits, and personalized curation settings.
              </p>
              <Link
                to={status === "authenticated" ? "/settings" : "/"}
                onClick={(event) => handleProtectedLink(event, "/settings", "register")}
                className="mt-8 flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-md transition hover:bg-white/10"
              >
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10">
                  <img
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80"
                    alt="Creator profile"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-white">{status === "authenticated" ? "MoviePainter User" : "Julian Voss"}</h3>
                  <span className="font-[var(--font-display)] text-xs font-bold tracking-[0.18em] text-white/50 uppercase">
                    Director Tier
                  </span>
                </div>
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-8">
              {accountCards.map((card) => (
                <Link
                  key={card.title}
                  to={status === "authenticated" ? "/settings" : "/"}
                  onClick={(event) => handleProtectedLink(event, "/settings", "register")}
                  className="group rounded-lg border border-white/10 bg-white/5 p-8 backdrop-blur-md transition duration-300 hover:border-white/20 hover:bg-white/10"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 font-[var(--font-display)] text-sm font-bold text-white transition group-hover:bg-white group-hover:text-black">
                    {card.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/50">{card.description}</p>
                </Link>
              ))}
            </div>
          </div>

          <footer className="relative z-10 border-t border-white/10 px-6 py-14">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
              <div className="text-center md:text-left">
                <span className="font-[var(--font-display)] text-lg font-black tracking-[0.16em] text-white">MoviePainter</span>
                <p className="mt-2 text-sm tracking-wide text-white/40">© 2024 MoviePainter. The Digital Curator.</p>
              </div>
              <div className="flex gap-8 text-sm tracking-wide">
                {["Privacy", "Terms", "Contact"].map((item) => (
                  <a key={item} href="#" className="text-white/40 transition hover:text-white">
                    {item}
                  </a>
                ))}
              </div>
              <div className="flex gap-3">
                {["Share", "World"].map((item) => (
                  <a
                    key={item}
                    href="#"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-xs font-bold text-white/60 transition hover:bg-white/10 hover:text-white"
                    aria-label={item}
                  >
                    {item[0]}
                  </a>
                ))}
              </div>
            </div>
          </footer>
        </section>
      </main>

      {authPanel ? (
        <LandingAuthModal
          mode={authPanel.mode}
          redirectPath={authPanel.redirectPath}
          onClose={() => setAuthPanel(null)}
          onModeChange={(mode) => setAuthPanel((current) => (current ? { ...current, mode } : current))}
        />
      ) : null}
    </div>
  );
}

function LandingAuthModal({
  mode,
  onClose,
  onModeChange,
  redirectPath
}: {
  mode: AuthPanelMode;
  onClose: () => void;
  onModeChange: (mode: AuthPanelMode) => void;
  redirectPath: string;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-[#0b0c0c]/78 px-4 py-4 backdrop-blur-[18px] md:py-20">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(32,31,31,0.88)_0%,rgba(10,10,10,0.96)_68%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,180,170,0.08),transparent_28%,rgba(229,9,20,0.08)_70%,transparent)]" />
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:4px_4px]" />

      <div className="relative z-10 flex w-full justify-center">
        <AuthPanel
          mode={mode}
          onClose={onClose}
          onModeChange={onModeChange}
          redirectPath={redirectPath}
        />
      </div>
    </div>
  );
}

function createParticle() {
  return {
    fadeSpeed: Math.random() * 0.005 + 0.002,
    growing: Math.random() > 0.5,
    opacity: Math.random() * 0.5 + 0.1,
    size: Math.random() * 1.6 + 0.45,
    speedX: (Math.random() - 0.5) * 0.38,
    speedY: (Math.random() - 0.5) * 0.38,
    x: Math.random() * 1600,
    y: Math.random() * 900
  };
}
