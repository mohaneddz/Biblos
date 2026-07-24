import { useState, useEffect } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import Titlebar from "./components/Titlebar";
import { ToastContainer } from "./components/ToastContainer";
import { ConfirmModal } from "./components/ConfirmModal";
import AiNaturalist from "./pages/AiNaturalist";
import Collection from "./pages/Collection";
import Compare from "./pages/Compare";
import Ecosystems from "./pages/Ecosystems";
import EcosystemDetail from "./pages/EcosystemDetail";
import Explorer from "./pages/Explorer";
import Home from "./pages/Home";
import LifeClass from "./pages/LifeClass";
import Settings from "./pages/Settings";
import Species from "./pages/Species";
import SpeciesDetail from "./pages/SpeciesDetail";
import TreeOfLife from "./pages/TreeOfLife";
import TraitDetail from "./pages/TraitDetail";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const contentShell = document.querySelector(".content-shell");
    if (contentShell) {
      contentShell.scrollTop = 0;
    }
  }, [pathname]);

  return null;
}

function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("biblos.sidebar.collapsed") === "true";
    }
    return false;
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem("biblos.sidebar.collapsed", String(next));
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="app-shell">
      <ScrollToTop />
      <Titlebar />
      <div className={`app-workspace text-app-text ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
        <main className="content-shell">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
      <ConfirmModal />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/species" element={<Species />} />
        <Route path="/species/:id" element={<SpeciesDetail />} />
        <Route path="/tree" element={<TreeOfLife />} />
        <Route path="/life-class/:id" element={<LifeClass />} />
        <Route path="/explorer" element={<Explorer />} />
        <Route path="/explore/diet/:value" element={<TraitDetail traitCategory="diet" />} />
        <Route path="/explore/status/:value" element={<TraitDetail traitCategory="status" />} />
        <Route path="/explore/activity/:value" element={<TraitDetail traitCategory="activity" />} />
        <Route path="/ecosystems" element={<Ecosystems />} />
        <Route path="/ecosystems/:id" element={<EcosystemDetail />} />
        <Route path="/ai" element={<AiNaturalist />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/atlas" element={<Navigate to="/explorer" replace />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
