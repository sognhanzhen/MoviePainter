import { FormEvent, startTransition, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { posterRecords } from "../data/posters";

type AuthPageProps = {
  mode: "login" | "register";
};

const defaultWorkspacePath = "/workspace?mode=chat";

const posterColumns = [
  {
    delay: "-3s",
    duration: "30s",
    items: posterRecords.slice(0, 4),
    offsetClassName: "translate-y-[-2%]"
  },
  {
    delay: "-10s",
    duration: "36s",
    items: posterRecords.slice(2, 6),
    offsetClassName: "translate-y-[-12%]"
  },
  {
    delay: "-6s",
    duration: "33s",
    items: posterRecords.slice(1, 5),
    offsetClassName: "hidden sm:block translate-y-[-5%]"
  }
];

export function AuthPage({ mode }: AuthPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("登录后会直接进入生成工作区。");
  const [submitting, setSubmitting] = useState(false);

  const redirectPath =
    typeof location.state === "object" && location.state && "from" in location.state
      ? String(location.state.from)
      : defaultWorkspacePath;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(mode === "login" ? "正在验证账号..." : "正在创建账号...");

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name.trim(), email, password);
      }

      startTransition(() => {
        navigate(redirectPath, { replace: true });
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "请求失败，请稍后再试。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-stage relative min-h-screen overflow-hidden bg-[#07090f] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,219,168,0.16),transparent_28%),radial-gradient(circle_at_16%_18%,rgba(222,74,128,0.14),transparent_24%),radial-gradient(circle_at_84%_20%,rgba(62,123,255,0.16),transparent_24%),linear-gradient(180deg,#04050a_0%,#090b14_48%,#05060a_100%)]" />

      <div className="pointer-events-none absolute inset-0">
        <div className="mx-auto grid h-full max-w-[1640px] grid-cols-2 gap-4 px-3 py-3 sm:grid-cols-3 sm:px-6 sm:py-6 lg:gap-6 lg:px-10 lg:py-8">
          {posterColumns.map((column, columnIndex) => (
            <div
              key={`poster-column-${columnIndex}`}
              className={`overflow-hidden ${column.offsetClassName}`}
            >
              <div
                className="auth-poster-column flex flex-col gap-4 sm:gap-5 lg:gap-6"
                style={{
                  animationDelay: column.delay,
                  animationDuration: column.duration
                }}
              >
                {[...column.items, ...column.items].map((poster, posterIndex) => (
                  <article
                    key={`${poster.id}-${columnIndex}-${posterIndex}`}
                    className={[
                      "auth-poster-card relative overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.42)]",
                      posterIndex % 3 === 0 ? "rotate-[-4deg]" : "",
                      posterIndex % 3 === 1 ? "rotate-[2.8deg]" : "",
                      posterIndex % 3 === 2 ? "rotate-[-1.6deg]" : "",
                      posterIndex % 2 === 0 ? "translate-x-3 sm:translate-x-7" : "-translate-x-2 sm:-translate-x-5"
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <img
                      src={poster.imageUrl}
                      alt={`${poster.title} 海报`}
                      className="h-[30vh] min-h-[220px] w-full object-cover sm:h-[34vh] lg:h-[36vh]"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,14,0.03)_0%,rgba(5,7,14,0.2)_58%,rgba(5,7,14,0.84)_100%)]" />
                    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                      <p className="text-[0.63rem] tracking-[0.36em] text-white/55 uppercase">{poster.genre}</p>
                      <h3 className="mt-2 font-['Iowan_Old_Style','Songti_SC','Times_New_Roman',serif] text-2xl leading-none text-white sm:text-[2rem]">
                        {poster.title}
                      </h3>
                      <p className="mt-2 max-w-[18rem] text-xs leading-5 text-white/72 sm:text-sm">
                        {poster.summary}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-stage__veil auth-stage__veil--top" />
      <div className="auth-stage__veil auth-stage__veil--right" />
      <div className="auth-stage__veil auth-stage__veil--bottom" />
      <div className="auth-stage__veil auth-stage__veil--left" />

      <section className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="auth-panel w-full max-w-[31rem] rounded-[2.2rem] px-5 py-6 text-white shadow-[0_30px_120px_rgba(2,4,12,0.56)] sm:px-8 sm:py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.68rem] tracking-[0.42em] text-white/52 uppercase">MoviePainter Entry</p>
              <h1 className="mt-3 font-['Iowan_Old_Style','Songti_SC','Times_New_Roman',serif] text-[2.4rem] leading-[0.94] sm:text-[3.1rem]">
                {mode === "login" ? "进入你的电影宇宙" : "创建你的海报身份"}
              </h1>
              <p className="mt-4 max-w-md text-sm leading-7 text-white/72 sm:text-[0.96rem]">
                满屏海报从下向上滚动，中央只保留一个入口。登录后会直接进入生成工作区，继续角色、构图与氛围探索。
              </p>
            </div>

            <Link
              to={mode === "login" ? "/register" : "/login"}
              className="cursor-pointer rounded-full border border-white/16 bg-white/8 px-4 py-2 text-xs font-medium tracking-[0.2em] text-white/76 uppercase transition hover:bg-white/16 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70"
            >
              {mode === "login" ? "去注册" : "去登录"}
            </Link>
          </div>

          <div className="mt-6 grid gap-3 text-[0.68rem] tracking-[0.24em] text-white/48 uppercase sm:grid-cols-3">
            {["错位海报流", "液态玻璃", "登录即工作区"].map((item) => (
              <div key={item} className="rounded-full bg-white/[0.06] px-3 py-2 text-center">
                {item}
              </div>
            ))}
          </div>

          <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
            {mode === "register" ? (
              <label className="block">
                <span className="mb-2 block text-xs tracking-[0.24em] text-white/48 uppercase">用户名</span>
                <input
                  className="w-full rounded-[1.35rem] border border-white/12 bg-white/[0.08] px-4 py-3.5 text-white outline-none backdrop-blur-md transition placeholder:text-white/30 focus:border-white/38 focus:bg-white/[0.12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
                  minLength={2}
                  placeholder="MoviePainter Creator"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-xs tracking-[0.24em] text-white/48 uppercase">邮箱</span>
              <input
                className="w-full rounded-[1.35rem] border border-white/12 bg-white/[0.08] px-4 py-3.5 text-white outline-none backdrop-blur-md transition placeholder:text-white/30 focus:border-white/38 focus:bg-white/[0.12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
                placeholder="hello@moviepainter.ai"
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs tracking-[0.24em] text-white/48 uppercase">密码</span>
              <input
                className="w-full rounded-[1.35rem] border border-white/12 bg-white/[0.08] px-4 py-3.5 text-white outline-none backdrop-blur-md transition placeholder:text-white/30 focus:border-white/38 focus:bg-white/[0.12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
                minLength={6}
                placeholder="请输入至少 6 位密码"
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer w-full rounded-[1.35rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(247,220,176,0.88))] px-4 py-3.5 text-sm font-semibold text-slate-950 transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "处理中..." : mode === "login" ? "登录并进入工作区" : "创建账号并进入工作区"}
            </button>
          </form>

          <p className="mt-4 min-h-12 rounded-[1.25rem] border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white/72">
            {message}
          </p>

          <div className="mt-6 flex items-center justify-between gap-4 text-sm text-white/62">
            <Link
              to="/"
              className="cursor-pointer inline-flex font-medium text-white/72 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70"
            >
              返回 landing 页
            </Link>
            <p className="text-right text-xs leading-5 tracking-[0.2em] text-white/34 uppercase">
              {mode === "login" ? "Sign In / Liquid Glass" : "Create / Liquid Glass"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
