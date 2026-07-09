import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import Titlebar from "./components/Titlebar";
import { ToastContainer } from "./components/ToastContainer";
import { ConfirmModal } from "./components/ConfirmModal";
import AiNaturalist from "./pages/AiNaturalist";
import Collection from "./pages/Collection";
import Compare from "./pages/Compare";
import Ecosystems from "./pages/Ecosystems";
import Explorer from "./pages/Explorer";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import Species from "./pages/Species";
import SpeciesDetail from "./pages/SpeciesDetail";
import TreeOfLife from "./pages/TreeOfLife";

function Layout() {
  return (
    <div className="app-shell">
      <Titlebar />
      <div className="app-workspace text-app-text">
        <Sidebar />
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
        <Route path="/explorer" element={<Explorer />} />
        <Route path="/ecosystems" element={<Ecosystems />} />
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
