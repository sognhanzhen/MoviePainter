import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LanguageProvider } from "./i18n/LanguageProvider";
import { HistoryDetailPage } from "./pages/HistoryDetailPage";
import { HistoryPage } from "./pages/HistoryPage";
import { LandingPage } from "./pages/LandingPage";
import { LibraryPage } from "./pages/LibraryPage";
import { SettingsPage } from "./pages/SettingsPage";
import { WorkspacePage } from "./pages/WorkspacePage";

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/workspace" element={<WorkspacePage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/history/:historyId" element={<HistoryDetailPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/admin" element={<Navigate replace to="/workspace?mode=chat" />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </AuthProvider>
    </LanguageProvider>
  );
}
