import { FormEvent, startTransition, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export type AuthPanelMode = "login" | "register";

type AuthPanelProps = {
  mode: AuthPanelMode;
  onClose?: () => void;
  onModeChange: (mode: AuthPanelMode) => void;
  redirectPath: string;
};

export function AuthPanel({ mode, onClose, onModeChange, redirectPath }: AuthPanelProps) {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const nextMode = mode === "login" ? "register" : "login";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(mode === "login" ? "Signing in..." : "Creating your account...");

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
      setMessage(error instanceof Error ? error.message : "Request failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-[40rem] flex-col overflow-hidden rounded-xl bg-[#1c1b1b]/82 text-white shadow-[0_24px_70px_rgba(0,0,0,0.56)] backdrop-blur-2xl md:max-h-[calc(100vh-10rem)]">
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-30 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-white/8 text-xl leading-none text-white/70 transition hover:bg-white/14 hover:text-white"
          aria-label="关闭登录面板"
        >
          ×
        </button>
      ) : null}

      <div className="relative flex w-full flex-col justify-center overflow-y-auto p-7 md:p-10">
        <div className="pointer-events-none absolute top-1/2 right-0 h-56 w-56 -translate-y-1/2 rounded-full bg-[#ffb4aa]/10 blur-[88px]" />

        <div className="relative z-10 mx-auto w-full max-w-[32rem] space-y-6">
          <div className="text-center">
            <h1 className="whitespace-nowrap font-[var(--font-ui)] text-4xl leading-tight font-extrabold tracking-normal text-white">
              Welcome to MoviePainter
            </h1>
            <p className="mt-3 text-sm leading-6 text-neutral-400">
              Please log in using the form below
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "register" ? (
              <label className="block">
                <span className="mb-2 block text-xs tracking-[0.2em] text-neutral-500 uppercase">Name</span>
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3.5 text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-white/28 focus:bg-white/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb4aa]/70"
                  minLength={2}
                  placeholder="MoviePainter Creator"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-xs tracking-[0.2em] text-neutral-500 uppercase">Email</span>
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3.5 text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-white/28 focus:bg-white/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb4aa]/70"
                placeholder="hello@moviepainter.ai"
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs tracking-[0.2em] text-neutral-500 uppercase">Password</span>
              <input
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3.5 text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-white/28 focus:bg-white/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffb4aa]/70"
                minLength={6}
                placeholder="Enter at least 6 characters"
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full cursor-pointer items-center justify-center rounded-lg bg-gradient-to-r from-[#ffb4aa] to-[#e50914] px-9 py-3.5 font-[var(--font-ui)] text-base font-extrabold text-white shadow-[0_10px_30px_rgba(229,9,20,0.28)] transition hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? "Processing..." : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>

          {message ? (
            <p className="min-h-12 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-neutral-300">
              {message}
            </p>
          ) : null}

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => onModeChange(nextMode)}
              className="cursor-pointer rounded-lg border border-white/12 bg-transparent px-6 py-2.5 text-sm font-semibold text-neutral-100 transition hover:border-white/24 hover:bg-white/8"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
