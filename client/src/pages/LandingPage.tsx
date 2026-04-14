import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { posterRecords } from "../data/posters";

const defaultWorkspacePath = "/workspace?mode=chat";
const featuredPosters = posterRecords.slice(0, 4);

export function LandingPage() {
  const { status } = useAuth();
  const primaryCtaHref = status === "authenticated" ? defaultWorkspacePath : "/login";
  const primaryCtaLabel = status === "authenticated" ? "进入工作区" : "登录开始创作";

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f8f6f1_0%,#efe8dd_100%)] text-slate-700">
        <div className="rounded-[1.8rem] border border-slate-900/8 bg-white px-8 py-6 shadow-lg">正在进入登录页...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef6ff_0%,#ffffff_24%,#f7fbff_100%)] text-slate-950">
      <section className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8 sm:py-14 lg:py-16">
        <div className="grid gap-10 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] xl:items-center">
          <div className="max-w-[34rem]">
            <p className="text-[11px] tracking-[0.34em] text-sky-700 uppercase">MoviePainter</p>
            <h1 className="mt-5 font-[var(--font-editorial)] text-5xl leading-[0.94] sm:text-6xl lg:text-7xl">
              让电影海报生成，变成一条能反复打磨的创作线。
            </h1>
            <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
              官方精选海报先给方向，AI Chat 和 AI Draw 共享同一个工作区，角色、构图、氛围和输出结果都能继续往下推。
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={primaryCtaHref}
                className="inline-flex items-center justify-center rounded-[8px] bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {primaryCtaLabel}
              </Link>
              <Link
                to={status === "authenticated" ? "/library" : "/register"}
                className="inline-flex items-center justify-center rounded-[8px] border border-slate-900/10 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900/18 hover:text-slate-950"
              >
                {status === "authenticated" ? "进入海报库" : "创建账号"}
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm leading-6 text-slate-500">
              <span>官方精选海报作为灵感入口</span>
              <span>AI Chat / AI Draw 双模式并行</span>
              <span>历史生成记录可回看可继续</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[1mm]">
            {featuredPosters.map((poster, index) => (
              <article
                key={poster.id}
                className={`relative overflow-hidden rounded-[8px] shadow-[0_18px_48px_rgba(15,23,42,0.14)] ${
                  index === 0 ? "row-span-2 aspect-[3/4]" : "aspect-[3/4]"
                }`}
              >
                <img src={poster.imageUrl} alt={`${poster.title} 海报`} className="h-full w-full object-cover" />
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
