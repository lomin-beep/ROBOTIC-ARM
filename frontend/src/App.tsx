import { useState, useEffect } from "react";
import Layout from "./components/Layout";
import Overview from "./pages/Overview";
import RobotControl from "./pages/RobotControl";
import VisionStudio from "./pages/VisionStudio";
import AITaskStudio from "./pages/AITaskStudio";
import TeleoperationStudio from "./pages/TeleoperationStudio";
import DatasetStudio from "./pages/DatasetStudio";
import ModelStudio from "./pages/ModelStudio";
import SettingsSafety from "./pages/SettingsSafety";

type Page =
  | "overview"
  | "robot"
  | "vision"
  | "tasks"
  | "teleop"
  | "datasets"
  | "models"
  | "settings";

const PAGES: Record<Page, React.ComponentType> = {
  overview: Overview,
  robot: RobotControl,
  vision: VisionStudio,
  tasks: AITaskStudio,
  teleop: TeleoperationStudio,
  datasets: DatasetStudio,
  models: ModelStudio,
  settings: SettingsSafety,
};

export default function App() {
  const [page, setPage] = useState<Page>("overview");

  // Sync URL hash to page for shareable / refreshable links
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace(/^#/, "") as Page;
      if (hash in PAGES) setPage(hash);
    };
    window.addEventListener("hashchange", onHashChange);
    onHashChange();
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <Layout page={page} onPageChange={(p) => setPage(p as Page)}>
      {(activePage) => {
        const Page = PAGES[activePage as Page];
        return <Page />;
      }}
    </Layout>
  );
}
