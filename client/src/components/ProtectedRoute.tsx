import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useI18n } from "../i18n/useI18n";

export function ProtectedRoute() {
  const location = useLocation();
  const { status } = useAuth();
  const { t } = useI18n();

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[linear-gradient(180deg,#f8f6f1_0%,#efe8dd_100%)] text-slate-700">
        <div className="rounded-[1.8rem] border border-slate-900/8 bg-white px-8 py-6 shadow-lg">
          {t("protected.restoring")}
        </div>
      </div>
    );
  }

  if (status === "guest") {
    return <Navigate replace state={{ authMode: "login", from: `${location.pathname}${location.search}${location.hash}` }} to="/" />;
  }

  return <Outlet />;
}
