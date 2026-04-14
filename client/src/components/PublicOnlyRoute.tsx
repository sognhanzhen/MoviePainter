import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

const defaultWorkspacePath = "/workspace?mode=chat";

export function PublicOnlyRoute() {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f8f6f1_0%,#efe8dd_100%)] text-slate-700">
        <div className="rounded-[1.8rem] border border-slate-900/8 bg-white px-8 py-6 shadow-lg">
          正在准备认证页面...
        </div>
      </div>
    );
  }

  if (status === "authenticated") {
    return <Navigate replace to={defaultWorkspacePath} />;
  }

  return <Outlet />;
}
